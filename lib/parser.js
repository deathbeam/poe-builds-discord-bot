const parseMap = {
  name: 'Build Name',
  author: 'Build Author',
  link: 'Link to forum post',
  ascendancy: 'Ascendancy',
  league: 'Intended League',
  tags: 'Build Tags',
  description: 'Short Description,',
  damage: 'Single Target',
  clear: 'Clear Speed',
  survivability: 'Survivability',
  recovery: 'Recovery',
  mobility: 'Mobility',
  involvedness: 'Involvedness',
  accessibility: 'Gear Accessibility'
}

function parseBuild (build) {
  const lineArray = build.trim().split(/\r?\n/)
  const data = {}

  lineArray.forEach(line => {
    const keyValue = line.trim().split(':')
    data[keyValue.shift().trim().toLowerCase()] = keyValue.join(':').trim()
  })

  const output = {}

  for (const [key, value] of Object.entries(parseMap)) {
    if (key in data) {
      output[value] = data[key]
    }
  }

  return output
}

module.exports = {
  parseBuild,
  parseMap
}
