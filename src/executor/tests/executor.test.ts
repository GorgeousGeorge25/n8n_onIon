/**
 * Integration tests for executor module - end-to-end workflow testing.
 *
 * Tests the complete build-deploy-test-cleanup loop using testWorkflow()
 * with real workflows against a live n8n instance.
 *
 * CRITICAL: All test workflows MUST use Webhook triggers (not Manual Trigger)
 * because n8n public API v1 does NOT support Manual Trigger execution.
 *
 * Tests skip gracefully when n8n is not available.
 */

import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import { workflow } from '../../builder/workflow.js';
import { testWorkflow } from '../test-harness.js';
import type { TestScenario } from '../types.js';

// --- n8n availability check ---

const N8N_BASE_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

let n8nAvailable = false;

/**
 * Check if n8n is reachable and API key is valid.
 */
async function checkAvailability(): Promise<boolean> {
  if (!N8N_API_KEY) {
    console.warn('Skipping executor integration tests: N8N_API_KEY not set in environment');
    return false;
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });

    if (response.ok) {
      return true;
    }

    console.warn(`Skipping executor integration tests: n8n API returned ${response.status}`);
    return false;
  } catch {
    console.warn(`Skipping executor integration tests: n8n not available at ${N8N_BASE_URL}`);
    return false;
  }
}

// --- Test suite ---

describe('Executor Integration Tests', { timeout: 30000 }, () => {
  beforeAll(async () => {
    n8nAvailable = await checkAvailability();
  });

  it.skipIf(!n8nAvailable)('should execute linear workflow (Webhook -> Set -> verify output)', async () => {

    // Build workflow: Webhook -> Set node
    const wf = workflow('Test Linear Workflow');
    const webhookPath = `test-linear-${Date.now()}`;

    wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'onReceived',
    });

    const setNode = wf.node('Set Data', 'n8n-nodes-base.set', {
      mode: 'manual',
      duplicateItem: false,
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'greeting',
            value: 'hello world',
            type: 'string',
          },
        ],
      },
      includeOtherFields: false,
      options: {},
    });

    wf.connect(wf.getNodes()[0], setNode);

    // Define test scenario
    const scenarios: TestScenario[] = [
      {
        name: 'Linear execution',
        triggerData: { test: 'linear' },
        expectedStatus: 'success',
        expectedNodes: ['Set Data'],
        expectedOutput: [
          {
            nodeName: 'Set Data',
            assertions: [
              { field: 'greeting', expected: 'hello world' },
            ],
          },
        ],
      },
    ];

    // Execute test
    const report = await testWorkflow(wf, scenarios, { webhookPath });

    // Verify results
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.cleaned).toBe(true);
    expect(report.results[0].passed).toBe(true);
    expect(report.results[0].failures).toHaveLength(0);
  });

  it.skipIf(!n8nAvailable)('should execute branching workflow (Webhook -> IF -> True Branch)', async () => {

    // Build workflow: Webhook -> IF (always true) -> True Branch
    const wf = workflow('Test Branching Workflow');
    const webhookPath = `test-branching-${Date.now()}`;

    wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'onReceived',
    });

    const ifNode = wf.node('IF', 'n8n-nodes-base.if', {
      conditions: {
        number: [
          {
            value1: '={{ 1 }}',
            operation: 'equal',
            value2: '={{ 1 }}',
          },
        ],
      },
    });

    const trueBranch = wf.node('True Branch', 'n8n-nodes-base.set', {
      mode: 'manual',
      duplicateItem: false,
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'branch',
            value: 'true',
            type: 'string',
          },
        ],
      },
      includeOtherFields: false,
      options: {},
    });

    const falseBranch = wf.node('False Branch', 'n8n-nodes-base.set', {
      mode: 'manual',
      duplicateItem: false,
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'branch',
            value: 'false',
            type: 'string',
          },
        ],
      },
      includeOtherFields: false,
      options: {},
    });

    wf.connect(wf.getNodes()[0], ifNode);
    wf.connect(ifNode, trueBranch, 0); // Output 0 = true path
    wf.connect(ifNode, falseBranch, 1); // Output 1 = false path

    // Define test scenario
    const scenarios: TestScenario[] = [
      {
        name: 'Branching - true path',
        triggerData: { test: 'branching' },
        expectedStatus: 'success',
        expectedNodes: ['IF', 'True Branch'],
      },
    ];

    // Execute test
    const report = await testWorkflow(wf, scenarios, { webhookPath });

    // Verify results
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.cleaned).toBe(true);
    expect(report.results[0].passed).toBe(true);
    expect(report.results[0].failures).toHaveLength(0);
  });

  it.skipIf(!n8nAvailable)('should execute error handling workflow (Webhook -> Code throws -> Error Handler)', async () => {

    // Build workflow: Webhook -> Code (throws) -> Error Handler
    const wf = workflow('Test Error Handling Workflow');
    const webhookPath = `test-error-${Date.now()}`;

    wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'onReceived',
    });

    const codeNode = wf.node('Code', 'n8n-nodes-base.code', {
      jsCode: 'throw new Error("test error");',
      mode: 'runOnceForAllItems',
    });

    const errorHandler = wf.node('Error Handler', 'n8n-nodes-base.set', {
      mode: 'manual',
      duplicateItem: false,
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'error',
            value: 'handled',
            type: 'string',
          },
        ],
      },
      includeOtherFields: false,
      options: {},
    });

    wf.connect(wf.getNodes()[0], codeNode);
    wf.connectError(codeNode, errorHandler);

    // Define test scenario
    const scenarios: TestScenario[] = [
      {
        name: 'Error handling',
        triggerData: { test: 'error' },
        expectedStatus: 'success', // Overall workflow succeeds because error is caught
        expectedNodes: ['Error Handler'],
      },
    ];

    // Execute test
    const report = await testWorkflow(wf, scenarios, { webhookPath });

    // Verify results
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.cleaned).toBe(true);
    expect(report.results[0].passed).toBe(true);
    expect(report.results[0].failures).toHaveLength(0);
  });

  it.skipIf(!n8nAvailable)('should trigger webhook and verify response', async () => {

    // Build workflow: Webhook -> Set
    const wf = workflow('Test Webhook Trigger');
    const webhookPath = `test-webhook-${Date.now()}`;

    wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'onReceived',
    });

    const setNode = wf.node('Set Data', 'n8n-nodes-base.set', {
      mode: 'manual',
      duplicateItem: false,
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'response',
            value: '={{ $json.message }}',
            type: 'string',
          },
        ],
      },
      includeOtherFields: false,
      options: {},
    });

    wf.connect(wf.getNodes()[0], setNode);

    // Define test scenario
    const scenarios: TestScenario[] = [
      {
        name: 'Webhook trigger with payload',
        triggerData: { message: 'hello from webhook' },
        expectedStatus: 'success',
        expectedNodes: ['Set Data'],
        expectedOutput: [
          {
            nodeName: 'Set Data',
            assertions: [
              { field: 'response', expected: 'hello from webhook' },
            ],
          },
        ],
      },
    ];

    // Execute test
    const report = await testWorkflow(wf, scenarios, { webhookPath });

    // Verify results
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.cleaned).toBe(true);
  });

  it.skipIf(!n8nAvailable)('should provide failure feedback with diagnostics when assertions fail', async () => {

    // Build workflow: Webhook -> Set
    const wf = workflow('Test Failure Feedback');
    const webhookPath = `test-failure-${Date.now()}`;

    wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'onReceived',
    });

    const setNode = wf.node('Set Data', 'n8n-nodes-base.set', {
      mode: 'manual',
      duplicateItem: false,
      assignments: {
        assignments: [
          {
            id: crypto.randomUUID(),
            name: 'value',
            value: 'actual',
            type: 'string',
          },
        ],
      },
      includeOtherFields: false,
      options: {},
    });

    wf.connect(wf.getNodes()[0], setNode);

    // Define test scenario with WRONG assertion (to trigger failure)
    const scenarios: TestScenario[] = [
      {
        name: 'Intentional failure for feedback',
        triggerData: { test: 'failure' },
        expectedStatus: 'success',
        expectedNodes: ['Set Data', 'NonExistent Node'], // NonExistent should fail
        expectedOutput: [
          {
            nodeName: 'Set Data',
            assertions: [
              { field: 'value', expected: 'wrong_value' }, // Wrong value should fail
            ],
          },
        ],
      },
    ];

    // Execute test
    const report = await testWorkflow(wf, scenarios, { webhookPath });

    // Verify failure feedback
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(1);
    expect(report.cleaned).toBe(true); // Cleanup should still succeed

    const result = report.results[0];
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);

    // Verify we have missing_node failure
    const missingNodeFailure = result.failures.find(f => f.type === 'missing_node');
    expect(missingNodeFailure).toBeDefined();
    expect(missingNodeFailure?.message).toContain('NonExistent Node');

    // Verify we have output_mismatch failure
    const outputFailure = result.failures.find(f => f.type === 'output_mismatch');
    expect(outputFailure).toBeDefined();
    expect(outputFailure?.expected).toBe('wrong_value');
    expect(outputFailure?.actual).toBe('actual');

    // Verify actualOutput is populated for debugging
    expect(result.actualOutput).toBeDefined();
    expect(result.actualOutput?.length).toBeGreaterThan(0);
  });
});
