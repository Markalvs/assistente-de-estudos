import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getEmentaInputSchema, ementaDetailsSchema, listEmentasOutputSchema } from './domain.js';
import { EmentaService } from './ementa-service.js';

export class StudyMcpServerFactory {
  public constructor(private readonly service: EmentaService) {}

  public create(): McpServer {
    const server = new McpServer({ name: 'study-assistant', version: '0.1.0' });

    server.registerTool(
      'list_ementas',
      {
        title: 'List ementas',
        description: 'List every supported syllabus with metadata and a brief AI-generated summary.',
        inputSchema: {},
        outputSchema: listEmentasOutputSchema.shape,
      },
      async () => {
        const output = await this.service.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      },
    );

    server.registerTool(
      'get_ementa',
      {
        title: 'Get ementa',
        description: 'Get extracted text, metadata, and structured details for one syllabus file.',
        inputSchema: getEmentaInputSchema.shape,
        outputSchema: ementaDetailsSchema.shape,
      },
      async ({ filename }) => {
        try {
          const output = await this.service.get(filename);
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The ementa could not be processed.';
          return { content: [{ type: 'text', text: message }], isError: true };
        }
      },
    );

    return server;
  }
}
