import { describe, it, expect } from 'vitest';
import { PRGenerator } from '../generator.js';
import { Differ } from '@codemind/review';

describe('PRGenerator', () => {
  const differ = new Differ();

  it('should generate PR description', async () => {
    const generator = new PRGenerator();
    const diff = differ.parse(`diff --git a/src/feature.ts b/src/feature.ts
new file mode 100644
--- /dev/null
+++ b/src/feature.ts
@@ -0,0 +1,10 @@
+export function newFeature() {
+  return "Hello";
+}
`);
    const pr = await generator.generate(diff);
    expect(pr.title).toBeDefined();
    expect(pr.title).toContain('feat');
    expect(pr.body).toContain('## Summary');
    expect(pr.type).toBe('feature');
  });

  it('should detect bugfix type', async () => {
    const generator = new PRGenerator();
    const diff = differ.parse(`diff --git a/src/fix.ts b/src/fix.ts
--- a/src/fix.ts
+++ b/src/fix.ts
@@ -1,1 +1,1 @@
-const x = 1;
+const x = 2;
`);
    const pr = await generator.generate(diff);
    expect(pr.type).toBe('bugfix');
  });

  it('should fill custom template', async () => {
    const generator = new PRGenerator();
    const diff = differ.parse(`diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1 +1,2 @@
+test
`);
    const pr = await generator.generate(diff, {
      customTemplate: 'Changed {{FILES_CHANGED}} files with {{LINES_ADDED}} additions',
    });
    expect(pr.body).toContain('Changed');
  });
});
