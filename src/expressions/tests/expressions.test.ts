import { describe, it, expect } from 'vitest';
import { ref } from '../reference.js';
import { expr } from '../template.js';

describe('Expression System', () => {
  describe('EXPR-01: Node output references', () => {
    it('should create basic node reference', () => {
      const result = ref('Webhook').out.body.name.toString();
      expect(result).toBe("={{ $node['Webhook'].json.body.name }}");
    });

    it('should create nested property access', () => {
      const result = ref('HTTP Request').out.data.items[0].id.toString();
      expect(result).toBe("={{ $node['HTTP Request'].json.data.items[0].id }}");
    });

    it('should produce Expression-compatible object with __expression property', () => {
      const r = ref('Webhook').out.body.email;
      expect(r.__expression).toBe("$node['Webhook'].json.body.email");
    });

    it('should use .out to start json path', () => {
      const result = ref('Set').out.name.toString();
      expect(result).toBe("={{ $node['Set'].json.name }}");
    });

    it('should handle deep nested paths', () => {
      const result = ref('API').out.response.data.user.profile.avatar.toString();
      expect(result).toBe("={{ $node['API'].json.response.data.user.profile.avatar }}");
    });
  });

  describe('EXPR-02: Template literals', () => {
    it('should create template with multiple references', () => {
      const webhook = ref('Webhook');
      const result = expr`Hello ${webhook.out.body.name}, your email is ${webhook.out.body.email}`;
      expect(result).toBe("={{ 'Hello ' + $node['Webhook'].json.body.name + ', your email is ' + $node['Webhook'].json.body.email }}");
    });

    it('should return plain string when no references', () => {
      const result = expr`Hello World`;
      expect(result).toBe("Hello World");
    });

    it('should handle template with single reference', () => {
      const webhook = ref('Webhook');
      const result = expr`${webhook.out.body.name}`;
      expect(result).toBe("={{ $node['Webhook'].json.body.name }}");
    });

    it('should handle mixed literal and reference', () => {
      const webhook = ref('Webhook');
      const result = expr`Name: ${webhook.out.body.name}`;
      expect(result).toBe("={{ 'Name: ' + $node['Webhook'].json.body.name }}");
    });

    it('should handle reference at end', () => {
      const webhook = ref('Webhook');
      const result = expr`Email is: ${webhook.out.body.email}`;
      expect(result).toBe("={{ 'Email is: ' + $node['Webhook'].json.body.email }}");
    });

    it('should handle multiple references with literals between', () => {
      const webhook = ref('Webhook');
      const http = ref('HTTP');
      const result = expr`User ${webhook.out.name} has ${http.out.count} items`;
      expect(result).toBe("={{ 'User ' + $node['Webhook'].json.name + ' has ' + $node['HTTP'].json.count + ' items' }}");
    });
  });
});
