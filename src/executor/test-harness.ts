/**
 * Test harness for automated workflow testing.
 *
 * Provides testWorkflow() function that deploys, executes, asserts, and cleans up
 * workflows in a single call with scenario-based testing.
 */

import { deployWorkflow } from '../deployer/deploy.js';
import {
  triggerWebhook,
  deleteWorkflow,
  extractNodeData,
  pollExecution,
  getExecution,
} from './execute.js';
import type {
  TestScenario,
  TestResult,
  TestReport,
  TestFailure,
  ExecutionOptions,
  NodeExecutionData,
} from './types.js';
import type { WorkflowBuilder } from '../builder/types.js';

/**
 * Test a workflow with multiple scenarios.
 *
 * Deploys the workflow, executes each test scenario, asserts outcomes,
 * and always cleans up (deletes the workflow).
 *
 * @param builder - WorkflowBuilder to test
 * @param scenarios - Array of test scenarios
 * @param options - Execution options (API URL, key, timeouts)
 * @returns TestReport with aggregate results and per-scenario details
 */
export async function testWorkflow(
  builder: WorkflowBuilder,
  scenarios: TestScenario[],
  options?: ExecutionOptions & { webhookPath?: string }
): Promise<TestReport> {
  const startTime = Date.now();

  // Initialize report
  const report: TestReport = {
    workflowName: builder.name,
    passed: 0,
    failed: 0,
    total: scenarios.length,
    results: [],
    cleaned: false,
  };

  let workflowId: string | undefined;

  try {
    // Step 1: Deploy and activate workflow
    const deployResult = await deployWorkflow(builder, {
      apiUrl: options?.apiUrl,
      apiKey: options?.apiKey,
      activate: true,
    });

    workflowId = deployResult.id;
    report.workflowId = workflowId;

    // Wait for webhook registration (n8n needs time to load the workflow)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 2: Execute each scenario
    for (const scenario of scenarios) {
      const scenarioStartTime = Date.now();
      const result: TestResult = {
        scenario: scenario.name,
        passed: false,
        duration: 0,
        failures: [],
      };

      try {
        // Determine webhook path
        const webhookPath = options?.webhookPath || extractWebhookPath(builder);

        if (!webhookPath) {
          result.failures.push({
            type: 'execution_error',
            message: 'No webhook path configured. Set options.webhookPath or add Webhook trigger.',
          });
          result.duration = Date.now() - scenarioStartTime;
          report.results.push(result);
          report.failed++;
          continue;
        }

        // Trigger webhook
        await triggerWebhook(webhookPath, scenario.triggerData || {}, options);

        // Find the most recent execution for this workflow
        const apiUrl = options?.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678';
        const apiKey = options?.apiKey || process.env.N8N_API_KEY || '';

        // Get the latest execution
        const executionsResponse = await fetch(
          `${apiUrl}/api/v1/executions?workflowId=${workflowId}&limit=1`,
          {
            method: 'GET',
            headers: {
              'X-N8N-API-KEY': apiKey,
            },
          }
        );

        if (!executionsResponse.ok) {
          throw new Error(`Failed to fetch executions: ${executionsResponse.status}`);
        }

        const executionsData = (await executionsResponse.json()) as {
          data: Array<{ id: string }>;
        };

        if (!executionsData.data || executionsData.data.length === 0) {
          result.failures.push({
            type: 'execution_error',
            message: 'No execution found after webhook trigger',
          });
          result.duration = Date.now() - scenarioStartTime;
          report.results.push(result);
          report.failed++;
          continue;
        }

        const executionId = executionsData.data[0].id;
        result.executionId = executionId;

        // Poll until execution completes
        const execution = await pollExecution(executionId, options);

        // Extract node data for assertions
        const nodeData = extractNodeData(execution);
        result.actualOutput = nodeData;

        // Step 3: Assert expected outcomes

        // Assert status
        const expectedStatus = scenario.expectedStatus || 'success';
        if (execution.status !== expectedStatus) {
          result.failures.push({
            type: 'status',
            message: `Expected status '${expectedStatus}', got '${execution.status}'`,
            expected: expectedStatus,
            actual: execution.status,
          });
        }

        // Assert expected nodes executed
        if (scenario.expectedNodes) {
          for (const expectedNode of scenario.expectedNodes) {
            const nodeExists = nodeData.some((nd) => nd.nodeName === expectedNode);
            if (!nodeExists) {
              result.failures.push({
                type: 'missing_node',
                message: `Expected node '${expectedNode}' did not execute`,
                expected: expectedNode,
                actual: nodeData.map((nd) => nd.nodeName),
              });
            }
          }
        }

        // Assert expected output
        if (scenario.expectedOutput) {
          for (const outputExpectation of scenario.expectedOutput) {
            const node = nodeData.find((nd) => nd.nodeName === outputExpectation.nodeName);

            if (!node) {
              result.failures.push({
                type: 'missing_node',
                message: `Expected output from node '${outputExpectation.nodeName}', but node did not execute`,
                expected: outputExpectation.nodeName,
              });
              continue;
            }

            // Run assertions on node output
            for (const assertion of outputExpectation.assertions) {
              // Check each output item for the field
              let fieldFound = false;
              let actualValue: unknown;

              for (const item of node.data) {
                const value = getNestedField(item, assertion.field);
                if (value !== undefined) {
                  fieldFound = true;
                  actualValue = value;

                  // Deep compare using JSON.stringify for objects
                  const expectedStr = JSON.stringify(assertion.expected);
                  const actualStr = JSON.stringify(value);

                  if (expectedStr !== actualStr) {
                    result.failures.push({
                      type: 'output_mismatch',
                      message: `Node '${outputExpectation.nodeName}' field '${assertion.field}': expected ${expectedStr}, got ${actualStr}`,
                      expected: assertion.expected,
                      actual: value,
                    });
                  }
                  break; // Only check first item with this field
                }
              }

              if (!fieldFound) {
                result.failures.push({
                  type: 'output_mismatch',
                  message: `Node '${outputExpectation.nodeName}' missing field '${assertion.field}'`,
                  expected: assertion.expected,
                  actual: actualValue,
                });
              }
            }
          }
        }

        // Check for execution errors
        if (execution.error) {
          result.executionError = execution.error;
          result.failures.push({
            type: 'execution_error',
            message: `Execution error: ${execution.error.message}`,
            actual: execution.error,
          });
        }

        // Mark as passed if no failures
        result.passed = result.failures.length === 0;
        if (result.passed) {
          report.passed++;
        } else {
          report.failed++;
        }
      } catch (error) {
        // Catch timeout or other errors
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('timed out')) {
          result.failures.push({
            type: 'timeout',
            message: errorMessage,
          });
        } else {
          result.failures.push({
            type: 'execution_error',
            message: errorMessage,
          });
        }
        report.failed++;
      }

      result.duration = Date.now() - scenarioStartTime;
      report.results.push(result);
    }
  } catch (error) {
    // Deploy failure - all scenarios fail
    const errorMessage = error instanceof Error ? error.message : String(error);

    for (const scenario of scenarios) {
      report.results.push({
        scenario: scenario.name,
        passed: false,
        duration: 0,
        failures: [
          {
            type: 'execution_error',
            message: `Deployment failed: ${errorMessage}`,
          },
        ],
      });
    }
    report.failed = scenarios.length;
  } finally {
    // Step 4: Cleanup - always delete workflow
    if (workflowId) {
      try {
        await deleteWorkflow(workflowId, options);
        report.cleaned = true;
      } catch (error) {
        // Log cleanup failure but don't fail the test
        report.cleaned = false;
      }
    }
  }

  return report;
}

/**
 * Extract webhook path from workflow builder.
 *
 * Looks for a Webhook trigger node and extracts the path parameter.
 */
function extractWebhookPath(builder: WorkflowBuilder): string | null {
  const nodes = builder.getNodes();

  for (const node of nodes) {
    if (node.type === 'n8n-nodes-base.webhook') {
      const path = node.parameters.path as string | undefined;
      if (path) {
        return path;
      }
    }
  }

  return null;
}

/**
 * Get a nested field from an object using dot notation.
 *
 * @param obj - Object to query
 * @param path - Field path (e.g., 'user.id')
 * @returns Field value or undefined
 */
function getNestedField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
