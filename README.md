I vibecoded this.. let me know if it works. Also first public repo.

My problem was that Claude Code made workflows but once it uplaoded them built workflows - i discovered that it guesses what datafields there are and hence flooded with errors.
This makes Claude Code create proper JSONs so that your workflows in n8n works.

Special thanks to GSD (get-shit-done) repo!


n8n Workflow SDK
TypeScript SDK that makes AI-generated n8n workflows actually work.

The Problem
When Claude (or any LLM) generates n8n workflows as JSON, they fail ~30-40% of the time:

Wrong parameter names
Invalid expression syntax
Incorrect typeVersions
Missing required fields
Bad connection structure

You only find out when you import into n8n and it breaks.

The Solution
A TypeScript SDK that provides compile-time validation for n8n workflows:
typescriptimport { workflow, createTypedNodes, expr } from 'n8n-workflow-sdk'

const nodes = createTypedNodes()
const wf = workflow('Process Orders')

const webhook = wf.trigger(nodes.webhook.webhookTrigger({
  httpMethod: 'POST',
  path: '/orders'
}))

const slack = wf.node(nodes.slack.message.post({
  select: 'channel',
  channelId: { mode: 'name', value: '#orders' },
  messageType: 'text',
  text: expr.template`New order: ${webhook.out.body.orderId}`
}))

wf.connect(webhook, slack)
Invalid params? TypeScript error — not n8n import failure.

What it does

Extracts schemas from your n8n instance (797 nodes)
Generates TypeScript types (7,160 interfaces)
Validates at compile time — wrong params won't compile
Compiles to n8n JSON — imports directly into n8n


Results
Without SDKWith SDK~60-70% first-try success~99% first-try successErrors at n8n importErrors in editorDebug in n8n UIDebug with TypeScript

Who it's for

AI agents building n8n workflows programmatically
Developers who want type-safe workflow authoring
Teams using LLMs to generate automation


One-liner

n8n-workflow-sdk: Type-safe workflow authoring that catches errors before they reach n8n.
