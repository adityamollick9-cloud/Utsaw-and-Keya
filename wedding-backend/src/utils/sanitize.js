/**
 * Escapes special regex characters in user search input to prevent
 * MongoDB / PCRE Regular Expression Syntax Errors and ReDoS vulnerabilities.
 *
 * @param {string} str - Raw user search input
 * @returns {string} - Escaped string safe for $regex queries
 */
export function escapeRegex(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

