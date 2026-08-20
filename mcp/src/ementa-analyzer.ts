import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';
import { ementaAnalysisSchema, type EmentaAnalysis } from './domain.js';

export type EmentaAnalyzer = {
  analyze(filename: string, text: string): Promise<EmentaAnalysis>;
};

type AnalyzerConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  attempts?: number;
  timeoutMs?: number;
};

export class GenkitOllamaEmentaAnalyzer implements EmentaAnalyzer {
  private readonly ai;
  private readonly model: string;
  private readonly attempts: number;
  private readonly timeoutMs: number;

  public constructor(config: AnalyzerConfig) {
    this.model = `ollama/${config.model}`;
    this.attempts = config.attempts ?? 3;
    this.timeoutMs = config.timeoutMs ?? 60_000;
    this.ai = genkit({
      plugins: [
        ollama({
          models: [{ name: config.model, type: 'chat' }],
          serverAddress: config.baseUrl,
          requestHeaders: { Authorization: `Bearer ${config.apiKey}` },
        }),
      ],
    });
  }

  public async analyze(filename: string, text: string): Promise<EmentaAnalysis> {
    return this.withRetry(async () => {
      const response = await this.ai.generate({
        model: this.model,
        output: { schema: ementaAnalysisSchema },
        config: { temperature: 0.1 },
        prompt: [
          `Analyze the syllabus file named "${filename}".`,
          'Return only information explicitly supported by the document.',
          'Use null for an unknown course name or workload and empty arrays for absent lists.',
          'Write a concise summary in the same language as the document.',
          '',
          text,
        ].join('\n'),
      });
      return ementaAnalysisSchema.parse(response.output);
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.attempts; attempt += 1) {
      try {
        return await this.withTimeout(operation());
      } catch (error) {
        lastError = error;
        if (!this.isTransient(error) || attempt === this.attempts) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
      }
    }
    throw new Error('Ollama Cloud could not analyze the ementa.', { cause: lastError });
  }

  private async withTimeout<T>(operation: Promise<T>): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Ollama Cloud request timed out.'));
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([operation, timeoutPromise]);
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
    }
  }

  private isTransient(error: unknown): boolean {
    const status = this.readStatus(error);
    if (status !== undefined) {
      return [429, 500, 502].includes(status);
    }
    const message = error instanceof Error ? error.message : String(error);
    return /\b(429|500|502)\b|timeout|ECONNRESET|ETIMEDOUT/i.test(message);
  }

  private readStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
      return undefined;
    }
    return typeof error.status === 'number' ? error.status : undefined;
  }
}
