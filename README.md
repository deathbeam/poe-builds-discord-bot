# poe-builds-discord-bot ![CI](https://github.com/deathbeam/poe-builds-discord-bot/workflows/CI/badge.svg)

1. Run `npm install`
2. Set env `DISCORD_TOKEN` to your Discord bot token
3. Set env `GOOGLE_API_KEY` to your Google API key
4. Set env `GOOGLE_SHEET_ID` to ID of google submission sheet
4. (optional) Set env `LOG_LEVEL` to `debug` if you want debug logging
5. Run `node lib/app.js` (or without LOG_LEVEL to default to 'info')

### Getting Discord token

To get discord bot token see this page https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token

### Getting google API key

To create google API key see this page https://developers.google.com/sheets/api/guides/authorizing#APIKey

After that, you also need to enable Sheets API, you can do that here https://console.developers.google.com/apis/api/sheets.googleapis.com

### Getting google sheet ID

If you have URL to your spreadsheet, see this page https://developers.google.com/sheets/api/guides/concepts#spreadsheet_id

