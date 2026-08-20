# Study Assistant

A local Model Context Protocol (MCP) server that turns syllabus documents into a searchable study knowledge base. The server reads documents from `files/ementas`, extracts their text, and uses Genkit with Ollama Cloud to produce summaries and structured details.

## Architecture

This repository is a pnpm monorepo. The `mcp` package contains the Express and MCP server, while `files/ementas` is the only document directory exposed to the tools.

The server binds to `127.0.0.1` and exposes:

- `GET /health`: process health without secrets or provider details.
- `/mcp`: stateless MCP Streamable HTTP endpoint.
- `list_ementas`: lists supported files with metadata and cached summaries.
- `get_ementa`: returns extracted text and structured syllabus details.

Supported formats are PDF, DOCX, Markdown, and plain text. Symbolic links, paths, and unsupported extensions are rejected.

## Requirements

- Node.js 20 or newer.
- pnpm 10 (Corepack can provide the pinned version).
- An Ollama Cloud API key.

## Setup

Install dependencies from the repository root:

```sh
corepack pnpm install
```

Copy `mcp/.env.example` to either `.env` in the repository root or `mcp/.env`, then provide the API key:

```dotenv
OLLAMA_API_KEY=your-key
```

The default model is `gpt-oss:120b`. Optional settings are:

```dotenv
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_TIMEOUT_MS=60000
MCP_PORT=3000
```

Environment files are ignored by Git. Never commit an API key.

The application resolves both locations explicitly, regardless of the directory from which pnpm starts the package. Existing system environment variables take precedence; when both files define the same variable, `mcp/.env` takes precedence over the root `.env`.

Place syllabus files directly inside `files/ementas`, then start the development server:

```sh
corepack pnpm dev
```

The MCP endpoint will be available at `http://127.0.0.1:3000/mcp`.

## Connect Codex

With the server running, register its URL in the local Codex client:

```sh
codex mcp add studyAssistant --url http://127.0.0.1:3000/mcp
```

Equivalent Codex configuration:

```toml
[mcp_servers.studyAssistant]
url = "http://127.0.0.1:3000/mcp"
```

This localhost endpoint is intended for a local Codex client. It is not exposed to remote ChatGPT clients.

## Commands

Run these commands from the repository root:

```sh
corepack pnpm dev       # Watch and run the TypeScript server
corepack pnpm build     # Build the production JavaScript
corepack pnpm start     # Run the compiled server
corepack pnpm typecheck # Check strict TypeScript types
corepack pnpm lint      # Run ESLint
corepack pnpm test      # Run the Vitest suite
```

`dev` and `build` never run the test suite. Production compilation also excludes `src/__tests__`, so test fixtures and mocks cannot be loaded by the server or emitted into `dist`.

Generated analysis is stored in `.cache/ementas.json`. Cache entries are invalidated when a document's size or modification time changes. A valid cached result remains usable if Ollama Cloud is temporarily unavailable.

## Security and failure behavior

The API key is loaded from the environment and sent only in the Ollama authorization header. It is not included in health responses, MCP responses, or application logs. Cloud requests use a timeout and retry transient `429`, `500`, and `502` failures. A failure in one file is isolated in `list_ementas`; `get_ementa` reports an MCP tool error.
