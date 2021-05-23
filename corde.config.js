/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv-safe');
dotenv.config();

module.exports = {
  cordeBotToken: process.env.CORDETOKEN || 'cordeBotToken',
  botTestId: process.env.BOTID || 'botTestId',
  botToken: process.env.TOKEN || 'botToken',
  guildId: process.env.GUILDID || 'guildId',
  channelId: process.env.CHANNELID || 'channelId',
  botPrefix: 'm',
  testMatches: ['./dist/test/**'],
  timeout: 10000
};
