/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
  rules: {
    // Allow Tailwind CSS @apply and other directives
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'variants',
          'responsive',
          'screen',
          'theme',
          'plugin',
          'utility',
          'source',
        ],
      },
    ],
    // Allow Tailwind CSS functions
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme', 'screen'],
      },
    ],
    // Disable rules that conflict with Tailwind CSS
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null,
    // Allow CSS custom properties
    'custom-property-pattern': null,
    // Allow class naming patterns for Tailwind utilities
    'selector-class-pattern': null,
    // Import ordering for CSS
    'import-notation': 'string',
    // Relax some rules for existing code
    'comment-empty-line-before': null,
    'declaration-empty-line-before': null,
    'rule-empty-line-before': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'media-feature-range-notation': null,
    'font-family-name-quotes': null,
    'no-duplicate-selectors': null,
    'no-empty-source': null,
    'property-no-vendor-prefix': null,
    'value-keyword-case': null,
    'hue-degree-notation': null,
    'number-max-precision': null,
    'block-no-empty': null,
  },
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.nx/**',
    // Ignore legacy/POC apps for now
    'apps/connectpoc/**',
    'apps/star-setup-docker/**',
    'apps/star-setup-web/**',
    'ConnectSetupOldRepo/**',
  ],
};
