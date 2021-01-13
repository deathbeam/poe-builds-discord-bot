module.exports = {
  // Minimum level of messages that are logged to console
  logLevel: process.env.LOG_LEVEL || 'info',
  // This is token used for bot to login, must be from Discord Application who has bot enabled
  discordToken: process.env.DISCORD_TOKEN,
  // Bot command prefix in Discord server
  prefix: '+',
  // Name of Discord role that will be used to check if user can submit build
  submitterRole: 'BuildGuideMonitor',
  // Name of Discord channel where submissions can be posted
  submissionChannel: 'build-guide-moderation',
  // Name of Discord role that will be used to check if user can approve build
  approverRole: 'BuildGuideMonitor',
  // Name of Discord channel where approved builds will be posted
  approvedChannel: 'build-guides',
  // Yes/No reactions used for approving/rejecting builds
  yesReaction: '👍',
  noReaction: '👎',
  reactionLimit: 1,
  // Build purge configuration
  purgeTitle: 'Build Purge!',
  purgeReactionLimit: 5,
  // Base url for ascendancy images
  resourceBase: 'https://raw.github.com/deathbeam/poe-builds-discord-bot/master/img',
  // Google sheet parsing
  sheets: {
    // ID of the submission sheet
    sheetId: process.env.GOOGLE_SHEET_ID,
    // Name of the sheet
    sheetName: 'Current_League',
    // Cell range of data to parse
    sheetRange: 'B:S',
    // Google API key with Sheets API enabled
    googleApiKey: process.env.GOOGLE_API_KEY
  }
}
