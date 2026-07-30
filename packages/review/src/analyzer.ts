/**
 * Code analyzer — performs static analysis and pattern matching for code review.
 *
 * @module review/analyzer
 */

import type { FileDiff, DiffResult } from './differ.js';
import {
  REVIEW_RULES,
  ReviewFinding,
  ReviewRule,
  Severity,
  RuleCategory,
} from './rules/index.js';

/** Analyzer configuration options */
export interface AnalyzerOptions {
  /** Categories to check */
  categories?: RuleCategory[];
  /** Minimum severity to report */
  minSeverity?: Severity;
  /** Files to ignore */
  ignorePaths?: string[];
  /** Custom rules to apply */
  customRules?: ReviewRule[];
}

/** Overall review result */
export interface ReviewResult {
  /** All findings */
  findings: ReviewFinding[];
  /** Summary statistics */
  summary: ReviewSummary;
  /** Review metadata */
  metadata: ReviewMetadata;
}

/** Review summary statistics */
export interface ReviewSummary {
  /** Total findings */
  totalFindings: number;
  /** Findings by severity */
  bySeverity: Record<Severity, number>;
  /** Findings by category */
  byCategory: Record<RuleCategory, number>;
  /** Findings by file */
  byFile: Record<string, number>;
  /** Score from 0-100 (higher is better) */
  score: number;
}

/** Review metadata */
export interface ReviewMetadata {
  /** When the review was performed */
  reviewedAt: string;
  /** Number of files reviewed */
  filesReviewed: number;
  /** Total lines reviewed */
  linesReviewed: number;
  /** Duration in ms */
  durationMs: number;
  /** Rules applied count */
  rulesApplied: number;
}

/**
 * Code Analyzer.
 * Performs pattern-based static analysis on code changes.
 */
export class Analyzer {
  private rules: ReviewRule[];
  private options: Required<AnalyzerOptions>;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      categories: options.categories || ['security', 'performance', 'code-smell', 'best-practice'],
      minSeverity: options.minSeverity || 'hint',
      ignorePaths: options.ignorePaths || [],
      customRules: options.customRules || [],
    };
    this.rules = this.buildRuleSet();
  }

  /**
   * Analyze a diff result for code issues
   * @param diff - The parsed diff result
   * @returns Review result with findings
   */
  analyze(diff: DiffResult): ReviewResult {
    const startTime = Date.now();
    const findings: ReviewFinding[] = [];

    for (const file of diff.files) {
      if (this.shouldIgnoreFile(file.newPath)) continue;

      for (const hunk of file.hunks) {
        for (const line of hunk.lines) {
          if (line.type === 'context' || line.type === 'removed') continue;

          const fileFindings = this.analyzeLine(
            file.newPath,
            line.content,
            line.newNumber,
            file.language,
          );
          findings.push(...fileFindings);
        }
      }
    }

    const summary = this.buildSummary(findings);
    const totalLines = diff.files.reduce(
      (sum, f) => sum + f.hunks.reduce((s, h) => s + h.lines.length, 0),
      0,
    );

    return {
      findings,
      summary,
      metadata: {
        reviewedAt: new Date().toISOString(),
        filesReviewed: diff.files.length,
        linesReviewed: totalLines,
        durationMs: Date.now() - startTime,
        rulesApplied: this.rules.length,
      },
    };
  }

  /**
   * Analyze a single line of code
   */
  private analyzeLine(
    filePath: string,
    content: string,
    lineNumber?: number,
    language?: string,
  ): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    for (const rule of this.rules) {
      // Check language filter
      if (rule.languages && rule.languages.length > 0 && language) {
        if (!rule.languages.includes(language)) continue;
      }

      // Check pattern match
      if (rule.patterns && rule.patterns.length > 0) {
        const matched = rule.patterns.some((pattern) =>
          content.toLowerCase().includes(pattern.toLowerCase()),
        );
        if (!matched) continue;
      }

      findings.push({
        rule,
        file: filePath,
        line: lineNumber,
        snippet: content.trim().slice(0, 200),
        suggestion: rule.goodExample
          ? `Consider: ${rule.goodExample}`
          : undefined,
      });
    }

    return findings;
  }

  /**
   * Build the full rule set from defaults and custom rules
   */
  private buildRuleSet(): ReviewRule[] {
    const allRules = [...REVIEW_RULES, ...this.options.customRules];
    return allRules.filter(
      (rule) =>
        this.options.categories.includes(rule.category) &&
        this.severityRank(rule.severity) >= this.severityRank(this.options.minSeverity),
    );
  }

  /**
   * Rank severity for comparison
   */
  private severityRank(severity: Severity): number {
    const ranks: Record<Severity, number> = { error: 3, warning: 2, info: 1, hint: 0 };
    return ranks[severity];
  }

  /**
   * Build summary statistics
   */
  private buildSummary(findings: ReviewFinding[]): ReviewSummary {
    const bySeverity: Record<Severity, number> = { error: 0, warning: 0, info: 0, hint: 0 };
    const byCategory: Record<RuleCategory, number> = {
      security: 0,
      performance: 0,
      'code-smell': 0,
      'best-practice': 0,
      style: 0,
    };
    const byFile: Record<string, number> = {};

    for (const f of findings) {
      bySeverity[f.rule.severity] = (bySeverity[f.rule.severity] || 0) + 1;
      byCategory[f.rule.category] = (byCategory[f.rule.category] || 0) + 1;
      byFile[f.file] = (byFile[f.file] || 0) + 1;
    }

    // Score: subtract points for each finding weighted by severity
    const deductions =
      bySeverity['error'] * 10 +
      bySeverity['warning'] * 5 +
      bySeverity['info'] * 2 +
      bySeverity['hint'] * 1;
    const score = Math.max(0, Math.min(100, 100 - deductions));

    return {
      totalFindings: findings.length,
      bySeverity,
      byCategory,
      byFile,
      score,
    };
  }

  /**
   * Check if a file path should be ignored
   */
  private shouldIgnoreFile(filePath: string): boolean {
    return this.options.ignorePaths.some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  /**
   * Add a custom rule for analysis
   */
  addRule(rule: ReviewRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rules matching a predicate
   */
  removeRules(predicate: (rule: ReviewRule) => boolean): void {
    this.rules = this.rules.filter((r) => !predicate(r));
  }

  /**
   * Get rules grouped by category
   */
  getRulesByCategory(): Record<RuleCategory, ReviewRule[]> {
    const grouped: Record<string, ReviewRule[]> = {};
    for (const rule of this.rules) {
      (grouped[rule.category] ||= []).push(rule);
    }
    return grouped as Record<RuleCategory, ReviewRule[]>;
  }
}
