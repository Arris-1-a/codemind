/**
 * Changelog Generator — generates CHANGELOG.md from git history.
 *
 * @module doc/changelog
 */

/** A single changelog entry */
export interface ChangelogEntry {
  /** Version tag */
  version: string;
  /** Release date */
  date: string;
  /** Changes grouped by type */
  changes: {
    features?: string[];
    fixes?: string[];
    breaking?: string[];
    docs?: string[];
    chore?: string[];
    refactor?: string[];
    other?: string[];
  };
}

/** Changelog generator options */
export interface ChangelogOptions {
  /** Repository URL for linking commits */
  repoUrl?: string;
  /** Whether to include commit hashes */
  includeHashes?: boolean;
  /** Maximum entries to include */
  maxEntries?: number;
  /** Custom title */
  title?: string;
}

/**
 * Changelog Generator.
 * Creates a CHANGELOG.md from git commit history.
 */
export class ChangelogGenerator {
  private options: Required<ChangelogOptions>;

  constructor(options: ChangelogOptions = {}) {
    this.options = {
      repoUrl: options.repoUrl || '',
      includeHashes: options.includeHashes || false,
      maxEntries: options.maxEntries || 50,
      title: options.title || 'Changelog',
    };
  }

  /**
   * Parse git log output into changelog entries
   * @param gitLog - Git log output in format: HASH|DATE|MESSAGE
   * @returns Parsed changelog entries
   */
  parseGitLog(gitLog: string): ChangelogEntry[] {
    const lines = gitLog.split('
').filter(Boolean);
    const entries = new Map<string, ChangelogEntry>();
    let currentVersion = 'Unreleased';

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length < 3) continue;

      const [hash, date, ...messageParts] = parts;
      const message = messageParts.join('|');

      // Check for version tag
      const versionMatch = message.match(/^(v?\d+\.\d+\.\d+)/);
      if (versionMatch) {
        currentVersion = versionMatch[1];
      }

      if (!entries.has(currentVersion)) {
        entries.set(currentVersion, {
          version: currentVersion,
          date: date || '',
          changes: {},
        });
      }

      const entry = entries.get(currentVersion)!;
      const changeType = this.classifyCommit(message);
      const formatted = this.formatCommitMessage(message, hash);

      if (!entry.changes[changeType]) {
        (entry.changes[changeType] as string[]) = [];
      }
      (entry.changes[changeType] as string[]).push(formatted);
    }

    return Array.from(entries.values()).slice(0, this.options.maxEntries);
  }

  /**
   * Classify a commit message into a change type
   */
  classifyCommit(message: string): keyof ChangelogEntry['changes'] {
    const lower = message.toLowerCase();

    if (/^(feat|feature)(\(.+\))?:/.test(lower)) return 'features';
    if (/^(fix|bugfix)(\(.+\))?:/.test(lower)) return 'fixes';
    if (/^(breaking|break|BREAKING CHANGE)/.test(lower)) return 'breaking';
    if (/^(docs|documentation)(\(.+\))?:/.test(lower)) return 'docs';
    if (/^(chore|ci|build)(\(.+\))?:/.test(lower)) return 'chore';
    if (/^(refactor|perf)(\(.+\))?:/.test(lower)) return 'refactor';
    return 'other';
  }

  /**
   * Format a commit message
   */
  private formatCommitMessage(message: string, hash: string): string {
    // Strip conventional commit prefix
    let cleaned = message.replace(/^(feat|fix|docs|chore|refactor|perf|test|ci|build|style)(\(.+?\))?:\s*/i, '');
    // Strip issue references
    cleaned = cleaned.replace(/#\d+/g, '').trim();

    if (this.options.includeHashes && hash && this.options.repoUrl) {
      return `- ${cleaned} ([${hash.slice(0, 7)}](${this.options.repoUrl}/commit/${hash}))`;
    }
    if (this.options.includeHashes && hash) {
      return `- ${cleaned} (\`${hash.slice(0, 7)}\`)`;
    }
    return `- ${cleaned}`;
  }

  /**
   * Generate a full CHANGELOG.md string
   * @param entries - Changelog entries
   * @returns Formatted changelog markdown
   */
  generate(entries: ChangelogEntry[]): string {
    const lines: string[] = [];

    lines.push(`# ${this.options.title}`);
    lines.push('');
    lines.push('All notable changes to this project will be documented in this file.');
    lines.push('');

    for (const entry of entries) {
      lines.push(`## [${entry.version}] - ${entry.date}`);
      lines.push('');

      const sections: Array<{ title: string; key: keyof ChangelogEntry['changes'] }> = [
        { title: '### ⚠ BREAKING CHANGES', key: 'breaking' },
        { title: '### ✨ Features', key: 'features' },
        { title: '### 🐛 Bug Fixes', key: 'fixes' },
        { title: '### 🔄 Refactors', key: 'refactor' },
        { title: '### 📚 Documentation', key: 'docs' },
        { title: '### 🧹 Chores', key: 'chore' },
        { title: '### Other', key: 'other' },
      ];

      for (const section of sections) {
        const items = entry.changes[section.key];
        if (items && items.length > 0) {
          lines.push(section.title);
          lines.push('');
          for (const item of items) {
            lines.push(item);
          }
          lines.push('');
        }
      }
    }

    return lines.join('
');
  }

  /**
   * Generate changelog from a list of commits
   */
  generateFromCommits(commits: Array<{ hash: string; date: string; message: string; version?: string }>): string {
    const entries = new Map<string, ChangelogEntry>();

    for (const commit of commits) {
      const version = commit.version || 'Unreleased';
      if (!entries.has(version)) {
        entries.set(version, {
          version,
          date: commit.date,
          changes: {},
        });
      }

      const entry = entries.get(version)!;
      const changeType = this.classifyCommit(commit.message);
      const formatted = this.formatCommitMessage(commit.message, commit.hash);

      if (!entry.changes[changeType]) {
        (entry.changes[changeType] as string[]) = [];
      }
      (entry.changes[changeType] as string[]).push(formatted);
    }

    return this.generate(Array.from(entries.values()));
  }
}
