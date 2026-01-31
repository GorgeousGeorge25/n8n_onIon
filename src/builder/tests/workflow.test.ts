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
});
