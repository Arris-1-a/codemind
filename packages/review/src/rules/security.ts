/**
 * Security review rules.
 *
 * @module review/rules/security
 */

import type { ReviewRule } from './index.js';

/** Security-specific review rules */
export const securityRules: ReviewRule[] = [
  {
    id: 'SEC-010',
    category: 'security',
    title: 'Command injection risk',
    description: 'Avoid using exec() or spawn() with user-supplied input. Use parameterized commands.',
    severity: 'error',
    patterns: ['child_process.exec', 'child_process.spawn', 'execSync', 'spawnSync'],
  },
  {
    id: 'SEC-011',
    category: 'security',
    title: 'Open redirect',
    description: 'Validate redirect URLs against a whitelist to prevent open redirect attacks.',
    severity: 'error',
    patterns: ['res.redirect', 'window.location', 'router.push'],
  },
  {
    id: 'SEC-012',
    category: 'security',
    title: 'Missing CSRF protection',
    description: 'Add CSRF protection for state-changing HTTP requests.',
    severity: 'warning',
    patterns: ['POST', 'PUT', 'DELETE', 'PATCH'],
  },
  {
    id: 'SEC-013',
    category: 'security',
    title: 'Sensitive data logging',
    description: 'Avoid logging sensitive data such as passwords, tokens, or personal information.',
    severity: 'error',
  },
  {
    id: 'SEC-014',
    category: 'security',
    title: 'Weak cryptography',
    description: 'Use strong cryptographic algorithms (SHA-256, AES-256). Avoid MD5 and SHA-1.',
    severity: 'warning',
    patterns: ['md5', 'MD5', 'sha1', 'SHA1', 'createHash', 'createCipher'],
  },
];
