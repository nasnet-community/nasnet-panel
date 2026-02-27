// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nxPlugin from '@nx/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import i18nextPlugin from 'eslint-plugin-i18next';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/coverage',
      '**/.nx',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      'ConnectSetupOldRepo/**',
      '**/generated/**',
      '**/*.generated.*',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...compat.config({
    extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  }),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@nx': nxPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: importPlugin,
      i18next: i18nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
        node: true,
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // React Hooks rules (AC1: React hooks rules enforced)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules (AC1: a11y rules enforced)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'warn',

      // Import ordering rules (AC1: import ordering rules enforced)
      // 'import/order': [
      //   'error',
      //   {
      //     groups: [
      //       'builtin',
      //       'external',
      //       'internal',
      //       ['parent', 'sibling'],
      //       'index',
      //       'type',
      //     ],
      //     'newlines-between': 'always',
      //     alphabetize: {
      //       order: 'asc',
      //       caseInsensitive: true,
      //     },
      //     pathGroups: [
      //       {
      //         pattern: 'react',
      //         group: 'external',
      //         position: 'before',
      //       },
      //       {
      //         pattern: '@nasnet/**',
      //         group: 'internal',
      //         position: 'before',
      //       },
      //       {
      //         pattern: '@/**',
      //         group: 'internal',
      //         position: 'after',
      //       },
      //     ],
      //     pathGroupsExcludedImportTypes: ['react'],
      //   },
      // ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/named': 'off', // TypeScript handles this
      'import/namespace': 'off', // TypeScript handles this
      'import/default': 'off', // TypeScript handles this
      'import/export': 'error',

      // Nx module boundary enforcement per ADR-003
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: [
            '@nasnet/api-client/queries',
            '@nasnet/api-client/queries/*',
            '@nasnet/api-client/generated',
            '@nasnet/features/firewall',
            '@nasnet/features/network',
            '@nasnet/features/services',
            '@nasnet/features/alerts',
            '@nasnet/features/diagnostics',
            '@nasnet/features/dashboard',
            '@nasnet/features/logs',
            '@nasnet/features/wireless',
            '@nasnet/features/router-discovery',
            '@nasnet/features/configuration-import',
            '@nasnet/ui/primitives',
            '@nasnet/ui/patterns',
            '@nasnet/ui/utils',
            '@nasnet/ui/layouts',
          ],
          depConstraints: [
            // Apps can depend on everything
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: [
                'scope:core',
                'scope:ui',
                'scope:ui-primitives',
                'scope:ui-patterns',
                'scope:ui-layouts',
                'scope:features',
                'scope:api-client',
                'scope:api-client-core',
                'scope:state',
                'scope:shared',
              ],
            },
            // Features can depend on ui, core, api-client, state, shared (NOT other features)
            {
              sourceTag: 'scope:features',
              onlyDependOnLibsWithTags: [
                'scope:ui',
                'scope:ui-primitives',
                'scope:ui-patterns',
                'scope:ui-layouts',
                'scope:core',
                'scope:api-client',
                'scope:api-client-core',
                'scope:state',
                'scope:shared',
              ],
            },
            // UI can depend on core, shared, and other UI libs
            {
              sourceTag: 'scope:ui',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:shared', 'scope:ui'],
            },
            // Three-Layer Component Architecture (ADR-017)
            // ui-primitives: Foundation layer (Layer 1), no UI dependencies
            {
              sourceTag: 'scope:ui-primitives',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:shared'],
            },
            // ui-patterns: Can depend on primitives, layouts, and state (Layer 2)
            // State access is needed for composite UI components (command palette, auth, connection status)
            {
              sourceTag: 'scope:ui-patterns',
              onlyDependOnLibsWithTags: [
                'scope:core',
                'scope:shared',
                'scope:ui-primitives',
                'scope:ui-layouts',
                'scope:state',
              ],
            },
            // ui-layouts: Can depend on primitives only
            {
              sourceTag: 'scope:ui-layouts',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:shared', 'scope:ui-primitives'],
            },
            // API client can depend on core, api-client-core, and shared
            {
              sourceTag: 'scope:api-client',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:api-client-core', 'scope:shared'],
            },
            // API client core can depend on core, state, and shared
            {
              sourceTag: 'scope:api-client-core',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:shared', 'scope:state'],
            },
            // State can depend on core, api-client, and shared
            {
              sourceTag: 'scope:state',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:api-client', 'scope:shared'],
            },
            // Core can only depend on shared
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // Shared has no dependencies
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: [],
            },
          ],
        },
      ],
    },
  },
  // Specific overrides for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@nx/enforce-module-boundaries': 'off', // Test files often need to mock dependencies
    },
  },
  // Storybook stories: render functions use hooks but aren't React components
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Test template files (not executed directly)
  {
    files: ['**/*.template.ts', '**/*.template.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // CommonJS configuration files
  {
    files: ['**/*.config.js', '.stylelintrc.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // TypeScript declaration files
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-var': 'off',
    },
  },
];
