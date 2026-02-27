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

import type { LanguageFn } from 'highlight.js';

/**
 * RouterOS language definition for highlight.js
 */
const routeros: LanguageFn = (hljs) => ({
  name: 'RouterOS',
  case_insensitive: true,
  keywords: {
    // Action keywords that modify configuration
    keyword: 'add set remove print export find get enable disable move copy paste edit where',
    // Boolean literals
    literal: 'yes no true false',
    // Common interface and service types
    type: 'bridge ethernet vlan wireless wireguard ovpn-client ovpn-server pppoe-client pppoe-server l2tp-client l2tp-server pptp-client pptp-server sstp-client sstp-server ipsec gre eoip ipip 6to4 bonding',
  },
  contains: [
    // Comments - lines starting with #
    hljs.COMMENT('#', '$', {
      className: 'comment',
    }),
    // Quoted strings (double quotes)
    hljs.QUOTE_STRING_MODE,
    // Single-quoted strings
    {
      className: 'string',
      begin: "'",
      end: "'",
      contains: [{ begin: "\\\\'" }],
    },
    // Command paths - /interface, /ip address, etc.
    {
      className: 'command',
      begin: /^\s*\//,
      end: /(?=\s|$)/,
      relevance: 10,
    },
    // Variables - $variableName
    {
      className: 'variable',
      begin: /\$[a-zA-Z_][a-zA-Z0-9_]*/,
    },
    // IP addresses with optional CIDR notation
    {
      className: 'number',
      begin: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?\b/,
      relevance: 5,
    },
    // IPv6 addresses (simplified pattern)
    {
      className: 'number',
      begin: /\b([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}(\/\d{1,3})?\b/,
    },
    // MAC addresses
    {
      className: 'number',
      begin: /\b([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}\b/,
    },
    // Property assignments - name=value
    {
      className: 'property',
      begin: /[a-zA-Z_-]+(?==)/,
      relevance: 3,
    },
    // Bracket expressions - [ find default-name=ether1 ]
    {
      className: 'meta',
      begin: /\[/,
      end: /\]/,
      contains: [
        hljs.QUOTE_STRING_MODE,
        {
          className: 'keyword',
          begin: /\b(find|get|print)\b/,
        },
        {
          className: 'property',
          begin: /[a-zA-Z_-]+(?==)/,
        },
      ],
    },
    // Numbers (ports, counts, etc.)
    {
      className: 'number',
      begin: /\b\d+[kmgt]?b?\b/i,
    },
    // Time values (1h30m, 5s, etc.)
    {
      className: 'number',
      begin: /\b\d+[wdhms]\b/i,
    },
  ],
});

let isRegistered = false;

/**
 * Register the RouterOS language with highlight.js
 * Safe to call multiple times - only registers once
 */
export function registerRouterOS(): void {
  if (!isRegistered) {
    hljs.registerLanguage('routeros', routeros);
    isRegistered = true;
  }
}

/**
 * Highlight RouterOS code
 *
 * @param code - The RouterOS script to highlight
 * @returns Highlighted HTML string
 */
export function highlightRouterOS(code: string): string {
  registerRouterOS();
  try {
    return hljs.highlight(code, { language: 'routeros' }).value;
  } catch {
    // Fallback to plain text if highlighting fails
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

export { hljs };
