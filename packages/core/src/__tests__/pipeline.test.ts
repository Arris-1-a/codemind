import { describe, it, expect } from 'vitest';
import { ContextManager, Analyzer, Transformer, OutputHandler, Pipeline } from '../pipeline/index.js';
import { LocalProvider } from '../provider/index.js';

describe('ContextManager', () => {
  it('should add and retrieve context items', () => {
    const ctx = new ContextManager();
    ctx.addItem({
      id: '1',
      type: 'file',
      content: 'const x = 1;',
      path: 'test.ts',
      metadata: {},
    });
    
    expect(ctx.getItems().length).toBe(1);
    expect(ctx.getItemsByType('file').length).toBe(1);
  });

  it('should build context string', () => {
    const ctx = new ContextManager();
    ctx.addItem({
      id: '1',
      type: 'file',
      content: 'hello world',
      path: 'readme.md',
      language: 'markdown',
      metadata: {},
    });
    
    const context = ctx.buildContext();
    expect(context).toContain('readme.md');
    expect(context).toContain('hello world');
  });

  it('should build summary', () => {
    const ctx = new ContextManager();
    ctx.addItem({
      id: '1',
      type: 'file',
      content: 'const a = 1;',
      metadata: {},
    });
    
    const summary = ctx.buildSummary();
    expect(summary).toContain('Total items: 1');
  });

  it('should clear context', () => {
    const ctx = new ContextManager();
    ctx.addItem({ id: '1', type: 'file', content: 'test', metadata: {} });
    ctx.clear();
    expect(ctx.getItems().length).toBe(0);
  });
});

describe('Transformer', () => {
  it('should apply strip-fences transform', async () => {
    const t = new Transformer();
    const result = await t.apply(
      { output: '```ts\nconst x = 1;\n```', metadata: { type: 'test', model: 'test', durationMs: 0, contextItems: 0 } },
      ['strip-fences'],
    );
    expect(result.output).toBe('const x = 1;');
  });

  it('should apply normalize transform', async () => {
    const t = new Transformer();
    const result = await t.apply(
      { output: 'hello\n\n\n\nworld', metadata: { type: 'test', model: 'test', durationMs: 0, contextItems: 0 } },
      ['normalize'],
    );
    expect(result.output).toBe('hello\n\nworld');
  });
});

describe('OutputHandler', () => {
  it('should format as JSON', async () => {
    const handler = new OutputHandler({ format: 'json' });
    const result = await handler.output({
      output: 'test output',
      metadata: { type: 'review', model: 'gpt-4', durationMs: 100, contextItems: 2 },
    });
    expect(result.formatted).toContain('"output": "test output"');
    expect(result.destination).toBe('stdout');
  });
});
