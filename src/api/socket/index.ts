import i18n from 'i18n';
import pMS from 'pretty-ms';
import { Server } from 'socket.io';

import { config } from '../../index';
i18n.setLocale(config.LOCALE);
import ProgressBar from '../../util/ProgressBar';

function socket(io: Server): void {
  io.on('connection', (socket) => {
    // Dashboard
    socket.on('dashboard', () => {
      if (socket.Dashboard) {
        clearInterval(socket.Dashboard);
      }
      socket.Dashboard = setInterval(async () => {
        const { client, Stats } = await import('../../index');
        let totalvcs = 0;
        client.guilds.cache.array().forEach((guild) => {
          if (guild.voice?.connection) {
            totalvcs += 1;
          }
        });
        socket.emit('dashboard', {
          users: client.users.cache.size,
          guilds: client.guilds.cache.size,
          uptime: pMS(client.uptime!, { secondsDecimalDigits: 0 }),
          avatarURL: client.user!.avatarURL()
            ? client.user!.avatarURL()
            : 'https://i.imgur.com/fFReq20.png',
          username: client.user!.username,
          totalvcs: totalvcs,
          commandsRan: Stats.commandsRan,
          songsPlayed: Stats.songsPlayed
        });
      }, 1000);
    });

    // Get Information about specific Server
    socket.on('server', (ServerID) => {
      if (socket.Server) {
        clearInterval(socket.Server);
      }
      socket.Server = setInterval(async () => {
        const { client, queue } = await import('../../index');
        const { getPrefix } = await import('../../util/database');
        const Guild = client.guilds.cache.get(ServerID);
        const prefix = await getPrefix(Guild!);
        if (!Guild) {
          return socket.emit('error', 'Unable to find that server');
        }
        const player = queue.get(Guild.id);
        if (!player) {
          socket.emit('server', {
            queue: 0,
            songsLoop: i18n.__('socket.disabled'),
            prefix: prefix
          });
        } else {
          socket.emit('server', {
            queue: player.songs ? player.songs.length : 0,
            songsLoop: player.loop ? i18n.__('socket.enabled') : i18n.__('socket.disabled'),
            prefix: prefix,
            bar:
              player.songs[0] && player.connection
                ? player.songs[0].live
                  ? '▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—'
                  : ProgressBar(
                      player.connection.dispatcher.streamTime,
                      player.songs[0].duration,
                      20
                    ).Bar
                : false,
            maxDuration:
              player.songs[0] && player.connection
                ? player.songs[0].live
                  ? i18n.__('nowplaying.live')
                  : pMS(player.songs[0].duration, {
                      colonNotation: true,
                      secondsDecimalDigits: 0
                    })
                : false,
            position: player.connection
              ? pMS(player.connection.dispatcher.streamTime, {
                  colonNotation: true,
                  secondsDecimalDigits: 0
                })
              : false,
            nowPlaying: player.songs[0] ? player.songs[0] : false
          });
        }
      }, 1000);
    });
  });
}

export default socket;
