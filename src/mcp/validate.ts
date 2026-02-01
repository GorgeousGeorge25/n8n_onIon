/**
 * MCP validation bridge — validates compiled workflows via n8n-mcp
 */

import { getMcpClient } from './client.js';
import type { N8nWorkflow } from '../compiler/types.js';
import type { ValidationResult, ValidationIssue } from '../compiler/types.js';

/**
 * Validates a compiled workflow via n8n-mcp's validate_workflow tool.
 * Catches issues that local validation misses: expression type errors,
 * AI agent connections, credential compatibility.
 *
 * @param workflow - Compiled n8n workflow JSON
 * @returns Validation result compatible with local ValidationResult type
 */
export async function validateViaMcp(workflow: N8nWorkflow): Promise<ValidationResult> {
  const client = await getMcpClient();

  const result = await client.callTool({
    name: 'validate_workflow',
    arguments: { workflow },
  });

  // Parse response
  const r = result as { content?: Array<{ type: string; text?: string }> };
  if (!r.content || !Array.isArray(r.content)) {
    return { valid: true, errors: [], warnings: [] };
  }

  for (const block of r.content) {
    if (block.type === 'text' && block.text) {
      try {
        const data = JSON.parse(block.text) as {
          valid?: boolean;
          errors?: ValidationIssue[];
          warnings?: ValidationIssue[];
          issues?: ValidationIssue[];
        };

        const errors: ValidationIssue[] = (data.errors || []).map(e => ({ ...e, type: 'error' as const }));
        const warnings: ValidationIssue[] = (data.warnings || []).map(w => ({ ...w, type: 'warning' as const }));

        // Some MCP responses may use a flat "issues" array
        if (data.issues) {
          for (const issue of data.issues) {
            if (issue.type === 'error') errors.push({ ...issue, type: 'error' });
            else warnings.push({ ...issue, type: 'warning' });
          }
        }

        return {
          valid: errors.length === 0,
          errors,
          warnings,
        };
      } catch {
        // Not JSON
      }
    }
  }

  return { valid: true, errors: [], warnings: [] };
}
