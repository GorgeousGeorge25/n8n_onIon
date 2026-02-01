/**
 * Executor types for n8n workflow execution and polling.
 *
 * Based on n8n public API v1 actual response shapes (verified 2026-02-01).
 */

/**
 * Execution status values from n8n API.
 * Maps to the 'status' field in execution responses.
 */
export type ExecutionStatus =
  | 'new'
  | 'running'
  | 'success'
  | 'error'
  | 'waiting'
  | 'canceled';

/**
 * Execution mode (how the workflow was triggered).
 */
export type ExecutionMode =
  | 'manual' // Triggered via UI
  | 'trigger' // Triggered by a trigger node (webhook, schedule, etc.)
  | 'integrated' // Sub-workflow execution
  | 'cli' // Triggered via CLI
  | 'error' // Retry execution
  | 'webhook'; // Explicitly via webhook

/**
 * Parsed execution result with node output data.
 *
 * Returned by getExecution() and executeWorkflow().
 */
export interface ExecutionResult {
  /** Execution ID */
  id: string;

  /** Final execution status */
  status: ExecutionStatus;

  /** Whether execution has completed (success, error, or canceled) */
  finished: boolean;

  /** How the workflow was triggered */
  mode: ExecutionMode;

  /** Workflow ID that was executed */
  workflowId: string;

  /** Execution start time (ISO timestamp) */
  startedAt: string;

  /** Execution stop time (ISO timestamp, null if still running) */
  stoppedAt: string | null;

  /** Per-node output data (only available when includeData=true) */
  data?: ExecutionData;

  /** Error details if execution failed */
  error?: ExecutionError;
}

/**
 * Full execution data structure from n8n API.
 * Contains per-node run data and metadata.
 */
export interface ExecutionData {
  /** n8n execution data format version */
  version: number;

  /** Workflow start data (trigger input) */
  startData: Record<string, unknown>;

  /** Per-node execution results */
  resultData: {
    /** Map of node name to array of execution runs */
    runData: Record<string, NodeRunData[]>;

    /** Last node executed */
    lastNodeExecuted?: string;

    /** Error information if execution failed */
    error?: ExecutionError;
  };
}

/**
 * Single node execution run data.
 */
export interface NodeRunData {
  /** Execution start time (epoch milliseconds) */
  startTime: number;

  /** Execution index (for multiple runs of same node) */
  executionIndex: number;

  /** Source nodes that triggered this execution */
  source: Array<{ previousNode: string }>;

  /** Execution hints (warnings, etc.) */
  hints: unknown[];

  /** Execution time in milliseconds */
  executionTime: number;

  /** Execution status for this node */
  executionStatus: 'success' | 'error';

  /** Output data from this node */
  data?: {
    /** Main output data (array of output branches, each containing items) */
    main?: Array<Array<{ json: Record<string, unknown>; pairedItem?: unknown }>>;
  };

  /** Error details if node failed */
  error?: ExecutionError;

  /** Metadata about this execution */
  metadata?: Record<string, unknown>;
}

/**
 * Execution error details.
 */
export interface ExecutionError {
  /** Error message */
  message: string;

  /** Node name where error occurred */
  node?: string;

  /** Stack trace */
  stack?: string;

  /** Error cause */
  cause?: unknown;
}

/**
 * Options for execution and polling operations.
 */
export interface ExecutionOptions {
  /** n8n API base URL (defaults to N8N_API_URL env var or http://localhost:5678) */
  apiUrl?: string;

  /** n8n API key (defaults to N8N_API_KEY env var) */
  apiKey?: string;

  /** Polling interval in milliseconds (default: 500ms) */
  pollIntervalMs?: number;

  /** Maximum wait time in milliseconds (default: 30000ms = 30s) */
  timeoutMs?: number;
}

/**
 * Simplified node execution data for test assertions.
 *
 * Extracted from the full ExecutionData structure for easier testing.
 */
export interface NodeExecutionData {
  /** Node name */
  nodeName: string;

  /** Output items from this node (flattened from all runs) */
  data: Array<Record<string, unknown>>;
}

/**
 * Test scenario definition for workflow testing.
 *
 * Defines input data and expected outcomes for a single test case.
 */
export interface TestScenario {
  /** Scenario name (for reporting) */
  name: string;

  /** Input data to send to the webhook trigger */
  triggerData?: Record<string, unknown>;

  /** Expected final execution status (default: 'success') */
  expectedStatus?: ExecutionStatus;

  /** Expected nodes that should execute */
  expectedNodes?: string[];

  /** Expected output data from specific nodes */
  expectedOutput?: {
    /** Node name to check */
    nodeName: string;
    /** Assertions to run on node output */
    assertions: OutputAssertion[];
  }[];
}

/**
 * Output assertion for a single field.
 */
export interface OutputAssertion {
  /** Field path to check (e.g., 'message', 'user.id') */
  field: string;

  /** Expected value */
  expected: unknown;
}

/**
 * Result of a single test scenario execution.
 */
export interface TestResult {
  /** Scenario name */
  scenario: string;

  /** Whether scenario passed all assertions */
  passed: boolean;

  /** n8n execution ID (if execution occurred) */
  executionId?: string;

  /** Test duration in milliseconds */
  duration: number;

  /** List of assertion failures */
  failures: TestFailure[];

  /** Actual output data from nodes (for debugging) */
  actualOutput?: NodeExecutionData[];

  /** Execution error details (if execution failed) */
  executionError?: ExecutionError;
}

/**
 * Test failure details.
 */
export interface TestFailure {
  /** Failure category */
  type: 'status' | 'missing_node' | 'output_mismatch' | 'execution_error' | 'timeout';

  /** Human-readable failure message */
  message: string;

  /** Expected value (for comparison failures) */
  expected?: unknown;

  /** Actual value (for comparison failures) */
  actual?: unknown;
}

/**
 * Aggregate test report for a workflow.
 */
export interface TestReport {
  /** Workflow name */
  workflowName: string;

  /** Deployed workflow ID (if deployment succeeded) */
  workflowId?: string;

  /** Number of scenarios that passed */
  passed: number;

  /** Number of scenarios that failed */
  failed: number;

  /** Total number of scenarios */
  total: number;

  /** Results for each scenario */
  results: TestResult[];

  /** Whether cleanup (workflow deletion) succeeded */
  cleaned: boolean;
}
