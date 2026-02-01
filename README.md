# n8n_onIon — n8n Workflow SDK

I vibecoded this.. let me know if it works. Also first public repo.

My problem was that Claude Code made workflows but once it uplaoded them built
workflows - i discovered that it guesses what datafields there are and hence flooded with errors.
This makes Claude Code create proper JSONs so that your workflows in n8n works.

Special thanks to GSD (get-shit-done) repo!


┌─────────────────────────────────────────────────────────────────────────────┐
│                                USER PROMPT                                  │
│                                                                             │
│  "Create a workflow that watches Gmail for invoices, extracts the          │
│   amount using AI, saves to Google Sheets, and notifies me on Slack"       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SKILL.md                                       │
│                           (Knowledge Layer)                                 │
│                                                                             │
│  • SDK API patterns                                                         │
│  • Best practices                                                           │
│  • Expression syntax                                                        │
│  • Common workflow patterns                                                 │
│                                                                             │
│  Claude reads this → knows HOW to write workflows correctly                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
  I made this:                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           n8n-sdk MCP                                       │
│                         (Authoring Layer)                                   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  list_nodes()   │  │   compile()     │  │   validate()    │             │
│  │                 │  │                 │  │                 │             │
│  │ "What nodes     │  │ TypeScript      │  │ Check without   │             │
│  │  can I use?"    │  │ → n8n JSON      │  │ deploying       │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                │                                            │
│         797 typed nodes        │   Type-safe params                         │
│         Schema-aware compiler  │   Compile-time errors                      │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 │  Valid n8n JSON
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           n8n-mcp                                           │
│                        (Management Layer)                                   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ create_workflow │  │  test_workflow  │  │   executions    │             │
│  │                 │  │                 │  │                 │             │
│  │ Deploy JSON     │  │ Trigger test    │  │ Monitor runs    │             │
│  │ to n8n          │  │ execution       │  │ View results    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           n8n INSTANCE                                      │
│                        (Execution Layer)                                    │
│                                                                             │
│         ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐        │
│         │  Gmail  │ ──▶ │   AI    │ ──▶ │ Sheets  │ ──▶ │  Slack  │        │
│         │ Trigger │     │ Extract │     │  Save   │     │ Notify  │        │
│         └─────────┘     └─────────┘     └─────────┘     └─────────┘        │
│                                                                             │
│                    Workflow running, processing data                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLAUDE RESPONSE                                   │
│                                                                             │
│  "Done. Workflow 'Invoice Processor' is live.                              │
│                                                                             │
│   • Triggers on: Gmail with subject containing 'invoice'                   │
│   • Extracts: amount, vendor, date via GPT-4                               │
│   • Saves to: 'Invoices 2026' spreadsheet                                  │
│   • Notifies: #accounting channel                                          │
│                                                                             │
│   Test it by sending yourself an invoice email."                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

---

## Quick Start

### 1. Install and sync schemas

```bash
npm install
npm run sync -- --all        # Populate schema cache via n8n-mcp
# OR: npm run sync -- --direct --all   # Fallback: direct n8n API
```

### 2. Configure environment

```bash
# .env
N8N_API_URL=http://localhost:5678
N8N_API_KEY=your-api-key-here
```

### 3. Write a workflow

```typescript
import { workflow, ref, deployWorkflow } from './src/index.js';

const wf = workflow('My Workflow');

const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
  httpMethod: 'POST',
  path: '/hello',
  responseMode: 'onReceived',
});

const slack = wf.node('Notify', 'n8n-nodes-base.slack', {
  resource: 'message',
  operation: 'post',
  select: 'channel',
  channelId: '#general',
  text: ref('Webhook').out.body.message.toString(),
}, {
  slackApi: { id: 'cred-id', name: 'My Slack' }
});

wf.connect(webhook, slack);

// Deploy to n8n
const result = await deployWorkflow(wf, { activate: true });
console.log(`Deployed: ${result.url}`);
```

## Core API

| Function | Description |
|----------|-------------|
| `workflow(name)` | Create a workflow builder |
| `wf.trigger(name, type, params, creds?)` | Add trigger node |
| `wf.node(name, type, params, creds?)` | Add action node |
| `wf.connect(from, to, outIdx?, inIdx?)` | Connect nodes |
| `wf.connectError(from, to)` | Error handling path |
| `await compileWorkflow(wf)` | Compile to n8n JSON |
| `await deployWorkflow(wf, opts?)` | Deploy to n8n instance |
| `await testWorkflow(wf, scenarios)` | Deploy, execute, assert, cleanup |
| `ref(nodeName).out.field` | Reference upstream node output |
| `` expr`text ${ref(...)}` `` | String interpolation with expressions |
| `validateWorkflow(nodes, conns)` | Validate workflow structure |
| `await validateViaMcp(json)` | Remote validation via n8n-mcp |

**Node discovery:** Use n8n-mcp `search_nodes` / `get_node` to find node types, parameters, and credentials.

## Project Structure

```
n8n_onIon/
├── src/
│   ├── builder/        # workflow(), trigger(), node(), connect()
│   ├── compiler/       # Compiles builder to n8n JSON
│   ├── deployer/       # Deploy to n8n via REST API
│   ├── executor/       # Test harness — deploy, execute, assert
│   ├── expressions/    # ref(), expr template literals
│   ├── mcp/            # MCP bridge — schema sync, validation
│   └── schema/         # Schema cache, extractor, types
├── cli/                # sync, build-workflow, validate, deploy
├── schemas/            # Cached n8n node schemas (797 JSON files)
└── SKILL.md            # Claude skill reference
```

## CLI Commands

```bash
npm run sync -- --all           # Sync all node schemas via n8n-mcp
npm run sync -- --direct --all  # Sync via direct n8n API (fallback)
npm run sync -- --check         # Report stale schemas (dry run)
npm run build-workflow          # Build workflow from TypeScript file
npm run validate                # Validate workflow structure
npm run deploy                  # Deploy workflow to n8n
npm run build                   # TypeScript compile
npm test                        # Run tests
```

## Requirements

- Node.js >= 18.0.0
- n8n instance with API key (for deploy/test)
- n8n-mcp (optional, for schema sync — can use direct API instead)

## License

MIT
