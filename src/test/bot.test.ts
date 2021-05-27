import { afterAll, beforeStart, expect, group, test } from 'corde';
import { IMessageEmbed } from 'corde/lib/src/types';

import { client } from '../index';

beforeStart(async () => {
  await new Promise((r) => setTimeout(r, 4999));
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

afterAll(() => {
  client.destroy();
});
