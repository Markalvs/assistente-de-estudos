import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Express, Request, Response } from 'express';
import { StudyMcpServerFactory } from './mcp-server.js';

export class StudyAssistantApp {
  public readonly express: Express;

  public constructor(private readonly serverFactory: StudyMcpServerFactory) {
    this.express = createMcpExpressApp({ host: '127.0.0.1' });
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.express.get('/health', (_request, response) => {
      response.json({ status: 'ok', mcpEndpoint: '/mcp' });
    });
    this.express.all('/mcp', async (request, response) => this.handleMcp(request, response));
  }

  private async handleMcp(request: Request, response: Response): Promise<void> {
    const server = this.serverFactory.create();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    response.on('close', () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch {
      if (!response.headersSent) {
        response.status(500).json({ error: 'MCP request failed.' });
      }
    }
  }
}
