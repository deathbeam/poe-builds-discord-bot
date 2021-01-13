const { MessageEmbed } = require('discord.js')
const { createLogger, format, transports } = require('winston')
const config = require('./config')
const { parseBuildId } = require('./parser')

const log = createLogger({
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [new transports.Console()],
  level: config.logLevel
})

/**
 * Small utility function to create embed with some predefined style
 */
function createEmbed () {
  return new MessageEmbed()
    .setColor(0x800080)
}

/**
 * Small utility function to send DMS to user
 * @param author message author
 * @param message message to send
 */
function sendDM (author, message) {
  return author.createDM().then(channel => channel.send(message))
}

/**
 * Finds all messages in specified channel
 * @param client discord client
 * @param channel channel name
 * @returns {Promise<*[]|Collection<Snowflake, Message>>}
 */
async function findMessagesForChannel (client, channel) {
  const clientChannel = client.channels.cache.find(c => c.name === config.submissionChannel)

  if (!clientChannel) {
    return Promise.resolve([])
  }

  return await clientChannel.messages.fetch()
}

/**
 * Build link that will point user to message in specific channel
 * @param message message to link to
 */
function buildMessageLink (message) {
  return `http://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
}

/**
 * Finds build message based on build URL
 * @param url build URL
 * @param messages messages to search in
 */
function findBuildMessage (url, messages) {
  const filteredApprovalMessages = messages.filter(m => m.embeds.length > 0)

  const reqBuildId = parseBuildId(url)

  if (!reqBuildId) {
    return
  }

  return filteredApprovalMessages.find(m => {
    const buildId = parseBuildId(m.embeds[0].url)
    return buildId && reqBuildId === buildId
  })
}

module.exports = {
  log,
  createEmbed,
  sendDM,
  findMessagesForChannel,
  buildMessageLink,
  findBuildMessage
}
