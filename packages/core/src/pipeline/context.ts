/**
 * Pipeline context — gathers and prepares context for AI processing.
 *
 * @module pipeline/context
 */

import type { AIProvider } from '../provider/base.js';

/** Types of context that can be gathered */
export type ContextType = 'file' | 'diff' | 'directory' | 'git' | 'custom';

/** A single context item */
export interface ContextItem {
  /** Unique identifier */
  id: string;
  /** Context type */
  type: ContextType;
  /** Content of the context */
  content: string;
  /** Metadata about the context */
  metadata: ContextMetadata;
  /** Source file path (if applicable) */
  path?: string;
  /** Language of the content */
  language?: string;
}

/** Metadata for context items */
export interface ContextMetadata {
  /** File or source size in bytes */
  size?: number;
  /** Last modified timestamp */
  modifiedAt?: string;
  /** Git branch */
  branch?: string;
  /** Commit hash */
  commit?: string;
  /** Custom tags */
  tags?: string[];
  /** Additional data */
  extra?: Record<string, unknown>;
}

/** Context gathering options */
export interface ContextOptions {
  /** Maximum total context size in tokens */
  maxTokens?: number;
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Whether to include git metadata */
  includeGitMeta?: boolean;
  /** Custom context providers */
  providers?: ContextProvider[];
}

/** Context provider interface */
export interface ContextProvider {
  readonly name: string;
  gather(options: ContextOptions): Promise<ContextItem[]>;
}

/**
 * Pipeline context manager.
 * Gathers, manages, and prepares context for the AI pipeline.
 */
export class ContextManager {
  private items: ContextItem[] = [];
  private options: ContextOptions;

  constructor(options: ContextOptions = {}) {
    this.options = {
      maxTokens: 100000,
      includeGitMeta: true,
      ...options,
    };
  }

  /**
   * Add a context item
   */
  addItem(item: ContextItem): void {
    this.items.push(item);
  }

  /**
   * Add multiple context items
   */
  addItems(items: ContextItem[]): void {
    this.items.push(...items);
  }

  /**
   * Get all context items
   */
  getItems(): ContextItem[] {
    return [...this.items];
  }

  /**
   * Get items filtered by type
   */
  getItemsByType(type: ContextType): ContextItem[] {
    return this.items.filter((item) => item.type === type);
  }

  /**
   * Get items filtered by path pattern
   */
  getItemsByPath(pattern: RegExp): ContextItem[] {
    return this.items.filter((item) => item.path && pattern.test(item.path));
  }

  /**
   * Clear all context items
   */
  clear(): void {
    this.items = [];
  }

  /**
   * Calculate total token count for all context
   */
  async totalTokens(provider: AIProvider): Promise<number> {
    let total = 0;
    for (const item of this.items) {
      total += await provider.countTokens(item.content);
    }
    return total;
  }

  /**
   * Build a formatted context string for AI consumption
   */
  buildContext(): string {
    const parts: string[] = [];

    for (const item of this.items) {
      const header = this.buildItemHeader(item);
      parts.push(`${header}
${'-'.repeat(60)}
${item.content}
`);
    }

    return parts.join('
');
  }

  /**
   * Build a summary of the context
   */
  buildSummary(): string {
    const byType = new Map<ContextType, number>();
    let totalSize = 0;

    for (const item of this.items) {
      byType.set(item.type, (byType.get(item.type) || 0) + 1);
      totalSize += item.content.length;
    }

    const typeBreakdown = Array.from(byType.entries())
      .map(([type, count]) => `  - ${type}: ${count} items`)
      .join('
');

    return `Context Summary:
Total items: ${this.items.length}
Total size: ${(totalSize / 1024).toFixed(1)} KB
By type:
${typeBreakdown}`;
  }

  /**
   * Build a header for a context item
   */
  private buildItemHeader(item: ContextItem): string {
    const parts: string[] = [];
    if (item.path) parts.push(item.path);
    if (item.language) parts.push(`(${item.language})`);
    if (item.metadata.commit) parts.push(`[${item.metadata.commit.slice(0, 7)}]`);
    return parts.length > 0 ? `=== ${parts.join(' ')} ===` : '=== Context ===';
  }
}
