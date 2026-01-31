/**
 * Compiler tests - TDD RED phase
 */

import { describe, it, expect } from 'vitest';
import { workflow } from '../../builder/workflow.js';
import { compileWorkflow } from '../compiler.js';
import { validateWorkflow } from '../validation.js';
import type { N8nWorkflow } from '../types.js';
import type { WorkflowConnection } from '../../builder/types.js';

describe('Compiler', () => {
  describe('compileWorkflow', () => {
    it('should produce valid n8n workflow structure with basic nodes', () => {
      // Create a simple workflow: trigger -> action
      const wf = workflow('Test Workflow');
      const trigger = wf.trigger('Start', 'n8n-nodes-base.manualTrigger', {});
      const action = wf.node('Send Message', 'n8n-nodes-base.slack', {
        channel: '#general',
        text: 'Hello'
      });
      wf.connect(trigger, action);

      const result: N8nWorkflow = compileWorkflow(wf);

      // Verify basic structure
      expect(result.name).toBe('Test Workflow');
      expect(result.nodes).toHaveLength(2);
      expect(result.active).toBe(false);
      expect(result.settings).toBeDefined();
      expect(typeof result.connections).toBe('object');

      // Verify each node has required fields
      result.nodes.forEach(node => {
        expect(node.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/); // UUID format
        expect(typeof node.name).toBe('string');
        expect(typeof node.type).toBe('string');
        expect(node.typeVersion).toBe(1);
        expect(Array.isArray(node.position)).toBe(true);
        expect(node.position).toHaveLength(2);
        expect(typeof node.position[0]).toBe('number');
        expect(typeof node.position[1]).toBe('number');
        expect(typeof node.parameters).toBe('object');
      });

      // Verify connections format
      expect(result.connections).toHaveProperty('Start');
      expect(result.connections['Start']).toHaveProperty('main');
      expect(Array.isArray(result.connections['Start'].main)).toBe(true);
    });

    it('should generate unique UUIDs for all nodes', () => {
      const wf = workflow('UUID Test');
      wf.trigger('Node1', 'n8n-nodes-base.manualTrigger', {});
      wf.node('Node2', 'n8n-nodes-base.slack', {});
      wf.node('Node3', 'n8n-nodes-base.http', {});
      wf.node('Node4', 'n8n-nodes-base.code', {});

      const result = compileWorkflow(wf);

      const ids = result.nodes.map(n => n.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length); // All IDs are unique
      expect(ids.length).toBe(4);
    });

    it('should assign non-overlapping grid positions', () => {
      const wf = workflow('Layout Test');
      wf.trigger('N1', 'n8n-nodes-base.manualTrigger', {});
      wf.node('N2', 'n8n-nodes-base.slack', {});
      wf.node('N3', 'n8n-nodes-base.http', {});
      wf.node('N4', 'n8n-nodes-base.code', {});
      wf.node('N5', 'n8n-nodes-base.webhook', {});

      const result = compileWorkflow(wf);

      const positions = result.nodes.map(n => `${n.position[0]},${n.position[1]}`);
      const uniquePositions = new Set(positions);

      expect(uniquePositions.size).toBe(positions.length); // All positions unique
      expect(positions.length).toBe(5);
    });

    it('should transform connections to n8n nested format', () => {
      const wf = workflow('Connection Test');
      const a = wf.trigger('A', 'n8n-nodes-base.manualTrigger', {});
      const b = wf.node('B', 'n8n-nodes-base.slack', {});
      const c = wf.node('C', 'n8n-nodes-base.http', {});

      // A connects to B on output 0 (default)
      wf.connect(a, b);
      // A connects to C on output 1 (e.g., IF node false branch)
      wf.connect(a, c, 1);

      const result = compileWorkflow(wf);

      // Verify connection structure
      expect(result.connections).toHaveProperty('A');
      expect(result.connections['A'].main).toHaveLength(2); // Two output branches
      expect(Array.isArray(result.connections['A'].main[0])).toBe(true);
      expect(Array.isArray(result.connections['A'].main[1])).toBe(true);

      // Verify output 0 -> B
      expect(result.connections['A'].main[0]).toHaveLength(1);
      expect(result.connections['A'].main[0][0]).toEqual({
        node: 'B',
        type: 'main',
        index: 0
      });

      // Verify output 1 -> C
      expect(result.connections['A'].main[1]).toHaveLength(1);
      expect(result.connections['A'].main[1][0]).toEqual({
        node: 'C',
        type: 'main',
        index: 0
      });
    });

    it('should handle empty workflows', () => {
      const wf = workflow('Empty Workflow');

      const result = compileWorkflow(wf);

      expect(result.name).toBe('Empty Workflow');
      expect(result.nodes).toEqual([]);
      expect(result.connections).toEqual({});
      expect(result.active).toBe(false);
      expect(result.settings).toEqual({});
    });

    it('should pass through expression values unchanged', () => {
      const wf = workflow('Expression Test');
      const trigger = wf.trigger('Start', 'n8n-nodes-base.manualTrigger', {});
      const action = wf.node('Process', 'n8n-nodes-base.code', {
        code: '={{ $node["Start"].json.data }}',
        value: '={{ $json.field }}'
      });
      wf.connect(trigger, action);

      const result = compileWorkflow(wf);

      const processNode = result.nodes.find(n => n.name === 'Process');
      expect(processNode).toBeDefined();
      expect(processNode!.parameters.code).toBe('={{ $node["Start"].json.data }}');
      expect(processNode!.parameters.value).toBe('={{ $json.field }}');
    });
  });

  describe('validateWorkflow', () => {
    it('should reject connections to non-existent nodes', () => {
      // Create a workflow and get its nodes
      const wf = workflow('Validation Test');
      wf.trigger('ValidNode', 'n8n-nodes-base.manualTrigger', {});

      const nodes = wf.getNodes();

      // Create a bad connection referencing non-existent node
      const badConnection: WorkflowConnection = {
        from: 'ValidNode',
        to: 'NonExistentNode',
        outputIndex: 0
      };

      expect(() => {
        validateWorkflow(nodes, [badConnection]);
      }).toThrow('Connection references unknown target: "NonExistentNode"');
    });

    it('should reject connections from non-existent nodes', () => {
      const wf = workflow('Validation Test 2');
      wf.trigger('ValidNode', 'n8n-nodes-base.manualTrigger', {});

      const nodes = wf.getNodes();

      const badConnection: WorkflowConnection = {
        from: 'NonExistentSource',
        to: 'ValidNode',
        outputIndex: 0
      };

      expect(() => {
        validateWorkflow(nodes, [badConnection]);
      }).toThrow('Connection references unknown source: "NonExistentSource"');
    });
  });
});
