import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  ollama: vi.fn(() => ({ name: 'ollama-plugin' })),
}));

vi.mock('genkit', () => ({ genkit: vi.fn(() => ({ generate: mocks.generate })) }));
vi.mock('genkitx-ollama', () => ({ ollama: mocks.ollama }));

import { GenkitOllamaEmentaAnalyzer } from '../ementa-analyzer.js';

const analysis = {
  courseName: null,
  workload: null,
  objectives: [],
  topics: [],
  bibliography: [],
  summary: 'Summary',
};

describe('GenkitOllamaEmentaAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures the cloud authorization header and selected model', async () => {
    mocks.generate.mockResolvedValue({ output: analysis });
    const analyzer = new GenkitOllamaEmentaAnalyzer({
      apiKey: 'private-key', baseUrl: 'https://ollama.com', model: 'gpt-oss:120b', attempts: 1,
    });
    await expect(analyzer.analyze('agents.md', 'Text')).resolves.toEqual(analysis);
    expect(mocks.ollama).toHaveBeenCalledWith(expect.objectContaining({
      serverAddress: 'https://ollama.com',
      requestHeaders: { Authorization: 'Bearer private-key' },
    }));
    expect(mocks.generate).toHaveBeenCalledWith(expect.objectContaining({ model: 'ollama/gpt-oss:120b' }));
  });

  it('retries transient provider failures', async () => {
    mocks.generate
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockResolvedValueOnce({ output: analysis });
    const analyzer = new GenkitOllamaEmentaAnalyzer({
      apiKey: 'key', baseUrl: 'https://ollama.com', model: 'model', attempts: 2,
    });
    await expect(analyzer.analyze('agents.md', 'Text')).resolves.toEqual(analysis);
    expect(mocks.generate).toHaveBeenCalledTimes(2);
  });

  it('returns a sanitized error after a timeout', async () => {
    mocks.generate.mockReturnValue(new Promise(() => undefined));
    const analyzer = new GenkitOllamaEmentaAnalyzer({
      apiKey: 'secret', baseUrl: 'https://ollama.com', model: 'model', attempts: 1, timeoutMs: 5,
    });
    await expect(analyzer.analyze('agents.md', 'Text')).rejects.toThrow('Ollama Cloud could not analyze');
  });
});
