/**
 * Pipeline transform step — modifies and transforms analysis results.
 *
 * @module pipeline/transform
 */

import type { AnalyzeResult } from './analyze.js';

/** Transform function type */
export type TransformFn = (input: AnalyzeResult) => Promise<AnalyzeResult>;

/** Transform pipeline options */
export interface TransformOptions {
  /** Transform steps to apply in order */
  transforms?: string[];
  /** Custom transform implementations */
  customTransforms?: Record<string, TransformFn>;
}

/**
 * Pipeline transformer.
 * Applies a series of transformations to analysis results.
 */
export class Transformer {
  private transforms: Map<string, TransformFn>;

  constructor() {
    this.transforms = new Map();
    this.registerBuiltinTransforms();
  }

  /**
   * Register a custom transform
   * @param name - Transform name
   * @param fn - Transform function
   */
  register(name: string, fn: TransformFn): void {
    if (this.transforms.has(name)) {
      throw new Error(`Transform "${name}" is already registered`);
    }
    this.transforms.set(name, fn);
  }

  /**
   * Apply a list of transforms to a result
   * @param result - The analysis result to transform
   * @param transformNames - Ordered list of transform names to apply
   * @returns The transformed result
   */
  async apply(result: AnalyzeResult, transformNames: string[]): Promise<AnalyzeResult> {
    let current = result;

    for (const name of transformNames) {
      const transformFn = this.transforms.get(name);
      if (!transformFn) {
        throw new Error(`Unknown transform: "${name}"`);
      }
      current = await transformFn(current);
    }

    return current;
  }

  /**
   * List available transforms
   */
  listTransforms(): string[] {
    return Array.from(this.transforms.keys());
  }

  /**
   * Register built-in transforms
   */
  private registerBuiltinTransforms(): void {
    /** Strip markdown code fences from output */
    this.transforms.set('strip-fences', async (result) => ({
      ...result,
      output: result.output
        .replace(/```[\w]*
/g, '')
        .replace(/```\s*$/gm, '')
        .trim(),
    }));

    /** Trim whitespace and normalize newlines */
    this.transforms.set('normalize', async (result) => ({
      ...result,
      output: result.output
        .replace(/
/g, '
')
        .replace(/
{3,}/g, '

')
        .trim(),
    }));

    /** Add metadata header to output */
    this.transforms.set('add-metadata', async (result) => ({
      ...result,
      output: [
        `<!-- Analysis: ${result.metadata.type} | Model: ${result.metadata.model} | Duration: ${result.metadata.durationMs}ms -->`,
        '',
        result.output,
      ].join('
'),
    }));

    /** Extract code blocks only */
    this.transforms.set('code-only', async (result) => {
      const codeBlocks = result.output.match(/```[\w]*
([\s\S]*?)```/g);
      if (!codeBlocks) return { ...result, output: '' };
      return {
        ...result,
        output: codeBlocks
          .map((block) => block.replace(/```[\w]*
/, '').replace(/```$/, ''))
          .join('

')
          .trim(),
      };
    });

    /** Format as JSON structure */
    this.transforms.set('format-json', async (result) => {
      try {
        const parsed = JSON.parse(result.output);
        return {
          ...result,
          output: JSON.stringify(parsed, null, 2),
          parsed,
        };
      } catch {
        return result;
      }
    });
  }
}
