import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'skip',
    description: 'Skip the current song',
    usage: '',
    aliases: ['s'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel!;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue)
      return sendError('There is nothing playing that I could skip for you.', message.channel);
    if (!serverQueue.connection) return;
    if (!serverQueue.connection.dispatcher) return;
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      const embed = new MessageEmbed()
        .setDescription('▶ Resumed the music for you!')
        .setColor('YELLOW')
        .setTitle('Music has been Resumed!');

      return message.channel.send(embed).catch((err) => console.log(err));
    }

    try {
      serverQueue.connection.dispatcher.end();
    } catch (error) {
      serverQueue.voiceChannel.leave();
      queue.delete(message.guild!.id);
      return sendError(
        `:notes: The player has stopped and the queue has been cleared.: ${error}`,
        message.channel
      );
    }
    message.react('✅');
  }
} as Command;
