/**
 * Typed node API factory
 * Provides nodes.slack.message.post(params) style calls with compile-time type checking.
 * Resource/operation discriminants are auto-injected by the factory.
 *
 * All param types are imported from generated/nodes.ts (produced by npm run generate).
 */

import type { WorkflowNode } from '../builder/types.js';
import type {
  Expression,
  ResourceLocator,
  HttpRequestNode,
  IfNode,
  SetNode,
  WebhookNode,
  SlackMessagePost,
  SlackMessageUpdate,
  SlackMessageDelete,
  SlackMessageSearch,
  SlackMessageGetpermalink,
  SlackChannelCreate,
  SlackChannelArchive,
  SlackChannelGet,
  SlackChannelGetall,
} from '../../generated/nodes.js';

// Re-export shared utility types for downstream consumers
export type { Expression, ResourceLocator };

// ---------------------------------------------------------------------------
// Param type aliases — strip resource/operation discriminants from Slack types
// ---------------------------------------------------------------------------

/** Parameters for the Webhook trigger node (all optional — n8n conditionally shows fields) */
export type WebhookParams = Partial<WebhookNode>;

/** Parameters for the HTTP Request node (all optional — n8n conditionally shows fields) */
export type HttpRequestParams = Partial<HttpRequestNode> & { url: string | Expression<string> };

/** Parameters for the IF node */
export type IfParams = Partial<IfNode>;

/** Parameters for the Set node */
export type SetParams = Partial<SetNode>;

/** Slack message.post parameters (resource/operation auto-injected by factory) */
export type SlackMessagePostParams = Partial<Omit<SlackMessagePost, 'resource' | 'operation'>>;

/** Slack message.update parameters */
export type SlackMessageUpdateParams = Partial<Omit<SlackMessageUpdate, 'resource' | 'operation'>>;

/** Slack message.delete parameters */
export type SlackMessageDeleteParams = Partial<Omit<SlackMessageDelete, 'resource' | 'operation'>>;

/** Slack message.search parameters */
export type SlackMessageSearchParams = Partial<Omit<SlackMessageSearch, 'resource' | 'operation'>>;

/** Slack message.getPermalink parameters */
export type SlackMessageGetPermalinkParams = Partial<Omit<SlackMessageGetpermalink, 'resource' | 'operation'>>;

/** Slack channel.create parameters */
export type SlackChannelCreateParams = Partial<Omit<SlackChannelCreate, 'resource' | 'operation'>>;

/** Slack channel.archive parameters */
export type SlackChannelArchiveParams = Partial<Omit<SlackChannelArchive, 'resource' | 'operation'>>;

/** Slack channel.get parameters */
export type SlackChannelGetParams = Partial<Omit<SlackChannelGet, 'resource' | 'operation'>>;

/** Slack channel.getAll parameters */
export type SlackChannelGetAllParams = Partial<Omit<SlackChannelGetall, 'resource' | 'operation'>>;

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
