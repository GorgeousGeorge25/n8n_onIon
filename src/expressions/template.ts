/**
 * Template literal expression builder
 * Compiles template strings with embedded references into n8n expression syntax
 */

interface ExpressionValue {
  __expression?: string;
}

/**
 * Tagged template literal for creating n8n expressions
 * Usage: expr`Hello ${ref('Webhook').out.name}` → ={{ 'Hello ' + $node['Webhook'].json.name }}
 */
export function expr(strings: TemplateStringsArray, ...values: any[]): string {
  // If no interpolated values, return plain string
  if (values.length === 0) {
    return strings[0];
  }

  // Build expression parts
  const parts: string[] = [];

  for (let i = 0; i < strings.length; i++) {
    const stringPart = strings[i];

    // Add string literal if not empty
    if (stringPart.length > 0) {
      parts.push(`'${stringPart}'`);
    }

    // Add interpolated value if exists
    if (i < values.length) {
      const value = values[i];

      // Extract expression from value object
      // Try to access __expression directly (Proxy get trap handles it)
      if (value && typeof value === 'object') {
        const expr = value.__expression;
        if (expr !== undefined) {
          parts.push(expr);
          continue;
        }
      }

      // Fallback: convert to string (for literal values)
      parts.push(`'${String(value)}'`);
    }
  }

  // Join parts with +
  const expression = parts.join(' + ');

  // Wrap in ={{ ... }}
  return `={{ ${expression} }}`;
}
