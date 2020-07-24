const { RichEmbed } = require('discord.js')
const log = require('loglevel')
const config = require('./config')
const { parseBuildId } = require('./parser')
log.setLevel(config.logLevel)

/**
 * Small utility function to create embed with some predefined style
 */
function createEmbed () {
  return new RichEmbed()
    .setColor(0x00FF00)
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
  buildMessageLink,
  findBuildMessage
}
