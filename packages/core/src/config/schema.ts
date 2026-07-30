/**
 * Configuration schema — defines the structure and validation for codemind config.
 *
 * @module config/schema
 */

/** Provider configuration */
export interface ProviderConfig {
  /** API key for the provider */
  apiKey?: string;
  /** Base URL override */
  baseUrl?: string;
  /** Default model */
  model?: string;
  /** Default temperature */
  temperature?: number;
  /** Default max tokens */
  maxTokens?: number;
}

/** Review configuration */
export interface ReviewConfig {
  /** Whether security review is enabled */
  security?: boolean;
  /** Whether performance review is enabled */
  performance?: boolean;
  /** Whether code smells detection is enabled */
  codeSmells?: boolean;
  /** Whether best practices check is enabled */
  bestPractices?: boolean;
  /** Severity levels to include */
  severities?: ('error' | 'warning' | 'info' | 'hint')[];
  /** Files to ignore */
  ignorePaths?: string[];
  /** Maximum files per review */
  maxFiles?: number;
  /** Custom rules directory */
  customRules?: string;
}

/** PR configuration */
export interface PRConfig {
  /** Whether to auto-generate PR descriptions */
  autoDescription?: boolean;
  /** Whether to auto-review PRs */
  autoReview?: boolean;
  /** Whether to auto-summarize changes */
  autoSummarize?: boolean;
  /** Template for PR descriptions */
  descriptionTemplate?: string;
  /** Labels to auto-add */
  autoLabels?: string[];
  /** Maximum diff size to process */
  maxDiffSize?: number;
}

/** Code generation configuration */
export interface GenerationConfig {
  /** Default language */
  language?: string;
  /** Default framework */
  framework?: string;
  /** Templates directory */
  templatesDir?: string;
  /** Whether to include tests */
  includeTests?: boolean;
  /** Whether to include documentation */
  includeDocs?: boolean;
}

/** Documentation configuration */
export interface DocConfig {
  /** Output directory */
  outputDir?: string;
  /** Documentation style */
  style?: 'jsdoc' | 'typedoc' | 'custom';
  /** Whether to generate changelog */
  changelog?: boolean;
  /** Whether to generate README */
  readme?: boolean;
  /** API doc format */
  apiFormat?: 'markdown' | 'html' | 'json';
}

/** CLI configuration */
export interface CLIConfig {
  /** Default output format */
  outputFormat?: 'text' | 'json' | 'markdown';
  /** Whether interactive mode is default */
  interactive?: boolean;
  /** Whether colors are enabled */
  colors?: boolean;
  /** Log level */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

/** GitHub integration configuration */
export interface GitHubConfig {
  /** GitHub App ID */
  appId?: string;
  /** GitHub App private key path */
  privateKeyPath?: string;
  /** Webhook secret */
  webhookSecret?: string;
  /** Installation ID */
  installationId?: string;
  /** Repositories to include */
  repos?: string[];
}

/** Complete codemind configuration */
export interface CodemindConfig {
  /** Configuration version */
  version: string;
  /** Default AI provider */
  defaultProvider: string;
  /** Provider configurations */
  providers: Record<string, ProviderConfig>;
  /** Review configuration */
  review?: ReviewConfig;
  /** PR configuration */
  pr?: PRConfig;
  /** Generation configuration */
  generation?: GenerationConfig;
  /** Documentation configuration */
  documentation?: DocConfig;
  /** CLI configuration */
  cli?: CLIConfig;
  /** GitHub configuration */
  github?: GitHubConfig;
}

/** Default configuration */
export const DEFAULT_CONFIG: CodemindConfig = {
  version: '1.0.0',
  defaultProvider: 'openai',
  providers: {
    openai: {
      model: 'gpt-4o',
      temperature: 0.3,
    },
    anthropic: {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
    },
    deepseek: {
      model: 'deepseek-chat',
      temperature: 0.3,
    },
    local: {
      model: 'llama3',
      temperature: 0.3,
      baseUrl: 'http://localhost:11434/v1',
    },
  },
  review: {
    security: true,
    performance: true,
    codeSmells: true,
    bestPractices: true,
    severities: ['error', 'warning', 'info', 'hint'],
    maxFiles: 50,
    ignorePaths: ['node_modules', 'dist', '.git', '*.lock', '*.min.js'],
  },
  pr: {
    autoDescription: true,
    autoReview: true,
    autoSummarize: true,
    maxDiffSize: 100000,
  },
  generation: {
    language: 'typescript',
    includeTests: true,
    includeDocs: true,
  },
  documentation: {
    outputDir: './docs',
    style: 'jsdoc',
    changelog: true,
    readme: true,
    apiFormat: 'markdown',
  },
  cli: {
    outputFormat: 'text',
    interactive: false,
    colors: true,
    logLevel: 'info',
  },
};
