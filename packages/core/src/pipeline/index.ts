/**
 * Pipeline module — full processing pipeline for AI analysis.
 *
 * The pipeline follows: Context → Analyze → Transform → Output
 *
 * @module pipeline
 */

export { ContextManager, ContextItem, ContextType, ContextMetadata, ContextOptions, ContextProvider } from './context.js';
export { Analyzer, AnalyzeOptions, AnalyzeResult } from './analyze.js';
export { Transformer, TransformFn, TransformOptions } from './transform.js';
export { OutputHandler, OutputFormat, OutputDestination, OutputOptions, OutputResult } from './output.js';

import type { AIProvider } from '../provider/base.js';
import { ContextManager, ContextOptions } from './context.js';
import { Analyzer, AnalyzeOptions } from './analyze.js';
import { Transformer } from './transform.js';
import { OutputHandler, OutputOptions } from './output.js';

/** Pipeline configuration */
export interface PipelineConfig {
  context?: ContextOptions;
  analyze: AnalyzeOptions;
  transform?: string[];
  output?: OutputOptions;
}

/** Pipeline result */
export interface PipelineResult {
  output: string;
  formatted: string;
  metadata: {
    type: string;
    model: string;
    durationMs: number;
  };
}

/**
 * The main processing pipeline.
 * Orchestrates context gathering, AI analysis, transformation, and output.
 *
 * @example
 * ```typescript
 * const pipeline = new Pipeline(provider);
 * const result = await pipeline.run({
 *   analyze: { type: 'review' },
 *   output: { format: 'markdown' }
 * });
 * ```
 */
export class Pipeline {
  private provider: AIProvider;
  private contextManager: ContextManager;
  private analyzer: Analyzer;
  private transformer: Transformer;

  constructor(provider: AIProvider) {
    this.provider = provider;
    this.contextManager = new ContextManager();
    this.analyzer = new Analyzer(provider);
    this.transformer = new Transformer();
  }

  /**
   * Get the context manager for adding context items
   */
  get context(): ContextManager {
    return this.contextManager;
  }

  /**
   * Run the full pipeline
   * @param config - Pipeline configuration
   * @returns The pipeline result
   */
  async run(config: PipelineConfig): Promise<PipelineResult> {
    // Step 1: Analyze
    const analysisResult = await this.analyzer.analyze(this.contextManager, config.analyze);

    // Step 2: Transform (if transforms specified)
    let transformed = analysisResult;
    if (config.transform && config.transform.length > 0) {
      transformed = await this.transformer.apply(analysisResult, config.transform);
    }

    // Step 3: Output
    const outputHandler = new OutputHandler(config.output);
    const outputResult = await outputHandler.output(transformed);

    return {
      output: transformed.output,
      formatted: outputResult.formatted,
      metadata: transformed.metadata,
    };
  }
}
