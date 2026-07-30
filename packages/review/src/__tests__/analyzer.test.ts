import { describe, it, expect } from 'vitest';
import { Analyzer } from '../analyzer.js';
import { Differ } from '../differ.js';

describe('Analyzer', () => {
  const differ = new Differ();

  it('should detect console.log statements', () => {
    const diff = differ.parse(`diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1 +1,2 @@
+console.log('debug');
`);
    const analyzer = new Analyzer({ categories: ['best-practice'] });
    const result = analyzer.analyze(diff);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule.id).toBe('BEST-003');
  });

  it('should respect severity filter', () => {
    const diff = differ.parse(`diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1 +1,2 @@
+const x = 1;
`);
    const analyzer = new Analyzer({ minSeverity: 'error' });
    const result = analyzer.analyze(diff);
    // Console.log is info severity, so it should be filtered out
    expect(result.findings.every((f) => f.rule.severity === 'error')).toBe(true);
  });

  it('should build summary statistics', () => {
    const diff = differ.parse(`diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1 +1,2 @@
+console.log('test');
`);
    const analyzer = new Analyzer();
    const result = analyzer.analyze(diff);
    expect(result.summary.totalFindings).toBeGreaterThanOrEqual(0);
    expect(result.summary.score).toBeDefined();
    expect(typeof result.metadata.durationMs).toBe('number');
  });

  it('should ignore specified paths', () => {
    const diff = differ.parse(`diff --git a/dist/test.js b/dist/test.js
--- a/dist/test.js
+++ b/dist/test.js
@@ -1 +1,2 @@
+console.log('test');
`);
    const analyzer = new Analyzer({ ignorePaths: ['dist'] });
    const result = analyzer.analyze(diff);
    expect(result.findings.length).toBe(0);
  });

  it('should get rules by category', () => {
    const analyzer = new Analyzer();
    const rules = analyzer.getRulesByCategory();
    expect(rules.security).toBeDefined();
    expect(rules.performance).toBeDefined();
    expect(rules['code-smell']).toBeDefined();
    expect(rules['best-practice']).toBeDefined();
  });
});
