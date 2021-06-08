import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue as Queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import Util from '../../util/pagination';

module.exports = {
  info: {
    name: 'queue',
    description: i18n.__('queue.description'),
    usage: '',
    aliases: ['q', 'list', 'songlist', 'song-list'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'ADD_REACTIONS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18n.__('error.noqueue'), message.channel);
    }

    const que = queue.songs.map(
      (t, i) => `\`${++i}.\` | [\`${t.title}\`](${t.url}) - [<@${t.req.id}>]`
    );

    const chunked = Util.chunk(que, 10).map((x) => x.join('\n'));

    const embed = new MessageEmbed()
      .setAuthor(
        i18n.__('queue.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(message.guild!.iconURL()!)
      .setColor('BLUE')
      .setDescription(chunked[0])
      .addField(
        i18n.__('queue.embed.now'),
        `[${queue.songs[0].title}](${queue.songs[0].url})`,
        true
      )
      .addField(i18n.__('queue.embed.text'), queue.textChannel, true)
      .addField(i18n.__('queue.embed.voice'), queue.voiceChannel, true)
      .setFooter(i18n.__mf('queue.embed.footer', { volume: queue.volume, pages: chunked.length }));
    if (queue.songs.length === 1) {
      embed.setDescription(i18n.__mf('queue.embed.description', { prefix: config.prefix }));
    }

    try {
      const queueMsg = await message.channel.send(embed);
      if (chunked.length > 1) {
        await Util.pagination(queueMsg, message.author, chunked);
      }
    } catch (e) {
      message.channel.send(`An error occurred: ${e.message}.`);
    }
  }
} as Command;
