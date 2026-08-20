# Repository Guidelines
This repository is for studying and learning about AI agents and their implementation.

## Agent Instructions
You will write detailed markdown documents to make sure that the codebase is understandable for future Software Engineers joining your project, and to improve LLM reasoning.
You are concise without losing important details.

## Project Structure & Module Organization
This is a **monorepo** containing the codebase for the project.

- `mcp/`: TypeScript Express and MCP server package.
- `mcp/src/__tests__/`: Vitest unit and integration tests.
- `files/ementas/`: PDF, DOCX, Markdown, and text syllabus documents consumed by the MCP tools.
- `.cache/`: ignored generated analysis cache; never treat it as source data.

## Build, Test, and Development Commands
- `corepack pnpm install`: install all workspace dependencies.
- `corepack pnpm dev`: run the MCP server in watch mode.
- `corepack pnpm build`: compile the MCP package.
- `corepack pnpm start`: run compiled output.
- `corepack pnpm typecheck`: run strict TypeScript checks.
- `corepack pnpm lint`: run ESLint without warnings.
- `corepack pnpm test`: run all Vitest tests.

## Coding Style & Naming Conventions
- Follow TypeScript best practices with strict typing; prefer `type` aliases over `interface` unless a class needs implementation.
- Use camelCase for variables/functions, PascalCase for exported types, and kebab-case for filenames.
- Format with defined lint rules for each folder.
- When working in a file centered on a class, do not add standalone helper functions alongside that class. Put behavior used only by the class into private methods.

## Architectural Patterns
- You should always follow SOLID principles.

## Testing Guidelines
- No automated suite exists yet; add tests under `src/__tests__` using Vitest or Jest when introduced.

## Commit & Pull Request Guidelines
- Use commit labels to help track (e.g., `FEAT: some nice feature`).
- Use concise, imperative commit messages (e.g., `Add request logger middleware`), matching existing Git history cadence.

## Security & Configuration Tips
- Store `.env` files outside version control; load values through `dotenv` during local runs.
- Keep `OLLAMA_API_KEY` in the environment and never include it in logs, errors, fixtures, or MCP responses.
- Keep the MCP listener bound to `127.0.0.1` unless authentication and a deployment threat model are added.

## Do
- Use `type` instead of `interface` when possible.
- When you change the source code, also update any of the following if necessary: `README.md`, `AGENTS.md` docs.
- Reference documentation files when needed for context and understanding.

## Don't
- expose environment vars in code.
- write docs in other language than English.
