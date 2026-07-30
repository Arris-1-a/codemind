/**
 * Review command — run code review on a git diff.
 *
 * @module cli/commands/review
 */

import { ConfigLoader } from '@codemind/core';
import { Differ, Analyzer, Reporter } from '@codemind/review';
import { execSync } from 'node:child_process';
import { colors } from '../utils/colors.js';
import { withSpinner } from '../utils/spinner.js';

/** Review command options */
export interface ReviewCommandOptions {
  /** Git ref to diff against (default: HEAD~1) */
  baseRef?: string;
  /** Output format */
  format?: 'text' | 'markdown' | 'json' | 'sarif';
  /** Output file path */
  output?: string;
  /** Minimum severity to report */
  severity?: string;
  /** Review categories */
  categories?: string[];
}

/**
 * Execute the review command
 */
export async function reviewCommand(options: ReviewCommandOptions): Promise<void> {
  const baseRef = options.baseRef || 'HEAD~1';

  console.log(colors.heading('Codemind Review'));
  console.log(colors.kv('Base ref', baseRef));
  console.log(colors.kv('Format', options.format || 'text'));
  console.log('');

  // Step 1: Get diff
  const diffText = await withSpinner(
    'diff',
    'Fetching git diff...',
    async () => {
      try {
        return execSync(`git diff ${baseRef} -- .`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch {
        // Fallback to diff against HEAD
        return execSync('git diff HEAD -- .', {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });
      }
    },
    'Diff fetched',
  );

  if (!diffText.trim()) {
    console.log(colors.info('No changes to review.'));
    return;
  }

  // Step 2: Parse diff
  const differ = new Differ();
  const diff = differ.parse(diffText);

  console.log(colors.kv('Files', String(diff.summary.filesChanged)));
  console.log(colors.kv('Changes', `+${diff.summary.linesAdded}/-${diff.summary.linesRemoved}`));
  console.log('');

  // Step 3: Analyze
  const analyzer = new Analyzer({
    categories: options.categories
      ? (options.categories as Array<'security' | 'performance' | 'code-smell' | 'best-practice'>)
      : undefined,
    minSeverity: (options.severity as 'error' | 'warning' | 'info' | 'hint') || 'hint',
  });

  let reviewResult;
  await withSpinner(
    'analyze',
    'Analyzing code...',
    async () => {
      reviewResult = analyzer.analyze(diff);
    },
    `Found ${reviewResult!.findings.length} finding(s)`,
  );

  // Step 4: Report
  const reporter = new Reporter({
    format: (options.format as 'markdown' | 'json' | 'sarif' | 'compact') || 'compact',
    includeSnippets: options.format !== 'compact',
  });

  const report = reporter.generate(reviewResult!);

  if (options.output) {
    const fs = await import('node:fs/promises');
    await fs.writeFile(options.output, report, 'utf-8');
    console.log(colors.success(`Report saved to ${options.output}`));
  } else {
    console.log(report);
  }

  // Summary
  const severityCounts = reviewResult!.summary.bySeverity;
  console.log('');
  if (severityCounts['error'] > 0) {
    console.log(colors.error(`  ${colors.badge.fail} ${severityCounts['error']} error(s) found`));
  }
  if (severityCounts['warning'] > 0 || severityCounts['error'] > 0) {
    console.log(colors.warning(`  ${colors.badge.warn} ${severityCounts['warning']} warning(s)`));
  }
  console.log(colors.kv('Score', `${reviewResult!.summary.score}/100`));
  console.log(colors.kv('Duration', colors.duration(reviewResult!.metadata.durationMs)));
  console.log('');
}
