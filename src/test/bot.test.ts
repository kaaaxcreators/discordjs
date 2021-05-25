import { afterAll, beforeStart, expect, group, test } from 'corde';
import { IMessageEmbed } from 'corde/lib/src/types';

import { client } from '../index';

beforeStart(async () => {
  await new Promise((r) => setTimeout(r, 4999));
});

group('main commands', () => {
  test('music commands should return error', () => {
    const embed = {
      description: "I'm sorry but you need to be in a voice channel to play music!",
      footer: 'Something went wrong :(',
      color: 'RED'
    } as IMessageEmbed;
    expect('earrape').toReturn(embed);
    expect('leave').toReturn(embed);
    expect('play').toReturn(embed);
    expect('playlist').toReturn(embed);
    expect('radio').toReturn(embed);
    expect('search').toReturn(embed);
    expect('stop').toReturn(embed);
    expect('volume').toReturn(embed);
  });
});

afterAll(() => {
  client.destroy();
});
