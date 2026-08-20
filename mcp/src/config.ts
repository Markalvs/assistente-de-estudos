import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const environmentSchema = z.object({
  OLLAMA_API_KEY: z.string().min(1, 'OLLAMA_API_KEY is required'),
  OLLAMA_MODEL: z.string().min(1).default('gpt-oss:120b'),
  OLLAMA_BASE_URL: z.string().url().default('https://ollama.com'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(300_000).default(60_000),
  MCP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type AppConfig = {
  apiKey: string;
  model: string;
  ollamaBaseUrl: string;
  ollamaTimeoutMs: number;
  host: '127.0.0.1';
  port: number;
  ementasDirectory: string;
  cacheFile: string;
};

export class ConfigLoader {
  public load(environment: NodeJS.ProcessEnv = process.env): AppConfig {
    const parsed = environmentSchema.parse(environment);
    const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
    const repositoryRoot = path.resolve(packageDirectory, '..', '..');

    return {
      apiKey: parsed.OLLAMA_API_KEY,
      model: parsed.OLLAMA_MODEL,
      ollamaBaseUrl: parsed.OLLAMA_BASE_URL.replace(/\/$/, ''),
      ollamaTimeoutMs: parsed.OLLAMA_TIMEOUT_MS,
      host: '127.0.0.1',
      port: parsed.MCP_PORT,
      ementasDirectory: path.join(repositoryRoot, 'files', 'ementas'),
      cacheFile: path.join(repositoryRoot, '.cache', 'ementas.json'),
    };
  }
}
