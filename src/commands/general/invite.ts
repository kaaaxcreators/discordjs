import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config } from '../../index';
i18n.setLocale(config.LOCALE);

module.exports = {
  info: {
    name: 'invite',
    description: i18n.__('invite.description'),
    usage: '',
    aliases: ['inv'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    if (config.DISABLEWEB) {
      const url = `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&permissions=${
        config.PERMISSION
      }&scope=bot`;
      const embed = new MessageEmbed()
        .setTitle(`${i18n.__('invite.embed.title')} ${client.user!.username}`)
        .setDescription(i18n.__mf('invite.embed.description', { url: url }))
        .setURL(url)
        .setColor('BLUE');
      return message.channel.send(embed);
    }
    //set the permissions id here (https://discordapi.com/permissions.html)
    const url = `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&permissions=${
      config.PERMISSION
    }&scope=bot%20${config.SCOPES.join('%20')}&redirect_url=${config.WEBSITE}${
      config.CALLBACK
    }&response_type=code`;

    const embed = new MessageEmbed()
      .setTitle(`${i18n.__('invite.embed.title')} ${client.user!.username}`)
      .setDescription(i18n.__mf('invite.embed.description', { url: url }))
      .setURL(url)
      .setColor('BLUE');
    return message.channel.send(embed);
  }
} as Command;
