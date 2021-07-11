export interface GuildInfo {
  owner: boolean;
  permissions: number;
  icon: string;
  id: string;
  name: string;
  /** User has MANAGE_GUILD Permission */
  hasPerms?: boolean;
  /** Bot is in Server */
  inGuild?: boolean;
}

import { Profile as passportProfile } from 'passport-discord';

declare module 'passport-discord' {
  interface Profile extends passportProfile {
    refreshToken?: string;
    accessToken?: string;
  }
}
