/**
 * PR Description Generator — auto-generates PR descriptions from diffs.
 *
 * @module pr/generator
 */

import type { AIProvider } from '@codemind/core';
import type { DiffResult } from '@codemind/review';

/** PR description template variables */
export interface PRTemplate {
  /** Template type */
  type: 'feature' | 'bugfix' | 'refactor' | 'docs' | 'chore';
  /** Section contents */
  sections: {
    summary?: string;
    changes?: string;
    testing?: string;
    screenshots?: string;
    checklist?: string[];
    related?: string[];
  };
}

/** Generator options */
export interface GeneratorOptions {
  /** PR template type */
  template?: PRTemplate['type'];
  /** Custom template content */
  customTemplate?: string;
  /** Include testing instructions */
  includeTesting?: boolean;
  /** Include screenshots section */
  includeScreenshots?: boolean;
  /** Include checklist */
  includeChecklist?: boolean;
  /** Related issues/PRs */
  relatedIssues?: string[];
  /** Labels to suggest */
  suggestedLabels?: string[];
}

/** Generated PR description */
export interface PRDescription {
  /** PR title */
  title: string;
  /** PR description (markdown) */
  body: string;
  /** Suggested labels */
  labels: string[];
  /** Detected PR type */
  type: PRTemplate['type'];
}

/**
 * PR Description Generator.
 * Creates well-structured PR descriptions.
 */
export class PRGenerator {
  private provider?: AIProvider;

  /** Default PR template */
  static readonly DEFAULT_TEMPLATE = `## Summary
<!-- Brief summary of the changes -->

## Changes
<!-- Detailed description of changes -->

## Testing
<!-- How were these changes tested? -->

## Checklist
- [ ] Tests pass
- [ ] Lint passes
- [ ] Documentation updated
- [ ] Self-reviewed
`;

  constructor(provider?: AIProvider) {
    this.provider = provider;
  }

  /**
   * Generate a PR description from a diff
   */
  async generate(diff: DiffResult, options: GeneratorOptions = {}): Promise<PRDescription> {
    const type = options.template || this.detectPRType(diff);
    const title = this.generateTitle(diff, type);
    const body = this.generateBody(diff, type, options);
    const labels = this.generateLabels(type, options);

    return { title, body, labels, type };
  }

  /**
   * Detect the PR type from the changes
   */
  private detectPRType(diff: DiffResult): PRTemplate['type'] {
    const allPaths = diff.files.map((f) => f.newPath.toLowerCase());

    const isDoc = allPaths.every((p) => p.endsWith('.md') || p.startsWith('docs/'));
    if (isDoc) return 'docs';

    const isTest = allPaths.every((p) => p.includes('test') || p.includes('spec'));
    if (isTest) return 'chore';

    const hasBreaking = diff.files.some(
      (f) => f.summary.linesRemoved > 100,
    );
    if (hasBreaking) return 'refactor';

    const hasFeature = diff.summary.linesAdded > diff.summary.linesRemoved * 2;
    if (hasFeature) return 'feature';

    if (diff.summary.linesAdded < 20 && diff.summary.linesRemoved < 20) {
      return 'bugfix';
    }

    return 'feature';
  }

  /**
   * Generate PR title
   */
  private generateTitle(diff: DiffResult, type: PRTemplate['type']): string {
    const prefix = { feature: 'feat', bugfix: 'fix', refactor: 'refactor', docs: 'docs', chore: 'chore' }[type];

    if (diff.files.length === 1) {
      const name = diff.files[0].newPath.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
      return `${prefix}: ${name}`;
    }

    const mainPath = diff.files[0]?.newPath.split('/')[0] || '';
    return `${prefix}: update ${mainPath} (+${diff.summary.linesAdded}/-${diff.summary.linesRemoved})`;
  }

  /**
   * Generate PR body with template
   */
  private generateBody(
    diff: DiffResult,
    type: PRTemplate['type'],
    options: GeneratorOptions,
  ): string {
    if (options.customTemplate) {
      return this.fillTemplate(options.customTemplate, diff);
    }

    const sections: string[] = [];

    // Summary
    sections.push('## Summary');
    sections.push('');
    sections.push(this.generateSummaryText(diff, type));
    sections.push('');

    // Changes
    sections.push('## Changes');
    sections.push('');
    sections.push(this.generateChangesList(diff));
    sections.push('');

    // Files changed
    sections.push('## Files Changed');
    sections.push('');
    sections.push('| File | Change | + | - |');
    sections.push('| --- | --- | --- | --- |');
    for (const file of diff.files) {
      const icon = { added: '➕', modified: '✏️', deleted: '➖', renamed: '🔄' }[file.changeType] || '✏️';
      sections.push(`| ${file.newPath} | ${icon} ${file.changeType} | ${file.summary.linesAdded} | ${file.summary.linesRemoved} |`);
    }
    sections.push('');

    // Testing
    if (options.includeTesting !== false) {
      sections.push('## Testing');
      sections.push('');
      sections.push('<!-- Describe how these changes were tested -->');
      sections.push('');
      sections.push('- [ ] Unit tests pass');
      sections.push('- [ ] Integration tests pass');
      sections.push('- [ ] Manual testing completed');
      sections.push('');
    }

    // Screenshots
    if (options.includeScreenshots) {
      sections.push('## Screenshots');
      sections.push('');
      sections.push('<!-- Add screenshots if UI changes were made -->');
      sections.push('');
    }

    // Checklist
    if (options.includeChecklist !== false) {
      sections.push('## Checklist');
      sections.push('');
      sections.push('- [ ] Code reviewed');
      sections.push('- [ ] Tests added/updated');
      sections.push('- [ ] Documentation updated');
      sections.push('- [ ] Breaking changes documented');
      sections.push('- [ ] PR title follows conventional commits');
      sections.push('');
    }

    // Related issues
    if (options.relatedIssues && options.relatedIssues.length > 0) {
      sections.push('## Related');
      sections.push('');
      for (const issue of options.relatedIssues) {
        sections.push(`- ${issue}`);
      }
      sections.push('');
    }

    return sections.join('
');
  }

  /**
   * Generate summary text
   */
  private generateSummaryText(diff: DiffResult, type: PRTemplate['type']): string {
    const counts = `This PR includes changes across **${diff.summary.filesChanged} files** (+${diff.summary.linesAdded}, -${diff.summary.linesRemoved}).`;

    const descriptions: Record<string, string> = {
      feature: `${counts}

Adds new functionality.`,
      bugfix: `${counts}

Fixes reported issues.`,
      refactor: `${counts}

Refactors existing code without changing functionality.`,
      docs: `${counts}

Updates documentation.`,
      chore: `${counts}

Maintenance and tooling changes.`,
    };

    return descriptions[type] || counts;
  }

  /**
   * Generate changes list
   */
  private generateChangesList(diff: DiffResult): string {
    const items: string[] = [];
    for (const file of diff.files.slice(0, 10)) {
      const name = file.newPath.split('/').pop() || file.newPath;
      items.push(`- **${name}**: ${file.changeType} (+${file.summary.linesAdded}/-${file.summary.linesRemoved})`);
    }
    if (diff.files.length > 10) {
      items.push(`- ... and ${diff.files.length - 10} more files`);
    }
    return items.join('
');
  }

  /**
   * Generate labels
   */
  private generateLabels(
    type: PRTemplate['type'],
    options: GeneratorOptions,
  ): string[] {
    const labels = new Set(options.suggestedLabels || []);

    const typeLabels: Record<string, string> = {
      feature: 'enhancement',
      bugfix: 'bug',
      refactor: 'refactor',
      docs: 'documentation',
      chore: 'chore',
    };

    const label = typeLabels[type];
    if (label) labels.add(label);

    return Array.from(labels);
  }

  /**
   * Fill a custom template with diff data
   */
  private fillTemplate(template: string, diff: DiffResult): string {
    return template
      .replace('{{FILES_CHANGED}}', String(diff.summary.filesChanged))
      .replace('{{LINES_ADDED}}', String(diff.summary.linesAdded))
      .replace('{{LINES_REMOVED}}', String(diff.summary.linesRemoved))
      .replace('{{TOTAL_CHANGES}}', String(diff.summary.linesAdded + diff.summary.linesRemoved))
      .replace(
        '{{FILE_LIST}}',
        diff.files.map((f) => `- ${f.newPath}`).join('
'),
      );
  }
}
