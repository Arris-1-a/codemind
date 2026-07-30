/**
 * PR Summarizer — generates concise summaries of pull request changes.
 *
 * @module pr/summarizer
 */

import type { AIProvider } from '@codemind/core';
import type { DiffResult } from '@codemind/review';

/** Summarization options */
export interface SummarizeOptions {
  /** Maximum length of the summary in words */
  maxWords?: number;
  /** Include a list of changed files */
  includeFileList?: boolean;
  /** Include risk assessment */
  includeRiskAssessment?: boolean;
  /** Custom focus areas */
  focus?: string[];
  /** Style of summary */
  style?: 'concise' | 'detailed' | 'bullet';
}

/** PR summary result */
export interface PRSummary {
  /** One-line title summary */
  title: string;
  /** Detailed summary */
  description: string;
  /** Key changes list */
  keyChanges: string[];
  /** Impact assessment */
  impact: ImpactAssessment;
  /** Risk assessment */
  risk?: RiskAssessment;
  /** Changed files summary */
  changedFiles?: FileChangeSummary[];
}

/** Impact assessment */
export interface ImpactAssessment {
  /** Overall impact level */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Affected areas */
  areas: string[];
  /** Description of the impact */
  description: string;
}

/** Risk assessment */
export interface RiskAssessment {
  /** Overall risk level */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Specific concerns */
  concerns: string[];
  /** Number of lines changed */
  linesChanged: number;
  /** Number of files changed */
  filesChanged: number;
}

/** File change summary */
export interface FileChangeSummary {
  /** File path */
  path: string;
  /** Change type */
  changeType: string;
  /** Lines added */
  added: number;
  /** Lines removed */
  removed: number;
  /** Brief description */
  description: string;
}

/**
 * PR Summarizer.
 * Creates human-readable summaries of pull request changes.
 */
export class Summarizer {
  private provider?: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider;
  }

  /**
   * Summarize a diff into a PR summary
   */
  async summarize(diff: DiffResult, options: SummarizeOptions = {}): Promise<PRSummary> {
    const maxWords = options.maxWords || 500;
    const includeFileList = options.includeFileList !== false;
    const includeRiskAssessment = options.includeRiskAssessment !== false;
    const style = options.style || 'concise';

    // Analyze the diff
    const risk = this.assessRisk(diff);
    const impact = this.assessImpact(diff);
    const keyChanges = this.extractKeyChanges(diff);
    const changedFiles = includeFileList ? this.buildFileChanges(diff) : undefined;

    if (this.provider) {
      return this.aiSummarize(diff, options, { risk, impact, keyChanges, changedFiles });
    }

    return {
      title: this.generateTitle(diff, style),
      description: this.generateDescription(diff, keyChanges, impact, risk, style, maxWords),
      keyChanges,
      impact,
      risk: includeRiskAssessment ? risk : undefined,
      changedFiles,
    };
  }

  /**
   * Generate a title for the PR summary
   */
  private generateTitle(diff: DiffResult, style: string): string {
    const totalFiles = diff.summary.filesChanged;
    const totalLines = diff.summary.linesAdded + diff.summary.linesRemoved;

    if (totalFiles === 1) {
      const file = diff.files[0];
      return `Update ${file.newPath.split('/').pop() || file.newPath}`;
    }
    if (totalFiles <= 3) {
      const names = diff.files.map((f) => f.newPath.split('/').pop()).join(', ');
      return `Update ${names}`;
    }
    return `${totalFiles} files changed (+${diff.summary.linesAdded}, -${diff.summary.linesRemoved})`;
  }

  /**
   * Generate the description
   */
  private generateDescription(
    diff: DiffResult,
    keyChanges: string[],
    impact: ImpactAssessment,
    risk: RiskAssessment,
    style: string,
    maxWords: number,
  ): string {
    if (style === 'bullet') {
      const parts: string[] = [];
      parts.push('## Changes');
      parts.push('');
      for (const change of keyChanges) {
        parts.push(`- ${change}`);
      }
      parts.push('');
      parts.push(`**Impact:** ${impact.description}`);
      return parts.join('
');
    }

    const parts: string[] = [];
    parts.push(`This PR includes changes across ${diff.summary.filesChanged} files`);
    parts.push(`(${diff.summary.linesAdded} additions, ${diff.summary.linesRemoved} deletions).`);

    if (keyChanges.length > 0) {
      parts.push(`
Key changes: ${keyChanges.slice(0, 3).join('; ')}.`);
    }

    parts.push(`
Impact: ${impact.description}`);

    return parts.join(' ');
  }

  /**
   * Extract key changes from the diff
   */
  private extractKeyChanges(diff: DiffResult): string[] {
    const changes: string[] = [];

    for (const file of diff.files) {
      if (file.changeType === 'added') {
        changes.push(`Added new file: ${file.newPath}`);
      } else if (file.changeType === 'deleted') {
        changes.push(`Removed file: ${file.oldPath}`);
      } else if (file.changeType === 'renamed') {
        changes.push(`Renamed ${file.oldPath} to ${file.newPath}`);
      } else if (file.summary.linesAdded > 50) {
        changes.push(`Major changes in ${file.newPath} (+${file.summary.linesAdded})`);
      } else if (file.summary.linesRemoved > 50) {
        changes.push(`Significant cleanup in ${file.newPath} (-${file.summary.linesRemoved})`);
      }
    }

    if (changes.length === 0 && diff.files.length > 0) {
      changes.push(`Minor changes in ${diff.files.length} file(s)`);
    }

    return changes.length > 0 ? changes : ['Minor changes'];
  }

  /**
   * Assess risk of the changes
   */
  private assessRisk(diff: DiffResult): RiskAssessment {
    const totalChanges = diff.summary.linesAdded + diff.summary.linesRemoved;
    const filesChanged = diff.summary.filesChanged;
    const concerns: string[] = [];

    let level: RiskAssessment['level'] = 'low';

    if (filesChanged > 20) {
      level = 'high';
      concerns.push(`Large number of files changed (${filesChanged})`);
    } else if (filesChanged > 10) {
      level = 'medium';
      concerns.push(`Many files changed (${filesChanged})`);
    }

    if (totalChanges > 1000) {
      level = 'critical';
      concerns.push(`Very large diff (${totalChanges} lines)`);
    } else if (totalChanges > 500) {
      if (level !== 'critical') level = 'high';
      concerns.push(`Large diff (${totalChanges} lines)`);
    }

    // Check for config/schema changes
    const configFiles = diff.files.filter(
      (f) => f.newPath.includes('config') || f.newPath.includes('schema') || f.newPath.includes('migration'),
    );
    if (configFiles.length > 0) {
      concerns.push(`${configFiles.length} config/schema files changed`);
      if (level === 'low') level = 'medium';
    }

    return {
      level,
      concerns: concerns.length > 0 ? concerns : ['No significant concerns'],
      linesChanged: totalChanges,
      filesChanged,
    };
  }

  /**
   * Assess the impact of changes
   */
  private assessImpact(diff: DiffResult): ImpactAssessment {
    const areas: string[] = [];
    let level: ImpactAssessment['level'] = 'low';

    for (const file of diff.files) {
      const path = file.newPath.toLowerCase();
      if (path.includes('src/')) areas.push('Source code');
      if (path.includes('test')) areas.push('Tests');
      if (path.includes('config')) areas.push('Configuration');
      if (path.includes('doc')) areas.push('Documentation');
      if (path.includes('api')) areas.push('API');
      if (path.includes('db') || path.includes('migration')) areas.push('Database');
    }

    const uniqueAreas = [...new Set(areas)];

    if (uniqueAreas.length >= 3) level = 'high';
    else if (uniqueAreas.length >= 2) level = 'medium';

    return {
      level,
      areas: uniqueAreas.length > 0 ? uniqueAreas : ['General'],
      description: `Changes affect ${uniqueAreas.join(', ').toLowerCase()}`,
    };
  }

  /**
   * Build file change summaries
   */
  private buildFileChanges(diff: DiffResult): FileChangeSummary[] {
    return diff.files.map((f) => ({
      path: f.newPath,
      changeType: f.changeType,
      added: f.summary.linesAdded,
      removed: f.summary.linesRemoved,
      description: f.changeType === 'added'
        ? 'New file'
        : f.changeType === 'deleted'
          ? 'Deleted'
          : f.changeType === 'renamed'
            ? `Renamed from ${f.oldPath}`
            : `${f.summary.linesAdded + f.summary.linesRemoved} line changes`,
    }));
  }

  /**
   * AI-powered summarization
   */
  private async aiSummarize(
    diff: DiffResult,
    options: SummarizeOptions,
    computed: {
      risk: RiskAssessment;
      impact: ImpactAssessment;
      keyChanges: string[];
      changedFiles?: FileChangeSummary[];
    },
  ): Promise<PRSummary> {
    if (!this.provider) {
      return {
        title: this.generateTitle(diff, options.style || 'concise'),
        description: '',
        keyChanges: computed.keyChanges,
        impact: computed.impact,
        risk: computed.risk,
        changedFiles: computed.changedFiles,
      };
    }

    const response = await this.provider.complete({
      model: '',
      messages: [
        {
          role: 'system',
          content: 'You are a PR summarizer. Generate a concise PR title and description from the diff.',
        },
        {
          role: 'user',
          content: `Summarize this PR diff:

Files: ${diff.files.map((f) => f.newPath).join(', ')}
Changes: +${diff.summary.linesAdded}, -${diff.summary.linesRemoved}

Provide: Title (one line), Description (2-3 paragraphs).`,
        },
      ],
    });

    const lines = response.message.content.split('
');
    const title = lines[0]?.replace(/^(#{1,3}\s*|Title:\s*)/i, '').trim() || computed.keyChanges[0];
    const description = lines.slice(1).join('
').trim();

    return {
      title,
      description,
      keyChanges: computed.keyChanges,
      impact: computed.impact,
      risk: computed.risk,
      changedFiles: computed.changedFiles,
    };
  }
}
