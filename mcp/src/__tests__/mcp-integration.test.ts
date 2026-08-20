import type { Server } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyAssistantApp } from '../app.js';
import type { EmentaService } from '../ementa-service.js';
import { StudyMcpServerFactory } from '../mcp-server.js';

describe('MCP HTTP integration', () => {
  let httpServer: Server | undefined;

  afterEach(async () => {
    if (httpServer !== undefined) {
      await new Promise<void>((resolve, reject) => httpServer?.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('discovers and calls both tools', async () => {
    const service = {
      list: vi.fn(async () => ({ ementas: [] })),
      get: vi.fn(async () => ({
        filename: 'agents.md', format: '.md', size: 4, modifiedAt: new Date(0).toISOString(), text: 'Text',
        analysis: { courseName: null, workload: null, objectives: [], topics: [], bibliography: [], summary: 'Summary' },
      })),
    } as unknown as EmentaService;
    const app = new StudyAssistantApp(new StudyMcpServerFactory(service));
    httpServer = app.express.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => httpServer?.once('listening', resolve));
    const address = httpServer.address();
    if (address === null || typeof address === 'string') throw new Error('Expected a TCP address.');

    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`)));
    expect((await client.listTools()).tools.map((tool) => tool.name)).toEqual(['list_ementas', 'get_ementa']);
    expect((await client.callTool({ name: 'list_ementas', arguments: {} })).structuredContent).toEqual({ ementas: [] });
    expect((await client.callTool({ name: 'get_ementa', arguments: { filename: 'agents.md' } })).isError).not.toBe(true);
    await client.close();
  });
});
