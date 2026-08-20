import { ConfigLoader } from './config.js';
import { EmentaCacheStore } from './cache-store.js';
import { GenkitOllamaEmentaAnalyzer } from './ementa-analyzer.js';
import { EmentaRepository } from './ementa-repository.js';
import { EmentaService } from './ementa-service.js';
import { StudyMcpServerFactory } from './mcp-server.js';
import { StudyAssistantApp } from './app.js';

try {
  const configLoader = new ConfigLoader();
  configLoader.loadEnvironmentFiles();
  const config = configLoader.load();
  const repository = new EmentaRepository(config.ementasDirectory);
  const cache = new EmentaCacheStore(config.cacheFile);
  const analyzer = new GenkitOllamaEmentaAnalyzer({
    apiKey: config.apiKey,
    baseUrl: config.ollamaBaseUrl,
    model: config.model,
    timeoutMs: config.ollamaTimeoutMs,
  });
  const service = new EmentaService(repository, cache, analyzer);
  const app = new StudyAssistantApp(new StudyMcpServerFactory(service));
  app.express.listen(config.port, config.host, () => {
    console.log(`Study Assistant MCP listening at http://${config.host}:${String(config.port)}/mcp`);
  });
} catch (error) {
  const message = error instanceof Error ? error.message : 'Invalid server configuration.';
  console.error(`Failed to start Study Assistant MCP: ${message}`);
  process.exitCode = 1;
}
