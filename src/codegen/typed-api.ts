/**
 * Typed node API factory
 * Re-exports from generated factories for backward compatibility.
 *
 * This file now serves as a thin wrapper around the auto-generated
 * factories in ../../generated/factories/index.ts
 */

// Re-export createTypedNodes function and TypedNodes interface from generated factories
export { createTypedNodes } from '../../generated/factories/index.js';
export type { TypedNodes } from '../../generated/factories/index.js';

// Re-export shared utility types for downstream consumers
export type { Expression, ResourceLocator } from '../../generated/nodes.js';
