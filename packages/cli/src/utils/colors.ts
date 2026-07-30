/**
 * CLI colors utility — wraps chalk for terminal color output.
 *
 * @module cli/utils/colors
 */

import chalk from 'chalk';

/** Color utility for consistent terminal styling */
export const colors = {
  /** Primary brand color */
  primary: chalk.hex('#6366f1'),

  /** Success messages */
  success: chalk.green,

  /** Warning messages */
  warning: chalk.yellow,

  /** Error messages */
  error: chalk.red,

  /** Info messages */
  info: chalk.blue,

  /** Dimmed/deemphasized text */
  dim: chalk.dim,

  /** Bold text */
  bold: chalk.bold,

  /** Section headers */
  header: chalk.hex('#6366f1').bold,

  /** File paths */
  filePath: chalk.cyan,

  /** Numbers and stats */
  stat: chalk.magenta,

  /** Log levels */
  level: {
    error: chalk.red.bold,
    warn: chalk.yellow.bold,
    info: chalk.blue.bold,
    debug: chalk.gray.bold,
  },

  /** Status badges */
  badge: {
    pass: chalk.green('✓'),
    fail: chalk.red('✗'),
    warn: chalk.yellow('⚠'),
    info: chalk.blue('ℹ'),
    pending: chalk.yellow('○'),
  },

  /** Generate a colored heading */
  heading(text: string): string {
    return '
' + colors.header('━'.repeat(50)) + '
' + colors.header(`  ${text}`) + '
' + colors.header('━'.repeat(50));
  },

  /** Format a key-value pair for display */
  kv(key: string, value: string): string {
    return `${chalk.dim(key)}: ${value}`;
  },

  /** Format a duration in ms */
  duration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  },

  /** Format a file size */
  size(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  },
};
