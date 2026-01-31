/**
 * Integration tests for importing compiled workflows into n8n via REST API.
 *
 * These tests compile workflows using the SDK and import them into a running
 * n8n instance to verify they are accepted without errors. Tests skip gracefully
 * when n8n is not available.
 *
 * Uses n8n public API v1 with API key authentication.
 *
 * Satisfies: TEST-02 (integration testing against actual n8n)
 */

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { workflow } from '../../builder/workflow.js';
import { compileWorkflow } from '../compiler.js';
import { ref } from '../../expressions/reference.js';
import type { N8nWorkflow } from '../types.js';

// --- n8n API helper ---

const N8N_BASE_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

let n8nAvailable = false;
const createdWorkflowIds: string[] = [];

/**
 * Check if n8n is reachable and API key is valid by listing workflows.
 */
async function checkAvailability(): Promise<boolean> {
  if (!N8N_API_KEY) {
    console.warn('Skipping integration tests: N8N_API_KEY not set in environment');
    return false;
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });

    if (response.ok) {
      return true;
    }

    console.warn(`Skipping integration tests: n8n API returned ${response.status}`);
    return false;
  } catch {
    console.warn(`Skipping integration tests: n8n not available at ${N8N_BASE_URL}`);
    return false;
  }
}

/**
 * Import a compiled workflow into n8n via the public API v1.
 * Strips the `active` field since it is read-only in the public API.
 */
async function importWorkflow(compiled: N8nWorkflow): Promise<{ status: number; body: Record<string, unknown> }> {
  // Strip read-only field 'active' — n8n public API rejects it
  const { active: _, ...payload } = compiled;

  const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json() as Record<string, unknown>;
  return { status: response.status, body };
}

/**
 * Delete a workflow from n8n by ID.
 */
async function deleteWorkflow(id: string): Promise<void> {
  await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}`, {
    method: 'DELETE',
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
  });
}

// --- Test suite ---

describe('Integration Tests — n8n Workflow Import', () => {
  beforeAll(async () => {
    n8nAvailable = await checkAvailability();
  });

  afterAll(async () => {
    if (!n8nAvailable) return;

    // Clean up all created workflows
    for (const id of createdWorkflowIds) {
      try {
        await deleteWorkflow(id);
      } catch {
        console.warn(`Failed to delete workflow ${id} during cleanup`);
      }
    }
  });

  // NODE-01: Webhook trigger
  it('should import compiled Webhook workflow into n8n', async () => {
    if (!n8nAvailable) return;

    const wf = workflow('Integration Test — Webhook');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: 'test-webhook',
      responseMode: 'onReceived',
    });
    const setNode = wf.node('Set Data', 'n8n-nodes-base.set', {
      keepOnlySet: false,
      values: { string: [] },
    });
    wf.connect(webhook, setNode);

    const compiled = compileWorkflow(wf);
    const { status, body } = await importWorkflow(compiled);

    expect(status === 200 || status === 201).toBe(true);
    expect(body).toHaveProperty('id');
    createdWorkflowIds.push(body.id as string);
  });

  // NODE-02: HTTP Request
  it('should import compiled HTTP Request workflow into n8n', async () => {
    if (!n8nAvailable) return;

    const wf = workflow('Integration Test — HTTP Request');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const httpReq = wf.node('HTTP Request', 'n8n-nodes-base.httpRequest', {
      method: 'GET',
      url: 'https://api.example.com/users',
      authentication: 'none',
      options: {},
    });
    wf.connect(trigger, httpReq);

    const compiled = compileWorkflow(wf);
    const { status, body } = await importWorkflow(compiled);

    expect(status === 200 || status === 201).toBe(true);
    expect(body).toHaveProperty('id');
    createdWorkflowIds.push(body.id as string);
  });

  // NODE-03: Slack with expression
  it('should import compiled Slack workflow into n8n', async () => {
    if (!n8nAvailable) return;

    const wf = workflow('Integration Test — Slack');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: 'slack-hook',
    });
    const slack = wf.node('Send Slack', 'n8n-nodes-base.slack', {
      resource: 'message',
      operation: 'post',
      channel: '#general',
      text: ref('Webhook').out.body.message.toString(),
    });
    wf.connect(webhook, slack);

    const compiled = compileWorkflow(wf);
    const { status, body } = await importWorkflow(compiled);

    expect(status === 200 || status === 201).toBe(true);
    expect(body).toHaveProperty('id');
    createdWorkflowIds.push(body.id as string);
  });

  // NODE-04: IF with branching
  it('should import compiled IF workflow into n8n', async () => {
    if (!n8nAvailable) return;

    const wf = workflow('Integration Test — IF');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const ifNode = wf.node('IF', 'n8n-nodes-base.if', {
      conditions: {
        string: [{
          value1: '={{ $json.status }}',
          operation: 'equal',
          value2: 'active',
        }],
      },
    });
    const trueNode = wf.node('True Branch', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'result', value: 'active' }] },
    });
    const falseNode = wf.node('False Branch', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'result', value: 'inactive' }] },
    });

    wf.connect(trigger, ifNode);
    wf.connect(ifNode, trueNode, 0);
    wf.connect(ifNode, falseNode, 1);

    const compiled = compileWorkflow(wf);
    const { status, body } = await importWorkflow(compiled);

    expect(status === 200 || status === 201).toBe(true);
    expect(body).toHaveProperty('id');
    createdWorkflowIds.push(body.id as string);
  });

  // NODE-05: Set with field assignments
  it('should import compiled Set workflow into n8n', async () => {
    if (!n8nAvailable) return;

    const wf = workflow('Integration Test — Set');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const setNode = wf.node('Set Fields', 'n8n-nodes-base.set', {
      keepOnlySet: true,
      values: {
        string: [{
          name: 'fullName',
          value: '={{ $json.firstName + " " + $json.lastName }}',
        }],
      },
    });
    wf.connect(trigger, setNode);

    const compiled = compileWorkflow(wf);
    const { status, body } = await importWorkflow(compiled);

    expect(status === 200 || status === 201).toBe(true);
    expect(body).toHaveProperty('id');
    createdWorkflowIds.push(body.id as string);
  });
});
