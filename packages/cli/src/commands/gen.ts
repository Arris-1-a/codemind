/**
 * Gen command — generate code from specifications.
 *
 * @module cli/commands/gen
 */

import { SpecParser, CodeBuilder } from '@codemind/gen';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { colors } from '../utils/colors.js';
import { withSpinner } from '../utils/spinner.js';

/** Gen command options */
export interface GenCommandOptions {
  /** Input spec file or description */
  input?: string;
  /** Output directory */
  output?: string;
  /** Template to use */
  template?: string;
  /** Include tests */
  tests?: boolean;
  /** Include docs */
  docs?: boolean;
  /** Specification format */
  format?: 'json' | 'yaml' | 'natural';
}

/**
 * Execute the gen command
 */
export async function genCommand(options: GenCommandOptions): Promise<void> {
  console.log(colors.heading('Codemind Code Generation'));

  const parser = new SpecParser();
  const builder = new CodeBuilder({
    includeDocs: options.docs !== false,
    includeTests: options.tests || false,
  });

  let spec;

  if (options.input) {
    const ext = path.extname(options.input);
    const format = options.format || (ext === '.json' ? 'json' : ext === '.yaml' || ext === '.yml' ? 'yaml' : 'natural');

    const content = await fs.readFile(options.input, 'utf-8');

    if (format === 'json') {
      spec = parser.parseJSON(content);
    } else if (format === 'yaml') {
      spec = parser.parseYAML(content);
    } else {
      spec = parser.parseNaturalLanguage(content);
    }

    if (spec.errors.length > 0) {
      console.log(colors.error('Errors:'));
      for (const err of spec.errors) {
        console.log(`  ${colors.badge.fail} ${err}`);
      }
      return;
    }

    if (spec.warnings.length > 0) {
      for (const warn of spec.warnings) {
        console.log(colors.warning(`  ${colors.badge.warn} ${warn}`));
      }
    }
  } else {
    // Use a sample spec
    spec = {
      spec: {
        name: 'ExampleComponent',
        kind: 'function',
        language: 'typescript',
        description: 'An example component',
        properties: [{ name: 'data', type: 'string', required: true }],
      },
      warnings: [],
      errors: [],
    };
  }

  // Generate code
  const generated = await withSpinner(
    'generate',
    'Generating code...',
    async () => builder.build(spec.spec),
    'Code generated',
  );

  const outputDir = options.output || './generated';
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, generated.filename);
  await fs.writeFile(outputPath, generated.content, 'utf-8');

  console.log(colors.success(`Generated: ${colors.filePath(outputPath)}`));
  console.log(colors.kv('Language', generated.language));
  console.log(colors.kv('Size', colors.size(generated.content.length)));
  console.log('');
}
