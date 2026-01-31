/**
 * Deploy result and options types for the n8n workflow deployer.
 */

/**
 * Result of deploying a workflow to n8n.
 */
export interface DeployResult {
  /** n8n workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Full URL to the workflow in n8n */
  url: string;
  /** HTTP status code from n8n API */
  status: number;
}

/**
 * Options for deploying a workflow to n8n.
 */
export interface DeployOptions {
  /** n8n API base URL (defaults to N8N_API_URL env var or http://localhost:5678) */
  apiUrl?: string;
  /** n8n API key (defaults to N8N_API_KEY env var) */
  apiKey?: string;
  /** Whether to activate the workflow after import (default: false) */
  activate?: boolean;
}
