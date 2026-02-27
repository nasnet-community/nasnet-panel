import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { remarkKroki } from 'remark-kroki';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const baseUrl = isGitHubPages ? '/nasnet-panel/' : '/';

const sharedRemarkPlugins = [
  [
    remarkKroki,
    {
      server: 'https://kroki.io',
      alias: ['plantuml', 'd2', 'excalidraw'],
      target: 'mdx3',
    },
  ],
];

const config: Config = {
  title: 'NasNet Docs',
  tagline: 'Enterprise-grade MikroTik router management platform',
  favicon: 'img/favicon.svg',

  url: isGitHubPages ? 'https://nasnet-community.github.io' : 'https://nasnet.dev',
  baseUrl,

  organizationName: 'nasnet-community',
  projectName: 'nasnet-panel',

  onBrokenLinks: 'warn',

  future: {
    v4: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: [
          '/docs/frontend',
          '/docs/backend',
          '/docs/testing',
          '/docs/ui',
          '/docs/features',
          '/docs/api-client',
          '/docs/state',
          '/docs/core',
          '/api',
        ],
        docsPluginIdForPreferredVersion: 'frontend',
        indexBlog: false,
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'frontend',
        path: '../connect/docs',
        routeBasePath: 'docs/frontend',
        sidebarPath: './sidebars/frontend.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'backend',
        path: '../backend/docs',
        routeBasePath: 'docs/backend',
        sidebarPath: './sidebars/backend.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'testing',
        path: '../connect-e2e/docs',
        routeBasePath: 'docs/testing',
        sidebarPath: './sidebars/testing.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ui',
        path: '../../libs/ui/docs',
        routeBasePath: 'docs/ui',
        sidebarPath: './sidebars/ui.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'features',
        path: '../../libs/features/docs',
        routeBasePath: 'docs/features',
        sidebarPath: './sidebars/features.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api-client',
        path: '../../libs/api-client/docs',
        routeBasePath: 'docs/api-client',
        sidebarPath: './sidebars/api-client.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'state',
        path: '../../libs/state/docs',
        routeBasePath: 'docs/state',
        sidebarPath: './sidebars/state.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'core',
        path: '../../libs/core/docs',
        routeBasePath: 'docs/core',
        sidebarPath: './sidebars/core.ts',
        remarkPlugins: sharedRemarkPlugins,
        editUrl: 'https://github.com/nasnet-community/nasnet-panel/tree/main/',
      },
    ],
    [
      '@graphql-markdown/docusaurus',
      {
        schema: '../../schema/**/*.graphql',
        rootPath: './docs',
        baseURL: 'api',
        loaders: {
          GraphQLFileLoader: '@graphql-tools/graphql-file-loader',
        },
        docOptions: {
          index: true,
        },
        printTypeOptions: {
          deprecated: 'group',
          typeBadges: true,
          parentTypePrefix: false,
          relatedTypeSection: true,
        },
        customDirective: {
          auth: {
            descriptor: (directive: { args?: { requires?: string } }) => {
              const { requires } = directive.args || {};
              return `Requires \`${requires}\` role.`;
            },
          },
          validate: {
            tag: () => ({
              text: 'VALIDATED',
              classname: 'badge--info',
            }),
          },
          sensitive: {
            tag: () => ({
              text: 'SENSITIVE',
              classname: 'badge--danger',
            }),
          },
        },
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api',
        path: './docs',
        routeBasePath: '/',
        include: ['api/**/*.{md,mdx}'],
        sidebarItemsGenerator: async ({ defaultSidebarItemsGenerator, ...args }) => {
          return defaultSidebarItemsGenerator(args);
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'NasNet Docs',
      logo: {
        alt: 'NasNet Logo',
        src: 'img/hero-logo.jpg',
        style: { borderRadius: '6px' },
      },
      items: [
        {
          type: 'dropdown',
          label: 'Apps',
          position: 'left',
          items: [
            {
              label: 'Frontend (Connect)',
              to: '/docs/frontend/intro',
            },
            {
              label: 'Backend (Go)',
              to: '/docs/backend/intro',
            },
            {
              label: 'E2E Testing',
              to: '/docs/testing/intro',
            },
          ],
        },
        {
          type: 'dropdown',
          label: 'Libraries',
          position: 'left',
          items: [
            {
              label: 'UI Components',
              to: '/docs/ui/intro',
            },
            {
              label: 'Feature Modules',
              to: '/docs/features/intro',
            },
            {
              label: 'API Client',
              to: '/docs/api-client/intro',
            },
            {
              label: 'State Management',
              to: '/docs/state/intro',
            },
            {
              label: 'Core Types',
              to: '/docs/core/intro',
            },
          ],
        },
        {
          type: 'dropdown',
          label: 'Components',
          position: 'left',
          items: [
            { label: 'UI Primitives', href: `${baseUrl}storybook/primitives/` },
            { label: 'UI Patterns', href: `${baseUrl}storybook/patterns/` },
            { label: 'Connect App', href: `${baseUrl}storybook/connect/` },
          ],
        },
        {
          label: 'API Reference',
          to: '/api',
          position: 'left',
        },
        {
          label: 'Changelog',
          href: 'https://github.com/nasnet-community/nasnet-panel/releases',
          position: 'right',
        },
        {
          label: 'Nx Graph',
          href: `${baseUrl}nx-graph/`,
          position: 'right',
        },
        {
          href: 'https://github.com/nasnet-community/nasnet-panel',
          label: 'GitHub',
          position: 'right',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Apps',
          items: [
            { label: 'Frontend', to: '/docs/frontend/intro' },
            { label: 'Backend', to: '/docs/backend/intro' },
            { label: 'E2E Testing', to: '/docs/testing/intro' },
          ],
        },
        {
          title: 'Libraries',
          items: [
            { label: 'UI Components', to: '/docs/ui/intro' },
            { label: 'Feature Modules', to: '/docs/features/intro' },
            { label: 'API Client', to: '/docs/api-client/intro' },
            { label: 'State Management', to: '/docs/state/intro' },
            { label: 'Core Types', to: '/docs/core/intro' },
          ],
        },
        {
          title: 'API',
          items: [
            { label: 'Schema Overview', to: '/api' },
            { label: 'Queries', to: '/category/queries' },
            { label: 'Mutations', to: '/category/mutations' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/nasnet-community/nasnet-panel' },
            { label: 'Storybook (Primitives)', href: `${baseUrl}storybook/primitives/` },
            { label: 'Storybook (Patterns)', href: `${baseUrl}storybook/patterns/` },
            { label: 'Nx Graph', href: `${baseUrl}nx-graph/` },
            {
              label: 'Architecture',
              href: 'https://github.com/nasnet-community/nasnet-panel/tree/main/Docs/architecture',
            },
          ],
        },
      ],
      copyright: `\u00A9 ${new Date().getFullYear()} NasNet \u00B7 Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'go', 'graphql', 'json', 'typescript'],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {
        light: 'base',
        dark: 'base',
      },
      options: {
        fontFamily: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
        fontSize: 14,
        flowchart: {
          curve: 'basis',
          padding: 24,
          htmlLabels: true,
          useMaxWidth: true,
        },
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
