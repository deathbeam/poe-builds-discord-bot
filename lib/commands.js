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
        .addField(`${config.prefix}help`, 'Display this message')

      if (isApprover(message.member)) {
        hasAny = true
        helpEmbed.addField(`${config.prefix}build <forum_url>`, 'Gets the link to build message based on build URL')
        helpEmbed.addField(`${config.prefix}build-full <forum_url>`, 'Gets build full details based on build URL')

        if (message.channel.name === config.submissionChannel) {
          helpEmbed.addField(`${config.prefix}build-purge`, 'Initiates build purge for approval')
        }
      }

      if (message.channel.name === config.submissionChannel) {
        hasAny = true
        helpEmbed.addField(`${config.prefix}post <build_data>`, 'Submits build for approval')
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

      break
    }
    case 'build-purge': {
      if (!isApprover(message.member) || message.channel.name !== config.submissionChannel) {
        return
      }

      const embed = createEmbed()
        .setColor(0xFF0000)
        .setTitle(config.purgeTitle)
        .setDescription(`Are you sure you want to perform build Purge in ${config.approvedChannel}? Requires ${config.purgeReactionLimit} approvals`)
        .setFooter('You don\'t remember how bad it was, Charlie, the poverty, all the crime. This night saved our country.')

      return message.channel.send({
        embed
      }).then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
    }
  }
}
