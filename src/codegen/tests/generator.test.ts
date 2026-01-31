import { describe, it, expect } from 'vitest';
import { generateNodeType, generateNodeTypes } from '../generator.js';
import type { N8nNodeType, N8nProperty } from '../../schema/types.js';

describe('Type Generator', () => {
  describe('TYGEN-01: Full node generation', () => {
    it('generates union type for node with resource/operation pattern', () => {
      const slackSchema: N8nNodeType = {
        name: 'n8n-nodes-base.slack',
        displayName: 'Slack',
        version: 1,
        description: 'Interact with Slack',
        defaults: { name: 'Slack' },
        properties: [
          {
            displayName: 'Resource',
            name: 'resource',
            type: 'options',
            default: 'message',
            options: [
              { name: 'Message', value: 'message' },
              { name: 'Channel', value: 'channel' }
            ]
          },
          {
            displayName: 'Operation',
            name: 'operation',
            type: 'options',
            default: 'post',
            displayOptions: { show: { resource: ['message'] } },
            options: [
              { name: 'Post', value: 'post' },
              { name: 'Reply', value: 'reply' }
            ]
          },
          {
            displayName: 'Text',
            name: 'text',
            type: 'string',
            default: '',
            displayOptions: { show: { resource: ['message'], operation: ['post'] } }
          }
        ]
      };

      const result = generateNodeType(slackSchema);

      // Should contain discriminated union types
      expect(result).toContain('interface SlackMessagePost');
      expect(result).toContain('interface SlackMessageReply');
      expect(result).toContain('export type SlackNode = SlackMessagePost | SlackMessageReply');

      // Should have discriminant fields with literal types
      expect(result).toContain("resource: 'message'");
      expect(result).toContain("operation: 'post'");

      // Properties should appear in correct interface
      expect(result).toContain('text?:'); // in SlackMessagePost
    });
  });

  describe('TYGEN-02: Discriminated unions from displayOptions', () => {
    it('creates separate interfaces per resource+operation combo', () => {
      const properties: N8nProperty[] = [
        {
          displayName: 'Resource',
          name: 'resource',
          type: 'options',
          default: 'message',
          options: [
            { name: 'Message', value: 'message' },
            { name: 'Channel', value: 'channel' }
          ]
        },
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          default: 'post',
          displayOptions: { show: { resource: ['message'] } },
          options: [{ name: 'Post', value: 'post' }]
        },
        {
          displayName: 'Channel Operation',
          name: 'operation',
          type: 'options',
          default: 'create',
          displayOptions: { show: { resource: ['channel'] } },
          options: [{ name: 'Create', value: 'create' }]
        },
        {
          displayName: 'Text',
          name: 'text',
          type: 'string',
          default: '',
          displayOptions: { show: { resource: ['message'], operation: ['post'] } }
        },
        {
          displayName: 'Channel Name',
          name: 'channelName',
          type: 'string',
          default: '',
          displayOptions: { show: { resource: ['channel'], operation: ['create'] } }
        }
      ];

      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties
      };

      const result = generateNodeType(schema);

      // Should have separate interfaces
      expect(result).toContain('interface TestMessagePost');
      expect(result).toContain('interface TestChannelCreate');

      // text should only be in MessagePost
      expect(result).toMatch(/interface TestMessagePost[^}]*text\?:/);
      expect(result).not.toMatch(/interface TestChannelCreate[^}]*text\?:/);

      // channelName should only be in ChannelCreate
      expect(result).toMatch(/interface TestChannelCreate[^}]*channelName\?:/);
      expect(result).not.toMatch(/interface TestMessagePost[^}]*channelName\?:/);
    });

    it('handles properties without displayOptions as common fields', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Auth',
            name: 'authentication',
            type: 'options',
            default: 'oauth2',
            options: [{ name: 'OAuth2', value: 'oauth2' }]
          },
          {
            displayName: 'Resource',
            name: 'resource',
            type: 'options',
            default: 'user',
            options: [{ name: 'User', value: 'user' }]
          }
        ]
      };

      const result = generateNodeType(schema);

      // authentication should appear in all interfaces (no displayOptions)
      expect(result).toContain('authentication?:');
    });
  });

  describe('TYGEN-03: String literal unions from options', () => {
    it('converts options array to TypeScript literal union', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Format',
            name: 'format',
            type: 'options',
            default: 'text',
            options: [
              { name: 'Text', value: 'text' },
              { name: 'Block', value: 'block' }
            ]
          }
        ]
      };

      const result = generateNodeType(schema);

      // Should have literal union, not string
      expect(result).toContain("format?: 'text' | 'block'");
      expect(result).not.toContain('format?: string');
    });

    it('handles numeric option values', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Priority',
            name: 'priority',
            type: 'options',
            default: 1,
            options: [
              { name: 'Low', value: 1 },
              { name: 'High', value: 2 }
            ]
          }
        ]
      };

      const result = generateNodeType(schema);

      expect(result).toContain('priority?: 1 | 2');
    });
  });

  describe('TYGEN-04: ResourceLocator support', () => {
    it('generates ResourceLocator union type for resourceLocator fields', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Channel',
            name: 'channel',
            type: 'resourceLocator',
            default: { mode: 'list', value: '' }
          }
        ]
      };

      const result = generateNodeType(schema);

      // Should accept both ResourceLocator object and string
      expect(result).toContain('channel?: ResourceLocator | string');
    });
  });

  describe('TYGEN-05: Collection typing', () => {
    it('generates typed object for collection fields', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Options',
            name: 'options',
            type: 'collection',
            default: {},
            options: [
              {
                displayName: 'Thread TS',
                name: 'threadTs',
                type: 'string',
                default: ''
              },
              {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: ''
              }
            ] as N8nProperty[]
          }
        ]
      };

      const result = generateNodeType(schema);

      // Should generate nested type with optional fields
      expect(result).toMatch(/options\?\s*:\s*\{[^}]*threadTs\?\s*:\s*string[^}]*username\?\s*:\s*string[^}]*\}/);
    });

    it('generates typed object for fixedCollection fields', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Attachments',
            name: 'attachments',
            type: 'fixedCollection',
            default: {},
            options: [
              {
                displayName: 'Attachment',
                name: 'attachment',
                type: 'collection',
                default: {},
                values: [
                  {
                    displayName: 'Title',
                    name: 'title',
                    type: 'string',
                    default: ''
                  },
                  {
                    displayName: 'Color',
                    name: 'color',
                    type: 'string',
                    default: ''
                  }
                ]
              }
            ] as N8nProperty[]
          }
        ]
      };

      const result = generateNodeType(schema);

      // Should have attachment group with typed fields
      expect(result).toMatch(/attachments\?\s*:\s*\{[^}]*attachment\?\s*:\s*\{[^}]*title\?\s*:\s*string[^}]*color\?\s*:\s*string/);
    });
  });

  describe('Expression type wrapping', () => {
    it('wraps expression-capable fields with Expression union', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Text',
            name: 'text',
            type: 'string',
            default: ''
          },
          {
            displayName: 'Count',
            name: 'count',
            type: 'number',
            default: 0
          }
        ]
      };

      const result = generateNodeType(schema);

      // Should wrap with Expression<T>
      expect(result).toContain('text?: string | Expression<string>');
      expect(result).toContain('count?: number | Expression<number>');
    });

    it('does not wrap fields with noDataExpression', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            default: '',
            noDataExpression: true
          }
        ]
      };

      const result = generateNodeType(schema);

      // Should be plain string, not Expression
      expect(result).toContain('apiKey?: string');
      expect(result).not.toContain('apiKey?: string | Expression');
    });
  });

  describe('Required fields', () => {
    it('makes required fields non-optional', () => {
      const schema: N8nNodeType = {
        name: 'n8n-nodes-base.test',
        displayName: 'Test',
        version: 1,
        description: 'Test',
        defaults: {},
        properties: [
          {
            displayName: 'Required Field',
            name: 'requiredField',
            type: 'string',
            default: '',
            required: true
          },
          {
            displayName: 'Optional Field',
            name: 'optionalField',
            type: 'string',
            default: ''
          }
        ]
      };

      const result = generateNodeType(schema);

      // Required field without ?
      expect(result).toMatch(/requiredField:\s*string/);
      expect(result).not.toMatch(/requiredField\?:/);

      // Optional field with ?
      expect(result).toMatch(/optionalField\?:/);
    });
  });

  describe('generateNodeTypes (multiple nodes)', () => {
    it('generates shared types and all node types', () => {
      const schemas: N8nNodeType[] = [
        {
          name: 'n8n-nodes-base.slack',
          displayName: 'Slack',
          version: 1,
          description: 'Slack',
          defaults: {},
          properties: [
            {
              displayName: 'Text',
              name: 'text',
              type: 'string',
              default: ''
            }
          ]
        },
        {
          name: 'n8n-nodes-base.http',
          displayName: 'HTTP',
          version: 1,
          description: 'HTTP',
          defaults: {},
          properties: [
            {
              displayName: 'URL',
              name: 'url',
              type: 'string',
              default: ''
            }
          ]
        }
      ];

      const result = generateNodeTypes(schemas);

      // Should have shared types
      expect(result).toContain('interface Expression<T>');
      expect(result).toContain('interface ResourceLocator');

      // Should have both node types
      expect(result).toContain('export type SlackNode');
      expect(result).toContain('export type HttpNode');
    });
  });
});
