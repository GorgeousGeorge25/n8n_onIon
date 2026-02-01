/**
 * n8n-workflow-sdk
 * Compiler layer for building, deploying, and testing n8n workflows programmatically
 */

// Schema types and utilities
export * from './schema/types.js';
export * from './schema/extractor.js';
export * from './schema/cache.js';

// Expression system
export * from './expressions/reference.js';
export * from './expressions/template.js';

// Workflow builder
export * from './builder/types.js';
export { workflow } from './builder/workflow.js';

// Compiler
export * from './compiler/types.js';
export { compileWorkflow } from './compiler/compiler.js';
export { validateWorkflow } from './compiler/validation.js';
export { calculateGridPosition, calculateTopologyPositions } from './compiler/layout.js';
export { loadSchemaRegistry, getTypeVersion } from './compiler/schema-registry.js';

// Deployer
export * from './deployer/types.js';
export { deployWorkflow } from './deployer/deploy.js';

// Executor (workflow testing)
export * from './executor/types.js';
export { getExecution, pollExecution, triggerWebhook, deleteWorkflow, extractNodeData } from './executor/execute.js';
export { testWorkflow } from './executor/test-harness.js';
