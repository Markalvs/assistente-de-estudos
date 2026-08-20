import { describe, expect, it, vi } from 'vitest';
import type { EmentaAnalyzer } from '../ementa-analyzer.js';
import type { EmentaCacheStore } from '../cache-store.js';
import type { EmentaRepository } from '../ementa-repository.js';
import { EmentaService } from '../ementa-service.js';

const metadata = { filename: 'agents.md', format: '.md' as const, size: 5, modifiedAt: new Date(0).toISOString() };
const analysis = { courseName: 'Agents', workload: null, objectives: [], topics: [], bibliography: [], summary: 'Summary' };

describe('EmentaService', () => {
  it('uses cached analysis without calling the provider', async () => {
    const repository = {
      read: vi.fn(async () => ({ metadata, text: 'Text', fingerprint: '5:date' })),
    } as unknown as EmentaRepository;
    const cache = { get: vi.fn(async () => analysis), set: vi.fn() } as unknown as EmentaCacheStore;
    const analyzer = { analyze: vi.fn() } satisfies EmentaAnalyzer;
    const result = await new EmentaService(repository, cache, analyzer).get('agents.md');
    expect(result.analysis).toEqual(analysis);
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('isolates failures when listing files', async () => {
    const broken = { ...metadata, filename: 'broken.md' };
    const repository = {
      list: vi.fn(async () => [metadata, broken]),
      read: vi.fn(async (filename: string) => {
        if (filename === 'broken.md') throw new Error('Cannot extract document.');
        return { metadata, text: 'Text', fingerprint: '5:date' };
      }),
    } as unknown as EmentaRepository;
    const cache = { get: vi.fn(async () => analysis), set: vi.fn() } as unknown as EmentaCacheStore;
    const analyzer = { analyze: vi.fn() } satisfies EmentaAnalyzer;
    const result = await new EmentaService(repository, cache, analyzer).list();
    expect(result.ementas[0]).toHaveProperty('summary', 'Summary');
    expect(result.ementas[1]).toHaveProperty('error', 'Cannot extract document.');
  });
});
