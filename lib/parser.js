const config = require('./config')

const parseMap = {
  name: 'Build Name',
  submitter: 'Submitter',
  author: 'Build Author',
  link: 'Link to forum post',
  ascendancy: 'Ascendancy',
  league: 'Intended League',
  tags: 'Build Tags',
  damagetype: 'Damage Type',
  description: 'Short Description,',
  damage: 'Single Target',
  clear: 'Clear Speed',
  survivability: 'Survivability',
  mobility: 'Mobility',
  activeness: 'Activeness',
  asleaguestarter: 'As League Starter',
  intrade: 'In Trade',
  ssf: 'SSF',
  pastebin: 'Pastebin'
}

function parseBuild (build) {
  const lineArray = build.trim().replace(/"/g, '').split(/\r?\n/)
  const data = {}

  lineArray.forEach(line => {
    const keyValue = line.trim().split(':')

    if (keyValue.length >= 2) {
      const key = keyValue.shift().trim().toLowerCase().replace(/ /g, '')
      const value = keyValue.join(':').trim()
      data[key] = value
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

  if (output[parseMap.name] === config.purgeTitle) {
    return null
  }

  return output
}

function parseBuildId (url) {
  if (!url) {
    return null
  }

  const regex = /\/view-thread\/(\d+)/
  const match = url.match(regex)

  if (match) {
    return match[1]
  }

  return null
}

function parseSheet (sheet) {
  const values = sheet.values

  return values.map(value => {
    const submitter = value.shift()
    const name = value.shift()
    const author = value.shift()
    const link = value.shift()
    const ascendancy = value.shift()
    const league = value.shift()
    const skill = value.shift()
    const damagetype = value.shift()
    const description = value.shift()
    const damage = value.shift()
    const clearspeed = value.shift()
    const survivability = value.shift()
    const mobility = value.shift()
    const activeness = value.shift()
    const accessibilityleaguestarter = value.shift()
    const accessibilitytrade = value.shift()
    const accessibilityssf = value.shift()
    const pastebin = value.shift()

    return {
      [parseMap.submitter]: submitter,
      [parseMap.name]: name,
      [parseMap.author]: author,
      [parseMap.link]: link,
      [parseMap.ascendancy]: ascendancy,
      [parseMap.league]: league,
      [parseMap.tags]: skill,
      [parseMap.damagetype]: damagetype,
      [parseMap.description]: description,
      [parseMap.damage]: damage,
      [parseMap.clear]: clearspeed,
      [parseMap.survivability]: survivability,
      [parseMap.mobility]: mobility,
      [parseMap.activeness]: activeness,
      [parseMap.asleaguestarter]: accessibilityleaguestarter,
      [parseMap.intrade]: accessibilitytrade,
      [parseMap.ssf]: accessibilityssf,
      [parseMap.pastebin]: pastebin
    }
  })
}

module.exports = {
  parseBuild,
  parseBuildId,
  parseSheet,
  parseMap
}
