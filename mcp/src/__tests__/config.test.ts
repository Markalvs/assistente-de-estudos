import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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

  it('loads environment files explicitly', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'study-env-'));
    const envFile = path.join(directory, '.env');
    const variableName = 'STUDY_ASSISTANT_ENV_TEST';
    try {
      await writeFile(envFile, `${variableName}=loaded\n`);
      Reflect.deleteProperty(process.env, variableName);
      new ConfigLoader().loadEnvironmentFiles([envFile]);
      expect(process.env[variableName]).toBe('loaded');
    } finally {
      Reflect.deleteProperty(process.env, variableName);
      await rm(directory, { recursive: true, force: true });
    }
  });
});
