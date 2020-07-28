const Discord = require('discord.js')
const fetch = require('node-fetch')
const config = require('./config')
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
  const reactions = message.reactions
    .filter(r => r.emoji.name === reaction)

  if (noFilter) {
    return Promise.resolve(reactions.map(r => r.count).reduce((a, b) => a + b, 0))
  }

  const users = await Promise.all(reactions
    .map(r => r.fetchUsers())
    .map(up => up.then(u => Promise.all(u.map(user => message.guild.members.get(user.id))))))

  return users
    .map(u => u.filter(u => isApprover(u)).length)
    .reduce((a, b) => a + b, 0)
}

/**
 * Finds all relevant messages in approval and submission channel
 * @param client discord client
 */
async function findMessages (client) {
  const submissionChannel = client.channels.find(c => c.name === config.submissionChannel)
  if (!submissionChannel) {
    log.warn(`Submission channel match for ${config.submissionChannel} failed: ${submissionChannel}`)
    return Promise.resolve()
  }

  const approvalChannel = client.channels.find(c => c.name === config.approvedChannel)
  if (!approvalChannel) {
    log.warn(`Approval channel match for ${config.approvedChannel} failed: ${approvalChannel}`)
    return Promise.resolve()
  }

  const approvalMessages = await approvalChannel.fetchMessages()
  const submissionMessages = await submissionChannel.fetchMessages()

  const filteredApprovalMessages = approvalMessages.filter(m => m.embeds.length > 0 && m.member.id === client.user.id)
  const filteredSubmissionMessages = submissionMessages.filter(m => m.embeds.length > 0 && m.member.id === client.user.id && m.reactions.size > 0)

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

    if (yesReactions > noReactions && yesReactions >= config.reactionLimit) {
      const similarMessage = findBuildMessage(message.embeds[0].url, approvalMessages)
      const newMessage = {
        embed: new Discord.RichEmbed(message.embeds[0])
      }

      if (similarMessage) {
        log.info(`Updating build ${newMessage.embed.title}`)
        return similarMessage.edit(newMessage.embed).then(() => message.delete())
      } else {
        log.info(`Adding build ${newMessage.embed.title}`)
        return approvalChannel.send(newMessage)
          .then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
          .then(() => message.delete())
      }
    } else if (noReactions > yesReactions && noReactions >= config.reactionLimit) {
      log.info(`Rejecting build ${message.embeds[0].title}`)
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

  const { submissionChannel, approvalMessages, submissionMessages } = await findMessages(client)

  return Promise.all(parsedSheet.map(async build => {
    const url = build[parseMap.link]
    const embed = createBuildEmbed(build)

    const approvalMessage = findBuildMessage(url, approvalMessages)

    if (approvalMessage) {
      log.info(`Updating build ${build[parseMap.name]}`)
      const result = approvalMessage.edit(embed)
      const yesReactions = await countReactions(approvalMessage, config.yesReaction, true)
      const noReactions = await countReactions(approvalMessage, config.noReaction, true)

      if (yesReactions === 0 && noReactions === 0) {
        return result.then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
      } else {
        return result
      }
    }

    const submissionMessage = findBuildMessage(url, submissionMessages)

    if (submissionMessage) {
      log.info(`Updating build ${build[parseMap.name]} for approval`)
      return submissionMessage.edit(embed)
    } else {
      log.info(`Submitting build ${build[parseMap.name]} for approval`)
      return submissionChannel.send({
        embed
      }).then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
    }
  }))
}

module.exports = (client) => {
  log.info(`Found ${client.channels.size} channels`)
  scheduleWithFixedDelay(client, () => scanReactions(client), 5000) // Every 5 seconds

  if (config.sheets.googleApiKey) {
    scheduleWithFixedDelay(client, () => fetchSheetSubmissions(client), 600000) // Every 10 minutes
  }
}
