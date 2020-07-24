const Discord = require('discord.js')
const config = require('./config')
const { log, createEmbed, sendDM, findBuildMessage, buildMessageLink } = require('./common')
const { createBuildEmbed } = require('./embed')
const { parseBuild, parseBuildId, parseMap } = require('./parser')
const { isApprover, isSubmitter } = require('./security')

module.exports = async (message, command, args) => {
  const value = args.join(' ')

  switch (command) {
    case 'help': {
      let hasAny = false
      const helpEmbed = createEmbed()
        .setTitle('Commands')
        .setDescription('You can view all available commands below')
        .addField('!help', 'Display this message')

      if (isApprover(message.member)) {
        hasAny = true
        helpEmbed.addField('!build <forum_url>', 'Gets the link to build message based on build URL')
        helpEmbed.addField('!build-full <forum_url>', 'Gets build full details based on build URL')
      }

      if (message.channel.name === config.submissionChannel) {
        hasAny = true
        helpEmbed.addField('!post <build_data>', 'Submits build for approval')
      }

      if (hasAny) {
        return message.channel.send({
          embed: helpEmbed
        })
      }

      break
    }
    case 'post': {
      if (!isSubmitter(message.member) || message.channel.name !== config.submissionChannel) {
        return
      }

      await message.delete()
      const build = parseBuild(value)

      if (!build) {
        return sendDM(message.author, {
          embed: createEmbed()
            .setTitle('Failed to execute command')
            .setDescription('Failed to parse build data')
            .addField('Command', message.content)
            .setColor(0xFF0000)
        })
      }

      const link = parseBuildId(build[parseMap.link])

      if (!link) {
        return sendDM(message.author, {
          embed: createEmbed()
            .setTitle('Failed to execute command')
            .setDescription('Failed to parse build data (invalid build url, needs to be forum post)')
            .addField('Command', message.content)
            .setColor(0xFF0000)
        })
      }

      const embed = createBuildEmbed(build)
      const channel = message.client.channels.find(c => c.name === config.submissionChannel)
      const messages = await channel.fetchMessages()
      const buildMessage = findBuildMessage(value, messages)

      if (buildMessage) {
        log.info(`Updating build ${build[parseMap.name]} for approval`)
        return buildMessage.edit(embed)
      }

      log.info(`Submitting build ${build[parseMap.name]} for approval`)
      return message.channel.send({
        embed
      }).then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
    }
    case 'build': {
      if (!isApprover(message.member)) {
        return
      }

      const channel = message.client.channels.find(c => c.name === config.approvedChannel)
      const messages = await channel.fetchMessages()
      const buildMessage = findBuildMessage(value, messages)

      if (buildMessage) {
        return message.channel.send('**Link to build**: ' + buildMessageLink(buildMessage))
      }

      break
    }
    case 'build-full': {
      if (!isApprover(message.member)) {
        return
      }

      const channel = message.client.channels.find(c => c.name === config.approvedChannel)
      const messages = await channel.fetchMessages()
      const buildMessage = findBuildMessage(value, messages)

      if (buildMessage) {
        return message.channel.send({
          embed: new Discord.RichEmbed(buildMessage.embeds[0])
        })
      }
    }
  }
}
