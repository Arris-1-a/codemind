import { describe, it, expect } from 'vitest';
import { ActionsManager } from '../actions.js';

describe('ActionsManager', () => {
  const manager = new ActionsManager();

  it('should generate standard CI workflow', () => {
    const workflow = manager.generateStandardCI();
    expect(workflow.content).toContain('name: Codemind CI');
    expect(workflow.content).toContain('pnpm install');
    expect(workflow.content).toContain('pnpm lint');
    expect(workflow.content).toContain('pnpm test');
  });

  it('should generate custom CI workflow', () => {
    const workflow = manager.generateCI({
      name: 'Custom CI',
      on: ['push'],
      nodeVersions: ['20'],
      jobs: [{ name: 'Test', run: 'npm test' }],
    });
    expect(workflow.content).toContain('Custom CI');
    expect(workflow.content).toContain('npm test');
  });

  it('should generate release workflow', () => {
    const workflow = manager.generateRelease();
    expect(workflow.content).toContain('Release');
    expect(workflow.content).toContain("'v*'");
    expect(workflow.content).toContain('pnpm build');
  });

  it('should generate codemind review workflow', () => {
    const workflow = manager.generateCodemindReview();
    expect(workflow.content).toContain('Codemind Review');
    expect(workflow.content).toContain('pull_request');
  });
});
