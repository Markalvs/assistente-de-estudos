import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EmentaCacheStore } from '../cache-store.js';

const analysis = {
  courseName: 'Agents',
  workload: null,
  objectives: ['Learn'],
  topics: [],
  bibliography: [],
  summary: 'A short summary.',
};

describe('EmentaCacheStore', () => {
  let directory: string;
  let cacheFile: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'ementa-cache-'));
    cacheFile = path.join(directory, 'cache.json');
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('persists and retrieves matching fingerprints', async () => {
    const cache = new EmentaCacheStore(cacheFile);
    await cache.set('agents.md', '10:date', analysis);
    expect(await new EmentaCacheStore(cacheFile).get('agents.md', '10:date')).toEqual(analysis);
    expect(await cache.get('agents.md', '11:date')).toBeUndefined();
    expect(JSON.parse(await readFile(cacheFile, 'utf8'))).toHaveProperty('version', 1);
  });

  it('recovers from corrupt cache contents', async () => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(cacheFile, 'not json');
    const cache = new EmentaCacheStore(cacheFile);
    expect(await cache.get('missing.md', 'x')).toBeUndefined();
    await cache.set('agents.md', 'x', analysis);
    expect(await cache.get('agents.md', 'x')).toEqual(analysis);
  });
});
