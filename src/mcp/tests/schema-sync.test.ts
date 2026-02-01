/**
 * Tests for MCP schema sync — transform layer and sync logic
 */

import { describe, it, expect } from 'vitest';
import { transformMcpNodeResponse } from '../schema-sync.js';

describe('MCP Schema Sync', () => {
  describe('transformMcpNodeResponse', () => {
    it('should transform a full MCP response to N8nNodeType', () => {
      const mcpResponse = {
        name: 'n8n-nodes-base.slack',
        displayName: 'Slack',
        version: [1, 2],
        defaultVersion: 2,
        description: 'Send messages to Slack',
        defaults: { name: 'Slack' },
        properties: [
          {
            displayName: 'Resource',
            name: 'resource',
            type: 'options',
            options: [{ name: 'Message', value: 'message' }],
            default: 'message',
          },
        ],
        credentials: [
          { name: 'slackApi', required: true },
        ],
        group: ['output'],
      };

      const result = transformMcpNodeResponse(mcpResponse);

      expect(result.name).toBe('n8n-nodes-base.slack');
      expect(result.displayName).toBe('Slack');
      expect(result.version).toEqual([1, 2]);
      expect(result.defaultVersion).toBe(2);
      expect(result.description).toBe('Send messages to Slack');
      expect(result.defaults).toEqual({ name: 'Slack' });
      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].name).toBe('resource');
      expect(result.credentials).toHaveLength(1);
      expect(result.credentials![0].name).toBe('slackApi');
      expect(result.group).toEqual(['output']);
    });

    it('should handle minimal response with missing optional fields', () => {
      const mcpResponse = {
        name: 'n8n-nodes-base.manualTrigger',
        displayName: 'Manual Trigger',
        version: 1,
        description: 'Starts the workflow on manual trigger',
        defaults: {},
        properties: [],
      };

      const result = transformMcpNodeResponse(mcpResponse);

      expect(result.name).toBe('n8n-nodes-base.manualTrigger');
      expect(result.version).toBe(1);
      expect(result.defaultVersion).toBeUndefined();
      expect(result.credentials).toBeUndefined();
      expect(result.group).toBeUndefined();
      expect(result.properties).toEqual([]);
    });

    it('should handle response with null defaults', () => {
      const mcpResponse = {
        name: 'n8n-nodes-base.code',
        displayName: 'Code',
        version: 2,
        description: 'Run JavaScript or Python',
        defaults: null,
        properties: [],
      };

      const result = transformMcpNodeResponse(mcpResponse as any);

      expect(result.defaults).toEqual({});
    });
  });
});
