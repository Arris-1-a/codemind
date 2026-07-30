/**
 * Review reporter — generates review reports in various formats.
 *
 * @module review/reporter
 */

import type { ReviewResult, ReviewSummary } from './analyzer.js';
import type { ReviewFinding, Severity } from './rules/index.js';

/** Report format types */
export type ReportFormat = 'markdown' | 'json' | 'sarif' | 'compact' | 'comment';

/** Reporter options */
export interface ReporterOptions {
  /** Output format */
  format?: ReportFormat;
  /** Include severity emojis in output */
  useEmojis?: boolean;
  /** Include code snippets */
  includeSnippets?: boolean;
  /** Maximum findings to include */
  maxFindings?: number;
  /** Custom title for the report */
  title?: string;
}

/**
 * Report generator for code review results.
 */
export class Reporter {
  private options: Required<ReporterOptions>;

  constructor(options: ReporterOptions = {}) {
    this.options = {
      format: 'markdown',
      useEmojis: true,
      includeSnippets: true,
      maxFindings: 100,
      title: 'Code Review Report',
      ...options,
    };
  }

  /**
   * Generate a report from review results
   * @param result - The review result
   * @returns Formatted report string
   */
  generate(result: ReviewResult): string {
    switch (this.options.format) {
      case 'json': return this.generateJSON(result);
      case 'sarif': return this.generateSARIF(result);
      case 'compact': return this.generateCompact(result);
      case 'comment': return this.generateComment(result);
      case 'markdown':
      default: return this.generateMarkdown(result);
    }
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdown(result: ReviewResult): string {
    const { findings, summary, metadata } = result;
    const lines: string[] = [];

    // Title
    lines.push(`# ${this.options.title}`);
    lines.push('');
    lines.push(`> ${this.formatMeta(metadata)}`);
    lines.push('');

    // Score
    lines.push(this.formatScoreBadge(summary));
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('| --- | --- |');
    for (const [cat, count] of Object.entries(summary.byCategory)) {
      if (count > 0) {
        const emoji = this.categoryEmoji(cat as string);
        lines.push(`| ${emoji} ${cat} | ${count} |`);
      }
    }
    lines.push('');

    // Severity breakdown
    lines.push('| Severity | Count |');
    lines.push('| --- | --- |');
    for (const [sev, count] of Object.entries(summary.bySeverity)) {
      if (count > 0) {
        const sevEmoji = this.severityEmoji(sev as Severity);
        lines.push(`| ${sevEmoji} ${sev} | ${count} |`);
      }
    }
    lines.push('');

    // Findings
    if (findings.length === 0) {
      lines.push('## Findings');
      lines.push('');
      lines.push('✅ No issues found! Great job!');
      return lines.join('
');
    }

    lines.push('## Findings');
    lines.push('');

    const displayFindings = findings.slice(0, this.options.maxFindings);
    let currentFile = '';

    for (const finding of displayFindings) {
      // File header
      if (finding.file !== currentFile) {
        currentFile = finding.file;
        lines.push(`### ${currentFile}`);
        lines.push('');
      }

      const emoji = this.severityEmoji(finding.rule.severity);
      lines.push(`- **${emoji} [${finding.rule.severity.toUpperCase()}] ${finding.rule.id}**: ${finding.rule.title}`);
      lines.push(`  ${finding.rule.description}`);

      if (finding.line) {
        lines.push(`  📍 Line ${finding.line}`);
      }
      if (this.options.includeSnippets && finding.snippet) {
        lines.push('  ```');
        lines.push(`  ${finding.snippet}`);
        lines.push('  ```');
      }
      if (finding.suggestion) {
        lines.push(`  💡 ${finding.suggestion}`);
      }
      lines.push('');
    }

    if (findings.length > this.options.maxFindings) {
      lines.push(`> Showing ${this.options.maxFindings} of ${findings.length} findings`);
      lines.push('');
    }

    return lines.join('
');
  }

  /**
   * Generate JSON report
   */
  private generateJSON(result: ReviewResult): string {
    return JSON.stringify(
      {
        title: this.options.title,
        metadata: result.metadata,
        summary: result.summary,
        findings: result.findings.slice(0, this.options.maxFindings),
      },
      null,
      2,
    );
  }

  /**
   * Generate SARIF report
   */
  private generateSARIF(result: ReviewResult): string {
    const sarifResults = result.findings.map((f) => ({
      ruleId: f.rule.id,
      message: {
        text: f.rule.title + ': ' + f.rule.description,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: f.file },
            region: f.line ? { startLine: f.line } : undefined,
          },
        },
      ],
    }));

    return JSON.stringify(
      {
        version: '2.1.0',
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        runs: [
          {
            tool: {
              driver: {
                name: 'codemind',
                informationUri: 'https://github.com/Arris-1-a/codemind',
                rules: result.findings.map((f) => ({
                  id: f.rule.id,
                  shortDescription: { text: f.rule.title },
                  fullDescription: { text: f.rule.description },
                })),
              },
            },
            results: sarifResults,
          },
        ],
      },
      null,
      2,
    );
  }

  /**
   * Generate compact one-line-per-finding report
   */
  private generateCompact(result: ReviewResult): string {
    const lines: string[] = [];
    lines.push(`${this.options.title} — ${result.metadata.filesReviewed} files, ${result.findings.length} findings`);
    lines.push('='.repeat(60));

    for (const f of result.findings) {
      const sev = f.rule.severity.toUpperCase();
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      lines.push(`[${sev}] ${f.rule.id}: ${loc} - ${f.rule.title}`);
    }

    return lines.join('
');
  }

  /**
   * Generate PR comment-friendly report
   */
  private generateComment(result: ReviewResult): string {
    const lines: string[] = [];
    
    // PR comment header
    lines.push('## 🤖 Codemind Review');
    lines.push('');
    lines.push(this.formatScoreBadge(result.summary));
    lines.push('');

    if (result.findings.length === 0) {
      lines.push('✅ **All clear!** No issues found in this review.');
      lines.push('');
      lines.push(`*Reviewed ${result.metadata.filesReviewed} files in ${result.metadata.durationMs}ms*`);
      return lines.join('
');
    }

    // Group findings by file
    const byFile = new Map<string, ReviewFinding[]>();
    for (const f of result.findings) {
      const list = byFile.get(f.file) || [];
      list.push(f);
      byFile.set(f.file, list);
    }

    for (const [file, findings] of byFile) {
      lines.push(`<details>`);
      lines.push(`<summary>📄 <strong>${file}</strong> (${findings.length} finding${findings.length > 1 ? 's' : ''})</summary>`);
      lines.push('');
      lines.push('| Severity | ID | Issue | Line |');
      lines.push('| --- | --- | --- | --- |');
      for (const f of findings.slice(0, 20)) {
        const emoji = this.severityEmoji(f.rule.severity);
        const line = f.line || '-';
        lines.push(`| ${emoji} ${f.rule.severity} | ${f.rule.id} | ${f.rule.title} | ${line} |`);
      }
      lines.push('</details>');
      lines.push('');
    }

    lines.push('---');
    lines.push(`*Reviewed ${result.metadata.filesReviewed} files in ${result.metadata.durationMs}ms • Score: ${result.summary.score}/100*`);

    return lines.join('
');
  }

  /**
   * Format score badge
   */
  private formatScoreBadge(summary: ReviewSummary): string {
    const score = summary.score;
    let color: string;
    let emoji: string;
    if (score >= 90) { color = 'green'; emoji = '🟢'; }
    else if (score >= 70) { color = 'yellow'; emoji = '🟡'; }
    else if (score >= 50) { color = 'orange'; emoji = '🟠'; }
    else { color = 'red'; emoji = '🔴'; }

    if (this.options.useEmojis) {
      return `${emoji} **Review Score: ${score}/100**`;
    }
    return `**Review Score: ${score}/100**`;
  }

  /**
   * Get emoji for severity level
   */
  private severityEmoji(severity: Severity): string {
    if (!this.options.useEmojis) return '';
    const emojis: Record<Severity, string> = {
      error: '🔴',
      warning: '🟡',
      info: '🔵',
      hint: '⚪',
    };
    return emojis[severity];
  }

  /**
   * Get emoji for rule category
   */
  private categoryEmoji(category: string): string {
    if (!this.options.useEmojis) return '';
    const emojis: Record<string, string> = {
      security: '🔒',
      performance: '⚡',
      'code-smell': '👃',
      'best-practice': '✅',
      style: '🎨',
    };
    return emojis[category] || '📋';
  }

  /**
   * Format metadata string
   */
  private formatMeta(metadata: ReviewResult['metadata']): string {
    return [
      `Files: ${metadata.filesReviewed}`,
      `Lines: ${metadata.linesReviewed}`,
      `Duration: ${metadata.durationMs}ms`,
      `Rules: ${metadata.rulesApplied}`,
      `At: ${metadata.reviewedAt}`,
    ].join(' | ');
  }
}
