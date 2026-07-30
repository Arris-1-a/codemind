/**
 * Performance review rules.
 *
 * @module review/rules/performance
 */

import type { ReviewRule } from './index.js';

/** Performance-specific review rules */
export const performanceRules: ReviewRule[] = [
  {
    id: 'PERF-010',
    category: 'performance',
    title: 'N+1 query problem',
    description: 'Eager-load related data or batch queries to avoid N+1 query problems.',
    severity: 'error',
    patterns: ['.find(', '.findOne(', '.forEach(await'],
  },
  {
    id: 'PERF-011',
    category: 'performance',
    title: 'Missing caching',
    description: 'Consider adding caching for expensive computations or frequent API calls.',
    severity: 'info',
  },
  {
    id: 'PERF-012',
    category: 'performance',
    title: 'Large bundle size',
    description: 'Use dynamic imports or tree-shaking to reduce bundle size.',
    severity: 'info',
    patterns: ['import *', 'import {'],
  },
  {
    id: 'PERF-013',
    category: 'performance',
    title: 'Unnecessary object creation',
    description: 'Avoid creating new objects in hot paths or loops.',
    severity: 'hint',
    patterns: ['new Array', 'new Object', 'new Set', 'new Map'],
  },
  {
    id: 'PERF-014',
    category: 'performance',
    title: 'Blocking main thread',
    description: 'Move CPU-intensive work to Web Workers or use setImmediate to break up long tasks.',
    severity: 'warning',
  },
];
