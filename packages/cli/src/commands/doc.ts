/**
 * Doc command — generate documentation from source code.
 *
 * @module cli/commands/doc
 */

import { DocGenerator } from '@codemind/doc';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { colors } from '../utils/colors.js';
import { withSpinner } from '../utils/spinner.js';

/** Doc command options */
export interface DocCommandOptions {
  /** Source directory */
  source?: string;
  /** Output file */
  output?: string;
  /** Documentation format */
  format?: 'markdown' | 'html' | 'json';
  /** Document title */
  title?: string;
  /** File pattern glob */
  pattern?: string;
}

/**
 * Execute the doc command
 */
export async function docCommand(options: DocCommandOptions): Promise<void> {
  const sourceDir = options.source || './src';
  const outputFile = options.output || './docs/api.md';
  const pattern = options.pattern || '**/*.ts';

  console.log(colors.heading('Codemind Documentation Generator'));
  console.log(colors.kv('Source', sourceDir));
  console.log(colors.kv('Output', outputFile));
  console.log(colors.kv('Format', options.format || 'markdown'));
  console.log('');

  // Collect source files
  const sourceFiles = new Map<string, string>();
  await withSpinner(
    'scan',
    `Scanning ${sourceDir}/${pattern}...`,
    async () => {
      const { glob } = await import('node:fs/promises');
      // Simple recursive file gathering
      await collectFiles(sourceDir, pattern, sourceFiles);
    },
    `Found ${sourceFiles.size} file(s)`,
  );

  // Generate docs
  const generator = new DocGenerator({
    format: options.format || 'markdown',
    title: options.title || 'API Documentation',
    toc: true,
  });

  const docs = await withSpinner(
    'generate',
    'Generating documentation...',
    async () => generator.generate(sourceFiles),
    'Documentation generated',
  );

  // Write output
  const outputDir = path.dirname(outputFile);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, docs, 'utf-8');

  console.log(colors.success(`Documentation saved to ${colors.filePath(outputFile)}`));
  console.log(colors.kv('Size', colors.size(docs.length)));
  console.log('');
}

/** Recursively collect files matching a pattern */
async function collectFiles(
  dir: string,
  pattern: string,
  files: Map<string, string>,
): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await collectFiles(fullPath, pattern, files);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        files.set(fullPath, content);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
}
