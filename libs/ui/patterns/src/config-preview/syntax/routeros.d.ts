/**
 * RouterOS Syntax Highlighting
 *
 * highlight.js language definition for MikroTik RouterOS scripts.
 * Provides syntax highlighting for configuration previews.
 *
 * Token Categories:
 * - commands: /interface, /ip, /system - displayed in primary color
 * - keywords: add, set, remove, print - displayed in secondary color
 * - strings: quoted values - displayed in green
 * - comments: # lines - displayed in muted gray
 * - variables: $variableName - displayed in purple
 * - ip-addresses: 192.168.1.1/24 - displayed in cyan
 * - booleans: yes, no - displayed in orange
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see https://highlightjs.readthedocs.io/en/latest/language-guide.html
 */
import hljs from 'highlight.js/lib/core';
/**
 * Register the RouterOS language with highlight.js
 * Safe to call multiple times - only registers once
 */
export declare function registerRouterOS(): void;
/**
 * Highlight RouterOS code
 *
 * @param code - The RouterOS script to highlight
 * @returns Highlighted HTML string
 */
export declare function highlightRouterOS(code: string): string;
export { hljs };
//# sourceMappingURL=routeros.d.ts.map