/**
 * Configuration loader — loads config from file, env vars, and defaults.
 *
 * @module config/loader
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CodemindConfig, DEFAULT_CONFIG } from './schema.js';

/** Configuration search paths */
const CONFIG_SEARCH_PATHS = [
  '.codemind.json',
  '.codemind.yaml',
  '.codemind.yml',
  '.codemind/config.json',
  '.codemind/config.yaml',
  '.codemind/config.yml',
  'codemind.config.json',
  'codemind.config.yaml',
  'codemind.config.yml',
];

/**
 * Configuration loader for Codemind.
 * Loads configuration from files, environment variables, and provides defaults.
 */
export class ConfigLoader {
  private config: CodemindConfig;

  constructor() {
    this.config = structuredClone(DEFAULT_CONFIG);
  }

  /**
   * Load configuration from a file
   * @param filePath - Path to the configuration file
   * @returns The loaded configuration
   */
  async loadFromFile(filePath: string): Promise<CodemindConfig> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    let loaded: Partial<CodemindConfig>;
    if (ext === '.json') {
      loaded = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      loaded = this.parseYAML(content);
    } else {
      throw new Error(`Unsupported config format: ${ext}`);
    }

    this.mergeConfig(loaded);
    return this.config;
  }

  /**
   * Auto-discover and load configuration from common paths
   * @param rootDir - Root directory to search from
   * @returns The loaded configuration
   */
  async autoLoad(rootDir: string = process.cwd()): Promise<CodemindConfig> {
    for (const searchPath of CONFIG_SEARCH_PATHS) {
      const fullPath = path.join(rootDir, searchPath);
      try {
        await fs.access(fullPath);
        await this.loadFromFile(fullPath);
        return this.config;
      } catch {
        continue;
      }
    }
    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnv(): void {
    // Provider API keys
    if (process.env.OPENAI_API_KEY) {
      this.config.providers['openai'] = {
        ...this.config.providers['openai'],
        apiKey: process.env.OPENAI_API_KEY,
      };
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.config.providers['anthropic'] = {
        ...this.config.providers['anthropic'],
        apiKey: process.env.ANTHROPIC_API_KEY,
      };
    }
    if (process.env.DEEPSEEK_API_KEY) {
      this.config.providers['deepseek'] = {
        ...this.config.providers['deepseek'],
        apiKey: process.env.DEEPSEEK_API_KEY,
      };
    }

    // Default provider
    if (process.env.CODEMIND_PROVIDER) {
      this.config.defaultProvider = process.env.CODEMIND_PROVIDER;
    }
    if (process.env.CODEMIND_MODEL) {
      const provider = this.config.providers[this.config.defaultProvider];
      if (provider) {
        provider.model = process.env.CODEMIND_MODEL;
      }
    }

    // Local model URL
    if (process.env.CODEMIND_LOCAL_URL) {
      this.config.providers['local'] = {
        ...this.config.providers['local'],
        baseUrl: process.env.CODEMIND_LOCAL_URL,
      };
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): CodemindConfig {
    return structuredClone(this.config);
  }

  /**
   * Set the configuration directly
   */
  setConfig(config: Partial<CodemindConfig>): void {
    this.mergeConfig(config);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerId?: string) {
    const id = providerId || this.config.defaultProvider;
    return this.config.providers[id] || this.config.providers[this.config.defaultProvider];
  }

  /**
   * Save configuration to a file
   */
  async saveToFile(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  /**
   * Deep merge configuration
   */
  private mergeConfig(partial: Partial<CodemindConfig>): void {
    for (const [key, value] of Object.entries(partial)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        (this.config as Record<string, unknown>)[key] = {
          ...((this.config as Record<string, unknown>)[key] as Record<string, unknown>),
          ...value,
        };
      } else {
        (this.config as Record<string, unknown>)[key] = value;
      }
    }
  }

  /**
   * Simple YAML parser (supports basic YAML structure)
   */
  private parseYAML(content: string): Partial<CodemindConfig> {
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    let currentSection: Record<string, unknown> | null = null;
    let currentKey = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (!trimmed.startsWith('  ') && trimmed.endsWith(':')) {
        currentKey = trimmed.slice(0, -1);
        currentSection = {};
        result[currentKey] = currentSection;
      } else if (currentSection) {
        const match = trimmed.match(/^(\s*)([\w-]+):\s*(.*)$/);
        if (match) {
          const [, , key, value] = match;
          currentSection[key] = this.parseYAMLValue(value.trim());
        }
      } else {
        const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          result[key] = this.parseYAMLValue(value.trim());
        }
      }
    }

    return result as Partial<CodemindConfig>;
  }

  /**
   * Parse a YAML scalar value
   */
  private parseYAMLValue(value: string): unknown {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '' || value === '~' || value === 'null') return null;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  }
}
