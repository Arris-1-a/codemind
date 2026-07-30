import { describe, it, expect } from 'vitest';
import { Differ } from '../differ.js';

describe('Differ', () => {
  const differ = new Differ();

  it('should parse a simple diff', () => {
    const diff = `diff --git a/test.ts b/test.ts
index 123..456 100644
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,4 @@
 const x = 1;
+const y = 2;
 const z = 3;
`;
    const result = differ.parse(diff);
    expect(result.files.length).toBe(1);
    expect(result.summary.linesAdded).toBe(1);
    expect(result.summary.linesRemoved).toBe(0);
    expect(result.files[0].newPath).toBe('test.ts');
  });

  it('should detect change type', () => {
    const diff = `diff --git a/new.ts b/new.ts
new file mode 100644
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,1 @@
+hello
`;
    const result = differ.parse(diff);
    expect(result.files[0].changeType).toBe('added');
  });

  it('should detect language', () => {
    expect(differ.detectLanguage('test.ts')).toBe('typescript');
    expect(differ.detectLanguage('test.py')).toBe('python');
    expect(differ.detectLanguage('test.rs')).toBe('rust');
    expect(differ.detectLanguage('test.unknown')).toBeUndefined();
  });

  it('should filter by file type', () => {
    const diff = differ.parse(`diff --git a/readme.md b/readme.md
--- a/readme.md
+++ b/readme.md
@@ -1 +1,2 @@
 # Title
+updated
`);
    expect(differ.filterCodeFiles(diff.files).length).toBe(0);
  });

  it('should handle empty diff', () => {
    const result = differ.parse('');
    expect(result.files.length).toBe(0);
    expect(result.summary.filesChanged).toBe(0);
  });
});
