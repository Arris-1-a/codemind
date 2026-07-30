import { describe, it, expect } from 'vitest';
import { CodeBuilder } from '../code-builder.js';

describe('CodeBuilder', () => {
  const builder = new CodeBuilder();

  it('should build a function', () => {
    const result = builder.build({
      name: 'add',
      kind: 'function',
      language: 'typescript',
      description: 'Add two numbers',
      properties: [
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' },
      ],
    });
    expect(result.content).toContain('function add');
    expect(result.content).toContain('a: number');
    expect(result.content).toContain('b: number');
  });

  it('should build a class', () => {
    const result = builder.build({
      name: 'User',
      kind: 'class',
      language: 'typescript',
      description: 'User model',
      properties: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
      ],
    });
    expect(result.content).toContain('class User');
  });

  it('should build an interface', () => {
    const result = builder.build({
      name: 'Config',
      kind: 'interface',
      language: 'typescript',
      description: 'Configuration',
      properties: [{ name: 'port', type: 'number' }],
    });
    expect(result.content).toContain('interface Config');
  });

  it('should include JSDoc by default', () => {
    const result = builder.build({
      name: 'Test',
      kind: 'function',
      language: 'typescript',
      description: 'Test function',
      properties: [],
    });
    expect(result.content).toContain('@generated');
  });

  it('should generate test code when configured', () => {
    const testBuilder = new CodeBuilder({ includeTests: true });
    const result = testBuilder.build({
      name: 'Add',
      kind: 'function',
      language: 'typescript',
      description: 'Add function',
      properties: [{ name: 'x', type: 'number' }],
    });
    expect(result.filename).toContain('Add');
  });
});
