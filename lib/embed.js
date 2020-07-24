const { parseMap } = require('./parser')
const { createEmbed } = require('./common')
const config = require('./config')

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
 * Creates discord embed from build parsed using parser
 * @param build map with build data
 */
function createBuildEmbed (build) {
  const ascendancy = build[parseMap.ascendancy]
  const image = ascendancy.substring(ascendancy.indexOf('-') + 1).trim()

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
    [parseMap.damagetype]: build[parseMap.damagetype],
    [parseMap.damage]: build[parseMap.damage],
    [parseMap.clear]: build[parseMap.clear],
    [parseMap.survivability]: build[parseMap.survivability],
    [parseMap.mobility]: build[parseMap.mobility],
    [parseMap.activeness]: build[parseMap.activeness]
  })

  buildMap(embed, 'Accessibility', {
    [parseMap.asleaguestarter]: build[parseMap.asleaguestarter],
    [parseMap.intrade]: build[parseMap.intrade],
    [parseMap.ssf]: build[parseMap.ssf]
  })

  return embed
}

module.exports = {
  createBuildEmbed
}
