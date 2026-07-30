#!/usr/bin/env node
/**
 * Codemind CLI — main entry point for the command-line interface.
 *
 * @module cli
 */

import { Command } from 'commander';
import { reviewCommand } from './commands/review.js';
import { prCommand } from './commands/pr.js';
import { genCommand } from './commands/gen.js';
import { docCommand } from './commands/doc.js';
import { configCommand } from './commands/config.js';
import { colors } from './utils/colors.js';

/** Package version (read from package.json at build time) */
const VERSION = '1.0.0';

/** Create and configure the CLI program */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('codemind')
    .description('AI-Powered Development Assistant — code review, PR analysis, code generation, documentation automation')
    .version(VERSION);

  // ── review command ──
  program
    .command('review')
    .description('Review code changes for issues')
    .option('-b, --base-ref <ref>', 'Git ref to diff against', 'HEAD~1')
    .option('-f, --format <format>', 'Output format (text, markdown, json, sarif)', 'text')
    .option('-o, --output <file>', 'Output file path')
    .option('-s, --severity <level>', 'Minimum severity (error, warning, info, hint)', 'hint')
    .option('-c, --categories <cats>', 'Categories to check (comma-separated)')
    .action(async (options) => {
      try {
        await reviewCommand({
          baseRef: options.baseRef,
          format: options.format,
          output: options.output,
          severity: options.severity,
          categories: options.categories?.split(','),
        });
      } catch (error) {
        console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ── pr command ──
  program
    .command('pr')
    .description('Generate PR descriptions and reviews')
    .option('-a, --action <action>', 'Action: generate, review, summarize', 'generate')
    .option('-b, --base <branch>', 'Base branch', 'main')
    .option('-f, --format <format>', 'Output format (markdown, json)')
    .option('-r, --review', 'Include auto-review')
    .action(async (options) => {
      try {
        await prCommand({
          action: options.action,
          base: options.base,
          format: options.format,
          withReview: options.review,
        });
      } catch (error) {
        console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ── gen command ──
  program
    .command('gen')
    .description('Generate code from specifications')
    .option('-i, --input <file>', 'Input spec file or description')
    .option('-o, --output <dir>', 'Output directory', './generated')
    .option('-t, --template <name>', 'Template name')
    .option('-T, --tests', 'Include test generation')
    .option('-D, --no-docs', 'Exclude documentation comments')
    .option('-f, --format <format>', 'Spec format (json, yaml, natural)')
    .action(async (options) => {
      try {
        await genCommand({
          input: options.input,
          output: options.output,
          template: options.template,
          tests: options.tests,
          docs: options.docs,
          format: options.format,
        });
      } catch (error) {
        console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ── doc command ──
  program
    .command('doc')
    .description('Generate documentation from source code')
    .option('-s, --source <dir>', 'Source directory', './src')
    .option('-o, --output <file>', 'Output file', './docs/api.md')
    .option('-f, --format <format>', 'Output format (markdown, html, json)')
    .option('-t, --title <title>', 'Document title')
    .option('-p, --pattern <glob>', 'File pattern', '**/*.ts')
    .action(async (options) => {
      try {
        await docCommand({
          source: options.source,
          output: options.output,
          format: options.format,
          title: options.title,
          pattern: options.pattern,
        });
      } catch (error) {
        console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ── config command ──
  program
    .command('config')
    .description('Manage codemind configuration')
    .option('-a, --action <action>', 'Action: init, show, set, list', 'show')
    .option('-k, --key <key>', 'Config key to set')
    .option('-v, --value <value>', 'Config value')
    .action(async (options) => {
      try {
        await configCommand({
          action: options.action,
          key: options.key,
          value: options.value,
        });
      } catch (error) {
        console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ── Default: show help ──
  program.action(() => {
    console.log(colors.primary.bold('🧠 Codemind — AI Development Assistant'));
    console.log(colors.dim('Run `codemind --help` for available commands.'));
    console.log('');
    console.log('Quick start:');
    console.log('  codemind review              Review your changes');
    console.log('  codemind pr generate         Generate a PR description');
    console.log('  codemind gen -i spec.json    Generate code from spec');
    console.log('  codemind doc                 Generate API docs');
    console.log('  codemind config init         Initialize config file');
  });

  return program;
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('codemind')) {
  const program = createCLI();
  program.parse(process.argv);
}
