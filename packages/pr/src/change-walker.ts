/**
 * Change Walker — navigates and walks through PR changes systematically.
 *
 * @module pr/change-walker
 */

import type { DiffResult, FileDiff, DiffHunk } from '@codemind/review';

/** Walk step */
export interface WalkStep {
  /** Step index */
  index: number;
  /** File diff */
  file: FileDiff;
  /** Hunk */
  hunk: DiffHunk;
  /** Description of the change */
  description: string;
}

/** Walk result */
export interface WalkResult {
  /** All steps */
  steps: WalkStep[];
  /** Total steps */
  totalSteps: number;
  /** Walk metadata */
  metadata: {
    files: number;
    hunks: number;
    additions: number;
    deletions: number;
  };
}

/** Walk callback */
export type WalkCallback = (step: WalkStep) => void | Promise<void>;

/**
 * Change Walker.
 * Provides systematic navigation through PR changes for review.
 */
export class ChangeWalker {
  private currentIndex: number = 0;
  private steps: WalkStep[] = [];

  /**
   * Initialize the walker with a diff
   */
  init(diff: DiffResult): void {
    this.steps = [];
    this.currentIndex = 0;

    let index = 0;
    for (const file of diff.files) {
      for (const hunk of file.hunks) {
        this.steps.push({
          index: index++,
          file,
          hunk,
          description: this.describeStep(file, hunk),
        });
      }
    }
  }

  /**
   * Get the current step
   */
  current(): WalkStep | null {
    if (this.steps.length === 0) return null;
    return this.steps[this.currentIndex] || null;
  }

  /**
   * Move to the next step
   */
  next(): WalkStep | null {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      return this.current();
    }
    return null;
  }

  /**
   * Move to the previous step
   */
  previous(): WalkStep | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.current();
    }
    return null;
  }

  /**
   * Jump to a specific step
   */
  goTo(index: number): WalkStep | null {
    if (index >= 0 && index < this.steps.length) {
      this.currentIndex = index;
      return this.current();
    }
    return null;
  }

  /**
   * Jump to first step
   */
  first(): WalkStep | null {
    return this.goTo(0);
  }

  /**
   * Jump to last step
   */
  last(): WalkStep | null {
    return this.goTo(this.steps.length - 1);
  }

  /**
   * Filter steps by file path pattern
   */
  filterByFile(pattern: string): WalkStep[] {
    const regex = new RegExp(pattern, 'i');
    return this.steps.filter((s) => regex.test(s.file.newPath));
  }

  /**
   * Filter steps by change type
   */
  filterByType(type: FileDiff['changeType']): WalkStep[] {
    return this.steps.filter((s) => s.file.changeType === type);
  }

  /**
   * Walk through all steps with a callback
   */
  async walk(callback: WalkCallback): Promise<void> {
    for (const step of this.steps) {
      this.currentIndex = step.index;
      await callback(step);
    }
  }

  /**
   * Get progress
   */
  progress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex + 1,
      total: this.steps.length,
      percentage:
        this.steps.length > 0
          ? Math.round(((this.currentIndex + 1) / this.steps.length) * 100)
          : 100,
    };
  }

  /**
   * Get all steps
   */
  getAllSteps(): WalkStep[] {
    return [...this.steps];
  }

  /**
   * Generate a description for a step
   */
  private describeStep(file: FileDiff, hunk: DiffHunk): string {
    const added = hunk.lines.filter((l) => l.type === 'added').length;
    const removed = hunk.lines.filter((l) => l.type === 'removed').length;

    if (file.changeType === 'added') {
      return `New file: ${file.newPath} (+${added} lines, start line ${hunk.newStart})`;
    }
    if (file.changeType === 'deleted') {
      return `Deleted file: ${file.oldPath} (-${removed} lines)`;
    }
    if (file.changeType === 'renamed') {
      return `Renamed: ${file.oldPath} → ${file.newPath}`;
    }

    const context = hunk.header ? ` (${hunk.header})` : '';
    return `${file.newPath}: L${hunk.newStart} +${added}/-${removed}${context}`;
  }

  /**
   * Get summary of the walk
   */
  summarize(): WalkResult {
    const totalAdditions = this.steps.reduce(
      (sum, s) => sum + s.hunk.lines.filter((l) => l.type === 'added').length,
      0,
    );
    const totalDeletions = this.steps.reduce(
      (sum, s) => sum + s.hunk.lines.filter((l) => l.type === 'removed').length,
      0,
    );
    const fileSet = new Set(this.steps.map((s) => s.file.newPath));

    return {
      steps: this.steps,
      totalSteps: this.steps.length,
      metadata: {
        files: fileSet.size,
        hunks: this.steps.length,
        additions: totalAdditions,
        deletions: totalDeletions,
      },
    };
  }
}
