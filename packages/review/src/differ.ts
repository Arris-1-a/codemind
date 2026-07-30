/**
 * Git diff parser — parses git diffs into structured data for analysis.
 *
 * @module review/differ
 */

/** Type of change in a diff */
export type ChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unchanged';

/** A single hunk within a file diff */
export interface DiffHunk {
  /** Starting line in the old file */
  oldStart: number;
  /** Number of lines in the old file for this hunk */
  oldLines: number;
  /** Starting line in the new file */
  newStart: number;
  /** Number of lines in the new file for this hunk */
  newLines: number;
  /** Header line */
  header: string;
  /** Individual lines in the hunk */
  lines: DiffLine[];
}

/** A single line in a diff */
export interface DiffLine {
  /** Line number in the old file */
  oldNumber?: number;
  /** Line number in the new file */
  newNumber?: number;
  /** Line content (without prefix) */
  content: string;
  /** Line type */
  type: 'context' | 'added' | 'removed';
}

/** A complete file diff */
export interface FileDiff {
  /** Old file path */
  oldPath: string;
  /** New file path */
  newPath: string;
  /** Type of change */
  changeType: ChangeType;
  /** Change summary */
  summary: DiffSummary;
  /** Hunks in this diff */
  hunks: DiffHunk[];
  /** Programming language of the file */
  language?: string;
  /** Whether this is a binary file */
  isBinary: boolean;
}

/** Summary statistics for a diff */
export interface DiffSummary {
  /** Total lines added */
  linesAdded: number;
  /** Total lines removed */
  linesRemoved: number;
  /** Files changed count */
  filesChanged: number;
}

/** Complete diff result */
export interface DiffResult {
  /** All file diffs */
  files: FileDiff[];
  /** Overall summary */
  summary: DiffSummary;
  /** Raw diff text */
  raw: string;
}

/**
 * Diff parser for analyzing git diffs.
 */
export class Differ {
  /**
   * Parse a raw git diff string into structured data
   * @param rawDiff - The raw git diff output
   * @returns Structured diff result
   */
  parse(rawDiff: string): DiffResult {
    const files: FileDiff[] = [];
    const lines = rawDiff.split('
');

    let i = 0;
    let currentFile: FileDiff | null = null;
    let currentHunk: DiffHunk | null = null;
    let totalAdded = 0;
    let totalRemoved = 0;

    while (i < lines.length) {
      const line = lines[i];

      // File header: diff --git a/... b/...
      if (line.startsWith('diff --git ')) {
        if (currentFile) {
          this.finalizeFile(currentFile);
          files.push(currentFile);
        }
        const match = line.match(/diff --git a\/(.*) b\/(.*)/);
        currentFile = {
          oldPath: match?.[1] || '',
          newPath: match?.[2] || '',
          changeType: 'modified',
          summary: { linesAdded: 0, linesRemoved: 0, filesChanged: 0 },
          hunks: [],
          isBinary: false,
        };
      }
      // Hunk header: @@ -old,count +new,count @@
      else if (currentFile && line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1], 10),
            oldLines: match[2] ? parseInt(match[2], 10) : 1,
            newStart: parseInt(match[3], 10),
            newLines: match[4] ? parseInt(match[4], 10) : 1,
            header: (match[5] || '').trim(),
            lines: [],
          };
          currentFile.hunks.push(currentHunk);
        }
      }
      // Added line
      else if (currentHunk && line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.lines.push({
          newNumber: currentHunk.newStart + currentHunk.lines.filter((l) => l.type !== 'removed').length,
          content: line.slice(1),
          type: 'added',
        });
        totalAdded++;
        if (currentFile) currentFile.summary.linesAdded++;
      }
      // Removed line
      else if (currentHunk && line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.lines.push({
          oldNumber: currentHunk.oldStart + currentHunk.lines.filter((l) => l.type === 'removed').length,
          content: line.slice(1),
          type: 'removed',
        });
        totalRemoved++;
        if (currentFile) currentFile.summary.linesRemoved++;
      }
      // Context line
      else if (currentHunk && line.startsWith(' ')) {
        currentHunk.lines.push({
          content: line.slice(1),
          type: 'context',
        });
      }

      i++;
    }

    // Finalize last file
    if (currentFile) {
      this.finalizeFile(currentFile);
      files.push(currentFile);
    }

    return {
      files,
      summary: {
        linesAdded: totalAdded,
        linesRemoved: totalRemoved,
        filesChanged: files.length,
      },
      raw: rawDiff,
    };
  }

  /**
   * Detect the change type of a file diff
   */
  private detectChangeType(file: FileDiff): ChangeType {
    if (file.oldPath === '/dev/null') return 'added';
    if (file.newPath === '/dev/null') return 'deleted';
    if (file.oldPath !== file.newPath) return 'renamed';
    return 'modified';
  }

  /**
   * Detect programming language from file path
   */
  detectLanguage(filePath: string): string | undefined {
    const extMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.vue': 'vue',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.sh': 'shell',
      '.graphql': 'graphql',
    };

    const ext = filePath.match(/\.[a-zA-Z]+$/)?.[0] || '';
    return extMap[ext];
  }

  /**
   * Filter files by type
   */
  filterByType(files: FileDiff[], type: ChangeType): FileDiff[] {
    return files.filter((f) => f.changeType === type);
  }

  /**
   * Get files changed in a specific directory
   */
  filterByDirectory(files: FileDiff[], directory: string): FileDiff[] {
    return files.filter((f) => f.newPath.startsWith(directory));
  }

  /**
   * Get only code files (exclude non-code)
   */
  filterCodeFiles(files: FileDiff[]): FileDiff[] {
    const codeExts = [
      '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java',
      '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.css', '.scss',
      '.html', '.vue', '.sql', '.sh',
    ];
    return files.filter((f) => {
      const ext = f.newPath.match(/\.[a-zA-Z]+$/)?.[0] || '';
      return codeExts.includes(ext);
    });
  }

  /**
   * Finalize a file diff after parsing
   */
  private finalizeFile(file: FileDiff): void {
    file.changeType = this.detectChangeType(file);
    file.language = this.detectLanguage(file.newPath);
  }
}
