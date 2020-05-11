const { createEmbed } = require('./common')
const { parseBuild } = require('./parser')
const { isSubmitter } = require('./security')
const config = require('./config')
const { parseBuildId } = require('./parser')
const { sendDM } = require('./common')
const { parseMap } = require('./parser')

module.exports = async (message, command, args) => {
  const value = args.join(' ')

  switch (command) {
    case 'help': {
      const helpEmbed = createEmbed()
        .setTitle('Commands')
        .setDescription('You can view all available commands below')
        .addField('!help', 'Display this message')
        .addField('!post <build_data>', 'Submits build for approval')
        .addField('!build <forum_url>', 'Gets build details based on build for url')

      const toSend = {
        embed: helpEmbed
      }

      return message.channel.send(toSend)
    }
    case 'post': {
      if (!isSubmitter(message.member) || message.channel.name !== config.submissionChannel) {
        return
      }

      message.delete()
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

      const embed = createEmbed()
        .setTitle(build[parseMap.name])
        .setURL(build[parseMap.link])
        .setAuthor(build[parseMap.author])
        .setDescription(build[parseMap.description])
        .attachFiles([`./img/${build[parseMap.ascendancy]}.png`])
        .setThumbnail(`attachment://${build[parseMap.ascendancy]}.png`)
        .addField(parseMap.ascendancy, build[parseMap.ascendancy], true)
        .addField(parseMap.league, build[parseMap.league], true)
        .addField(parseMap.tags, build[parseMap.tags])
        .addField(parseMap.damage, build[parseMap.damage], true)
        .addField(parseMap.clear, build[parseMap.clear], true)
        .addField(parseMap.survivability, build[parseMap.survivability], true)
        .addField(parseMap.recovery, build[parseMap.recovery], true)
        .addField(parseMap.involvedness, build[parseMap.involvedness], true)
        .addField(parseMap.accessibility, build[parseMap.accessibility], true)

      return message.channel.send({
        embed
      }).then(m => m.react(config.yesReaction).then(() => m.react(config.noReaction)))
    }
    case 'build': {
      const approvalChannel = message.client.channels.find(c => c.name === config.approvedChannel)
      const approvalMessages = await approvalChannel.fetchMessages()
      const filteredApprovalMessages = approvalMessages.filter(m => m.embeds.length > 0)

      const reqBuildId = parseBuildId(value)

      if (!reqBuildId) {
        return
      }

      const build = filteredApprovalMessages.find(m => {
        const buildId = parseBuildId(m.embeds[0].url)
        return buildId && reqBuildId === buildId
      })

      if (build) {
        return message.channel.send({
          embed: build.embeds[0]
        })
      }
    }
  }
}
