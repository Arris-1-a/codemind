/**
 * CLI spinner utility — wraps ora for loading animations.
 *
 * @module cli/utils/spinner
 */

import ora, { Ora } from 'ora';

/** Spinner instance management */
const spinners = new Map<string, Ora>();

/**
 * Start a spinner with a message
 * @param id - Unique spinner ID
 * @param text - Spinner text
 * @returns Spinner instance
 */
export function startSpinner(id: string, text: string): Ora {
  stopSpinner(id);
  const spinner = ora({ text, color: 'cyan' }).start();
  spinners.set(id, spinner);
  return spinner;
}

/**
 * Stop a spinner
 * @param id - Spinner ID
 */
export function stopSpinner(id: string): void {
  const spinner = spinners.get(id);
  if (spinner) {
    spinner.stop();
    spinners.delete(id);
  }
}

/**
 * Succeed a spinner
 * @param id - Spinner ID
 * @param text - Success text
 */
export function succeedSpinner(id: string, text?: string): void {
  const spinner = spinners.get(id);
  if (spinner) {
    spinner.succeed(text);
    spinners.delete(id);
  }
}

/**
 * Fail a spinner
 * @param id - Spinner ID
 * @param text - Failure text
 */
export function failSpinner(id: string, text?: string): void {
  const spinner = spinners.get(id);
  if (spinner) {
    spinner.fail(text);
    spinners.delete(id);
  }
}

/**
 * Wrap an async function with a spinner
 * @param id - Spinner ID
 * @param text - Spinner text
 * @param fn - Async function to execute
 * @param successText - Text to show on success
 * @returns Result of the function
 */
export async function withSpinner<T>(
  id: string,
  text: string,
  fn: () => Promise<T>,
  successText?: string,
): Promise<T> {
  startSpinner(id, text);
  try {
    const result = await fn();
    succeedSpinner(id, successText);
    return result;
  } catch (error) {
    failSpinner(id, error instanceof Error ? error.message : 'Failed');
    throw error;
  }
}
