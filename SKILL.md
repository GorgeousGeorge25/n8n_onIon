---
name: n8n_onIon
description: Build type-safe n8n workflows with TypeScript
version: 1.1.0
---

# n8n_onIon — n8n Workflow SDK

Type-safe TypeScript SDK for building, deploying, and testing n8n workflows programmatically. Compile workflows to valid n8n JSON with compile-time parameter checking, auto-deploy via API, and test execution with sample data.

**Core value:** Compiled workflows import and execute correctly in n8n on the first try.

## When to Use

Use this SDK when:
- Building n8n workflows programmatically instead of using the n8n GUI
- You need type-safe, version-controlled workflow definitions
- Generating workflows from templates or dynamic inputs
- Automating workflow deployment and testing across n8n instances

## Prerequisites

**SDK location:** This project root (`/Users/jurissleiners/MyPrograms/n8n_onIon`)

**Node.js:** >= 18.0.0

**Environment variables** (in `.env`):
```bash
N8N_API_URL=http://localhost:5678    # n8n instance URL
N8N_API_KEY=your-api-key-here        # n8n API key (required for deploy/test)
```

**Install dependencies:**
```bash
npm install
```

## Quick Start

```typescript
import { workflow, createTypedNodes, compileWorkflow, deployWorkflow } from './src/index.js';

// 1. Create workflow with typed node factories
const wf = workflow('My Workflow');
const nodes = createTypedNodes();

// 2. Add nodes using typed factories (797 nodes available)
const trigger = nodes.webhook('Start', {
  httpMethod: 'POST',
  path: '/hook'
});
const slack = nodes.slack.message.post('Notify', {
  select: 'channel',
  channelId: '#general',
  text: 'Hello from SDK!'
});

// 3. Add to workflow and connect
wf.trigger(trigger.name, trigger.type, trigger.parameters);
wf.node(slack.name, slack.type, slack.parameters);
wf.connect({ name: trigger.name }, { name: slack.name });

// 4. Deploy to n8n (compiles and imports via API)
const result = await deployWorkflow(wf, { activate: true });
console.log(`Deployed: ${result.url}`);
```

## Core API Reference

### Node Discovery

#### `createTypedNodes()` — Get all 797 typed node factories

Returns a factory object with 7158 typed factory functions for all n8n nodes. Each factory auto-injects resource/operation parameters and provides compile-time type checking.

```typescript
import { createTypedNodes } from './src/index.js';

const nodes = createTypedNodes();

// Simple nodes — pass params directly
nodes.webhook('Trigger', { httpMethod: 'POST', path: '/hook' });
nodes.httpRequest('Fetch', { url: 'https://api.example.com/data' });
nodes.if('Check', { conditions: { ... } });
nodes.set('Transform', { mode: 'manual', assignments: { ... } });
nodes.code('Process', { jsCode: 'return items;' });
nodes.manualTrigger('Start', {});

// Nested resource.operation — resource/operation auto-injected
nodes.slack.message.post('Notify', { select: 'channel', channelId: '#general', text: 'Hello' });
nodes.gmail.message.send('Email', { to: 'user@example.com', subject: 'Test' });
nodes.github.file.create('CreateFile', { owner: 'user', repo: 'repo', filePath: 'README.md' });
nodes.googleSheets.spreadsheet.append('AddRow', { ... });
nodes.notion.database.page.create('CreatePage', { ... });

// LangChain nodes
nodes.openAi('ChatGPT', { messages: [...] });
nodes.anthropic('Claude', { messages: [...] });
nodes.agent('AIAgent', { ... });

// Access via "Tool" suffix for LangChain tool variants
nodes.httpRequestTool('HTTPTool', { ... });
nodes.calculatorTool('Calculator', { ... });
```

**All 797 nodes available.** To discover available nodes and their operations:

```typescript
import catalog from './generated/node-catalog.json' assert { type: 'json' };

// Browse all 797 nodes
console.log(catalog.nodes.length); // 797

// Find a node
const slackNode = catalog.nodes.find(n => n.type === 'n8n-nodes-base.slack');
console.log(slackNode.operations);
// { message: ['post', 'update', 'delete', ...], channel: ['create', 'get', ...], ... }

// Check credentials needed
console.log(slackNode.credentials); // ['slackApi', 'slackOAuth2Api']
```

**Catalog location:** `generated/node-catalog.json` (384KB, full node metadata)

### Workflow Building

#### `workflow(name)` — Create a workflow

Creates a workflow builder instance. All nodes and connections are added through this builder.

```typescript
import { workflow } from './src/index.js';

const wf = workflow('My Workflow');
```

Returns `WorkflowBuilder` with methods: `trigger()`, `node()`, `connect()`, `connectError()`, `getNodes()`, `getConnections()`.

#### `wf.trigger(name, type, params, credentials?)` — Add a trigger node

Adds the workflow's entry point. Returns a `NodeRef` for connecting.

```typescript
const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
  httpMethod: 'POST',
  path: '/notifications',
  responseMode: 'onReceived',
});

// With credentials (4th parameter)
const gmailTrigger = wf.trigger('Gmail Trigger', 'n8n-nodes-base.gmailTrigger', {
  event: 'messageReceived',
}, {
  gmailOAuth2: { id: 'credential-id', name: 'My Gmail' }
});
```

#### `wf.node(name, type, params, credentials?)` — Add an action node

Adds a processing node. Returns a `NodeRef` for connecting.

```typescript
const slack = wf.node('Post to Slack', 'n8n-nodes-base.slack', {
  resource: 'message',
  operation: 'post',
  select: 'channel',
  channelId: '#general',
  text: 'Hello from SDK!',
}, {
  slackApi: { id: 'cred-123', name: 'My Slack' }
});
```

**Credentials (4th parameter):** Optional. Format: `{ [credentialType]: { id: string, name: string } }`

#### `wf.connect(from, to, outputIndex?, inputIndex?)` — Connect nodes

Connects two nodes. Default `outputIndex = 0`, `inputIndex = 0`.

```typescript
wf.connect(webhook, slack);                  // Main output, main input
wf.connect(ifNode, trueHandler, 0);          // IF true branch (output 0)
wf.connect(ifNode, falseHandler, 1);         // IF false branch (output 1)
wf.connect(merge, process, 0, 1);            // Connect to input index 1 (for Merge)
```

**Branch indices for IF node:** `0` = true, `1` = false.

**Merge node:** Use `inputIndex` to specify which Merge input (0, 1, 2, ...).

#### `wf.connectError(from, to)` — Connect error handling path

Connects a node's error output to an error handler.

```typescript
const codeNode = wf.node('Process', 'n8n-nodes-base.code', {
  jsCode: 'throw new Error("test");'
});

const errorHandler = wf.node('Handle Error', 'n8n-nodes-base.set', {
  mode: 'manual',
  assignments: { assignments: [{ id: '...', name: 'error', value: 'handled', type: 'string' }] }
});

wf.connectError(codeNode, errorHandler);
```

This automatically adds `onError: 'continueErrorOutput'` to the source node parameters.

### Compilation

#### `await compileWorkflow(builder)` — Compile to n8n JSON

**ASYNC FUNCTION.** Transforms a `WorkflowBuilder` into n8n-importable JSON with UUIDs, typeVersions, grid positions, and nested connection format.

```typescript
import { compileWorkflow } from './src/index.js';

const json = await compileWorkflow(wf);
// json is a complete n8n workflow object ready for import
```

**Important:** `compileWorkflow` is async (loads schema registry). Always `await` it.

#### `validateWorkflow(nodes, connections)` — Validate structure

Validates workflow before compilation. Returns `ValidationResult` with errors and warnings.

```typescript
import { validateWorkflow } from './src/index.js';

const validation = validateWorkflow(wf.getNodes(), wf.getConnections());
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

**Errors:** Block compilation (invalid connections, missing nodes, circular references).

**Warnings:** Don't block (missing credentials, unresolved node references in expressions).

### Deployment

#### `await deployWorkflow(builder, options?)` — Deploy to n8n

Compiles and deploys a workflow to n8n via REST API. Optionally activates it.

```typescript
import { deployWorkflow } from './src/index.js';

// Deploy (inactive)
const result = await deployWorkflow(wf);
console.log(`Deployed: ${result.id} at ${result.url}`);

// Deploy and activate
const result = await deployWorkflow(wf, { activate: true });

// With explicit credentials
const result = await deployWorkflow(wf, {
  apiUrl: 'https://n8n.example.com',
  apiKey: 'my-api-key',
  activate: true
});
```

**Options:**
- `apiUrl?: string` — n8n instance URL (default: `N8N_API_URL` env var or `http://localhost:5678`)
- `apiKey?: string` — n8n API key (default: `N8N_API_KEY` env var)
- `activate?: boolean` — Activate workflow after deployment (default: `false`)

**Returns:** `DeployResult` with `id`, `name`, `url`, `status`.

**Throws:** If API key missing, n8n unreachable, or n8n rejects the workflow.

### Testing

#### `await testWorkflow(builder, scenarios, options?)` — Test with sample data

Deploys, executes, asserts, and cleans up a workflow in a single call. Returns detailed test report.

```typescript
import { testWorkflow } from './src/index.js';

const scenarios = [
  {
    name: 'Success case',
    triggerData: { message: 'hello' },
    expectedStatus: 'success',
    expectedNodes: ['Set Data'],
    expectedOutput: [
      {
        nodeName: 'Set Data',
        assertions: [
          { field: 'greeting', expected: 'hello world' }
        ]
      }
    ]
  }
];

const report = await testWorkflow(wf, scenarios);

if (report.passed === report.total) {
  console.log('All tests passed!');
} else {
  console.error('Failures:', report.results.filter(r => !r.passed));
}
```

**Scenarios:** Array of `TestScenario` objects.

**TestScenario fields:**
- `name: string` — Scenario description
- `triggerData?: object` — Data to POST to webhook
- `expectedStatus?: string` — Expected execution status (`'success'` | `'error'`, default: `'success'`)
- `expectedNodes?: string[]` — Nodes that should execute
- `expectedOutput?: Array<{ nodeName: string, assertions: Array<{ field: string, expected: any }> }>` — Output assertions

**Options:**
- `apiUrl?: string` — n8n instance URL
- `apiKey?: string` — n8n API key
- `webhookPath?: string` — Webhook path (auto-extracted if not provided)
- `timeout?: number` — Execution timeout in ms (default: 30000)
- `pollInterval?: number` — Poll interval in ms (default: 500)

**Returns:** `TestReport` with aggregate results and per-scenario details:
- `passed: number` — Number of passing scenarios
- `failed: number` — Number of failing scenarios
- `total: number` — Total scenarios
- `results: TestResult[]` — Per-scenario results with failures and actual output
- `cleaned: boolean` — Whether workflow was deleted after tests

**Cleanup:** Always deletes the workflow after tests (even on failure) to prevent n8n clutter.

### Expressions

#### `ref(nodeName)` — Reference upstream node output

Creates a proxy-based reference to another node's output data. Chain `.out.field` to access nested fields.

```typescript
import { ref } from './src/index.js';

// Access a field from the Webhook node's output
ref('Webhook').out.body.message.toString()
// Compiles to: ={{ $node['Webhook'].json.body.message }}

// Nested field access
ref('Webhook').out.body.user.name.toString()
// Compiles to: ={{ $node['Webhook'].json.body.user.name }}

// Array access
ref('Webhook').out.items[0].id.toString()
// Compiles to: ={{ $node['Webhook'].json.items[0].id }}

// Use as a parameter value
const slack = wf.node('Notify', 'n8n-nodes-base.slack', {
  resource: 'message',
  operation: 'post',
  select: 'channel',
  channelId: '#general',
  text: ref('Webhook').out.body.message.toString(),
});
```

**Important:** Call `.toString()` when using `ref()` directly as a string parameter value. This wraps the expression in `={{ ... }}` format.

#### `expr` — Template literal for string interpolation

Tagged template literal that combines static text with node references into n8n expressions.

```typescript
import { expr, ref } from './src/index.js';

// Interpolate node references into text
expr`Hello ${ref('Webhook').out.body.name}`
// Compiles to: ={{ 'Hello ' + $node['Webhook'].json.body.name }}

// Multiple references
expr`${ref('Webhook').out.body.firstName} ${ref('Webhook').out.body.lastName}`
// Compiles to: ={{ $node['Webhook'].json.body.firstName + ' ' + $node['Webhook'].json.body.lastName }}

// Use in node parameters
const slack = wf.node('Notify', 'n8n-nodes-base.slack', {
  resource: 'message',
  operation: 'post',
  select: 'channel',
  channelId: '#general',
  text: expr`Processed: ${ref('Create Full Name').out.fullName}`,
});
```

**When to use which:**
- `ref('Node').out.field.toString()` — When the entire value is a single expression
- `` expr`text ${ref('Node').out.field}` `` — When mixing static text with expressions

#### Raw n8n expressions

You can always use raw n8n expression strings directly:

```typescript
const ifNode = wf.node('Check', 'n8n-nodes-base.if', {
  conditions: {
    string: [{
      value1: '={{ $json.body.priority }}',
      operation: 'equal',
      value2: 'urgent',
    }],
  },
});
```

## Common Patterns

### Pattern 1: Linear Workflow (Webhook → Set → Slack)

```typescript
import { workflow, createTypedNodes, ref } from './src/index.js';

const wf = workflow('Linear Workflow');
const nodes = createTypedNodes();

const trigger = nodes.webhook('Webhook', {
  httpMethod: 'POST',
  path: '/hook',
  responseMode: 'onReceived'
});

const set = nodes.set('Transform', {
  mode: 'manual',
  duplicateItem: false,
  assignments: {
    assignments: [{
      id: crypto.randomUUID(),
      name: 'greeting',
      value: ref('Webhook').out.body.name.toString(),
      type: 'string'
    }]
  },
  includeOtherFields: false,
  options: {}
});

const slack = nodes.slack.message.post('Notify', {
  select: 'channel',
  channelId: '#general',
  text: ref('Transform').out.greeting.toString()
});

wf.trigger(trigger.name, trigger.type, trigger.parameters);
const setRef = wf.node(set.name, set.type, set.parameters);
const slackRef = wf.node(slack.name, slack.type, slack.parameters);
wf.connect({ name: trigger.name }, setRef);
wf.connect(setRef, slackRef);
```

### Pattern 2: Branching with IF

```typescript
const wf = workflow('Conditional Router');
const nodes = createTypedNodes();

const trigger = nodes.webhook('Webhook', {
  httpMethod: 'POST',
  path: '/orders',
  responseMode: 'onReceived'
});

const ifNode = nodes.if('Check Priority', {
  conditions: {
    string: [{
      value1: '={{ $json.body.priority }}',
      operation: 'equal',
      value2: 'urgent'
    }]
  }
});

const urgent = nodes.slack.message.post('Urgent Notify', {
  select: 'channel',
  channelId: '#urgent',
  text: 'Urgent order received!'
});

const normal = nodes.httpRequest('Forward Order', {
  method: 'POST',
  url: 'https://api.example.com/orders',
  sendBody: true,
  bodyParameters: { parameters: [] }
});

wf.trigger(trigger.name, trigger.type, trigger.parameters);
const ifRef = wf.node(ifNode.name, ifNode.type, ifNode.parameters);
const urgentRef = wf.node(urgent.name, urgent.type, urgent.parameters);
const normalRef = wf.node(normal.name, normal.type, normal.parameters);

wf.connect({ name: trigger.name }, ifRef);
wf.connect(ifRef, urgentRef, 0);  // true branch
wf.connect(ifRef, normalRef, 1);  // false branch
```

### Pattern 3: Error Handling

```typescript
const wf = workflow('Error Handling');
const nodes = createTypedNodes();

const trigger = nodes.webhook('Webhook', {
  httpMethod: 'POST',
  path: '/process',
  responseMode: 'onReceived'
});

const code = nodes.code('Process', {
  jsCode: 'throw new Error("test error");',
  mode: 'runOnceForAllItems'
});

const errorHandler = nodes.set('Handle Error', {
  mode: 'manual',
  duplicateItem: false,
  assignments: {
    assignments: [{
      id: crypto.randomUUID(),
      name: 'error',
      value: 'handled',
      type: 'string'
    }]
  },
  includeOtherFields: false,
  options: {}
});

wf.trigger(trigger.name, trigger.type, trigger.parameters);
const codeRef = wf.node(code.name, code.type, code.parameters);
const errorRef = wf.node(errorHandler.name, errorHandler.type, errorHandler.parameters);

wf.connect({ name: trigger.name }, codeRef);
wf.connectError(codeRef, errorRef);
```

### Pattern 4: Merge Multiple Inputs

```typescript
const wf = workflow('Merge Workflow');
const nodes = createTypedNodes();

const trigger = nodes.webhook('Webhook', {
  httpMethod: 'POST',
  path: '/merge',
  responseMode: 'onReceived'
});

const branch1 = nodes.set('Branch 1', { mode: 'manual', assignments: { assignments: [] } });
const branch2 = nodes.set('Branch 2', { mode: 'manual', assignments: { assignments: [] } });

const merge = nodes.merge('Merge', {
  mode: 'combine',
  combineBy: 'combineAll'
});

wf.trigger(trigger.name, trigger.type, trigger.parameters);
const b1Ref = wf.node(branch1.name, branch1.type, branch1.parameters);
const b2Ref = wf.node(branch2.name, branch2.type, branch2.parameters);
const mergeRef = wf.node(merge.name, merge.type, merge.parameters);

wf.connect({ name: trigger.name }, b1Ref);
wf.connect({ name: trigger.name }, b2Ref);
wf.connect(b1Ref, mergeRef, 0, 0);  // Branch 1 to Merge input 0
wf.connect(b2Ref, mergeRef, 0, 1);  // Branch 2 to Merge input 1
```

### Pattern 5: Deploy and Test

```typescript
import { workflow, createTypedNodes, deployWorkflow, testWorkflow } from './src/index.js';

// Build workflow
const wf = workflow('Test Workflow');
const nodes = createTypedNodes();

const trigger = nodes.webhook('Webhook', {
  httpMethod: 'POST',
  path: `/test-${Date.now()}`,
  responseMode: 'onReceived'
});

const set = nodes.set('Set Data', {
  mode: 'manual',
  duplicateItem: false,
  assignments: {
    assignments: [{
      id: crypto.randomUUID(),
      name: 'response',
      value: 'success',
      type: 'string'
    }]
  },
  includeOtherFields: false,
  options: {}
});

wf.trigger(trigger.name, trigger.type, trigger.parameters);
const setRef = wf.node(set.name, set.type, set.parameters);
wf.connect({ name: trigger.name }, setRef);

// Test workflow
const scenarios = [{
  name: 'Basic test',
  triggerData: { test: 'data' },
  expectedStatus: 'success',
  expectedNodes: ['Set Data'],
  expectedOutput: [{
    nodeName: 'Set Data',
    assertions: [{ field: 'response', expected: 'success' }]
  }]
}];

const report = await testWorkflow(wf, scenarios);

if (report.passed === report.total) {
  console.log('Tests passed! Deploying...');
  const result = await deployWorkflow(wf, { activate: true });
  console.log(`Deployed: ${result.url}`);
} else {
  console.error('Tests failed:', report.results.filter(r => !r.passed));
}
```

## Node Type Quick Reference

**Top 20 Most-Used Nodes:**

| Node | Type | Use Case |
|---|---|---|
| Webhook | `n8n-nodes-base.webhook` | HTTP trigger |
| Manual Trigger | `n8n-nodes-base.manualTrigger` | Manual execution |
| HTTP Request | `n8n-nodes-base.httpRequest` | API calls |
| Code | `n8n-nodes-base.code` | JavaScript/Python |
| Set | `n8n-nodes-base.set` | Transform data |
| IF | `n8n-nodes-base.if` | Conditional branching |
| Switch | `n8n-nodes-base.switch` | Multi-way branching |
| Merge | `n8n-nodes-base.merge` | Merge inputs |
| Slack | `n8n-nodes-base.slack` | Slack messages |
| Gmail | `n8n-nodes-base.gmail` | Email send/read |
| Google Sheets | `n8n-nodes-base.googleSheets` | Spreadsheet CRUD |
| Notion | `n8n-nodes-base.notion` | Notion pages/DBs |
| GitHub | `n8n-nodes-base.github` | GitHub operations |
| Airtable | `n8n-nodes-base.airtable` | Airtable records |
| Postgres | `n8n-nodes-base.postgres` | PostgreSQL queries |
| Schedule Trigger | `n8n-nodes-base.scheduleTrigger` | Cron/interval |
| OpenAI | `@n8n/n8n-nodes-langchain.openAi` | ChatGPT/GPT-4 |
| Anthropic | `@n8n/n8n-nodes-langchain.anthropic` | Claude |
| Agent | `@n8n/n8n-nodes-langchain.agent` | LangChain agent |
| Split In Batches | `n8n-nodes-base.splitInBatches` | Batch processing |

**Discovery:** See `generated/node-catalog.json` for all 797 nodes with full metadata.

## Credentials

Credentials are optional 4th parameter to `wf.trigger()` and `wf.node()`.

```typescript
// Format
wf.node('Node Name', 'n8n-nodes-base.slack', { ... }, {
  slackApi: { id: 'credential-uuid', name: 'My Slack Account' }
});

// Multiple credentials
wf.node('Gmail Send', 'n8n-nodes-base.gmail', { ... }, {
  gmailOAuth2: { id: 'gmail-cred-id', name: 'My Gmail' },
  googleSheetsOAuth2: { id: 'sheets-cred-id', name: 'My Sheets' }
});
```

**Credential IDs:** Get from n8n UI or API. Format: `{ [credentialType]: { id: string, name: string } }`

**Validation:** Compiler generates warnings (not errors) for missing credentials. Deployment handles credential resolution.

## Gotchas

1. **`compileWorkflow` is async** — Always `await compileWorkflow(wf)`. It loads the schema registry to get correct typeVersions.

2. **Resource/operation auto-injection** — Typed factories like `nodes.slack.message.post()` automatically add `resource: 'message'` and `operation: 'post'` to parameters. Don't add them manually.

3. **Set node v3.4 format** — Use `assignments.assignments` array with `id`/`name`/`value`/`type` structure:
   ```typescript
   {
     mode: 'manual',
     duplicateItem: false,
     assignments: {
       assignments: [{
         id: crypto.randomUUID(),
         name: 'fieldName',
         value: 'fieldValue',
         type: 'string'
       }]
     },
     includeOtherFields: false,
     options: {}
   }
   ```

4. **Webhook registration delay** — After activating a workflow, n8n needs ~2 seconds to register webhooks. `testWorkflow()` handles this automatically.

5. **Manual Trigger not supported for testing** — n8n public API v1 doesn't support Manual Trigger execution. Use Webhook triggers for testable workflows.

6. **Node names must be unique** — Each node in a workflow must have a unique name string.

7. **Credential warnings don't block compilation** — Missing credential IDs generate warnings, not errors. Deployment will fail if credentials are actually needed.

8. **Expression validation is regex-based** — Validation extracts `$node["Name"]` references via JSON.stringify and regex. Complex expressions may not be fully validated.

9. **TypedNodes return type needs annotation** — The `createTypedNodes()` function has an explicit `TypedNodes` return type to avoid TypeScript serialization limits.

10. **Topology-aware layout** — Compiler uses BFS-based topology to position nodes: triggers at left, downstream flows right, branches fan vertically.

## CLI Commands

```bash
# Build the SDK
npm run build

# Run tests
npm test                           # All tests (unit + integration)
npm test -- --reporter=verbose     # Verbose output

# Extract schemas from n8n (requires N8N_API_URL and N8N_API_KEY)
npm run extract                    # Extract default nodes
npm run extract -- --all           # Extract all 797 nodes

# Generate TypeScript types and factories
npm run generate                   # Regenerate types and factories from schemas
```

## Tips for Claude

1. **Use `createTypedNodes()` for all workflows** — It provides type safety and auto-injects resource/operation parameters for all 797 nodes.

2. **Discover nodes via catalog** — Read `generated/node-catalog.json` to see available nodes, operations, and credentials before building workflows.

3. **Always `await compileWorkflow()`** — It's async. Don't forget the `await`.

4. **Use `testWorkflow()` for verification** — Deploy, execute, assert, and cleanup in a single call. Returns detailed failure diagnostics.

5. **Set node uses v3.4 format** — Use `assignments.assignments` array, not legacy `values.string` format.

6. **Webhook triggers for testing** — Manual Trigger doesn't work with n8n API execution. Use Webhook with unique paths.

7. **Credentials are optional** — Pass as 4th parameter. Validation warns but doesn't block. Deployment fails if truly needed.

8. **Error handling via `connectError()`** — Use for error paths. Automatically adds `onError: 'continueErrorOutput'` parameter.

9. **Merge nodes use `inputIndex`** — `wf.connect(branch1, merge, 0, 0)` connects to Merge input 0.

10. **All factory functions return `WorkflowNode`** — Use their properties with `wf.trigger()`/`wf.node()`, not the objects directly.
