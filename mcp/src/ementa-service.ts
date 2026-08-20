import {
  ementaDetailsSchema,
  listEmentasOutputSchema,
  type EmentaDetails,
  type EmentaListItem,
} from './domain.js';
import type { EmentaAnalyzer } from './ementa-analyzer.js';
import { EmentaCacheStore } from './cache-store.js';
import { EmentaRepository } from './ementa-repository.js';

export class EmentaService {
  public constructor(
    private readonly repository: EmentaRepository,
    private readonly cache: EmentaCacheStore,
    private readonly analyzer: EmentaAnalyzer,
  ) {}

  public async list(): Promise<{ ementas: EmentaListItem[] }> {
    const metadata = await this.repository.list();
    const ementas = await Promise.all(
      metadata.map(async (item): Promise<EmentaListItem> => {
        try {
          const document = await this.repository.read(item.filename);
          const analysis = await this.getAnalysis(document.metadata.filename, document.fingerprint, document.text);
          return { ...item, summary: analysis.summary };
        } catch (error) {
          return { ...item, error: this.publicError(error) };
        }
      }),
    );
    return listEmentasOutputSchema.parse({ ementas });
  }

  public async get(filename: string): Promise<EmentaDetails> {
    const document = await this.repository.read(filename);
    const analysis = await this.getAnalysis(document.metadata.filename, document.fingerprint, document.text);
    return ementaDetailsSchema.parse({ ...document.metadata, text: document.text, analysis });
  }

  private async getAnalysis(filename: string, fingerprint: string, text: string) {
    const cached = await this.cache.get(filename, fingerprint);
    if (cached !== undefined) {
      return cached;
    }
    const analysis = await this.analyzer.analyze(filename, text);
    await this.cache.set(filename, fingerprint, analysis);
    return analysis;
  }

  private publicError(error: unknown): string {
    if (error instanceof Error && !error.message.includes('Bearer')) {
      return error.message;
    }
    return 'The ementa could not be processed.';
  }
}
