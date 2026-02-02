/**
 * i18next-parser Configuration
 *
 * Extracts translation keys from source code and generates/updates JSON files.
 * Run with: npm run i18n:extract
 *
 * @see NAS-4.22: Implement Internationalization (i18n) Setup
 */
module.exports = {
  // Context separator used in keys (e.g., "namespace:key")
  contextSeparator: '_',

  // Create initial translation files if they don't exist
  createOldCatalogs: false,

  // Default namespace when none specified
  defaultNamespace: 'common',

  // Default value for new keys (empty or the key itself)
  defaultValue: '',

  // Indentation for JSON output
  indentation: 2,

  // Keep removed keys in output (for review)
  keepRemoved: false,

  // Key separator in nested objects
  keySeparator: '.',

  // Files to scan for translation keys
  input: [
    'apps/connect/src/**/*.{ts,tsx}',
    'libs/ui/patterns/src/**/*.{ts,tsx}',
    'libs/ui/layouts/src/**/*.{ts,tsx}',
    'libs/features/*/src/**/*.{ts,tsx}',
    // Exclude test files
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/*.stories.{ts,tsx}',
  ],

  // Locales to generate
  locales: ['en', 'fa'],

  // Namespace separator
  namespaceSeparator: ':',

  // Output path pattern
  // {{lng}} = language code (en, fa)
  // {{ns}} = namespace (common, validation, errors)
  output: 'apps/connect/public/locales/$LOCALE/$NAMESPACE.json',

  // Plural suffix
  pluralSeparator: '_',

  // Sort keys alphabetically
  sort: true,

  // Skip default values
  skipDefaultValues: false,

  // Use key as initial value
  useKeysAsDefaultValue: true,

  // Verbose output
  verbose: false,

  // Fail on warnings (for CI)
  failOnWarnings: false,

  // Fail on update (for CI - detects missing keys)
  failOnUpdate: false,

  // Custom transform for Trans components
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span'],

  // Lexers for different file types
  lexers: {
    ts: [
      {
        lexer: 'JavascriptLexer',
        functions: ['t', 'i18n.t'],
      },
    ],
    tsx: [
      {
        lexer: 'JsxLexer',
        functions: ['t', 'i18n.t'],
        // Attr to look for in Trans components
        attr: 'i18nKey',
      },
    ],
  },
};
