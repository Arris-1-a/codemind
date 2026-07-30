/**
 * Pipeline analysis step — processes context through AI for analysis.
 *
 * @module pipeline/analyze
 */

import type { AIProvider, CompletionRequest } from '../provider/base.js';
import type { ContextManager } from './context.js';

/** Analysis request options */
export interface AnalyzeOptions {
  /** Analysis type or purpose */
  type: string;
  /** System prompt to guide the analysis */
  systemPrompt?: string;
  /** User prompt or instruction */
  userPrompt?: string;
  /** Model to use (defaults to provider default) */
  model?: string;
  /** Temperature for generation */
  temperature?: number;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Additional instructions */
  instructions?: string[];
  /** Expected output format */
  outputFormat?: 'text' | 'json' | 'markdown';
}

/** Analysis result */
export interface AnalyzeResult {
  /** The analysis output */
  output: string;
  /** Parsed JSON output (if outputFormat was 'json') */
  parsed?: unknown;
  /** Metadata about the analysis */
  metadata: {
    type: string;
    model: string;
    tokensUsed?: number;
    durationMs: number;
    contextItems: number;
  };
}

/**
 * Pipeline analyzer.
 * Takes context and sends it through the AI provider for analysis.
 */
export class Analyzer {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Analyze context with the AI provider
   * @param context - The context manager with gathered context
   * @param options - Analysis options
   * @returns The analysis result
   */
  async analyze(context: ContextManager, options: AnalyzeOptions): Promise<AnalyzeResult> {
    const startTime = Date.now();

    const contextStr = context.buildContext();
    const systemPrompt = options.systemPrompt || this.buildDefaultSystemPrompt(options.type);
    const userPrompt = options.userPrompt || this.buildDefaultUserPrompt(options);

    const instructions = (options.instructions || []).join('
');

    const request: CompletionRequest = {
      model: options.model || '',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${contextStr}

${instructions}

${userPrompt}`,
        },
      ],
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 4096,
    };

    try {
      const response = await this.provider.complete(request);
      const output = response.message.content;

      const result: AnalyzeResult = {
        output,
        metadata: {
          type: options.type,
          model: response.model,
          tokensUsed: response.usage?.totalTokens,
          durationMs: Date.now() - startTime,
          contextItems: context.getItems().length,
        },
      };

      // Parse JSON if requested
      if (options.outputFormat === 'json') {
        result.parsed = this.extractJSON(output);
      }

      return result;
    } catch (error) {
      throw new Error(
        `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Extract JSON from a string that may have markdown code blocks
   */
  private extractJSON(text: string): unknown {
    // Try to find JSON in markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Try to find the first { } or [ ] block
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Build a default system prompt for the analysis type
   */
  private buildDefaultSystemPrompt(type: string): string {
    const prompts: Record<string, string> = {
      review: 'You are an expert code reviewer. Analyze the provided code for bugs, security issues, performance problems, and best practice violations. Be specific and actionable.',
      summarize: 'You are a technical writer. Summarize the provided context clearly and concisely. Focus on key changes and their impact.',
      generate: 'You are a skilled software engineer. Generate high-quality code based on the provided specification and context.',
      document: 'You are a technical documentation specialist. Generate comprehensive documentation from the provided code.',
      default: 'You are an AI development assistant. Analyze the provided context and respond helpfully.',
    };
    return prompts[type] || prompts['default'];
  }

  /**
   * Build a default user prompt from options
   */
  private buildDefaultUserPrompt(options: AnalyzeOptions): string {
    const prompts: Record<string, string> = {
      review: 'Please review the above code. Identify any issues and suggest improvements.',
      summarize: 'Please summarize the above changes.',
      generate: 'Please generate code based on the above context and specification.',
      document: 'Please generate documentation for the above code.',
      default: 'Please analyze the above context.',
    };
    return prompts[options.type] || prompts['default'];
  }
}
