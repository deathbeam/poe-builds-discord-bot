const parseMap = {
  name: 'Build Name',
  submitter: 'Submitter',
  author: 'Build Author',
  link: 'Link to forum post',
  ascendancy: 'Ascendancy',
  league: 'Intended League',
  tags: 'Build Tags',
  'damage type': 'Damage Type',
  description: 'Short Description,',
  damage: 'Single Target',
  clear: 'Clear Speed',
  survivability: 'Survivability',
  mobility: 'Mobility',
  activeness: 'Activeness',
  'as league starter': 'As League Starter',
  'in trade': 'In Trade',
  ssf: 'SSF'
}

function parseBuild (build) {
  const lineArray = build.trim().split(/\r?\n/)
  const data = {}

  lineArray.forEach(line => {
    const keyValue = line.trim().split(':')

    if (keyValue.length >= 2) {
      data[keyValue.shift().trim().toLowerCase()] = keyValue.join(':').trim()
    }
  })

  const output = {}

  for (const [key, value] of Object.entries(parseMap)) {
    if (key in data) {
      output[value] = data[key]
    }
  }

  if (Object.values(output).filter(v => !!v).length !== Object.values(parseMap).filter(v => !!v).length) {
    return null
  }

  return output
}

function parseBuildId (url) {
  const regex = /\/view-thread\/(\d+)/
  const match = url.match(regex)

  if (match) {
    return match[1]
  }

  return null
}

module.exports = {
  parseBuild,
  parseBuildId,
  parseMap
}
