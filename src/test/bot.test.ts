import { afterAll, beforeStart, expect, group, test } from 'corde';
import { IMessageEmbed } from 'corde/lib/src/types';

import { client } from '../index';

beforeStart(async () => {
  await new Promise((r) => setTimeout(r, 4999));
});

group('main commands', () => {
  test('schnansch command should return schnansch', () => {
    const embed = {
      description: "I'm sorry but you need to be in a voice channel to play music!",
      footer: 'Something went wrong :(',
      color: 'RANDOM'
    } as IMessageEmbed;
    expect('play').toReturn(embed);
  });
});

afterAll(() => {
  client.destroy();
});
