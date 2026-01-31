/**
 * Workflow deployer - compiles and imports workflows into n8n via REST API.
 *
 * Pattern extracted from integration test importWorkflow() helper,
 * generalized with error handling, activation support, and env var fallbacks.
 */

import { compileWorkflow } from '../compiler/compiler.js';
import type { WorkflowBuilder } from '../builder/types.js';
import type { DeployResult, DeployOptions } from './types.js';

/**
 * Compile a WorkflowBuilder and deploy it to n8n via the REST API.
 *
 * @param builder - The workflow builder instance to compile and deploy
 * @param options - Optional deployment configuration (API URL, key, activation)
 * @returns DeployResult with workflow ID, name, URL, and status
 * @throws Error if API key is missing, n8n is unreachable, or n8n rejects the workflow
 */
export async function deployWorkflow(
  builder: WorkflowBuilder,
  options?: DeployOptions
): Promise<DeployResult> {
  const apiUrl = options?.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678';
  const apiKey = options?.apiKey || process.env.N8N_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      'N8N_API_KEY not configured. Set it in .env or pass via options.apiKey'
    );
  }

  // Compile workflow to n8n JSON
  const compiled = compileWorkflow(builder);

  // Strip read-only 'active' field — n8n public API rejects it
  const { active: _, ...payload } = compiled;

  // POST to n8n API to create the workflow
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      `n8n not reachable at ${apiUrl}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = (body.message as string) || JSON.stringify(body);
    throw new Error(`n8n rejected workflow: ${message} (status ${response.status})`);
  }

  const workflowId = body.id as string;

  // Activate workflow if requested
  if (options?.activate) {
    try {
      const activateResponse = await fetch(`${apiUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': apiKey,
        },
        body: JSON.stringify({ active: true }),
      });

      if (!activateResponse.ok) {
        const activateBody = (await activateResponse.json()) as Record<string, unknown>;
        const activateMsg = (activateBody.message as string) || JSON.stringify(activateBody);
        throw new Error(`Failed to activate workflow: ${activateMsg}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to activate')) {
        throw error;
      }
      throw new Error(
        `n8n not reachable at ${apiUrl} during activation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    id: workflowId,
    name: compiled.name,
    url: `${apiUrl}/workflow/${workflowId}`,
    status: response.status,
  };
}
