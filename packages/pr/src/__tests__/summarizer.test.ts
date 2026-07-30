import { describe, it, expect } from 'vitest';
import { Summarizer } from '../summarizer.js';
import { Differ } from '@codemind/review';

describe('Summarizer', () => {
  const differ = new Differ();

  it('should summarize a simple diff', async () => {
    const summarizer = new Summarizer();
    const diff = differ.parse(`diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1 +1,2 @@
 const x = 1;
+const y = 2;
`);
    const summary = await summarizer.summarize(diff);
    expect(summary.title).toBeDefined();
    expect(summary.description).toBeDefined();
    expect(summary.keyChanges.length).toBeGreaterThan(0);
    expect(summary.impact.level).toBeDefined();
  });

  it('should assess risk level', async () => {
    const summarizer = new Summarizer();
    const diff = differ.parse(`diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1 +1,50 @@
+${Array(50).fill('+new line').join('\n')}
`);
    const summary = await summarizer.summarize(diff);
    expect(summary.risk).toBeDefined();
    expect(summary.risk!.level).toBeDefined();
  });

  it('should detect single file changes', async () => {
    const summarizer = new Summarizer();
    const diff = differ.parse(`diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1,3 @@
+import express from 'express';
+const app = express();
`);
    const summary = await summarizer.summarize(diff);
    expect(summary.title).toContain('app.ts');
  });
});
