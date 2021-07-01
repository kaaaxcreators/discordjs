import { afterAll, beforeStart, expect, group, test } from 'corde';
import { IEmbedFieldData, IMessageEmbed, IMessageEmbedFooter } from 'corde/lib/src/types';

import { client } from '../index';

beforeStart(async () => {
  await new Promise((r) => setTimeout(r, 25000));
});

group('music commands', () => {
  test('various commands should return samevc', () => {
    const samevc = {
      description: "I'm sorry but you need to be in the same voice channel as me!",
      footer: 'Something went wrong :(',
      color: 'RED'
    } as IMessageEmbed;
    expect('earrape').toReturn(samevc);
    expect('loop').toReturn(samevc);
    expect('pause').toReturn(samevc);
    expect('remove').toReturn(samevc);
    expect('resume').toReturn(samevc);
    expect('shuffle').toReturn(samevc);
    expect('skip').toReturn(samevc);
    expect('skipto 1').toReturn(samevc);
    expect('stop').toReturn(samevc);
    expect('volume').toReturn(samevc);
  });
  test('various commands should return novc', () => {
    const novc = {
      description: "I'm sorry but you need to be in a voice channel to play music!",
      footer: 'Something went wrong :(',
      color: 'RED'
    } as IMessageEmbed;
    expect('leave').toReturn(novc);
    expect('play').toReturn(novc);
    expect('playlist').toReturn(novc);
    expect('radio').toReturn(novc);
    expect('search').toReturn(novc);
  });
});
group('maincommands', () => {
  test('count', () => {
    const count = {
      color: 'YELLOW',
      description: 'The Bot is currently in 2 Servers',
      footer: 'Use minvite to add/invite the Bot to your server'
    } as IMessageEmbed;
    expect('count').toReturn(count);
  });
  test('invite', () => {
    const invite = {
      title: 'Invite kaaaxTest',
      description:
        'Want me in your server? Invite me today! \n\n [Invite Link](https://discord.com/oauth2/authorize?client_id=' +
        process.env.BOTID +
        '6&permissions=2205281600&scope=bot)',
      color: 'BLUE'
    } as IMessageEmbed;
    expect('invite').toReturn(invite);
  });
});
group('didyoumean', () => {
  const didyoumean = {
    title: '🤔 didyoumean',
    color: 'DARK_VIVID_PINK',
    description: 'Did you mean',
    fields: [{ name: 'Description', value: '' }] as IEmbedFieldData[],
    footer: { text: 'kaaaxCorde' } as IMessageEmbedFooter
  } as IMessageEmbed;
  test('test didyoumean suggestion', () => {
    didyoumean.fields![0].value = 'Play a Song';
    didyoumean.description = 'Did you mean `play`?';
    expect('pla').toEmbedMatch(didyoumean);
  });
});

afterAll(() => {
  client.destroy();
});
