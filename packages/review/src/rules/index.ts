/**
 * Review rules — defines the rules and categories for code review.
 *
 * @module review/rules
 */

/** Severity level of a review finding */
export type Severity = 'error' | 'warning' | 'info' | 'hint';

/** Review rule category */
export type RuleCategory = 'security' | 'performance' | 'code-smell' | 'best-practice' | 'style';

/** A review rule definition */
export interface ReviewRule {
  /** Unique rule ID */
  id: string;
  /** Category of the rule */
  category: RuleCategory;
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** Severity level */
  severity: Severity;
  /** Languages this rule applies to (empty = all) */
  languages?: string[];
  /** Pattern to match in code */
  patterns?: string[];
  /** Positive example of correct code */
  goodExample?: string;
  /** Negative example of problematic code */
  badExample?: string;
}

/** A review finding */
export interface ReviewFinding {
  /** The matched rule */
  rule: ReviewRule;
  /** File where the finding was located */
  file: string;
  /** Line number of the finding */
  line?: number;
  /** The relevant code snippet */
  snippet?: string;
  /** Suggested fix */
  suggestion?: string;
}

/** All review rules */
export const REVIEW_RULES: ReviewRule[] = [
  // ── Security Rules ──
  {
    id: 'SEC-001',
    category: 'security',
    title: 'Hardcoded credentials',
    description: 'Avoid hardcoding passwords, API keys, tokens, or secrets in source code.',
    severity: 'error',
    patterns: ['password', 'passwd', 'secret', 'api_key', 'apiKey', 'token', 'private_key'],
    goodExample: 'const apiKey = process.env.API_KEY;',
    badExample: 'const apiKey = "sk-1234567890abcdef";',
  },
  {
    id: 'SEC-002',
    category: 'security',
    title: 'SQL injection risk',
    description: 'Use parameterized queries instead of string concatenation for SQL.',
    severity: 'error',
    patterns: ['`SELECT', '`INSERT', '`UPDATE', '`DELETE', '+ query', '+ sql'],
  },
  {
    id: 'SEC-003',
    category: 'security',
    title: 'XSS vulnerability',
    description: 'Avoid using innerHTML or dangerouslySetInnerHTML with unsanitized input.',
    severity: 'error',
    patterns: ['innerHTML', 'dangerouslySetInnerHTML', 'document.write'],
  },
  {
    id: 'SEC-004',
    category: 'security',
    title: 'Insecure random',
    description: 'Use crypto.randomBytes or crypto.randomUUID instead of Math.random for security-sensitive operations.',
    severity: 'warning',
    patterns: ['Math.random'],
  },
  {
    id: 'SEC-005',
    category: 'security',
    title: 'Path traversal risk',
    description: 'Validate and sanitize file paths to prevent path traversal attacks.',
    severity: 'error',
    patterns: ['path.join', 'path.resolve', '../', '..\\'],
  },

  // ── Performance Rules ──
  {
    id: 'PERF-001',
    category: 'performance',
    title: 'Synchronous file operations',
    description: 'Prefer async file operations (fs.promises) over sync variants (fs.readFileSync).',
    severity: 'warning',
    patterns: ['readFileSync', 'writeFileSync', 'existsSync', 'mkdirSync'],
  },
  {
    id: 'PERF-002',
    category: 'performance',
    title: 'Missing database index',
    description: 'Ensure database queries have appropriate indexes for filtered/sorted columns.',
    severity: 'warning',
    patterns: ['WHERE', 'ORDER BY', 'GROUP BY'],
  },
  {
    id: 'PERF-003',
    category: 'performance',
    title: 'Unnecessary re-render',
    description: 'Use React.memo, useMemo, or useCallback to prevent unnecessary re-renders.',
    severity: 'info',
    patterns: ['useEffect', 'useState'],
    languages: ['typescript', 'javascript'],
  },
  {
    id: 'PERF-004',
    category: 'performance',
    title: 'Memory leak risk',
    description: 'Ensure event listeners, timers, and subscriptions are cleaned up.',
    severity: 'warning',
    patterns: ['addEventListener', 'setInterval', 'setTimeout', 'subscribe'],
  },
  {
    id: 'PERF-005',
    category: 'performance',
    title: 'Inefficient loop',
    description: 'Consider using map/filter/reduce instead of for loops for clearer intent.',
    severity: 'hint',
    patterns: ['for (let', 'for (const'],
  },

  // ── Code Smells ──
  {
    id: 'SMELL-001',
    category: 'code-smell',
    title: 'Too many function parameters',
    description: 'Functions with more than 4 parameters should use an options object.',
    severity: 'warning',
  },
  {
    id: 'SMELL-002',
    category: 'code-smell',
    title: 'Magic numbers',
    description: 'Replace magic numbers with named constants.',
    severity: 'info',
  },
  {
    id: 'SMELL-003',
    category: 'code-smell',
    title: 'Deeply nested code',
    description: 'Code nested deeper than 3 levels should be refactored.',
    severity: 'warning',
  },
  {
    id: 'SMELL-004',
    category: 'code-smell',
    title: 'Duplicate code',
    description: 'Extract duplicated code into shared functions or utilities.',
    severity: 'warning',
  },
  {
    id: 'SMELL-005',
    category: 'code-smell',
    title: 'Long function',
    description: 'Functions longer than 50 lines should be broken into smaller functions.',
    severity: 'info',
  },
  {
    id: 'SMELL-006',
    category: 'code-smell',
    title: 'Dead code',
    description: 'Remove commented-out code and unused variables/functions.',
    severity: 'info',
    patterns: ['// TODO', '// FIXME', '// HACK', '// XXX'],
  },

  // ── Best Practices ──
  {
    id: 'BEST-001',
    category: 'best-practice',
    title: 'Missing error handling',
    description: 'Async operations should have proper try/catch or .catch() handlers.',
    severity: 'error',
    patterns: ['await ', 'fetch(', 'axios'],
  },
  {
    id: 'BEST-002',
    category: 'best-practice',
    title: 'Missing type annotations',
    description: 'Add TypeScript type annotations to function parameters and return types.',
    severity: 'warning',
    languages: ['typescript'],
  },
  {
    id: 'BEST-003',
    category: 'best-practice',
    title: 'Console statements in production',
    description: 'Remove or use a proper logger instead of console.log in production code.',
    severity: 'info',
    patterns: ['console.log', 'console.error', 'console.warn', 'console.debug'],
  },
  {
    id: 'BEST-004',
    category: 'best-practice',
    title: 'Missing input validation',
    description: 'Validate user input before processing it.',
    severity: 'warning',
  },
  {
    id: 'BEST-005',
    category: 'best-practice',
    title: 'Any type usage',
    description: 'Avoid using "any" type in TypeScript. Use "unknown" or proper types.',
    severity: 'warning',
    languages: ['typescript'],
    patterns: [': any', 'as any'],
  },
];

export { securityRules } from './security.js';
export { performanceRules } from './performance.js';
export { codeSmellsRules } from './code-smells.js';
export { bestPracticesRules } from './best-practices.js';
