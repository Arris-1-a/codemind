/**
 * Code smell review rules.
 *
 * @module review/rules/code-smells
 */

import type { ReviewRule } from './index.js';

/** Code smell review rules */
export const codeSmellsRules: ReviewRule[] = [
  {
    id: 'SMELL-010',
    category: 'code-smell',
    title: 'God class',
    description: 'Classes with too many responsibilities should be split.',
    severity: 'warning',
  },
  {
    id: 'SMELL-011',
    category: 'code-smell',
    title: 'Feature envy',
    description: 'Methods that use another class data more than their own should be moved.',
    severity: 'info',
  },
  {
    id: 'SMELL-012',
    category: 'code-smell',
    title: 'Primitive obsession',
    description: 'Use value objects instead of primitives for domain concepts.',
    severity: 'info',
  },
  {
    id: 'SMELL-013',
    category: 'code-smell',
    title: 'Switch statements',
    description: 'Consider replacing complex switch statements with polymorphism or strategy pattern.',
    severity: 'hint',
    patterns: ['switch (', 'case '],
  },
  {
    id: 'SMELL-014',
    category: 'code-smell',
    title: 'Comments as deodorant',
    description: 'Comments explaining what code does suggest the code is unclear. Make code self-documenting.',
    severity: 'hint',
  },
];
