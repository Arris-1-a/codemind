/**
 * Config command — manage codemind configuration.
 *
 * @module cli/commands/config
 */

import { ConfigLoader, DEFAULT_CONFIG, CodemindConfig } from '@codemind/core';
import { colors } from '../utils/colors.js';

/** Config command options */
export interface ConfigCommandOptions {
  /** Action: init, show, set, list */
  action?: 'init' | 'show' | 'set' | 'list';
  /** Config key to set */
  key?: string;
  /** Config value to set */
  value?: string;
}

/**
 * Execute the config command
 */
export async function configCommand(options: ConfigCommandOptions): Promise<void> {
  const action = options.action || 'show';

  switch (action) {
    case 'init': return initConfig();
    case 'show': return showConfig();
    case 'set': return setConfig(options.key, options.value);
    case 'list': return listConfig();
  }
}

/** Initialize a default config file */
async function initConfig(): Promise<void> {
  const loader = new ConfigLoader();
  await loader.saveToFile('.codemind.json');

  console.log(colors.success('Created .codemind.json with default configuration'));
  console.log(colors.dim('Edit this file to customize codemind settings.'));
}

/** Show current configuration */
async function showConfig(): Promise<void> {
  const loader = new ConfigLoader();
  await loader.autoLoad();
  loader.loadFromEnv();

  const config = loader.getConfig();

  console.log(colors.heading('Codemind Configuration'));
  console.log(colors.kv('Version', config.version));
  console.log(colors.kv('Default Provider', config.defaultProvider));
  console.log('');

  console.log(colors.bold('Providers:'));
  for (const [name, provider] of Object.entries(config.providers)) {
    const hasKey = provider.apiKey ? colors.badge.pass : colors.badge.fail;
    console.log(`  ${hasKey} ${name} (${provider.model || 'default'})`);
  }
  console.log('');

  console.log(colors.bold('Features:'));
  console.log(colors.kv('Review', config.review?.security ? 'enabled' : 'disabled'));
  console.log(colors.kv('PR', config.pr?.autoReview ? 'enabled' : 'disabled'));
  console.log(colors.kv('CLI Output', config.cli?.outputFormat || 'text'));
  console.log('');
}

/** Set a config value */
async function setConfig(key?: string, value?: string): Promise<void> {
  if (!key || !value) {
    console.log(colors.error('Usage: codemind config set <key> <value>'));
    console.log(colors.dim('Example: codemind config set defaultProvider openai'));
    return;
  }

  const loader = new ConfigLoader();
  await loader.autoLoad();

  const config = loader.getConfig();
  setNestedValue(config, key, value);
  loader.setConfig(config);

  await loader.saveToFile('.codemind.json');
  console.log(colors.success(`Set ${key} = ${value}`));
}

/** List available config keys */
async function listConfig(): Promise<void> {
  console.log(colors.heading('Available Configuration Keys'));
  console.log('');
  console.log(colors.bold('Top-level:'));
  console.log('  version            - Config version');
  console.log('  defaultProvider    - Default AI provider');
  console.log('');
  console.log(colors.bold('Provider keys (providers.<name>.<key>):'));
  console.log('  apiKey             - Provider API key');
  console.log('  model              - Default model');
  console.log('  temperature        - Default temperature');
  console.log('  baseUrl            - API base URL');
  console.log('');
  console.log(colors.bold('Review keys (review.<key>):'));
  console.log('  security, performance, codeSmells, bestPractices');
  console.log('  severities, ignorePaths, maxFiles');
  console.log('');
  console.log(colors.bold('CLI keys (cli.<key>):'));
  console.log('  outputFormat, interactive, colors, logLevel');
  console.log('');
}

/** Set a nested value in config object */
function setNestedValue(obj: Record<string, unknown>, key: string, value: string): void {
  const parts = key.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }

  // Try to parse as JSON value
  try {
    current[parts[parts.length - 1]] = JSON.parse(value);
  } catch {
    current[parts[parts.length - 1]] = value;
  }
}
