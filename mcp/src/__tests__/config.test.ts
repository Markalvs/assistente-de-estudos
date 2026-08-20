import { describe, expect, it } from 'vitest';
import { ConfigLoader } from '../config.js';

describe('ConfigLoader', () => {
  it('uses the cloud defaults', () => {
    const config = new ConfigLoader().load({ OLLAMA_API_KEY: 'secret' });
    expect(config.model).toBe('gpt-oss:120b');
    expect(config.ollamaBaseUrl).toBe('https://ollama.com');
    expect(config.host).toBe('127.0.0.1');
  });

  it('gives OLLAMA_MODEL precedence over the fallback', () => {
    const config = new ConfigLoader().load({
      OLLAMA_API_KEY: 'secret',
      OLLAMA_MODEL: 'custom-model',
    });
    expect(config.model).toBe('custom-model');
  });

  it('requires an API key', () => {
    expect(() => new ConfigLoader().load({})).toThrow('OLLAMA_API_KEY');
  });
});
