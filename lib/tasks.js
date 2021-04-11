const Discord = require('discord.js')
const fetch = require('node-fetch')
const config = require('./config')
const { createEmbed } = require('./common')
const { log, findBuildMessage } = require('./common')
const { createBuildEmbed } = require('./embed')
const { parseSheet, parseMap } = require('./parser')
const { isApprover } = require('./security')

/**
 * Schedules task with fixed delay between task runs
 * @param client discord client
 * @param promiseCreator task creator
 * @param delay delay between task runs
 */
function scheduleWithFixedDelay (client, promiseCreator, delay) {
  return promiseCreator()
    .then(() => client
      .setTimeout(() => scheduleWithFixedDelay(client, promiseCreator, delay), delay))
}

/**
 * Counts specified reactions of approvers on message
 * @param message discord message
 * @param reaction reaction text form
 * @param noFilter skip approver filtering for reactions
 */
async function countReactions (message, reaction, noFilter = false) {
  const reactions = message.reactions.cache
    .filter(r => r.emoji.name === reaction)

  if (noFilter) {
    return Promise.resolve(reactions.map(r => r.count).reduce((a, b) => a + b, 0))
  }

  const users = await Promise.all(reactions
    .map(r => r.users.fetch())
    .map(up => up.then(u => Promise.all(u.map(user => message.guild.members.fetch(user.id))))))

  return users
    .map(u => u.filter(u => isApprover(u)).length)
    .reduce((a, b) => a + b, 0)
}

/**
 * Finds all relevant messages in approval and submission channel
 * @param client discord client
 */
async function findMessages (client) {
  const submissionChannel = client.channels.cache.find(c => c.name === config.submissionChannel)
  if (!submissionChannel) {
    log.warn(`Submission channel match for ${config.submissionChannel} failed: ${submissionChannel}`)
    return Promise.resolve({})
  }

  const approvalChannel = client.channels.cache.find(c => c.name === config.approvedChannel)
  if (!approvalChannel) {
    log.warn(`Approval channel match for ${config.approvedChannel} failed: ${approvalChannel}`)
    return Promise.resolve({})
  }

  const approvalMessages = await approvalChannel.messages.fetch()
  const submissionMessages = await submissionChannel.messages.fetch()

  const filteredApprovalMessages = approvalMessages.filter(m =>
    m.embeds &&
    m.embeds.length > 0 &&
    m.member &&
    client.user &&
    m.member.id === client.user.id)

  const filteredSubmissionMessages = submissionMessages.filter(m =>
    m.embeds &&
    m.embeds.length > 0 &&
    m.member &&
    client.user &&
    m.member.id === client.user.id &&
    m.reactions.cache.size > 0)

  return {
    approvalChannel: approvalChannel,
    submissionChannel: submissionChannel,
    approvalMessages: filteredApprovalMessages,
    submissionMessages: filteredSubmissionMessages
  }
}

/**
 * Scans all messages in submission channel, counts reactions and determines what happens with build submission based
 * on reaction count
 * @param client discord client
 */
async function scanReactions (client) {
  const { approvalChannel, approvalMessages, submissionMessages } = await findMessages(client)

  return Promise.all(submissionMessages.map(async message => {
    const yesReactions = await countReactions(message, config.yesReaction)
    const noReactions = await countReactions(message, config.noReaction)
    const embed = message.embeds[0]
    const isPurge = embed.title === config.purgeTitle
    const reactionLimit = isPurge ? config.purgeReactionLimit : config.reactionLimit

    if (!embed.url && !isPurge) {
      return null
    }

    if (yesReactions > noReactions && yesReactions >= reactionLimit) {
      if (isPurge) {
        log.info(`Purging ${approvalMessages.size} messages in ${config.approvedChannel}`)
        return Promise.all(approvalMessages.map(m => m.delete()))
          .then(() => message.edit({
            embed: createEmbed()
              .setTitle(`${config.purgeTitle} - Complete`)
              .setDescription(`${approvalMessages.size} approved builds in ${config.approvedChannel} deleted.`)
              .setFooter('Just remember all the good the purge does.')
          }))
      }

      const similarMessage = findBuildMessage(embed.url, approvalMessages)
      const newMessage = {
        embed: new Discord.MessageEmbed(embed)
      }

      if (similarMessage) {
        log.info(`Updating build ${newMessage.embed.title}`)
        return similarMessage.edit(newMessage.embed).then(() => message.delete())
      } else {
        log.info(`Adding build ${newMessage.embed.title}`)
        return approvalChannel.send(newMessage)
          .then(m => m.react(config.yesReaction))
          .then(() => message.delete())
      }
    } else if (noReactions > yesReactions && noReactions >= config.reactionLimit) {
      log.info(`Rejecting ${embed.title}`)
      return message.delete()
    }

    return null
  }))
}

/**
 * Fetches and parses build submissions from google sheets and updates existing build submissions
 * @param client discord client
 */
async function fetchSheetSubmissions (client) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheets.sheetId}/values/${config.sheets.sheetName}!${config.sheets.sheetRange}?key=${config.sheets.googleApiKey}`

  const response = await fetch(url)
  const json = await response.json()
  const parsedSheet = parseSheet(json)

  if (parsedSheet.length === 0) {
    log.warn(`Failed to parse sheet ${config.sheets.sheetId}/${config.sheets.sheetName}`)
  }

  const { submissionChannel, approvalMessages, submissionMessages } = await findMessages(client)

  return Promise.all(parsedSheet.map(async build => {
    const url = build[parseMap.link]
    const name = build[parseMap.name]
    const embed = createBuildEmbed(build)

    const approvalMessage = findBuildMessage(url, approvalMessages)

    if (approvalMessage) {
      log.info(`Updating build ${name}`)
      return approvalMessage.edit(embed)
    }

    const submissionMessage = findBuildMessage(url, submissionMessages)

    if (submissionMessage) {
      log.info(`Updating build ${name} for approval`)
      return submissionMessage.edit(embed)
    } else {
      log.info(`Submitting build ${name} for approval`)
      return submissionChannel.send({
        embed
      }).then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
    }
  }))
}

module.exports = (client) => {
  log.info(`Found ${client.channels.size} channels`)
  scheduleWithFixedDelay(client, () => scanReactions(client), 4 * 60000) // Every 4 minutes

  if (config.sheets.googleApiKey) {
    scheduleWithFixedDelay(client, () => fetchSheetSubmissions(client), 30 * 60000) // Every 30 minutes
  }
}
