/**
 * Typed node API factory
 * Provides nodes.slack.message.post(params) style calls with compile-time type checking.
 * Resource/operation discriminants are auto-injected by the factory.
 *
 * Types are defined inline to mirror generated/nodes.ts without pulling the
 * generated file into compilation (it has intentional duplicate properties
 * from n8n's conditional displayOptions schema).
 */

import type { WorkflowNode } from '../builder/types.js';

// ---------------------------------------------------------------------------
// Shared utility types (mirrors generated Expression/ResourceLocator)
// ---------------------------------------------------------------------------

/** Expression wrapper for dynamic n8n expression values */
export interface Expression<T> {
  __expression: string;
  __type?: T;
}

/** Resource locator for n8n resource selection fields */
export interface ResourceLocator {
  __rl: true;
  mode: 'list' | 'id' | 'name' | 'url';
  value: string;
  cachedResultName?: string;
  cachedResultUrl?: string;
}

// ---------------------------------------------------------------------------
// Simple node param types (webhook, httpRequest, if, set)
// ---------------------------------------------------------------------------

/** Parameters for the Webhook trigger node */
export interface WebhookParams {
  httpMethod?: 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT';
  path?: string | Expression<string>;
  authentication?: 'basicAuth' | 'headerAuth' | 'jwtAuth' | 'none';
  responseMode?: 'onReceived' | 'lastNode' | 'responseNode';
  responseCode?: number | Expression<number>;
  responseData?: 'allEntries' | 'firstEntryJson' | 'firstEntryBinary' | 'noData';
  options?: Record<string, unknown>;
}

/** Parameters for the HTTP Request node */
export interface HttpRequestParams {
  method?: 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';
  url: string | Expression<string>;
  authentication?: 'none' | 'predefinedCredentialType' | 'genericCredentialType';
  sendQuery?: boolean;
  sendHeaders?: boolean;
  sendBody?: boolean;
  contentType?: 'form-urlencoded' | 'multipart-form-data' | 'json' | 'binaryData' | 'raw';
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Parameters for the IF node */
export interface IfParams {
  conditions?: unknown;
  looseTypeValidation?: boolean | Expression<boolean>;
  options?: { ignoreCase?: boolean | Expression<boolean>; looseTypeValidation?: boolean | Expression<boolean> };
}

/** Parameters for the Set node */
export interface SetParams {
  mode?: 'manual' | 'raw';
  duplicateItem?: boolean | Expression<boolean>;
  duplicateCount?: number | Expression<number>;
  fields?: { values?: { name?: string | Expression<string>; type?: 'stringValue' | 'numberValue' | 'booleanValue' | 'arrayValue' | 'objectValue'; stringValue?: string | Expression<string>; numberValue?: string | Expression<string>; booleanValue?: 'true' | 'false' }[] };
  include?: 'all' | 'none' | 'selected' | 'except';
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Slack param types (resource/operation stripped — factory injects them)
// ---------------------------------------------------------------------------

/** Slack message.post parameters */
export interface SlackMessagePostParams {
  authentication?: 'accessToken' | 'oAuth2';
  select: 'channel' | 'user';
  channelId: ResourceLocator | string;
  user?: ResourceLocator | string;
  messageType?: 'text' | 'block' | 'attachment';
  text?: string | Expression<string>;
  otherOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Slack message.update parameters */
export interface SlackMessageUpdateParams {
  authentication?: 'accessToken' | 'oAuth2';
  channelId: ResourceLocator | string;
  ts: number | Expression<number>;
  text?: string | Expression<string>;
  updateFields?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Slack message.delete parameters */
export interface SlackMessageDeleteParams {
  authentication?: 'accessToken' | 'oAuth2';
  select: 'channel' | 'user';
  channelId: ResourceLocator | string;
  user?: ResourceLocator | string;
  timestamp: number | Expression<number>;
}

/** Slack message.search parameters */
export interface SlackMessageSearchParams {
  authentication?: 'accessToken' | 'oAuth2';
  query: string | Expression<string>;
  sort?: 'desc' | 'asc' | 'relevance';
  returnAll?: boolean | Expression<boolean>;
  limit?: number | Expression<number>;
  options?: { searchChannel?: string[] };
}

/** Slack message.getPermalink parameters */
export interface SlackMessageGetPermalinkParams {
  authentication?: 'accessToken' | 'oAuth2';
  channelId?: ResourceLocator | string;
  timestamp: number | Expression<number>;
}

/** Slack channel.create parameters */
export interface SlackChannelCreateParams {
  authentication?: 'accessToken' | 'oAuth2';
  channelId: string | Expression<string>;
  channelVisibility: 'public' | 'private';
}

/** Slack channel.archive parameters */
export interface SlackChannelArchiveParams {
  authentication?: 'accessToken' | 'oAuth2';
  channelId?: ResourceLocator | string;
}

/** Slack channel.get parameters */
export interface SlackChannelGetParams {
  authentication?: 'accessToken' | 'oAuth2';
  channelId: ResourceLocator | string;
  options?: { includeNumMembers?: boolean | Expression<boolean> };
}

/** Slack channel.getAll parameters */
export interface SlackChannelGetAllParams {
  authentication?: 'accessToken' | 'oAuth2';
  returnAll?: boolean | Expression<boolean>;
  limit?: number | Expression<number>;
  filters?: { excludeArchived?: boolean | Expression<boolean>; types?: Array<'public_channel' | 'private_channel' | 'mpim' | 'im'> };
}

// ---------------------------------------------------------------------------
// TypedNodes interface hierarchy
// ---------------------------------------------------------------------------

/** Typed nodes interface — provides compile-time checked node creation */
export interface TypedNodes {
  webhook: (name: string, params: WebhookParams) => WorkflowNode;
  httpRequest: (name: string, params: HttpRequestParams) => WorkflowNode;
  if: (name: string, params: IfParams) => WorkflowNode;
  set: (name: string, params: SetParams) => WorkflowNode;
  slack: {
    message: {
      post: (name: string, params: SlackMessagePostParams) => WorkflowNode;
      update: (name: string, params: SlackMessageUpdateParams) => WorkflowNode;
      delete: (name: string, params: SlackMessageDeleteParams) => WorkflowNode;
      search: (name: string, params: SlackMessageSearchParams) => WorkflowNode;
      getPermalink: (name: string, params: SlackMessageGetPermalinkParams) => WorkflowNode;
    };
    channel: {
      create: (name: string, params: SlackChannelCreateParams) => WorkflowNode;
      archive: (name: string, params: SlackChannelArchiveParams) => WorkflowNode;
      get: (name: string, params: SlackChannelGetParams) => WorkflowNode;
      getAll: (name: string, params: SlackChannelGetAllParams) => WorkflowNode;
    };
  };
}

// ---------------------------------------------------------------------------
// Factory implementation
// ---------------------------------------------------------------------------

function makeNode(type: string, name: string, params: Record<string, unknown>): WorkflowNode {
  return { name, type, parameters: params };
}

function makeSlackNode(
  name: string,
  resource: string,
  operation: string,
  params: Record<string, unknown>
): WorkflowNode {
  return makeNode('n8n-nodes-base.slack', name, {
    ...params,
    resource,
    operation,
  });
}

/**
 * Creates a typed nodes API factory.
 *
 * Usage:
 * ```typescript
 * const nodes = createTypedNodes();
 *
 * // Simple nodes
 * const webhook = nodes.webhook('My Webhook', { path: '/hook', httpMethod: 'POST' });
 *
 * // Slack with nested resource.operation — resource/operation auto-injected
 * const slack = nodes.slack.message.post('Post Message', {
 *   select: 'channel',
 *   channelId: '#general',
 *   text: 'Hello from typed API!',
 * });
 * // slack.parameters.resource === 'message'
 * // slack.parameters.operation === 'post'
 * ```
 */
export function createTypedNodes(): TypedNodes {
  return {
    webhook: (name, params) =>
      makeNode('n8n-nodes-base.webhook', name, params as unknown as Record<string, unknown>),

    httpRequest: (name, params) =>
      makeNode('n8n-nodes-base.httpRequest', name, params as unknown as Record<string, unknown>),

    if: (name, params) =>
      makeNode('n8n-nodes-base.if', name, params as unknown as Record<string, unknown>),

    set: (name, params) =>
      makeNode('n8n-nodes-base.set', name, params as unknown as Record<string, unknown>),

    slack: {
      message: {
        post: (name, params) =>
          makeSlackNode(name, 'message', 'post', params as unknown as Record<string, unknown>),
        update: (name, params) =>
          makeSlackNode(name, 'message', 'update', params as unknown as Record<string, unknown>),
        delete: (name, params) =>
          makeSlackNode(name, 'message', 'delete', params as unknown as Record<string, unknown>),
        search: (name, params) =>
          makeSlackNode(name, 'message', 'search', params as unknown as Record<string, unknown>),
        getPermalink: (name, params) =>
          makeSlackNode(name, 'message', 'getPermalink', params as unknown as Record<string, unknown>),
      },
      channel: {
        create: (name, params) =>
          makeSlackNode(name, 'channel', 'create', params as unknown as Record<string, unknown>),
        archive: (name, params) =>
          makeSlackNode(name, 'channel', 'archive', params as unknown as Record<string, unknown>),
        get: (name, params) =>
          makeSlackNode(name, 'channel', 'get', params as unknown as Record<string, unknown>),
        getAll: (name, params) =>
          makeSlackNode(name, 'channel', 'getAll', params as unknown as Record<string, unknown>),
      },
    },
  };
}
