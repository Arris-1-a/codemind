/**
 * PR command — generate PR description and review.
 *
 * @module cli/commands/pr
 */

import { Differ } from '@codemind/review';
import { Summarizer, PRGenerator } from '@codemind/pr';
import { execSync } from 'node:child_process';
import { colors } from '../utils/colors.js';
import { withSpinner } from '../utils/spinner.js';

/** PR command options */
export interface PRCommandOptions {
  /** Action: generate or review */
  action?: 'generate' | 'review' | 'summarize';
  /** Base branch */
  base?: string;
  /** Output format */
  format?: 'markdown' | 'json';
  /** Include review */
  withReview?: boolean;
}

/**
 * Execute the PR command
 */
export async function prCommand(options: PRCommandOptions): Promise<void> {
  const action = options.action || 'generate';
  const base = options.base || 'main';

  console.log(colors.heading(`Codemind PR — ${action}`));
  console.log(colors.kv('Base branch', base));
  console.log('');

  // Get diff
  const diffText = await withSpinner(
    'diff',
    'Fetching changes...',
    async () => {
      try {
        return execSync(`git diff ${base}...HEAD -- .`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch {
        return execSync('git diff HEAD~1 -- .', {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });
      }
    },
    'Changes fetched',
  );

  if (!diffText.trim()) {
    console.log(colors.info('No changes detected.'));
    return;
  }

  const differ = new Differ();
  const diff = differ.parse(diffText);

  if (action === 'summarize') {
    const summarizer = new Summarizer();
    const summary = await withSpinner(
      'summarize',
      'Generating summary...',
      async () => summarizer.summarize(diff),
      'Summary generated',
    );

    console.log(colors.bold(summary.title));
    console.log(summary.description);
    console.log('');
  } else if (action === 'generate') {
    const generator = new PRGenerator();
    const pr = await withSpinner(
      'generate',
      'Generating PR description...',
      async () => generator.generate(diff),
      'PR description generated',
    );

    console.log(colors.bold(colors.primary('Title:')));
    console.log(pr.title);
    console.log('');
    console.log(colors.bold(colors.primary('Description:')));
    console.log(pr.body);
    console.log('');

    if (pr.labels.length > 0) {
      console.log(colors.bold(colors.primary('Suggested Labels:')));
      console.log(pr.labels.map((l) => `  ${l}`).join('
'));
      console.log('');
    }
  }
}
