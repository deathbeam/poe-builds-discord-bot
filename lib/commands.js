const Discord = require('discord.js')
const { createEmbed } = require('./common')
const { parseBuild } = require('./parser')
const { isApprover, isSubmitter } = require('./security')
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
 * @param message incoming message
 */
async function findBuildMessage (url, message) {
  const approvalChannel = message.client.channels.find(c => c.name === config.approvedChannel)
  const approvalMessages = await approvalChannel.fetchMessages()
  const filteredApprovalMessages = approvalMessages.filter(m => m.embeds.length > 0)

  const reqBuildId = parseBuildId(url)

  if (!reqBuildId) {
    return
  }

  return filteredApprovalMessages.find(m => {
    const buildId = parseBuildId(m.embeds[0].url)
    return buildId && reqBuildId === buildId
  })
}

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
        .setThumbnail(`${config.resourceBase}/${image}.png`)

      buildField(embed, parseMap.author, build[parseMap.author])
      buildField(embed, parseMap.ascendancy, ascendancy)
      buildField(embed, parseMap.league, build[parseMap.league])
      buildField(embed, parseMap.tags, build[parseMap.tags], false)
      buildField(embed, parseMap.pastebin, build[parseMap.pastebin], false)

      buildMap(embed, 'Characteristics', {
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
      if (!isApprover(message.member)) {
        return
      }

      const build = await findBuildMessage(value, message)

      if (build) {
        return message.channel.send('**Link to build**: ' + buildMessageLink(build))
      }

      break
    }
    case 'build-full': {
      if (!isApprover(message.member)) {
        return
      }

      const build = await findBuildMessage(value, message)

      if (build) {
        return message.channel.send({
          embed: new Discord.RichEmbed(build.embeds[0])
        })
      }
    }
  }
}
