---
name: n8n_onIon
description: Compiler layer for building, deploying, and testing n8n workflows
version: 2.0.0
---

# n8n_onIon — n8n Workflow SDK

Compiler layer for building, deploying, and testing n8n workflows programmatically. Compiles TypeScript workflow definitions to valid n8n JSON with correct typeVersions, UUIDs, topology-aware layout, and connection format.

**This SDK is not a node knowledge base.** Use [n8n-mcp](https://github.com/user/n8n-mcp) `search_nodes`/`get_node` for node discovery, parameters, and credentials. Use n8n-skills for expression syntax and workflow patterns.

## Setup

```bash
npm install
npm run sync --all        # Populate schema cache via n8n-mcp (preferred)
# OR: npm run sync -- --direct --all   # Fallback: direct n8n API extraction
```

**Environment variables** (in `.env`):
```bash
N8N_API_URL=http://localhost:5678    # n8n instance URL
N8N_API_KEY=your-api-key-here        # n8n API key (required for deploy/test)
```

## Core API

### `workflow(name)` — Create a workflow builder

```typescript
import { workflow } from './src/index.js';
const wf = workflow('My Workflow');
```

### `wf.trigger(name, type, params, credentials?)` — Add trigger node

```typescript
const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
  httpMethod: 'POST', path: '/hook', responseMode: 'onReceived'
});
```

### `wf.node(name, type, params, credentials?)` — Add action node

```typescript
const slack = wf.node('Notify', 'n8n-nodes-base.slack', {
  resource: 'message', operation: 'post',
  select: 'channel', channelId: '#general', text: 'Hello!'
}, { slackApi: { id: 'cred-id', name: 'My Slack' } });
```

Node types and parameters: use n8n-mcp `search_nodes` / `get_node` to discover.

### `wf.connect(from, to, outputIndex?, inputIndex?)` — Connect nodes

```typescript
wf.connect(webhook, slack);              // Main output → main input
wf.connect(ifNode, trueHandler, 0);      // IF true branch (output 0)
wf.connect(ifNode, falseHandler, 1);     // IF false branch (output 1)
wf.connect(branch1, merge, 0, 0);       // To Merge input 0
wf.connect(branch2, merge, 0, 1);       // To Merge input 1
```

### `wf.connectError(from, to)` — Error handling path

```typescript
wf.connectError(codeNode, errorHandler);
```

### `await compileWorkflow(builder)` — Compile to n8n JSON

```typescript
import { compileWorkflow } from './src/index.js';
const json = await compileWorkflow(wf);  // Always await — loads schema registry
```

### `await deployWorkflow(builder, options?)` — Deploy to n8n

```typescript
import { deployWorkflow } from './src/index.js';
const result = await deployWorkflow(wf, { activate: true });
```

### `await testWorkflow(builder, scenarios)` — Deploy, execute, assert, cleanup

```typescript
import { testWorkflow } from './src/index.js';
const report = await testWorkflow(wf, [{
  name: 'Basic test',
  triggerData: { message: 'hello' },
  expectedStatus: 'success',
  expectedNodes: ['Set Data'],
  expectedOutput: [{ nodeName: 'Set Data', assertions: [{ field: 'greeting', expected: 'hello world' }] }]
}]);
```

### `ref(nodeName)` / `expr` — Expressions

```typescript
import { ref, expr } from './src/index.js';
ref('Webhook').out.body.message.toString()   // ={{ $node['Webhook'].json.body.message }}
expr`Hello ${ref('Webhook').out.body.name}`  // ={{ 'Hello ' + $node['Webhook'].json.body.name }}
```

### `validateWorkflow(nodes, connections)` — Validate structure

```typescript
import { validateWorkflow } from './src/index.js';
const result = validateWorkflow(wf.getNodes(), wf.getConnections());
```

### `await validateViaMcp(compiledJson)` — Remote validation via n8n-mcp

```typescript
import { validateViaMcp } from './src/index.js';
const result = await validateViaMcp(json);  // Catches expression errors, credential issues
```

## Schema Sync

```bash
npm run sync -- --all           # Sync all nodes via n8n-mcp
npm run sync -- --direct --all  # Fallback: direct n8n API
npm run sync -- --check         # Dry run: report stale schemas
npm run sync -- n8n-nodes-base.slack  # Sync specific node
```

## Gotchas

1. **`compileWorkflow` is async** — Always `await`. It loads the schema registry for correct typeVersions.
2. **Credentials are optional 4th parameter** — Format: `{ [credType]: { id: string, name: string } }`
3. **Set node v3.4 format** — `{ mode: 'manual', assignments: { assignments: [{ id: crypto.randomUUID(), name, value, type: 'string' }] }, includeOtherFields: false, options: {} }`
4. **Node names must be unique** within a workflow.
5. **Webhook triggers for testing** — Manual Trigger doesn't work with n8n API execution.
6. **IF branches** — output 0 = true, output 1 = false.
7. **Topology-aware layout** — Compiler uses BFS to position nodes: triggers left, downstream right.
8. **ref().toString()** — Call `.toString()` when using ref() as a direct string parameter value.

## CLI Commands

```bash
npm run sync            # Sync schemas (see Schema Sync above)
npm run build           # TypeScript compile
npm test                # Run vitest tests
npm run build-workflow  # Build workflow from file
npm run validate        # Validate workflow
npm run deploy          # Deploy workflow
```
