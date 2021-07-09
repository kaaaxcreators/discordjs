import connectLivereload from 'connect-livereload';
import { MessageEmbed, Permissions, TextChannel, Util, VoiceChannel } from 'discord.js';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import i18n from 'i18n';
import livereload from 'livereload';
import millify from 'millify';
import moment from 'moment';
import { join } from 'path';
import pMS from 'pretty-ms';
import scdl from 'soundcloud-downloader/dist/index';
import spdl from 'spdl-core';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { client, commands, config, IQueue } from '../index';
import database, { getGuild } from '../util/database';
import play, { Song } from '../util/playing';
i18n.setLocale(config.LOCALE);

import Auth from './Middlewares/Auth';

const Commands = Array.from(commands.mapValues((value) => value.info).values());

const api = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  draft_polli_ratelimit_headers: true
});

api.use(limiter);

if (process.env.LIVERELOAD == 'true') {
  const server = livereload.createServer();
  server.watch([join(__dirname + '../../../views'), join(__dirname + '../../../assets')]);
  api.use(connectLivereload());
}

api.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../../views/index.html'));
});

api.get('/api/info', (req, res) => {
  res.send({
    ClientID: client.user?.id,
    Permissions: config.PERMISSION,
    Scopes: config.SCOPES,
    Website: config.WEBSITE,
    CallbackURL: config.CALLBACK
  });
});

api.get('/dashboard', Auth, (req, res) => {
  res.sendFile(join(__dirname, '../../views/dashboard.html'));
});

api.get('/servers', Auth, (req, res) => {
  res.sendFile(join(__dirname, '../../views/servers.html'));
});

api.get('/servers/:id', Auth, (req, res) => {
  if (!req.user!.guilds!.find((x) => x.id == req.params.id)) {
    return res.redirect('/servers');
  }
  res.sendFile(join(__dirname, '../../views/server.html'));
});

api.get('/api/user', async (req, res) => {
  if (!req.user) {
    return res.send({});
  }
  req.user!.guilds!.map((g) => {
    g.hasPerms = new Permissions(g.permissions).has('MANAGE_GUILD', true);
    g.inGuild = client.guilds.cache.has(g.id);
    return g;
  });
  res.send({ user: req.user });
});

api.get('/api/commands', (req, res) => {
  res.send({ commands: Commands });
});

api.get('/api/translations', (req, res) => {
  res.send({ translations: i18n.getCatalog(config.LOCALE), locale: config.LOCALE });
});

api.post('/api/prefix/:id/:prefix', async (req, res) => {
  const { prefix, id } = req.params;
  const guildDB = await getGuild(id);
  // Check if valid request
  if (
    typeof prefix !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild and has perms
    req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id) &&
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)?.hasPerms
  ) {
    res.status(403).json({ status: 403 });
  } else if (!guildDB) {
    res.status(500).json({ status: 500 });
  } else if (prefix == guildDB.prefix) {
    res.status(304).json({ status: 304 });
  } else {
    database.set(id, { prefix: prefix });
    return res.json({ prefix: prefix });
  }
});

api.post('/api/queue/:id/add/:song', async (req, res) => {
  const { id, song } = req.params;
  const vchannel = <string>req.query.vchannel;
  const mchannel = <string>req.query.mchannel;
  if (
    typeof id !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else {
    const serverQueue = (await import('../index')).queue.get(id);
    const client = (await import('../index')).client;
    const user = await client.users.fetch(req.user.id);
    let Song: Song;
    let songInfo;
    if (song.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
      try {
        songInfo = await ytdl.getInfo(song);
        if (!songInfo) {
          return res.status(404).json({ status: 404 });
        }
        Song = {
          id: songInfo.videoDetails.videoId,
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          img: songInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
          duration: Number(songInfo.videoDetails.lengthSeconds) * 1000,
          ago: moment(songInfo.videoDetails.publishDate).fromNow(),
          views: millify(Number(songInfo.videoDetails.viewCount)),
          live: songInfo.videoDetails.isLiveContent,
          req: user
        };
      } catch (error) {
        return res.status(500).json({ status: 500, error: error.message || error });
      }
    } else if (scdl.isValidUrl(song)) {
      try {
        songInfo = await scdl.getInfo(song);
        if (!songInfo) {
          return res.status(404).json({ status: 404 });
        }
        Song = {
          id: songInfo.permalink!,
          title: songInfo.title!,
          url: songInfo.permalink_url!,
          img: songInfo.artwork_url!,
          ago: moment(songInfo.last_modified!).fromNow(),
          views: millify(songInfo.playback_count!),
          duration: Math.ceil(songInfo.duration!),
          req: user
        };
      } catch (error) {
        return res.status(500).json({ status: 500, error: error.message || error });
      }
    } else if (spdl.validateURL(song)) {
      try {
        songInfo = await spdl.getInfo(song);
        if (!songInfo) {
          return res.status(404).json({ status: 404 });
        }
        Song = {
          id: songInfo.id,
          title: songInfo.title,
          url: songInfo.url,
          img: songInfo.thumbnail,
          ago: '-',
          views: '-',
          duration: songInfo.duration!,
          req: user
        };
      } catch (error) {
        return res.status(500).json({ status: 500, error: error.message || error });
      }
    } else {
      try {
        const searched = await yts.search(song);
        if (searched.videos.length === 0) {
          return res.status(404).json({ status: 404 });
        }
        songInfo = searched.videos[0];
        Song = {
          id: songInfo.videoId,
          title: Util.escapeMarkdown(songInfo.title),
          views: millify(songInfo.views),
          url: songInfo.url,
          ago: songInfo.ago,
          duration: songInfo.duration.seconds * 1000,
          img: songInfo.image,
          req: user
        };
      } catch (error) {
        return res.json({ status: 500, error: error.message || error });
      }
    }
    if (serverQueue) {
      serverQueue.songs.push(Song);
      const embed = new MessageEmbed()
        .setAuthor(
          'Song has been added to queue from Dashboard',
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(Song.img!)
        .setColor('YELLOW')
        .addField(i18n.__('play.embed.name'), `[${Song.title}](${Song.url})`, true)
        .addField(
          i18n.__('play.embed.duration'),
          Song.live ? i18n.__('nowplaying.live') : pMS(Song.duration, { secondsDecimalDigits: 0 }),
          true
        )
        .addField(i18n.__('play.embed.request'), Song.req.tag, true)
        .setFooter(`${i18n.__('play.embed.views')} ${Song.views} | ${Song.ago}`);
      serverQueue.textChannel.send(embed);
      return res.json(Song);
    } else {
      if (mchannel && vchannel) {
        const textChannel = <TextChannel>await client.channels.cache.get(mchannel);
        const voiceChannel = <VoiceChannel>await client.channels.cache.get(vchannel);
        if (
          // check if channels are valid and if user has perms
          textChannel?.type === 'text' &&
          voiceChannel?.type === 'voice' &&
          textChannel.permissionsFor(user)?.has('SEND_MESSAGES') &&
          voiceChannel.permissionsFor(user)?.has('SPEAK')
        ) {
          const queueConstruct: IQueue = {
            textChannel: textChannel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 80,
            playing: true,
            loop: false
          };
          queueConstruct.songs.push(Song);
          (await import('../index')).queue.set(id, queueConstruct);
          try {
            const connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            const message = {
              guild: {
                id: id
              },
              channel: textChannel
            };
            play.play(queueConstruct.songs[0], message);
          } catch (error) {
            console.error(`${i18n.__('error.join')} ${error}`);
            (await import('../index')).queue.delete(id);
            voiceChannel.leave();
            return res.status(500).json({ status: i18n.__('error.join') });
          }
          return res.json({ status: 200 });
        } else {
          return res.status(400).json({ status: 400 });
        }
      } else {
        return res.status(400).json({ status: 400 });
      }
    }
  }
});

api.post('/api/queue/:id/skip', async (req, res) => {
  const { id } = req.params;
  if (
    typeof id !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else {
    const serverQueue = (await import('../index')).queue.get(id);
    if (serverQueue && serverQueue.connection && serverQueue.connection.dispatcher) {
      try {
        if (serverQueue.playing) {
          serverQueue.connection.dispatcher.end();
          return res.json({ status: 'Skipped' });
        } else {
          serverQueue.playing = true;
          serverQueue.connection.dispatcher.resume();
          return res.json({ status: 'Resumed' });
        }
      } catch {
        serverQueue.voiceChannel.leave();
        (await import('../index')).queue.delete(id);
      }
    } else {
      return res.status(501).json({ status: 501 });
    }
  }
});

api.get('/logout', (req, res) => {
  if (req.user) {
    req.logout();
  }
  res.redirect('/');
});

export default api;
