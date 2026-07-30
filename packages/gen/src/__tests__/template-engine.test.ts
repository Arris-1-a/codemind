import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine, BUILTIN_TEMPLATES } from '../template-engine.js';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
    for (const t of BUILTIN_TEMPLATES) {
      engine.register(t);
    }
  });

  it('should render simple variable substitution', () => {
    engine.register({
      name: 'test',
      description: 'test',
      language: 'typescript',
      variables: [{ name: 'name' }],
      content: 'function {{name}}() {}',
    });
    const result = engine.render('test', { variables: { name: 'hello' } });
    expect(result).toBe('function hello() {}');
  });

  it('should render if blocks', () => {
    engine.register({
      name: 'if-test',
      description: '',
      language: 'typescript',
      variables: [{ name: 'export' }],
      content: '{{#if export}}export {{/if}}function test() {}',
    });
    const exported = engine.render('if-test', { variables: { export: true } });
    expect(exported).toBe('export function test() {}');
    
    const notExported = engine.render('if-test', { variables: { export: false } });
    expect(notExported).toBe('function test() {}');
  });

  it('should validate required variables', () => {
    engine.register({
      name: 'validate-test',
      description: '',
      language: 'typescript',
      variables: [{ name: 'required', required: true }],
      content: '{{required}}',
    });
    const missing = engine.validate('validate-test', {});
    expect(missing).toContain('required');
  });

  it('should render built-in function template', () => {
    const result = engine.render('ts-function', {
      variables: { name: 'greet', params: 'name: string', returnType: 'string', body: 'return `Hello ${name}`;' },
    });
    expect(result).toContain('export function greet');
    expect(result).toContain('name: string');
    expect(result).toContain('return');
  });

  it('should list all templates', () => {
    const templates = engine.list();
    expect(templates.length).toBeGreaterThanOrEqual(4);
  });
});
