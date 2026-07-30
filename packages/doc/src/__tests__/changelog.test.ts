import { describe, it, expect } from 'vitest';
import { ChangelogGenerator } from '../changelog.js';

describe('ChangelogGenerator', () => {
  it('should classify commits correctly', () => {
    const gen = new ChangelogGenerator();
    expect(gen.classifyCommit('feat: add new feature')).toBe('features');
    expect(gen.classifyCommit('fix: resolve bug')).toBe('fixes');
    expect(gen.classifyCommit('docs: update readme')).toBe('docs');
    expect(gen.classifyCommit('chore: update deps')).toBe('chore');
    expect(gen.classifyCommit('refactor: clean up')).toBe('refactor');
    expect(gen.classifyCommit('BREAKING CHANGE: api changed')).toBe('breaking');
  });

  it('should generate changelog from commits', () => {
    const gen = new ChangelogGenerator({ repoUrl: 'https://github.com/user/repo' });
    const changelog = gen.generateFromCommits([
      { hash: 'abc123', date: '2024-01-01', message: 'feat: add login', version: '1.0.0' },
      { hash: 'def456', date: '2024-01-01', message: 'fix: login bug', version: '1.0.0' },
    ]);
    expect(changelog).toContain('1.0.0');
    expect(changelog).toContain('Features');
    expect(changelog).toContain('add login');
  });

  it('should handle empty commits', () => {
    const gen = new ChangelogGenerator();
    const changelog = gen.generateFromCommits([]);
    expect(changelog).toContain('Changelog');
  });
});
