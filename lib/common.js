const { RichEmbed } = require('discord.js')
const log = require('loglevel')
const config = require('./config')
log.setLevel(config.logLevel)

function createEmbed () {
  return new RichEmbed()
    .setColor(0x00FF00)
}

module.exports = {
  log,
  createEmbed
}
