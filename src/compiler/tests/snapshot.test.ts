/**
 * Snapshot tests for all 5 target nodes (NODE-01 through NODE-05)
 * Verifies compiled n8n JSON matches expected structure for each node type.
 */

import { describe, it, expect } from 'vitest';
import { workflow } from '../../builder/workflow.js';
import { compileWorkflow } from '../compiler.js';
import { ref } from '../../expressions/reference.js';
import type { N8nWorkflow } from '../types.js';

/**
 * Replace all UUID fields in compiled output with deterministic placeholders
 * so snapshots are stable across runs.
 */
function normalizeUUIDs(result: N8nWorkflow): N8nWorkflow {
  const copy = JSON.parse(JSON.stringify(result)) as N8nWorkflow;
  copy.nodes.forEach((node, i) => {
    node.id = `uuid-${i}`;
  });
  return copy;
}

describe('Snapshot Tests', () => {

  // NODE-01: Webhook trigger
  it('should compile Webhook workflow', async () => {
    const wf = workflow('Webhook Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: 'test-webhook',
      responseMode: 'onReceived'
    });
    const setNode = wf.node('Set Data', 'n8n-nodes-base.set', {
      keepOnlySet: false,
      values: { string: [] }
    });
    wf.connect(webhook, setNode);

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions
    const webhookNode = normalized.nodes.find(n => n.name === 'Webhook')!;
    expect(webhookNode.parameters).toHaveProperty('httpMethod', 'POST');
    expect(webhookNode.parameters).toHaveProperty('path', 'test-webhook');
    expect(webhookNode.parameters).toHaveProperty('responseMode', 'onReceived');

    expect(normalized).toMatchSnapshot();
  });

  // NODE-02: HTTP Request
  it('should compile HTTP Request workflow', async () => {
    const wf = workflow('HTTP Request Test');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const httpReq = wf.node('HTTP Request', 'n8n-nodes-base.httpRequest', {
      method: 'GET',
      url: 'https://api.example.com/users',
      authentication: 'none',
      options: {}
    });
    wf.connect(trigger, httpReq);

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions
    const httpNode = normalized.nodes.find(n => n.name === 'HTTP Request')!;
    expect(httpNode.parameters).toHaveProperty('method', 'GET');
    expect(httpNode.parameters).toHaveProperty('url', 'https://api.example.com/users');
    expect(httpNode.parameters).toHaveProperty('authentication', 'none');

    expect(normalized).toMatchSnapshot();
  });

  // NODE-03: Slack with expression
  it('should compile Slack workflow with expression', async () => {
    const wf = workflow('Slack Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: 'slack-hook'
    });
    const slack = wf.node('Send Slack', 'n8n-nodes-base.slack', {
      resource: 'message',
      operation: 'post',
      channel: '#general',
      text: ref('Webhook').out.body.message.toString()
    });
    wf.connect(webhook, slack);

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions
    const slackNode = normalized.nodes.find(n => n.name === 'Send Slack')!;
    expect(slackNode.parameters).toHaveProperty('resource', 'message');
    expect(slackNode.parameters).toHaveProperty('operation', 'post');
    expect(slackNode.parameters).toHaveProperty('channel', '#general');
    expect(slackNode.parameters.text).toContain('={{');
    expect(slackNode.parameters.text).toContain("$node['Webhook'].json");

    expect(normalized).toMatchSnapshot();
  });

  // NODE-04: IF with branching connections
  it('should compile IF workflow with two output branches', async () => {
    const wf = workflow('IF Test');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const ifNode = wf.node('IF', 'n8n-nodes-base.if', {
      conditions: {
        string: [{
          value1: '={{ $json.status }}',
          operation: 'equal',
          value2: 'active'
        }]
      }
    });
    const trueNode = wf.node('True Branch', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'result', value: 'active' }] }
    });
    const falseNode = wf.node('False Branch', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'result', value: 'inactive' }] }
    });

    wf.connect(trigger, ifNode);
    wf.connect(ifNode, trueNode, 0);   // true branch
    wf.connect(ifNode, falseNode, 1);   // false branch

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions - verify TWO output branches
    const ifConnections = normalized.connections['IF'];
    expect(ifConnections).toBeDefined();
    expect(ifConnections.main).toHaveLength(2);
    expect(ifConnections.main![0]).toHaveLength(1); // true branch -> True Branch
    expect(ifConnections.main![1]).toHaveLength(1); // false branch -> False Branch
    expect(ifConnections.main![0][0].node).toBe('True Branch');
    expect(ifConnections.main![1][0].node).toBe('False Branch');

    expect(normalized).toMatchSnapshot();
  });

  // NODE-05: Set with field assignments
  it('should compile Set workflow with field assignments', async () => {
    const wf = workflow('Set Test');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const setNode = wf.node('Set Fields', 'n8n-nodes-base.set', {
      keepOnlySet: true,
      values: {
        string: [{
          name: 'fullName',
          value: '={{ $json.firstName + " " + $json.lastName }}'
        }]
      }
    });
    wf.connect(trigger, setNode);

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions
    const setNodeResult = normalized.nodes.find(n => n.name === 'Set Fields')!;
    expect(setNodeResult.parameters).toHaveProperty('keepOnlySet', true);
    const values = setNodeResult.parameters.values as { string: Array<{ name: string; value: string }> };
    expect(values.string).toHaveLength(1);
    expect(values.string[0].name).toBe('fullName');
    expect(values.string[0].value).toContain('$json.firstName');

    expect(normalized).toMatchSnapshot();
  });

  // Phase 5.2 Pattern Tests

  // PATTERN-01: Merge with inputIndex
  it('should compile Merge workflow with inputIndex on connections', async () => {
    const wf = workflow('Merge Test');
    const trigger1 = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const set1 = wf.node('Set 1', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'source', value: 'trigger1' }] }
    });
    const trigger2 = wf.trigger('Schedule Trigger', 'n8n-nodes-base.scheduleTrigger', {
      rule: { interval: [{ field: 'hours', hoursInterval: 1 }] }
    });
    const set2 = wf.node('Set 2', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'source', value: 'trigger2' }] }
    });
    const merge = wf.node('Merge', 'n8n-nodes-base.merge', {
      mode: 'combine',
      combinationMode: 'multiplex'
    });

    wf.connect(trigger1, set1);
    wf.connect(trigger2, set2);
    wf.connect(set1, merge, 0, 0); // Input 0
    wf.connect(set2, merge, 0, 1); // Input 1

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions - verify inputIndex values
    const set1Connections = normalized.connections['Set 1'];
    const set2Connections = normalized.connections['Set 2'];
    expect(set1Connections.main![0][0].index).toBe(0);
    expect(set2Connections.main![0][0].index).toBe(1);

    expect(normalized).toMatchSnapshot();
  });

  // PATTERN-02: Credentials
  it('should compile workflow with credentials attached to node', async () => {
    const wf = workflow('Credentials Test');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const slack = wf.node('Send Slack', 'n8n-nodes-base.slack', {
      resource: 'message',
      operation: 'post',
      text: 'Hello'
    }, {
      slackApi: { id: '1', name: 'My Slack' }
    });
    wf.connect(trigger, slack);

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions - verify credentials
    const slackNode = normalized.nodes.find(n => n.name === 'Send Slack')!;
    expect(slackNode.credentials).toBeDefined();
    expect(slackNode.credentials).toHaveProperty('slackApi');
    expect(slackNode.credentials!.slackApi).toEqual({ id: '1', name: 'My Slack' });

    expect(normalized).toMatchSnapshot();
  });

  // PATTERN-03: Error connection
  it('should compile workflow with error connection', async () => {
    const wf = workflow('Error Connection Test');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const httpReq = wf.node('HTTP Request', 'n8n-nodes-base.httpRequest', {
      method: 'GET',
      url: 'https://api.example.com/data',
      authentication: 'none'
    });
    const errorHandler = wf.node('Error Handler', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'error', value: 'handled' }] }
    });
    wf.connect(trigger, httpReq);
    wf.connectError(httpReq, errorHandler);

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions - verify error connection
    const httpConnections = normalized.connections['HTTP Request'];
    expect(httpConnections).toBeDefined();
    expect(httpConnections.error).toBeDefined(); // Error connections should exist
    expect(httpConnections.error![0][0].node).toBe('Error Handler');
    expect(httpConnections.error![0][0].type).toBe('error');

    const httpNode = normalized.nodes.find(n => n.name === 'HTTP Request')!;
    expect(httpNode.parameters).toHaveProperty('onError', 'continueErrorOutput');

    expect(normalized).toMatchSnapshot();
  });

  // PATTERN-04: Topology layout
  it('should compile branching workflow with proper topology layout', async () => {
    const wf = workflow('Topology Test');
    const trigger = wf.trigger('Start', 'n8n-nodes-base.manualTrigger', {});
    const ifNode = wf.node('Check Status', 'n8n-nodes-base.if', {
      conditions: {
        string: [{ value1: '={{ $json.status }}', operation: 'equal', value2: 'ok' }]
      }
    });
    const trueBranch = wf.node('Success Path', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'result', value: 'success' }] }
    });
    const falseBranch = wf.node('Failure Path', 'n8n-nodes-base.set', {
      values: { string: [{ name: 'result', value: 'failure' }] }
    });

    wf.connect(trigger, ifNode);
    wf.connect(ifNode, trueBranch, 0);   // true branch
    wf.connect(ifNode, falseBranch, 1);  // false branch

    const result = await compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions - verify topology layout
    const startNode = normalized.nodes.find(n => n.name === 'Start')!;
    const checkNode = normalized.nodes.find(n => n.name === 'Check Status')!;
    const successNode = normalized.nodes.find(n => n.name === 'Success Path')!;
    const failureNode = normalized.nodes.find(n => n.name === 'Failure Path')!;

    // X positions: trigger < if < branches
    expect(startNode.position[0]).toBeLessThan(checkNode.position[0]);
    expect(checkNode.position[0]).toBeLessThan(successNode.position[0]);
    expect(checkNode.position[0]).toBeLessThan(failureNode.position[0]);

    // Y positions: branches should be different
    expect(successNode.position[1]).not.toBe(failureNode.position[1]);

    expect(normalized).toMatchSnapshot();
  });
});
