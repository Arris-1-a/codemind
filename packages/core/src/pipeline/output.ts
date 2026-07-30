/**
 * Pipeline output step — formats and writes analysis results.
 *
 * @module pipeline/output
 */

import type { AnalyzeResult } from './analyze.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/** Output format types */
export type OutputFormat = 'text' | 'json' | 'markdown' | 'sarif' | 'html';

/** Output destination types */
export type OutputDestination = 'stdout' | 'file' | 'callback';

/** Output options */
export interface OutputOptions {
  /** Output format */
  format?: OutputFormat;
  /** Output destination */
  destination?: OutputDestination;
  /** File path (when destination is 'file') */
  filePath?: string;
  /** Callback function (when destination is 'callback') */
  callback?: (result: string, metadata: AnalyzeResult['metadata']) => void | Promise<void>;
  /** Whether to include metadata in output */
  includeMetadata?: boolean;
  /** Whether to use colors in terminal output */
  useColors?: boolean;
}

/** Output result */
export interface OutputResult {
  /** The formatted output string */
  formatted: string;
  /** Where the output was sent */
  destination: OutputDestination;
  /** File path if written to file */
  filePath?: string;
}

/** ANSI color codes for terminal output */
const COLORS = {
  reset: '[0m',
  red: '[31m',
  green: '[32m',
  yellow: '[33m',
  blue: '[34m',
  magenta: '[35m',
  cyan: '[36m',
  gray: '[90m',
  bold: '[1m',
};

/**
 * Pipeline output handler.
 * Formats and outputs analysis results to various destinations.
 */
export class OutputHandler {
  private options: OutputOptions;

  constructor(options: OutputOptions = {}) {
    this.options = {
      format: 'text',
      destination: 'stdout',
      includeMetadata: true,
      useColors: true,
      ...options,
    };
  }

  /**
   * Output an analysis result
   * @param result - The analysis result to output
   * @returns Output result with formatted content and destination
   */
  async output(result: AnalyzeResult): Promise<OutputResult> {
    const formatted = this.format(result, this.options.format!);

    switch (this.options.destination) {
      case 'file':
        return this.writeFile(formatted, result.metadata);
      case 'callback':
        return this.handleCallback(formatted, result.metadata);
      case 'stdout':
      default:
        return this.writeStdout(formatted);
    }
  }

  /**
   * Format the analysis result
   */
  private format(result: AnalyzeResult, format: OutputFormat): string {
    switch (format) {
      case 'json':
        return this.formatJSON(result);
      case 'markdown':
        return this.formatMarkdown(result);
      case 'sarif':
        return this.formatSARIF(result);
      case 'html':
        return this.formatHTML(result);
      case 'text':
      default:
        return this.formatText(result);
    }
  }

  /**
   * Format as plain text with optional colors
   */
  private formatText(result: AnalyzeResult): string {
    const lines: string[] = [];

    if (this.options.includeMetadata) {
      const c = this.options.useColors ? COLORS : { reset: '', gray: '', bold: '', cyan: '' };
      lines.push(`${c.gray}── Analysis Result ──${c.reset}`);
      lines.push(`${c.gray}Type: ${result.metadata.type} | Model: ${result.metadata.model} | Duration: ${result.metadata.durationMs}ms${c.reset}`);
      lines.push('');
    }

    lines.push(result.output);

    return lines.join('
');
  }

  /**
   * Format as JSON
   */
  private formatJSON(result: AnalyzeResult): string {
    return JSON.stringify(
      {
        type: result.metadata.type,
        model: result.metadata.model,
        durationMs: result.metadata.durationMs,
        tokensUsed: result.metadata.tokensUsed,
        output: result.output,
        parsed: result.parsed,
      },
      null,
      2,
    );
  }

  /**
   * Format as Markdown
   */
  private formatMarkdown(result: AnalyzeResult): string {
    const lines: string[] = [];
    lines.push(`# Analysis: ${result.metadata.type}`);
    lines.push('');
    if (this.options.includeMetadata) {
      lines.push(`> **Model:** ${result.metadata.model} | **Duration:** ${result.metadata.durationMs}ms`);
      if (result.metadata.tokensUsed) {
        lines.push(`> **Tokens:** ${result.metadata.tokensUsed}`);
      }
      lines.push('');
    }
    lines.push(result.output);
    return lines.join('
');
  }

  /**
   * Format as SARIF (Static Analysis Results Interchange Format)
   */
  private formatSARIF(result: AnalyzeResult): string {
    const sarif = {
      version: '2.1.0',
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'codemind',
              informationUri: 'https://github.com/Arris-1-a/codemind',
            },
          },
          results: [
            {
              message: { text: result.output },
              kind: 'informational',
            },
          ],
        },
      ],
    };
    return JSON.stringify(sarif, null, 2);
  }

  /**
   * Format as HTML
   */
  private formatHTML(result: AnalyzeResult): string {
    const meta = result.metadata;
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Codemind Analysis</title></head>
<body>
<h1>Analysis: ${this.escapeHtml(meta.type)}</h1>
<p>Model: ${this.escapeHtml(meta.model)} | Duration: ${meta.durationMs}ms</p>
<pre>${this.escapeHtml(result.output)}</pre>
</body>
</html>`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Write formatted output to stdout
   */
  private async writeStdout(formatted: string): Promise<OutputResult> {
    process.stdout.write(formatted + '
');
    return { formatted, destination: 'stdout' };
  }

  /**
   * Write formatted output to a file
   */
  private async writeFile(
    formatted: string,
    metadata: AnalyzeResult['metadata'],
  ): Promise<OutputResult> {
    const filePath = this.options.filePath || `./codemind-output-${Date.now()}.md`;
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, formatted, 'utf-8');

    return {
      formatted,
      destination: 'file',
      filePath,
    };
  }

  /**
   * Handle output via callback
   */
  private async handleCallback(
    formatted: string,
    metadata: AnalyzeResult['metadata'],
  ): Promise<OutputResult> {
    if (this.options.callback) {
      await this.options.callback(formatted, metadata);
    }
    return { formatted, destination: 'callback' };
  }
}
