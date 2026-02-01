# n8n_onIon — Documentation

See the [root README](../README.md) for project overview and quick start.

See [SKILL.md](../SKILL.md) for the full API reference (optimized for Claude).

## Architecture

n8n_onIon is a **compiler layer** — it transforms TypeScript workflow definitions into valid n8n JSON. Node discovery and parameter knowledge come from n8n-mcp; this SDK handles the build/compile/deploy/test pipeline.

```
n8n-mcp (or direct API) → npm run sync → schemas/ (cache) → compiler → n8n JSON
                                                                ↓
workflow() → trigger/node/connect → compileWorkflow() → deployWorkflow()
                                                                ↓
                                                       testWorkflow()
```

## Key Concepts

- **Schema cache** (`schemas/`): 797 JSON files with n8n node definitions. The compiler reads typeVersions from these. Populated via `npm run sync`.
- **Builder** (`src/builder/`): Fluent API — `workflow()`, `trigger()`, `node()`, `connect()`, `connectError()`.
- **Compiler** (`src/compiler/`): Transforms builder state to n8n-importable JSON with UUIDs, typeVersions, topology-aware layout.
- **Deployer** (`src/deployer/`): Imports compiled JSON to n8n via REST API, optionally activates.
- **Executor** (`src/executor/`): Test harness — deploys, triggers via webhook, polls execution, asserts results, cleans up.
- **MCP bridge** (`src/mcp/`): Optional integration with n8n-mcp for schema sync and remote validation.
