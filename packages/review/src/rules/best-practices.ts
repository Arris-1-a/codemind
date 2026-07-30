/**
 * Best practice review rules.
 *
 * @module review/rules/best-practices
 */

import type { ReviewRule } from './index.js';

/** Best practice review rules */
export const bestPracticesRules: ReviewRule[] = [
  {
    id: 'BEST-010',
    category: 'best-practice',
    title: 'Use const for immutable variables',
    description: 'Prefer const over let for variables that are never reassigned.',
    severity: 'info',
    languages: ['typescript', 'javascript'],
    patterns: ['let ', 'var '],
  },
  {
    id: 'BEST-011',
    category: 'best-practice',
    title: 'Avoid null/undefined confusion',
    description: 'Use optional chaining (?.) and nullish coalescing (??) operators.',
    severity: 'info',
    languages: ['typescript', 'javascript'],
  },
  {
    id: 'BEST-012',
    category: 'best-practice',
    title: 'Use strict equality',
    description: 'Prefer === and !== over == and != to avoid type coercion.',
    severity: 'warning',
    patterns: [' == ', ' != '],
  },
  {
    id: 'BEST-013',
    category: 'best-practice',
    title: 'Default exports discouraged',
    description: 'Prefer named exports over default exports for better IDE support.',
    severity: 'hint',
  },
  {
    id: 'BEST-014',
    category: 'best-practice',
    title: 'Meaningful variable names',
    description: 'Use descriptive variable names. Avoid single-letter names except in loops.',
    severity: 'hint',
  },
];
