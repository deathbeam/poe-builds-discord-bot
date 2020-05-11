const { RichEmbed } = require('discord.js')
const log = require('loglevel')
const config = require('./config')
log.setLevel(config.logLevel)

function createEmbed () {
  return new RichEmbed()
    .setColor(0x00FF00)
}

function sendDM (author, message) {
  return author.createDM().then(channel => channel.send(message))
}

module.exports = {
  log,
  createEmbed,
  sendDM
}
