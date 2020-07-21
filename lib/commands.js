const { createEmbed } = require('./common')
const { parseBuild } = require('./parser')
const { isSubmitter } = require('./security')
const config = require('./config')
const { parseBuildId } = require('./parser')
const { sendDM } = require('./common')
const { parseMap } = require('./parser')

/**
 * Builds single field for Discord embed
 * @param embed discord embed
 * @param header field header
 * @param value field value
 * @param inline if field is displayed in line or breaks into new line
 */
function buildField (embed, header, value, inline = true) {
  embed.addField(header, value, inline)
}

/**
 * Builds single field for Discord embed from map of fields
 * @param embed discord embed
 * @param header field header
 * @param map field key-value map
 * @param inline if field is displayed in line or breaks into new line
 */
function buildMap (embed, header, map, inline = true) {
  let output = ''

  for (const [key, value] of Object.entries(map)) {
    output += `**${key}**: ${value}\n`
  }

  buildField(embed, header, output, inline)
}

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

      const ascendancy = build[parseMap.ascendancy]
      const image = ascendancy.substring(ascendancy.indexOf("-") + 1).trim()
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

      const embed = createEmbed()
        .setTitle(build[parseMap.name])
        .setURL(build[parseMap.link])
        .setDescription(build[parseMap.description])
        .attachFiles([`./img/${image}.png`])
        .setThumbnail(`attachment://${image}.png`)

      buildField(embed, parseMap.author, build[parseMap.author])
      buildField(embed, parseMap.ascendancy, ascendancy)
      buildField(embed, parseMap.league, build[parseMap.league])
      buildField(embed, parseMap.tags, build[parseMap.tags], false)
      buildField(embed, parseMap.pastebin, build[parseMap.pastebin], false)

      buildMap(embed, 'Metadata', {
        [parseMap['damage type']]: build[parseMap['damage type']],
        [parseMap.damage]: build[parseMap.damage],
        [parseMap.clear]: build[parseMap.clear],
        [parseMap.survivability]: build[parseMap.survivability],
        [parseMap.mobility]: build[parseMap.mobility],
        [parseMap.activeness]: build[parseMap.activeness]
      })

      buildMap(embed, 'Accessibility', {
        [parseMap['as league starter']]: build[parseMap['as league starter']],
        [parseMap['in trade']]: build[parseMap['in trade']],
        [parseMap.ssf]: build[parseMap.ssf]
      })

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
