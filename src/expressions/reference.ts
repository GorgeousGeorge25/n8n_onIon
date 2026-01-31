/**
 * Node output reference builder
 * Creates type-safe references to node outputs that compile to n8n expression syntax
 */

interface ExpressionObject {
  __expression: string;
  toString(): string;
  [key: string]: any;
}

/**
 * Creates a reference to a node's output data
 * Usage: ref('Webhook').out.body.name → ={{ $node['Webhook'].json.body.name }}
 */
export function ref(nodeName: string): { out: ExpressionObject } {
  return {
    out: createProxy(nodeName, [])
  };
}

function createProxy(nodeName: string, path: Array<string | number>): ExpressionObject {
  const handler: ProxyHandler<ExpressionObject> = {
    get(target, prop) {
      // Handle special properties
      if (prop === '__expression') {
        return buildExpression(nodeName, path, false);
      }

      if (prop === 'toString') {
        return () => buildExpression(nodeName, path, true);
      }

      // Handle Symbol.toPrimitive for template literal coercion
      if (prop === Symbol.toPrimitive) {
        return () => buildExpression(nodeName, path, false);
      }

      // For any other property access, extend the path
      if (typeof prop === 'string' || typeof prop === 'number') {
        const newPath = [...path, prop];
        return createProxy(nodeName, newPath);
      }

      return undefined;
    }
  };

  // Create a function that can be called with bracket notation
  const proxyTarget = new Proxy(
    Object.create(null) as ExpressionObject,
    handler
  );

  return proxyTarget;
}

function buildExpression(nodeName: string, path: Array<string | number>, wrapped: boolean): string {
  // Build the path: json.field1.field2[0].field3
  const pathStr = path.map(segment => {
    if (typeof segment === 'number') {
      return `[${segment}]`;
    }
    // Check if segment is a number string (for bracket notation)
    if (/^\d+$/.test(segment)) {
      return `[${segment}]`;
    }
    return `.${segment}`;
  }).join('');

  const expression = `$node['${nodeName}'].json${pathStr}`;

  return wrapped ? `={{ ${expression} }}` : expression;
}
