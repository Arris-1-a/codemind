import { describe, it, expect } from 'vitest';
import { Reporter } from '../reporter.js';

describe('Reporter', () => {
  const sampleResult = {
    findings: [
      {
        rule: {
          id: 'SEC-001',
          category: 'security' as const,
          title: 'Hardcoded credentials',
          description: 'Test',
          severity: 'error' as const,
        },
        file: 'test.ts',
        line: 10,
        snippet: 'const key = "secret";',
        suggestion: 'Use env variable',
      },
    ],
    summary: {
      totalFindings: 1,
      bySeverity: { error: 1, warning: 0, info: 0, hint: 0 },
      byCategory: { security: 1, performance: 0, 'code-smell': 0, 'best-practice': 0, style: 0 },
      byFile: { 'test.ts': 1 },
      score: 90,
    },
    metadata: {
      reviewedAt: '2024-01-01T00:00:00Z',
      filesReviewed: 1,
      linesReviewed: 10,
      durationMs: 100,
      rulesApplied: 5,
    },
  };

  it('should generate markdown report', () => {
    const reporter = new Reporter({ format: 'markdown' });
    const report = reporter.generate(sampleResult);
    expect(report).toContain('# Code Review Report');
    expect(report).toContain('SEC-001');
    expect(report).toContain('90/100');
  });

  it('should generate JSON report', () => {
    const reporter = new Reporter({ format: 'json' });
    const report = reporter.generate(sampleResult);
    const parsed = JSON.parse(report);
    expect(parsed.findings.length).toBe(1);
    expect(parsed.summary.score).toBe(90);
  });

  it('should generate compact report', () => {
    const reporter = new Reporter({ format: 'compact' });
    const report = reporter.generate(sampleResult);
    expect(report).toContain('[ERROR]');
    expect(report).toContain('SEC-001');
  });

  it('should generate PR comment', () => {
    const reporter = new Reporter({ format: 'comment' });
    const report = reporter.generate(sampleResult);
    expect(report).toContain('Codemind Review');
    expect(report).toContain('test.ts');
  });

  it('should handle no findings', () => {
    const reporter = new Reporter({ format: 'markdown' });
    const emptyResult = { ...sampleResult, findings: [] };
    const report = reporter.generate(emptyResult);
    expect(report).toContain('No issues found');
  });
});
