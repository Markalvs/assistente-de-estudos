import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { supportedExtensionSchema, type EmentaMetadata } from './domain.js';

export type EmentaDocument = {
  metadata: EmentaMetadata;
  text: string;
  fingerprint: string;
};

export class EmentaRepository {
  public constructor(private readonly directory: string) {}

  public async list(): Promise<EmentaMetadata[]> {
    const entries = await readdir(this.directory, { withFileTypes: true });
    const filenames = entries
      .filter((entry) => entry.isFile() && this.isSupported(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, 'pt-BR'));

    return Promise.all(filenames.map(async (filename) => this.getMetadata(filename)));
  }

  public async read(filename: string): Promise<EmentaDocument> {
    const filePath = await this.resolveSafeFile(filename);
    const metadata = await this.getMetadata(filename, filePath);
    const buffer = await readFile(filePath);
    const text = await this.extractText(buffer, metadata.format);

    if (text.trim().length === 0) {
      throw new Error(`Ementa '${filename}' contains no extractable text.`);
    }

    return {
      metadata,
      text: text.trim(),
      fingerprint: `${String(metadata.size)}:${metadata.modifiedAt}`,
    };
  }

  private isSupported(filename: string): boolean {
    return supportedExtensionSchema.safeParse(path.extname(filename).toLowerCase()).success;
  }

  private async getMetadata(filename: string, knownPath?: string): Promise<EmentaMetadata> {
    const filePath = knownPath ?? (await this.resolveSafeFile(filename));
    const fileStat = await stat(filePath);
    const extension = supportedExtensionSchema.parse(path.extname(filename).toLowerCase());
    return {
      filename,
      format: extension,
      size: fileStat.size,
      modifiedAt: fileStat.mtime.toISOString(),
    };
  }

  private async resolveSafeFile(filename: string): Promise<string> {
    if (filename !== path.basename(filename) || filename.includes('/') || filename.includes('\\')) {
      throw new Error('The filename must not contain a path.');
    }
    if (!this.isSupported(filename)) {
      throw new Error(`Unsupported ementa format for '${filename}'.`);
    }

    const root = await realpath(this.directory);
    const candidate = path.resolve(root, filename);
    const candidateStat = await lstat(candidate);
    if (!candidateStat.isFile() || candidateStat.isSymbolicLink()) {
      throw new Error(`Ementa '${filename}' is not a regular file.`);
    }
    const resolved = await realpath(candidate);
    if (!resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error('The requested file is outside the ementas directory.');
    }
    return resolved;
  }

  private async extractText(buffer: Buffer, extension: EmentaMetadata['format']): Promise<string> {
    if (extension === '.pdf') {
      return (await pdf(buffer)).text;
    }
    if (extension === '.docx') {
      return (await mammoth.extractRawText({ buffer })).value;
    }
    return buffer.toString('utf8');
  }
}
