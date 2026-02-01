import { describe, it, expect } from 'vitest';
import { createTypedNodes } from '../typed-api.js';
import type { WorkflowNode } from '../../builder/types.js';

describe('Typed Node API', () => {
  const nodes = createTypedNodes();

  describe('Backward compatibility - original hand-written factories', () => {
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

  describe('Generated factories - new nodes', () => {
    it('gmail.message.send produces correct WorkflowNode', () => {
      const result = nodes.gmail.message.send('Send Email', {});

      expect(result.name).toBe('Send Email');
      expect(result.type).toBe('n8n-nodes-base.gmail');
      expect(result.parameters).toMatchObject({
        resource: 'message',
        operation: 'send',
      });
    });

    it('code produces correct WorkflowNode', () => {
      const result = nodes.code('Run Code', {});

      expect(result.name).toBe('Run Code');
      expect(result.type).toBe('n8n-nodes-base.code');
      expect(result.parameters).toBeDefined();
    });

    it('httpRequestTool produces correct WorkflowNode', () => {
      const result = nodes.httpRequestTool('Fetch Data', {});

      expect(result.name).toBe('Fetch Data');
      expect(result.type).toBe('n8n-nodes-base.httpRequestTool');
      expect(result.parameters).toBeDefined();
    });

    it('manualTrigger produces correct WorkflowNode', () => {
      const result = nodes.manualTrigger('Start', {});

      expect(result.name).toBe('Start');
      expect(result.type).toBe('n8n-nodes-base.manualTrigger');
      expect(result.parameters).toBeDefined();
    });
  });

  describe('Comprehensive validation - all 797 factories', () => {
    it('walks all factories and verifies they produce valid WorkflowNodes', () => {
      let factoryCount = 0;
      const errors: string[] = [];
      const seen = new Set<string>();

      function walkObject(obj: any, path: string[] = []): void {
        for (const key in obj) {
          const value = obj[key];
          const currentPath = [...path, key];
          const pathStr = currentPath.join('.');

          if (typeof value === 'function') {
            // Avoid counting duplicates (in case there are re-exports)
            if (seen.has(pathStr)) continue;
            seen.add(pathStr);

            factoryCount++;
            try {
              const node = value('Test', {});

              // Verify WorkflowNode shape
              if (!node.name || typeof node.name !== 'string') {
                errors.push(`${pathStr}: missing or invalid 'name' property`);
              }
              if (!node.type || typeof node.type !== 'string') {
                errors.push(`${pathStr}: missing or invalid 'type' property`);
              }
              if (!node.parameters || typeof node.parameters !== 'object') {
                errors.push(`${pathStr}: missing or invalid 'parameters' property`);
              }
            } catch (err) {
              errors.push(`${pathStr}: factory call failed - ${err}`);
            }
          } else if (typeof value === 'object' && value !== null) {
            // Recurse into nested objects
            walkObject(value, currentPath);
          }
        }
      }

      walkObject(nodes);

      // Report errors if any
      if (errors.length > 0) {
        console.error('Factory validation errors:');
        errors.forEach(err => console.error(`  - ${err}`));
      }

      expect(errors).toEqual([]);
      // Note: The actual count is higher because the generated structure includes
      // both simple factories and nested resource.operation factories
      expect(factoryCount).toBeGreaterThanOrEqual(797);
      console.log(`Total factory functions found: ${factoryCount}`);
    });

    it('verifies resource/operation injection for nodes with nested structure', () => {
      // Test a few samples to verify resource/operation auto-injection
      const samples = [
        { factory: nodes.slack.message.post, expected: { resource: 'message', operation: 'post' } },
        { factory: nodes.gmail.message.send, expected: { resource: 'message', operation: 'send' } },
        { factory: nodes.github.file.create, expected: { resource: 'file', operation: 'create' } },
      ];

      for (const { factory, expected } of samples) {
        const node = factory('Test', {});
        expect(node.parameters).toMatchObject(expected);
      }
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
        nodes.gmail.message.send('G', {}),
        nodes.code('C', {}),
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
