import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ementaAnalysisSchema, type EmentaAnalysis } from './domain.js';

const cacheEntrySchema = z.object({
  fingerprint: z.string(),
  analysis: ementaAnalysisSchema,
});

const cacheSchema = z.object({
  version: z.literal(1),
  entries: z.record(z.string(), cacheEntrySchema),
});

type CacheData = z.infer<typeof cacheSchema>;

export class EmentaCacheStore {
  private data: CacheData | undefined;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(private readonly cacheFile: string) {}

  public async get(filename: string, fingerprint: string): Promise<EmentaAnalysis | undefined> {
    const data = await this.load();
    const entry = data.entries[filename];
    return entry?.fingerprint === fingerprint ? entry.analysis : undefined;
  }

  public async set(filename: string, fingerprint: string, analysis: EmentaAnalysis): Promise<void> {
    const data = await this.load();
    data.entries[filename] = { fingerprint, analysis };
    this.writeQueue = this.writeQueue.then(async () => this.persist(data));
    await this.writeQueue;
  }

  private async load(): Promise<CacheData> {
    if (this.data !== undefined) {
      return this.data;
    }
    try {
      const parsed: unknown = JSON.parse(await readFile(this.cacheFile, 'utf8'));
      this.data = cacheSchema.parse(parsed);
    } catch {
      this.data = { version: 1, entries: {} };
    }
    return this.data;
  }

  private async persist(data: CacheData): Promise<void> {
    await mkdir(path.dirname(this.cacheFile), { recursive: true });
    const temporaryFile = `${this.cacheFile}.${String(process.pid)}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    await rename(temporaryFile, this.cacheFile);
  }
}
