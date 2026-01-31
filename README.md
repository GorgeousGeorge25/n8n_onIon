I vibecoded this.. let me know if it works. Also first public repo.

My problem was that Claude Code made workflows but once it uplaoded them built workflows - i discovered that it guesses what datafields there are and hence flooded with errors.
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
│         797 typed nodes        │   7,160 interfaces                         │
│         Type-safe params       │   Compile-time errors                      │
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
