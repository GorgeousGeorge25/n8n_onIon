import { describe, it, expect } from 'vitest';
import { workflow } from '../workflow.js';

describe('BUILD-01: workflow() factory', () => {
  it('creates workflow with given name', () => {
    const wf = workflow('My Workflow');
    expect(wf.name).toBe('My Workflow');
  });

  it('starts with empty nodes and connections', () => {
    const wf = workflow('Test');
    expect(wf.getNodes()).toEqual([]);
    expect(wf.getConnections()).toEqual([]);
  });
});

describe('BUILD-02: wf.trigger()', () => {
  it('adds a trigger node', () => {
    const wf = workflow('Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST',
      path: 'my-hook'
    });

    expect(wf.getNodes()).toHaveLength(1);
    expect(wf.getNodes()[0].name).toBe('Webhook');
    expect(wf.getNodes()[0].type).toBe('n8n-nodes-base.webhook');
    expect(wf.getNodes()[0].parameters.httpMethod).toBe('POST');
  });

  it('returns a node reference for connections', () => {
    const wf = workflow('Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {});
    expect(webhook.name).toBe('Webhook');
  });
});

describe('BUILD-03: wf.node()', () => {
  it('adds an action node', () => {
    const wf = workflow('Test');
    const slack = wf.node('Send Slack', 'n8n-nodes-base.slack', {
      resource: 'message',
      operation: 'post',
      text: 'Hello'
    });

    expect(wf.getNodes()).toHaveLength(1);
    expect(wf.getNodes()[0].name).toBe('Send Slack');
    expect(wf.getNodes()[0].type).toBe('n8n-nodes-base.slack');
    expect(wf.getNodes()[0].parameters.resource).toBe('message');
  });

  it('rejects duplicate node names', () => {
    const wf = workflow('Test');
    wf.node('Slack', 'n8n-nodes-base.slack', {});
    expect(() => wf.node('Slack', 'n8n-nodes-base.slack', {})).toThrow('duplicate');
  });
});

describe('BUILD-04: wf.connect()', () => {
  it('connects two nodes', () => {
    const wf = workflow('Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {});
    const slack = wf.node('Slack', 'n8n-nodes-base.slack', {});

    wf.connect(webhook, slack);

    const connections = wf.getConnections();
    expect(connections).toHaveLength(1);
    expect(connections[0].from).toBe('Webhook');
    expect(connections[0].to).toBe('Slack');
  });

  it('supports chaining multiple connections', () => {
    const wf = workflow('Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {});
    const set = wf.node('Set Data', 'n8n-nodes-base.set', {});
    const slack = wf.node('Slack', 'n8n-nodes-base.slack', {});

    wf.connect(webhook, set);
    wf.connect(set, slack);

    expect(wf.getConnections()).toHaveLength(2);
  });

  it('supports output index for branching nodes (IF)', () => {
    const wf = workflow('Test');
    const ifNode = wf.node('Check', 'n8n-nodes-base.if', {});
    const trueNode = wf.node('True Path', 'n8n-nodes-base.set', {});
    const falseNode = wf.node('False Path', 'n8n-nodes-base.set', {});

    wf.connect(ifNode, trueNode, 0); // true output
    wf.connect(ifNode, falseNode, 1); // false output

    const conns = wf.getConnections();
    expect(conns[0].outputIndex).toBe(0);
    expect(conns[1].outputIndex).toBe(1);
  });

  it('rejects connection to non-existent node', () => {
    const wf = workflow('Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {});
    const fakeNode = { name: 'Nonexistent' };

    expect(() => wf.connect(webhook, fakeNode)).toThrow('Unknown node');
  });

  it('rejects connection from non-existent node', () => {
    const wf = workflow('Test');
    const slack = wf.node('Slack', 'n8n-nodes-base.slack', {});
    const fakeNode = { name: 'Nonexistent' };

    expect(() => wf.connect(fakeNode, slack)).toThrow('Unknown node');
  });

  it('supports inputIndex parameter for merge patterns', () => {
    const wf = workflow('Test');
    const source1 = wf.trigger('Source1', 'n8n-nodes-base.manualTrigger', {});
    const source2 = wf.trigger('Source2', 'n8n-nodes-base.scheduleTrigger', {});
    const merge = wf.node('Merge', 'n8n-nodes-base.merge', {});

    wf.connect(source1, merge, 0, 0); // Input 0
    wf.connect(source2, merge, 0, 1); // Input 1

    const conns = wf.getConnections();
    expect(conns[0].inputIndex).toBe(0);
    expect(conns[1].inputIndex).toBe(1);
  });
});

describe('BUILD-05: wf.connectError()', () => {
  it('creates error-type connection', () => {
    const wf = workflow('Test');
    const httpReq = wf.node('HTTP', 'n8n-nodes-base.httpRequest', {});
    const errorHandler = wf.node('ErrorHandler', 'n8n-nodes-base.set', {});

    wf.connectError(httpReq, errorHandler);

    const conns = wf.getConnections();
    expect(conns).toHaveLength(1);
    expect(conns[0].from).toBe('HTTP');
    expect(conns[0].to).toBe('ErrorHandler');
    expect(conns[0].connectionType).toBe('error');
  });

  it('rejects error connection to non-existent node', () => {
    const wf = workflow('Test');
    const httpReq = wf.node('HTTP', 'n8n-nodes-base.httpRequest', {});
    const fakeNode = { name: 'Nonexistent' };

    expect(() => wf.connectError(httpReq, fakeNode)).toThrow('Unknown node');
  });
});

describe('BUILD-06: credentials parameter', () => {
  it('attaches credentials to trigger nodes', () => {
    const wf = workflow('Test');
    const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
      httpMethod: 'POST'
    }, {
      webhookAuth: { id: '123', name: 'My Auth' }
    });

    const nodes = wf.getNodes();
    expect(nodes[0].credentials).toBeDefined();
    expect(nodes[0].credentials).toHaveProperty('webhookAuth');
    expect(nodes[0].credentials!.webhookAuth).toEqual({ id: '123', name: 'My Auth' });
  });

  it('attaches credentials to action nodes', () => {
    const wf = workflow('Test');
    const slack = wf.node('Slack', 'n8n-nodes-base.slack', {
      resource: 'message'
    }, {
      slackApi: { id: '456', name: 'My Slack' }
    });

    const nodes = wf.getNodes();
    expect(nodes[0].credentials).toBeDefined();
    expect(nodes[0].credentials).toHaveProperty('slackApi');
    expect(nodes[0].credentials!.slackApi).toEqual({ id: '456', name: 'My Slack' });
  });

  it('omits credentials when not provided', () => {
    const wf = workflow('Test');
    const slack = wf.node('Slack', 'n8n-nodes-base.slack', {});

    const nodes = wf.getNodes();
    expect(nodes[0].credentials).toBeUndefined();
  });
});
