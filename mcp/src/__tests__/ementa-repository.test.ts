import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pdf-parse/lib/pdf-parse.js', () => ({ default: vi.fn(async () => ({ text: 'PDF content' })) }));
vi.mock('mammoth', () => ({ default: { extractRawText: vi.fn(async () => ({ value: 'DOCX content' })) } }));

import { EmentaRepository } from '../ementa-repository.js';

describe('EmentaRepository', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'ementas-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('lists supported files alphabetically and ignores other files', async () => {
    await Promise.all([
      writeFile(path.join(directory, 'zeta.txt'), 'Zeta'),
      writeFile(path.join(directory, 'alpha.md'), '# Alpha'),
      writeFile(path.join(directory, 'ignored.json'), '{}'),
    ]);
    const items = await new EmentaRepository(directory).list();
    expect(items.map((item) => item.filename)).toEqual(['alpha.md', 'zeta.txt']);
  });

  it.each([
    ['sample.pdf', 'PDF content'],
    ['sample.docx', 'DOCX content'],
    ['sample.md', 'Markdown content'],
    ['sample.txt', 'Text content'],
  ])('extracts %s', async (filename, expected) => {
    await writeFile(path.join(directory, filename), expected);
    const document = await new EmentaRepository(directory).read(filename);
    expect(document.text).toBe(expected);
  });

  it('blocks traversal and unsupported formats', async () => {
    const repository = new EmentaRepository(directory);
    await expect(repository.read('../secret.txt')).rejects.toThrow('must not contain a path');
    await expect(repository.read('secret.json')).rejects.toThrow('Unsupported');
  });
});
