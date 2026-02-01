/**
 * Workflow execution functions for n8n via public API v1.
 *
 * Key limitations discovered from live n8n instance (v2.2.4):
 * - Manual Trigger workflows CANNOT be executed via public API v1.
 *   POST /api/v1/workflows/{id}/execute and POST /api/v1/executions both
 *   return 405. This is an n8n limitation, not an SDK bug. The internal API
 *   (/rest/workflows/{id}/run) requires cookie auth and is not stable.
 *   All automated testing MUST use Webhook trigger nodes instead.
 * - Webhook triggers work after activation + ~2s registration delay
 * - Execution polling works via GET /api/v1/executions/{id}?includeData=true
 *   (without ?includeData=true, node output data is omitted from response)
 * - Workflow deletion works via DELETE /api/v1/workflows/{id}
 */

import type {
  ExecutionResult,
  ExecutionOptions,
  ExecutionData,
  NodeExecutionData,
} from './types.js';

/**
 * Get execution details by ID.
 *
 * @param executionId - The n8n execution ID
 * @param options - API configuration options
 * @returns Parsed execution result with node data
 * @throws Error if API key is missing or n8n returns an error
 */
export async function getExecution(
  executionId: string,
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  const apiUrl = options?.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678';
  const apiKey = options?.apiKey || process.env.N8N_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      'N8N_API_KEY not configured. Set it in .env or pass via options.apiKey'
    );
  }

  // Request execution data with full node outputs
  const response = await fetch(`${apiUrl}/api/v1/executions/${executionId}?includeData=true`, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': apiKey,
    },
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = (body.message as string) || JSON.stringify(body);
    throw new Error(`Failed to get execution ${executionId}: ${message} (status ${response.status})`);
  }

  // Parse n8n API response into ExecutionResult
  return {
    id: body.id as string,
    status: body.status as ExecutionResult['status'],
    finished: body.finished as boolean,
    mode: body.mode as ExecutionResult['mode'],
    workflowId: body.workflowId as string,
    startedAt: body.startedAt as string,
    stoppedAt: (body.stoppedAt as string) || null,
    data: body.data as ExecutionData | undefined,
    error: body.data
      ? ((body.data as ExecutionData).resultData?.error)
      : undefined,
  };
}

/**
 * Poll an execution until it completes or times out.
 *
 * @param executionId - The n8n execution ID to poll
 * @param options - Polling and API configuration options
 * @returns Final execution result
 * @throws Error if execution times out or API returns an error
 */
export async function pollExecution(
  executionId: string,
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  const pollIntervalMs = options?.pollIntervalMs || 500;
  const timeoutMs = options?.timeoutMs || 30000;
  const startTime = Date.now();

  while (true) {
    const result = await getExecution(executionId, options);

    // Check if execution is finished
    if (result.finished) {
      return result;
    }

    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `Execution ${executionId} timed out after ${timeoutMs}ms (status: ${result.status})`
      );
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

/**
 * Trigger a webhook workflow and get the response.
 *
 * Note: This only works if the workflow is active and has a Webhook trigger.
 * The webhook must be registered (workflow activated + n8n loaded the workflow).
 *
 * @param path - Webhook path (as configured in the Webhook node)
 * @param payload - JSON payload to send
 * @param options - API configuration options
 * @returns Response data from the webhook
 * @throws Error if webhook is not registered or returns an error
 */
export async function triggerWebhook(
  path: string,
  payload: Record<string, unknown>,
  options?: ExecutionOptions
): Promise<unknown> {
  const apiUrl = options?.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678';

  // Use production webhook endpoint (requires active workflow)
  const response = await fetch(`${apiUrl}/webhook/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorText;
    } catch {
      errorMessage = errorText;
    }

    throw new Error(`Webhook ${path} failed: ${errorMessage} (status ${response.status})`);
  }

  // Parse response (might be JSON or text)
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
}

/**
 * Delete a workflow by ID (for cleanup).
 *
 * @param workflowId - The n8n workflow ID
 * @param options - API configuration options
 * @throws Error if API key is missing or deletion fails
 */
export async function deleteWorkflow(
  workflowId: string,
  options?: ExecutionOptions
): Promise<void> {
  const apiUrl = options?.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678';
  const apiKey = options?.apiKey || process.env.N8N_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      'N8N_API_KEY not configured. Set it in .env or pass via options.apiKey'
    );
  }

  const response = await fetch(`${apiUrl}/api/v1/workflows/${workflowId}`, {
    method: 'DELETE',
    headers: {
      'X-N8N-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    const body = (await response.json()) as Record<string, unknown>;
    const message = (body.message as string) || JSON.stringify(body);
    throw new Error(`Failed to delete workflow ${workflowId}: ${message} (status ${response.status})`);
  }
}

/**
 * Extract simplified node execution data from full execution result.
 *
 * Useful for test assertions - flattens the complex n8n execution data
 * structure into a simple array of { nodeName, data[] } objects.
 *
 * @param execution - Full execution result from getExecution()
 * @returns Array of node execution data
 */
export function extractNodeData(execution: ExecutionResult): NodeExecutionData[] {
  if (!execution.data?.resultData?.runData) {
    return [];
  }

  const nodeData: NodeExecutionData[] = [];

  for (const [nodeName, runs] of Object.entries(execution.data.resultData.runData)) {
    // Flatten all output items from all runs of this node
    const allItems: Array<Record<string, unknown>> = [];

    for (const run of runs) {
      if (run.data?.main) {
        for (const branch of run.data.main) {
          for (const item of branch) {
            allItems.push(item.json);
          }
        }
      }
    }

    nodeData.push({
      nodeName,
      data: allItems,
    });
  }

  return nodeData;
}
