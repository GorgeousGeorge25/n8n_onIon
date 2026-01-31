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
  it('should compile Webhook workflow', () => {
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

    const result = compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions
    const webhookNode = normalized.nodes.find(n => n.name === 'Webhook')!;
    expect(webhookNode.parameters).toHaveProperty('httpMethod', 'POST');
    expect(webhookNode.parameters).toHaveProperty('path', 'test-webhook');
    expect(webhookNode.parameters).toHaveProperty('responseMode', 'onReceived');

    expect(normalized).toMatchSnapshot();
  });

  // NODE-02: HTTP Request
  it('should compile HTTP Request workflow', () => {
    const wf = workflow('HTTP Request Test');
    const trigger = wf.trigger('Manual Trigger', 'n8n-nodes-base.manualTrigger', {});
    const httpReq = wf.node('HTTP Request', 'n8n-nodes-base.httpRequest', {
      method: 'GET',
      url: 'https://api.example.com/users',
      authentication: 'none',
      options: {}
    });
    wf.connect(trigger, httpReq);

    const result = compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions
    const httpNode = normalized.nodes.find(n => n.name === 'HTTP Request')!;
    expect(httpNode.parameters).toHaveProperty('method', 'GET');
    expect(httpNode.parameters).toHaveProperty('url', 'https://api.example.com/users');
    expect(httpNode.parameters).toHaveProperty('authentication', 'none');

    expect(normalized).toMatchSnapshot();
  });

  // NODE-03: Slack with expression
  it('should compile Slack workflow with expression', () => {
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

    const result = compileWorkflow(wf);
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
  it('should compile IF workflow with two output branches', () => {
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

    const result = compileWorkflow(wf);
    const normalized = normalizeUUIDs(result);

    // Structural assertions - verify TWO output branches
    const ifConnections = normalized.connections['IF'];
    expect(ifConnections).toBeDefined();
    expect(ifConnections.main).toHaveLength(2);
    expect(ifConnections.main[0]).toHaveLength(1); // true branch -> True Branch
    expect(ifConnections.main[1]).toHaveLength(1); // false branch -> False Branch
    expect(ifConnections.main[0][0].node).toBe('True Branch');
    expect(ifConnections.main[1][0].node).toBe('False Branch');

    expect(normalized).toMatchSnapshot();
  });

  // NODE-05: Set with field assignments
  it('should compile Set workflow with field assignments', () => {
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

    const result = compileWorkflow(wf);
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
});
