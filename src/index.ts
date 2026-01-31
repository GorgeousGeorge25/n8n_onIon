/**
 * n8n-workflow-sdk
 * Type-safe SDK for programmatic n8n workflow construction
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
export { calculateGridPosition } from './compiler/layout.js';

// Code generation
export { generateNodeType, generateNodeTypes } from './codegen/generator.js';
export { analyzeDisplayOptions, buildDiscriminatedUnions } from './codegen/conditional.js';
