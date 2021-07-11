// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  ActivityType,
  Client,
  Collection,
  DMChannel,
  Message,
  NewsChannel,
  PermissionResolvable,
  TextChannel,
  VoiceChannel,
  VoiceConnection
} from 'discord.js';
import dotenv, { MissingEnvVarsError } from 'dotenv-safe'; //Loading .env
try {
  dotenv.config();
} catch (err) {
  EnvError(err);
}

import { existsSync, mkdirSync, readdir } from 'fs';
import i18n from 'i18n';
import path from 'path';

import docs from './docs';
import console from './util/logger';
import { Song } from './util/playing';

export const client = new Client();
export const commands = new Collection<string, Command>();
export const queue = new Map<string, IQueue>();

/** Represents the Queue */
export interface IQueue {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  connection: VoiceConnection | null;
  songs: Song[];
  volume: number;
  playing: boolean;
  loop: boolean;
}

const locales = ['en', 'de'];
const locale = process.env.LOCALE || 'en';

const PresenceTypes = ['STREAMING', 'WATCHING', 'PLAYING', 'LISTENING'];
const PresenceType = <ActivityType>process.env.PRESENCETYPE || 'LISTENING';

export const config: Config = {
  prefix: process.env.PREFIX!,
  TOKEN: process.env.TOKEN!,
  PRESENCE: process.env.PRESENCE!,
  PRESENCETYPE: PresenceTypes.includes(PresenceType) ? PresenceType : 'LISTENING',
  LOCALE: locales.includes(locale) ? locale : 'en',
  PERMISSION: process.env.PERMS || '2205281600',
  WEBSITE: process.env.WEB!,
  SCOPES: process.env.SCOPES?.split(' ') || 'identify guilds applications.commands'.split(' '),
  CALLBACK: process.env.CALLBACK || '/api/callback',
  SECRET: process.env.SECRET!,
  COOKIESECRET: process.env.COOKIESECRET || 'garbage-shampoo-surviving',
  DISABLEWEB: process.env.DISABLE_WEB ? /true/i.test(process.env.DISABLE_WEB) : false,
  DIDYOUMEAN: process.env.DIDYOUMEAN ? /true/i.test(process.env.DIDYOUMEAN) : false,
  GUILDPREFIX: process.env.GUILDPREFIX ? /true/i.test(process.env.GUILDPREFIX) : false
};

export const Stats = {
  commandsRan: 0,
  songsPlayed: 0
};

// Configure i18n
i18n.configure({
  locales: locales,
  directory: path.join(__dirname, '/../locales'),
  defaultLocale: 'en',
  objectNotation: true,
  register: global,

  logWarnFn: function (msg) {
    console.info(msg);
  },

  logErrorFn: function (msg) {
    console.info(msg);
  }
});
i18n.setLocale(config.LOCALE);

// Generate Docs if Env is set
if (process.env.DOCS == 'true') {
  docs();
}

//Loading Events
readdir(__dirname + '/events/', (err, files) => {
  if (err) {
    return console.error(err);
  }
  files.forEach((file) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const event = require(__dirname + `/events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
    console.info(i18n.__('index.event') + ' ' + eventName);
  });
});

//Loading Music
readdir(__dirname + '/commands/music', (err, files) => {
  if (err) {
    return console.error(err);
  }
  files.forEach((file) => {
    if (!endsWithAny(['.ts', '.js'], file)) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/music/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.info(i18n.__('index.command.music') + ' ' + commandName);
  });
});

//Loading General
readdir(__dirname + '/commands/general', (err, files) => {
  if (err) {
    return console.error(err);
  }
  files.forEach((file) => {
    if (!endsWithAny(['.ts', '.js'], file)) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/general/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.info(i18n.__('index.command.general') + ' ' + commandName);
  });
});

// Setup DB
if (!existsSync('db')) {
  mkdirSync('db');
}

// Logging in to discord and start server
try {
  client.login(config.TOKEN).catch((err) => LoginError(err));
} catch (err) {
  LoginError(err);
}

// Custom Bad Token Error Handling
function LoginError(err: Error) {
  console.info(
    i18n.__('error.occurred') + ' ' + err.message
      ? err.message == i18n.__('index.token.invalid')
        ? i18n.__('index.token.env')
        : err.message
      : err
  );
  process.exit();
}

// Custom Missing Env Vars Error Handling
function EnvError(err: MissingEnvVarsError) {
  console.info(
    i18n.__('error.occurred') + ' ' + err.missing
      ? `${i18n.__('index.env.missing')} ${err.missing
          .map((err) => `"${err}"`)
          .join(', ')}\n${i18n.__('index.env.add')}`
      : err.message
      ? err.message
      : err
  );
  process.exit();
}

/** Represents a Command */
export interface Command {
  info: {
    name: string;
    description: string;
    usage: string;
    aliases: string[];
    categorie: 'general' | 'music';
    permissions: Permissions;
  };

  run: (client: Client, message: Message, args: string[]) => unknown;
}

interface Permissions {
  /** Permissions the Bot needs */
  channel: PermissionResolvable[];
  /** Permissions the Member needs */
  member: PermissionResolvable[];
}

interface Config {
  TOKEN: string;
  prefix: string;
  PRESENCE: string;
  PRESENCETYPE: ActivityType;
  LOCALE: string;
  PERMISSION: string;
  WEBSITE: string;
  SCOPES: string[];
  CALLBACK: string;
  SECRET: string;
  COOKIESECRET: string;
  DISABLEWEB: boolean;
  DIDYOUMEAN: boolean;
  GUILDPREFIX: boolean;
}

/**
 * support typescript files when using ts-node
 * @author <https://stackoverflow.com/a/45069552/13707908> */
function endsWithAny(suffixes: string[], string: string) {
  return suffixes.some((suffix) => string.endsWith(suffix));
}
