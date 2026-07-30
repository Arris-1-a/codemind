/**
 * PR Reviewer — automatic PR review with inline comments.
 *
 * @module pr/reviewer
 */

import type { AIProvider } from '@codemind/core';
import type { DiffResult, FileDiff, DiffLine } from '@codemind/review';

/** Review comment */
export interface ReviewComment {
  /** File path */
  file: string;
  /** Line number */
  line?: number;
  /** Comment body */
  body: string;
  /** Comment type */
  type: 'suggestion' | 'question' | 'praise' | 'issue' | 'nitpick';
  /** Suggested code change */
  suggestion?: {
    old: string;
    new: string;
  };
}

/** Review summary */
export interface ReviewSummary {
  /** Overall verdict */
  verdict: 'approve' | 'comment' | 'request_changes';
  /** Summary message */
  summary: string;
  /** Detailed review body */
  body: string;
  /** Individual comments */
  comments: ReviewComment[];
}

/** Reviewer options */
export interface ReviewerOptions {
  /** Review focus areas */
  focus?: ('security' | 'performance' | 'readability' | 'testing' | 'architecture')[];
  /** Whether to be strict */
  strict?: boolean;
  /** Maximum comments to generate */
  maxComments?: number;
}

/**
 * PR Reviewer.
 * Performs automated review of pull request changes.
 */
export class Reviewer {
  private provider?: AIProvider;
  private options: Required<ReviewerOptions>;

  constructor(provider?: AIProvider, options: ReviewerOptions = {}) {
    this.provider = provider;
    this.options = {
      focus: options.focus || ['security', 'performance', 'readability', 'testing', 'architecture'],
      strict: options.strict || false,
      maxComments: options.maxComments || 30,
    };
  }

  /**
   * Review a diff
   */
  async review(diff: DiffResult): Promise<ReviewSummary> {
    if (this.provider) {
      return this.aiReview(diff);
    }
    return this.staticReview(diff);
  }

  /**
   * Static rule-based review
   */
  private staticReview(diff: DiffResult): ReviewSummary {
    const comments: ReviewComment[] = [];

    for (const file of diff.files) {
      // Large file warning
      if (file.summary.linesAdded > 200) {
        comments.push({
          file: file.newPath,
          body: `This file has a large number of additions (${file.summary.linesAdded} lines). Consider splitting into smaller, focused files.`,
          type: 'suggestion',
        });
      }

      // Deleted file without replacement
      if (file.changeType === 'deleted' && diff.files.every((f) => f.newPath !== file.oldPath)) {
        comments.push({
          file: file.oldPath,
          body: 'This file is being deleted. Ensure no other code depends on it.',
          type: 'question',
        });
      }

      // Check each hunk
      for (const hunk of file.hunks) {
        this.reviewHunk(file, hunk.lines, comments);
      }
    }

    return {
      verdict: this.determineVerdict(comments),
      summary: this.buildSummary(diff, comments),
      body: this.buildBody(diff, comments),
      comments: comments.slice(0, this.options.maxComments),
    };
  }

  /**
   * Review a single hunk's lines
   */
  private reviewHunk(file: FileDiff, lines: DiffLine[], comments: ReviewComment[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.type !== 'added') continue;

      const content = line.content.trim();

      // Check for console.log
      if (content.includes('console.log') || content.includes('console.debug')) {
        comments.push({
          file: file.newPath,
          line: line.newNumber,
          body: 'Avoid using `console.log` in production code. Use a proper logger.',
          type: 'nitpick',
          suggestion: {
            old: content,
            new: content.replace(/console\.log|console\.debug/, 'logger.info'),
          },
        });
      }

      // Check for TODO/FIXME
      if (/\/\/\s*(TODO|FIXME|HACK)/.test(content)) {
        const match = content.match(/\/\/\s*(TODO|FIXME|HACK)\s*(.*)/);
        comments.push({
          file: file.newPath,
          line: line.newNumber,
          body: `Remaining \`${match?.[1]}\` comment: "${match?.[2] || 'no description'}". Please address or create an issue.`,
          type: 'issue',
        });
      }

      // Check for long lines
      if (line.content.length > 120) {
        comments.push({
          file: file.newPath,
          line: line.newNumber,
          body: `This line is ${line.content.length} characters long. Consider wrapping at 100 characters for readability.`,
          type: 'nitpick',
        });
      }

      // Check for debugger statements
      if (content.includes('debugger')) {
        comments.push({
          file: file.newPath,
          line: line.newNumber,
          body: 'Remove `debugger` statement before merging.',
          type: 'issue',
        });
      }

      // Check for any usage
      if (this.options.strict && /:\s*any/.test(content)) {
        comments.push({
          file: file.newPath,
          line: line.newNumber,
          body: 'Avoid using `any` type. Use a more specific type.',
          type: 'suggestion',
        });
      }
    }
  }

  /**
   * AI-powered review
   */
  private async aiReview(diff: DiffResult): Promise<ReviewSummary> {
    if (!this.provider) {
      return this.staticReview(diff);
    }

    const diffSummary = diff.files
      .map((f) => `${f.changeType}: ${f.newPath} (+${f.summary.linesAdded}/-${f.summary.linesRemoved})`)
      .join('
');

    const response = await this.provider.complete({
      model: '',
      messages: [
        {
          role: 'system',
          content: `You are an expert code reviewer. Review the PR changes. Focus on: ${this.options.focus.join(', ')}. ${this.options.strict ? 'Be thorough and strict.' : 'Be helpful and constructive.'}`,
        },
        {
          role: 'user',
          content: `Review this PR:

Changed files:
${diffSummary}

Raw diff:
${diff.raw.slice(0, 8000)}`,
        },
      ],
      maxTokens: 4096,
    });

    return {
      verdict: 'comment',
      summary: 'AI-powered review',
      body: response.message.content,
      comments: [],
    };
  }

  /**
   * Determine the review verdict
   */
  private determineVerdict(comments: ReviewComment[]): ReviewSummary['verdict'] {
    const issues = comments.filter((c) => c.type === 'issue');
    const suggestions = comments.filter((c) => c.type === 'suggestion');

    if (issues.length > 0 && this.options.strict) {
      return 'request_changes';
    }
    if (issues.length > 0 || suggestions.length > 5) {
      return 'comment';
    }
    return 'approve';
  }

  /**
   * Build review summary
   */
  private buildSummary(diff: DiffResult, comments: ReviewComment[]): string {
    const parts: string[] = [];

    if (comments.length === 0) {
      parts.push('✅ **LGTM!** No issues found.');
    } else {
      const issues = comments.filter((c) => c.type === 'issue').length;
      const suggestions = comments.filter((c) => c.type === 'suggestion').length;
      const nits = comments.filter((c) => c.type === 'nitpick').length;

      if (issues > 0) parts.push(`🔴 ${issues} issue${issues > 1 ? 's' : ''} found`);
      if (suggestions > 0) parts.push(`💡 ${suggestions} suggestion${suggestions > 1 ? 's' : ''}`);
      if (nits > 0) parts.push(`📝 ${nits} nitpick${nits > 1 ? 's' : ''}`);
    }

    return parts.join(', ') || 'Review complete';
  }

  /**
   * Build detailed review body
   */
  private buildBody(diff: DiffResult, comments: ReviewComment[]): string {
    const lines: string[] = [];

    lines.push('## Code Review');
    lines.push('');
    lines.push(`Reviewed ${diff.summary.filesChanged} files with ${comments.length} comments.`);
    lines.push('');

    const byFile = new Map<string, ReviewComment[]>();
    for (const c of comments) {
      const list = byFile.get(c.file) || [];
      list.push(c);
      byFile.set(c.file, list);
    }

    for (const [file, fileComments] of byFile) {
      lines.push(`### ${file}`);
      for (const c of fileComments) {
        const icon = {
          suggestion: '💡',
          question: '❓',
          praise: '🌟',
          issue: '🔴',
          nitpick: '📝',
        }[c.type];
        lines.push(`- ${icon} ${c.body}`);
      }
      lines.push('');
    }

    return lines.join('
');
  }
}
