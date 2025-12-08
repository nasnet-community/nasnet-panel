import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  darkMode: 'class',
  // Theme customizations are now in src/styles/main.css using @theme block
  // This config is minimal for Tailwind v4 compatibility
  safelist: [
    // RTL/LTR utilities
    {
      pattern: /(ps|pe|ms|me|start|end)-(0|1|2|3|4|5|6|8|10|12|16|20|24)/,
      variants: ['sm', 'md', 'lg', 'xl', 'rtl', 'ltr'],
    },
    // Dark mode utilities
    {
      pattern:
        /(bg|text|border)-(primary|secondary|surface|gray)-(50|100|200|300|400|500|600|700|800|900|950)/,
      variants: ['dark', 'dark:hover', 'dark:focus', 'dark:active'],
    },
    // Responsive utilities
    {
      pattern: /(block|hidden|flex|grid)/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl', 'mobile', 'tablet', 'desktop'],
    },
    // Animation utilities
    {
      pattern: /animate-(fade|slide|scale)/,
      variants: [
        'hover',
        'focus',
        'group-hover',
        'motion-safe',
        'motion-reduce',
      ],
    },
    // Touch utilities
    {
      pattern: /(touch-none|touch-pan-x|touch-pan-y|touch-manipulation)/,
    },
    // Print utilities
    'print:hidden',
    'print:block',
    'print:inline-block',
    'print:flex',
  ],
  // Performance optimizations
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config;
