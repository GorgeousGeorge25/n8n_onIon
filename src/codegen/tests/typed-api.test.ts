import { describe, it, expect } from 'vitest';
import { createTypedNodes } from '../typed-api.js';
import type { WorkflowNode } from '../../builder/types.js';

describe('Typed Node API', () => {
  const nodes = createTypedNodes();

  describe('Simple nodes produce correct WorkflowNode', () => {
    it('webhook produces WorkflowNode with correct type and parameters', () => {
      const result = nodes.webhook('Trigger', { httpMethod: 'POST', path: '/hook' });

      expect(result).toEqual({
        name: 'Trigger',
        type: 'n8n-nodes-base.webhook',
        parameters: { httpMethod: 'POST', path: '/hook' },
      });
    });

    it('httpRequest produces WorkflowNode with correct type and parameters', () => {
      const result = nodes.httpRequest('Fetch', { method: 'GET', url: 'https://api.example.com' });

      expect(result).toEqual({
        name: 'Fetch',
        type: 'n8n-nodes-base.httpRequest',
        parameters: { method: 'GET', url: 'https://api.example.com' },
      });
    });

    it('if produces WorkflowNode with correct type and parameters', () => {
      const result = nodes.if('Check', { conditions: {} });

      expect(result).toEqual({
        name: 'Check',
        type: 'n8n-nodes-base.if',
        parameters: { conditions: {} },
      });
    });

    it('set produces WorkflowNode with correct type and parameters', () => {
      const result = nodes.set('Assign', { mode: 'manual' });

      expect(result).toEqual({
        name: 'Assign',
        type: 'n8n-nodes-base.set',
        parameters: { mode: 'manual' },
      });
    });
  });

  describe('Slack nested resource.operation pattern', () => {
    it('slack.message.post produces correct WorkflowNode with auto-injected resource/operation', () => {
      const result = nodes.slack.message.post('Notify', {
        select: 'channel',
        channelId: '#general',
        text: 'Hello',
      });

      expect(result.name).toBe('Notify');
      expect(result.type).toBe('n8n-nodes-base.slack');
      expect(result.parameters).toMatchObject({
        resource: 'message',
        operation: 'post',
        text: 'Hello',
      });
    });

    it('slack.channel.create produces correct WorkflowNode with auto-injected resource/operation', () => {
      const result = nodes.slack.channel.create('NewChannel', {
        channelId: 'general',
        channelVisibility: 'public',
      });

      expect(result.name).toBe('NewChannel');
      expect(result.type).toBe('n8n-nodes-base.slack');
      expect(result.parameters).toMatchObject({
        resource: 'channel',
        operation: 'create',
        channelId: 'general',
        channelVisibility: 'public',
      });
    });
  });

  describe('Auto-injection verification', () => {
    it('user does NOT pass resource/operation — factory adds them', () => {
      const result = nodes.slack.message.post('Test', {
        select: 'channel',
        channelId: '#test',
        text: 'hi',
      });

      // User params should not contain resource/operation
      // But the result should have them auto-injected
      expect(result.parameters.resource).toBe('message');
      expect(result.parameters.operation).toBe('post');
      expect(result.parameters.text).toBe('hi');
    });
  });

  describe('WorkflowNode shape verification', () => {
    it('each result has name, type, and parameters properties', () => {
      const testCases = [
        nodes.webhook('W', { httpMethod: 'GET', path: '/test' }),
        nodes.httpRequest('H', { url: 'https://example.com' }),
        nodes.if('I', { conditions: {} }),
        nodes.set('S', { mode: 'manual' }),
        nodes.slack.message.post('M', { select: 'channel', channelId: '#c', text: 'x' }),
      ];

      for (const node of testCases) {
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('parameters');
        expect(typeof node.name).toBe('string');
        expect(typeof node.type).toBe('string');
        expect(typeof node.parameters).toBe('object');
      }
    });
  });

  describe('Integration with workflow builder', () => {
    it('typed nodes have compatible NodeRef shape for connect()', async () => {
      const { workflow } = await import('../../builder/workflow.js');
      const wf = workflow('Test Integration');

      // Create typed nodes
      const trigger = nodes.webhook('Webhook', { httpMethod: 'POST', path: '/hook' });
      const slack = nodes.slack.message.post('Notify', {
        select: 'channel',
        channelId: '#general',
        text: 'Hello',
      });

      // Add them via the builder using their type/parameters
      const triggerRef = wf.trigger(trigger.name, trigger.type, trigger.parameters);
      const slackRef = wf.node(slack.name, slack.type, slack.parameters);

      // Connect them
      wf.connect(triggerRef, slackRef);

      // Verify integration
      expect(wf.getNodes()).toHaveLength(2);
      expect(wf.getNodes()[0].type).toBe('n8n-nodes-base.webhook');
      expect(wf.getNodes()[1].type).toBe('n8n-nodes-base.slack');
      expect(wf.getNodes()[1].parameters.resource).toBe('message');
      expect(wf.getNodes()[1].parameters.operation).toBe('post');
      expect(wf.getConnections()).toHaveLength(1);
      expect(wf.getConnections()[0].from).toBe('Webhook');
      expect(wf.getConnections()[0].to).toBe('Notify');
    });
  });
});
