const Discord = require('discord.js')
const { log } = require('./common')
const config = require('./config')
const commands = require('./commands')
const tasks = require('./tasks')
const client = new Discord.Client()

client.on('ready', () => {
  log.info(`Logged in as ${client.user.tag}!`)
  client.channels.forEach(c => log.info('Found channel ' + c.name))
  setTimeout(tasks, 5000, client)
})

client.on('message', message => {
  if (message.author.bot) {
    return
  }

  if (!message.content.startsWith(config.prefix)) {
    return
  }

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  commands(message, command, args)
})

client.on('error', log.error)

client.login(config.discordToken)
  .then(token => log.info('Successfully authenticated with token', token))
  .catch(err => log.error('Failed to authenticate with token', err))
