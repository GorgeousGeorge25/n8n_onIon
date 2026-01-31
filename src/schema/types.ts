/**
 * TypeScript types modeling the n8n node type schema structure
 * These match the REST API response format from n8n
 */

// Core property types in n8n
export type N8nPropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'multiOptions'
  | 'collection'
  | 'fixedCollection'
  | 'resourceLocator'
  | 'color'
  | 'json'
  | 'notice'
  | 'hidden'
  | 'filter'
  | 'resourceMapper'
  | 'assignmentCollection';

export interface N8nOption {
  name: string;
  value: string | number | boolean;
  description?: string;
}

export interface N8nDisplayOptions {
  show?: Record<string, Array<string | number | boolean>>;
  hide?: Record<string, Array<string | number | boolean>>;
}

export interface N8nProperty {
  displayName: string;
  name: string;
  type: N8nPropertyType;
  default?: unknown;
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: N8nOption[] | N8nProperty[];  // options for 'options' type, sub-properties for collections
  displayOptions?: N8nDisplayOptions;
  typeOptions?: Record<string, unknown>;
  noDataExpression?: boolean;
  // For fixedCollection
  values?: N8nProperty[];
}

export interface N8nCredential {
  name: string;
  required?: boolean;
  displayOptions?: N8nDisplayOptions;
}

export interface N8nNodeType {
  name: string;           // e.g. "n8n-nodes-base.slack"
  displayName: string;
  version: number | number[];
  defaultVersion?: number;  // Preferred version to use when creating new nodes
  description: string;
  defaults: Record<string, unknown>;
  properties: N8nProperty[];
  credentials?: N8nCredential[];
  group?: string[];
}

// API response wrapper
export interface N8nNodeTypesResponse {
  data: N8nNodeType[];
}
