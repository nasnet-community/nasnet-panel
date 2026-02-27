import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true,
  },
  {
    path: '/404',
    component: ComponentCreator('/404', 'cfc'),
    exact: true,
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true,
  },
  {
    path: '/docs/api-client',
    component: ComponentCreator('/docs/api-client', '68d'),
    routes: [
      {
        path: '/docs/api-client',
        component: ComponentCreator('/docs/api-client', '4b5'),
        routes: [
          {
            path: '/docs/api-client',
            component: ComponentCreator('/docs/api-client', '740'),
            routes: [
              {
                path: '/docs/api-client/apollo-client',
                component: ComponentCreator('/docs/api-client/apollo-client', 'dd0'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/authentication',
                component: ComponentCreator('/docs/api-client/authentication', '97c'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/axios-http-client',
                component: ComponentCreator('/docs/api-client/axios-http-client', 'd9d'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/change-set-pattern',
                component: ComponentCreator('/docs/api-client/change-set-pattern', 'e18'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/domain-query-hooks',
                component: ComponentCreator('/docs/api-client/domain-query-hooks', 'b14'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/error-handling',
                component: ComponentCreator('/docs/api-client/error-handling', '9ba'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/graphql-schema-contracts',
                component: ComponentCreator('/docs/api-client/graphql-schema-contracts', 'a86'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/intro',
                component: ComponentCreator('/docs/api-client/intro', 'd93'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/notifications-webhooks',
                component: ComponentCreator('/docs/api-client/notifications-webhooks', 'bef'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/offline-first',
                component: ComponentCreator('/docs/api-client/offline-first', 'c2d'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/service-lifecycle',
                component: ComponentCreator('/docs/api-client/service-lifecycle', '1f3'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/tanstack-query-modules',
                component: ComponentCreator('/docs/api-client/tanstack-query-modules', '543'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/testing-and-codegen',
                component: ComponentCreator('/docs/api-client/testing-and-codegen', '4b1'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/universal-state-resource-model',
                component: ComponentCreator(
                  '/docs/api-client/universal-state-resource-model',
                  '421'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/api-client/websocket-subscriptions',
                component: ComponentCreator('/docs/api-client/websocket-subscriptions', 'b09'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/backend',
    component: ComponentCreator('/docs/backend', '2e3'),
    routes: [
      {
        path: '/docs/backend',
        component: ComponentCreator('/docs/backend', 'ce6'),
        routes: [
          {
            path: '/docs/backend',
            component: ComponentCreator('/docs/backend', 'ebe'),
            routes: [
              {
                path: '/docs/backend/',
                component: ComponentCreator('/docs/backend/', '63b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/alert-system',
                component: ComponentCreator('/docs/backend/alert-system', '1d5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/application-bootstrap',
                component: ComponentCreator('/docs/backend/application-bootstrap', '6b7'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/build-and-deploy',
                component: ComponentCreator('/docs/backend/build-and-deploy', '552'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/config-generation',
                component: ComponentCreator('/docs/backend/config-generation', 'de9'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/connection-management',
                component: ComponentCreator('/docs/backend/connection-management', 'b18'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/data-layer',
                component: ComponentCreator('/docs/backend/data-layer', 'e83'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/error-handling',
                component: ComponentCreator('/docs/backend/error-handling', 'b6b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/event-system',
                component: ComponentCreator('/docs/backend/event-system', '214'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/feature-marketplace',
                component: ComponentCreator('/docs/backend/feature-marketplace', 'e1f'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/alert-lifecycle-flow',
                component: ComponentCreator('/docs/backend/flows/alert-lifecycle-flow', 'f80'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/config-provisioning-flow',
                component: ComponentCreator('/docs/backend/flows/config-provisioning-flow', 'ed1'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/device-routing-chain-flow',
                component: ComponentCreator('/docs/backend/flows/device-routing-chain-flow', '852'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/graphql-request-lifecycle',
                component: ComponentCreator('/docs/backend/flows/graphql-request-lifecycle', 'f54'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/router-connection-flow',
                component: ComponentCreator('/docs/backend/flows/router-connection-flow', 'e24'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/service-installation-flow',
                component: ComponentCreator('/docs/backend/flows/service-installation-flow', 'bb2'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/flows/service-update-flow',
                component: ComponentCreator('/docs/backend/flows/service-update-flow', 'ead'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/getting-started',
                component: ComponentCreator('/docs/backend/getting-started', 'e74'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/graphql-api',
                component: ComponentCreator('/docs/backend/graphql-api', '5fb'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/intro',
                component: ComponentCreator('/docs/backend/intro', '082'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/network-services',
                component: ComponentCreator('/docs/backend/network-services', '7e3'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/process-isolation',
                component: ComponentCreator('/docs/backend/process-isolation', 'afc'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/provisioning-engine',
                component: ComponentCreator('/docs/backend/provisioning-engine', 'abf'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/router-communication',
                component: ComponentCreator('/docs/backend/router-communication', '4e3'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/router-services',
                component: ComponentCreator('/docs/backend/router-services', '671'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/security',
                component: ComponentCreator('/docs/backend/security', 'c1e'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/service-orchestrator',
                component: ComponentCreator('/docs/backend/service-orchestrator', '572'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/translator-layer',
                component: ComponentCreator('/docs/backend/translator-layer', '986'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/validation-pipeline',
                component: ComponentCreator('/docs/backend/validation-pipeline', '989'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/backend/virtual-interface-factory',
                component: ComponentCreator('/docs/backend/virtual-interface-factory', 'f7c'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/core',
    component: ComponentCreator('/docs/core', '841'),
    routes: [
      {
        path: '/docs/core',
        component: ComponentCreator('/docs/core', 'cdc'),
        routes: [
          {
            path: '/docs/core',
            component: ComponentCreator('/docs/core', 'c64'),
            routes: [
              {
                path: '/docs/core/',
                component: ComponentCreator('/docs/core/', 'c9a'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/accessibility-patterns',
                component: ComponentCreator('/docs/core/guides/accessibility-patterns', '690'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/change-set-operations',
                component: ComponentCreator('/docs/core/guides/change-set-operations', '67c'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/device-detection-pipeline',
                component: ComponentCreator('/docs/core/guides/device-detection-pipeline', '14c'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/error-handling-patterns',
                component: ComponentCreator('/docs/core/guides/error-handling-patterns', 'f36'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/firewall-system',
                component: ComponentCreator('/docs/core/guides/firewall-system', '217'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/graphql-integration-guide',
                component: ComponentCreator('/docs/core/guides/graphql-integration-guide', '1e7'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/internationalization-flow',
                component: ComponentCreator('/docs/core/guides/internationalization-flow', '57f'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/network-configuration',
                component: ComponentCreator('/docs/core/guides/network-configuration', '859'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/performance-patterns',
                component: ComponentCreator('/docs/core/guides/performance-patterns', '5d9'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/security-patterns',
                component: ComponentCreator('/docs/core/guides/security-patterns', 'fa1'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/state-machines-guide',
                component: ComponentCreator('/docs/core/guides/state-machines-guide', '97c'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/testing-patterns',
                component: ComponentCreator('/docs/core/guides/testing-patterns', '1b1'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/universal-state-v2',
                component: ComponentCreator('/docs/core/guides/universal-state-v2', 'f2d'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/guides/validation-pipeline',
                component: ComponentCreator('/docs/core/guides/validation-pipeline', '890'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/intro',
                component: ComponentCreator('/docs/core/intro', '0d7'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/sub-libraries/constants',
                component: ComponentCreator('/docs/core/sub-libraries/constants', '615'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/sub-libraries/forms',
                component: ComponentCreator('/docs/core/sub-libraries/forms', 'd4b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/sub-libraries/i18n',
                component: ComponentCreator('/docs/core/sub-libraries/i18n', '6af'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/sub-libraries/types',
                component: ComponentCreator('/docs/core/sub-libraries/types', 'e74'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/core/sub-libraries/utils',
                component: ComponentCreator('/docs/core/sub-libraries/utils', 'c5f'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/features',
    component: ComponentCreator('/docs/features', '704'),
    routes: [
      {
        path: '/docs/features',
        component: ComponentCreator('/docs/features', '8fa'),
        routes: [
          {
            path: '/docs/features',
            component: ComponentCreator('/docs/features', '7c2'),
            routes: [
              {
                path: '/docs/features/',
                component: ComponentCreator('/docs/features/', '182'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/api-client-and-graphql',
                component: ComponentCreator('/docs/features/api-client-and-graphql', '471'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/architecture-overview',
                component: ComponentCreator('/docs/features/architecture-overview', 'f28'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/cross-cutting-flows',
                component: ComponentCreator('/docs/features/cross-cutting-flows', '562'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/error-handling',
                component: ComponentCreator('/docs/features/error-handling', 'ecc'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-alerts',
                component: ComponentCreator('/docs/features/feature-alerts', '5c5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-dashboard',
                component: ComponentCreator('/docs/features/feature-dashboard', '2ba'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-diagnostics',
                component: ComponentCreator('/docs/features/feature-diagnostics', '821'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-firewall',
                component: ComponentCreator('/docs/features/feature-firewall', 'd70'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-logs',
                component: ComponentCreator('/docs/features/feature-logs', 'b9b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-minor',
                component: ComponentCreator('/docs/features/feature-minor', 'a1f'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-network',
                component: ComponentCreator('/docs/features/feature-network', '571'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-services',
                component: ComponentCreator('/docs/features/feature-services', '253'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/feature-vpn',
                component: ComponentCreator('/docs/features/feature-vpn', '9d6'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/intro',
                component: ComponentCreator('/docs/features/intro', 'e3b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/routing-and-navigation',
                component: ComponentCreator('/docs/features/routing-and-navigation', 'a08'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/state-management',
                component: ComponentCreator('/docs/features/state-management', '3eb'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/testing-and-storybook',
                component: ComponentCreator('/docs/features/testing-and-storybook', 'c07'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/features/xstate-machines',
                component: ComponentCreator('/docs/features/xstate-machines', 'fcb'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/frontend',
    component: ComponentCreator('/docs/frontend', 'ed6'),
    routes: [
      {
        path: '/docs/frontend',
        component: ComponentCreator('/docs/frontend', 'd3f'),
        routes: [
          {
            path: '/docs/frontend',
            component: ComponentCreator('/docs/frontend', '3df'),
            routes: [
              {
                path: '/docs/frontend/',
                component: ComponentCreator('/docs/frontend/', '539'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/architecture/build-system',
                component: ComponentCreator('/docs/frontend/architecture/build-system', '851'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/architecture/library-dependencies',
                component: ComponentCreator(
                  '/docs/frontend/architecture/library-dependencies',
                  'e8c'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/architecture/overview',
                component: ComponentCreator('/docs/frontend/architecture/overview', '3c3'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/architecture/provider-stack',
                component: ComponentCreator('/docs/frontend/architecture/provider-stack', '688'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/architecture/routing',
                component: ComponentCreator('/docs/frontend/architecture/routing', '32f'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/alerts-system',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/alerts-system',
                  '337'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/change-set-system',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/change-set-system',
                  'a4e'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/configuration-import',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/configuration-import',
                  '6c3'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/drift-detection-feature',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/drift-detection-feature',
                  '282'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/router-connection',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/router-connection',
                  'e02'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/service-marketplace',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/service-marketplace',
                  '183'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/cross-cutting-features/virtual-interface-factory',
                component: ComponentCreator(
                  '/docs/frontend/cross-cutting-features/virtual-interface-factory',
                  '550'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/data-fetching/codegen',
                component: ComponentCreator('/docs/frontend/data-fetching/codegen', 'cfc'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/data-fetching/graphql-hooks',
                component: ComponentCreator('/docs/frontend/data-fetching/graphql-hooks', '13b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/data-fetching/offline-support',
                component: ComponentCreator('/docs/frontend/data-fetching/offline-support', 'e42'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/data-fetching/overview',
                component: ComponentCreator('/docs/frontend/data-fetching/overview', '094'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/data-fetching/rest-client',
                component: ComponentCreator('/docs/frontend/data-fetching/rest-client', '4e5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/dashboard',
                component: ComponentCreator('/docs/frontend/feature-modules/dashboard', 'eeb'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/diagnostics',
                component: ComponentCreator('/docs/frontend/feature-modules/diagnostics', '9e7'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/firewall',
                component: ComponentCreator('/docs/frontend/feature-modules/firewall', '64a'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/logs',
                component: ComponentCreator('/docs/frontend/feature-modules/logs', '82b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/network',
                component: ComponentCreator('/docs/frontend/feature-modules/network', 'd71'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/services',
                component: ComponentCreator('/docs/frontend/feature-modules/services', '96a'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/vpn',
                component: ComponentCreator('/docs/frontend/feature-modules/vpn', '931'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/feature-modules/wireless',
                component: ComponentCreator('/docs/frontend/feature-modules/wireless', 'f1b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/forms-validation/form-utilities',
                component: ComponentCreator(
                  '/docs/frontend/forms-validation/form-utilities',
                  '1a7'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/forms-validation/network-validators',
                component: ComponentCreator(
                  '/docs/frontend/forms-validation/network-validators',
                  'e7d'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/forms-validation/overview',
                component: ComponentCreator('/docs/frontend/forms-validation/overview', '59e'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/forms-validation/validation-pipeline',
                component: ComponentCreator(
                  '/docs/frontend/forms-validation/validation-pipeline',
                  '232'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/forms-validation/wizard-forms',
                component: ComponentCreator('/docs/frontend/forms-validation/wizard-forms', '207'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/getting-started/environment-setup',
                component: ComponentCreator(
                  '/docs/frontend/getting-started/environment-setup',
                  '47c'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/getting-started/key-commands',
                component: ComponentCreator('/docs/frontend/getting-started/key-commands', 'a2c'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/getting-started/overview',
                component: ComponentCreator('/docs/frontend/getting-started/overview', '6cf'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/getting-started/project-structure',
                component: ComponentCreator(
                  '/docs/frontend/getting-started/project-structure',
                  'a3d'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/i18n-accessibility/accessibility',
                component: ComponentCreator(
                  '/docs/frontend/i18n-accessibility/accessibility',
                  '1de'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/i18n-accessibility/i18n',
                component: ComponentCreator('/docs/frontend/i18n-accessibility/i18n', 'f6b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/intro',
                component: ComponentCreator('/docs/frontend/intro', '23b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/operations/development-workflow',
                component: ComponentCreator(
                  '/docs/frontend/operations/development-workflow',
                  'ac6'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/operations/performance',
                component: ComponentCreator('/docs/frontend/operations/performance', '268'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/operations/storybook',
                component: ComponentCreator('/docs/frontend/operations/storybook', '2df'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/state-management/apollo-client',
                component: ComponentCreator('/docs/frontend/state-management/apollo-client', '7c5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/state-management/drift-detection',
                component: ComponentCreator(
                  '/docs/frontend/state-management/drift-detection',
                  '316'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/state-management/overview',
                component: ComponentCreator('/docs/frontend/state-management/overview', 'b75'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/state-management/xstate-machines',
                component: ComponentCreator(
                  '/docs/frontend/state-management/xstate-machines',
                  '2cd'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/state-management/zustand-stores',
                component: ComponentCreator(
                  '/docs/frontend/state-management/zustand-stores',
                  '625'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/testing/component-testing',
                component: ComponentCreator('/docs/frontend/testing/component-testing', '9a5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/testing/e2e-testing',
                component: ComponentCreator('/docs/frontend/testing/e2e-testing', 'f9b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/testing/mocking',
                component: ComponentCreator('/docs/frontend/testing/mocking', 'c12'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/testing/overview',
                component: ComponentCreator('/docs/frontend/testing/overview', 'd3e'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/testing/unit-testing',
                component: ComponentCreator('/docs/frontend/testing/unit-testing', 'ea3'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/ui-system/design-tokens',
                component: ComponentCreator('/docs/frontend/ui-system/design-tokens', 'e18'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/ui-system/layouts',
                component: ComponentCreator('/docs/frontend/ui-system/layouts', '7f8'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/ui-system/overview',
                component: ComponentCreator('/docs/frontend/ui-system/overview', 'fe2'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/ui-system/patterns-catalog',
                component: ComponentCreator('/docs/frontend/ui-system/patterns-catalog', '119'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/ui-system/platform-presenters',
                component: ComponentCreator('/docs/frontend/ui-system/platform-presenters', 'd5b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/frontend/ui-system/primitives-catalog',
                component: ComponentCreator('/docs/frontend/ui-system/primitives-catalog', '327'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/state',
    component: ComponentCreator('/docs/state', '41c'),
    routes: [
      {
        path: '/docs/state',
        component: ComponentCreator('/docs/state', '75a'),
        routes: [
          {
            path: '/docs/state',
            component: ComponentCreator('/docs/state', 'af9'),
            routes: [
              {
                path: '/docs/state/architecture',
                component: ComponentCreator('/docs/state/architecture', '641'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/guides/adding-a-machine',
                component: ComponentCreator('/docs/state/guides/adding-a-machine', '889'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/guides/adding-a-store',
                component: ComponentCreator('/docs/state/guides/adding-a-store', '337'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/guides/debugging',
                component: ComponentCreator('/docs/state/guides/debugging', 'b3d'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/guides/quickstart',
                component: ComponentCreator('/docs/state/guides/quickstart', '809'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/guides/testing',
                component: ComponentCreator('/docs/state/guides/testing', '48a'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/integrations/a11y-provider',
                component: ComponentCreator('/docs/state/integrations/a11y-provider', 'ef2'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/integrations/apollo-integration',
                component: ComponentCreator('/docs/state/integrations/apollo-integration', '0f9'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/integrations/cross-feature-sharing',
                component: ComponentCreator(
                  '/docs/state/integrations/cross-feature-sharing',
                  '884'
                ),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/intro',
                component: ComponentCreator('/docs/state/intro', '978'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/change-set-machine',
                component: ComponentCreator('/docs/state/machines/change-set-machine', 'acd'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/config-pipeline',
                component: ComponentCreator('/docs/state/machines/config-pipeline', '330'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/hooks-reference',
                component: ComponentCreator('/docs/state/machines/hooks-reference', '791'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/overview',
                component: ComponentCreator('/docs/state/machines/overview', '4de'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/persistence',
                component: ComponentCreator('/docs/state/machines/persistence', '73b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/resource-lifecycle',
                component: ComponentCreator('/docs/state/machines/resource-lifecycle', 'c66'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/vpn-connection',
                component: ComponentCreator('/docs/state/machines/vpn-connection', '7b7'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/machines/wizard',
                component: ComponentCreator('/docs/state/machines/wizard', 'df8'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/performance',
                component: ComponentCreator('/docs/state/performance', '989'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/persistence',
                component: ComponentCreator('/docs/state/persistence', 'fd9'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/auth',
                component: ComponentCreator('/docs/state/stores/auth', 'c6e'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/change-set',
                component: ComponentCreator('/docs/state/stores/change-set', '9ee'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/command-shortcut',
                component: ComponentCreator('/docs/state/stores/command-shortcut', '64d'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/connection',
                component: ComponentCreator('/docs/state/stores/connection', '2a5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/domain-ui-stores',
                component: ComponentCreator('/docs/state/stores/domain-ui-stores', '254'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/drift-detection',
                component: ComponentCreator('/docs/state/stores/drift-detection', '2cb'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/history-undo-redo',
                component: ComponentCreator('/docs/state/stores/history-undo-redo', '629'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/hooks-utilities',
                component: ComponentCreator('/docs/state/stores/hooks-utilities', '075'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/overview',
                component: ComponentCreator('/docs/state/stores/overview', '2c4'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/router',
                component: ComponentCreator('/docs/state/stores/router', '963'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/selectors-reference',
                component: ComponentCreator('/docs/state/stores/selectors-reference', '642'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/state/stores/ui',
                component: ComponentCreator('/docs/state/stores/ui', 'd8a'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/testing',
    component: ComponentCreator('/docs/testing', 'da8'),
    routes: [
      {
        path: '/docs/testing',
        component: ComponentCreator('/docs/testing', '62b'),
        routes: [
          {
            path: '/docs/testing',
            component: ComponentCreator('/docs/testing', 'cd1'),
            routes: [
              {
                path: '/docs/testing/intro',
                component: ComponentCreator('/docs/testing/intro', '29e'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/docs/ui',
    component: ComponentCreator('/docs/ui', '0bd'),
    routes: [
      {
        path: '/docs/ui',
        component: ComponentCreator('/docs/ui', '766'),
        routes: [
          {
            path: '/docs/ui',
            component: ComponentCreator('/docs/ui', '4d5'),
            routes: [
              {
                path: '/docs/ui/contributing-and-storybook',
                component: ComponentCreator('/docs/ui/contributing-and-storybook', 'b86'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/error-handling',
                component: ComponentCreator('/docs/ui/error-handling', '489'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/intro',
                component: ComponentCreator('/docs/ui/intro', '08a'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/layouts-and-platform',
                component: ComponentCreator('/docs/ui/layouts-and-platform', 'b3b'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/multi-package-flows',
                component: ComponentCreator('/docs/ui/multi-package-flows', 'cdb'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/patterns-domain-components',
                component: ComponentCreator('/docs/ui/patterns-domain-components', 'e54'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/patterns-forms-and-inputs',
                component: ComponentCreator('/docs/ui/patterns-forms-and-inputs', '358'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/patterns-status-and-data',
                component: ComponentCreator('/docs/ui/patterns-status-and-data', '29f'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/primitives-reference',
                component: ComponentCreator('/docs/ui/primitives-reference', '382'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/quick-start',
                component: ComponentCreator('/docs/ui/quick-start', 'a14'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/shared-hooks',
                component: ComponentCreator('/docs/ui/shared-hooks', 'cf5'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/testing-and-accessibility',
                component: ComponentCreator('/docs/ui/testing-and-accessibility', '383'),
                exact: true,
                sidebar: 'sidebar',
              },
              {
                path: '/docs/ui/tokens-and-animation',
                component: ComponentCreator('/docs/ui/tokens-and-animation', '82c'),
                exact: true,
                sidebar: 'sidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true,
  },
  {
    path: '/',
    component: ComponentCreator('/', 'fc7'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '69b'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '6c9'),
            routes: [
              {
                path: '/api',
                component: ComponentCreator('/api', 'fd1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/directives/include',
                component: ComponentCreator('/api/operations/directives/include', '146'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/directives/skip',
                component: ComponentCreator('/api/operations/directives/skip', '34c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/acknowledge-alert',
                component: ComponentCreator('/api/operations/mutations/acknowledge-alert', 'c7b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/acknowledge-alerts',
                component: ComponentCreator('/api/operations/mutations/acknowledge-alerts', 'a19'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/add-bridge-port',
                component: ComponentCreator('/api/operations/mutations/add-bridge-port', '0c0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/add-change-set-item',
                component: ComponentCreator('/api/operations/mutations/add-change-set-item', 'ef3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/add-dependency',
                component: ComponentCreator('/api/operations/mutations/add-dependency', '863'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/add-ingress-to-bridge',
                component: ComponentCreator(
                  '/api/operations/mutations/add-ingress-to-bridge',
                  'f56'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/add-provisioning-resource',
                component: ComponentCreator(
                  '/api/operations/mutations/add-provisioning-resource',
                  'd9e'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/add-router',
                component: ComponentCreator('/api/operations/mutations/add-router', 'c3d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-alert-rule-template',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-alert-rule-template',
                  '45d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-alert-template',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-alert-template',
                  '093'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-change-set',
                component: ComponentCreator('/api/operations/mutations/apply-change-set', 'aa0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-firewall-template',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-firewall-template',
                  '231'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-provisioning-session',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-provisioning-session',
                  'a76'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-resource',
                component: ComponentCreator('/api/operations/mutations/apply-resource', 'eec'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-service-config',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-service-config',
                  '00b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-service-import',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-service-import',
                  'b85'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/apply-troubleshoot-fix',
                component: ComponentCreator(
                  '/api/operations/mutations/apply-troubleshoot-fix',
                  'e1b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/archive-resource',
                component: ComponentCreator('/api/operations/mutations/archive-resource', '9ee'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/assign-device-routing',
                component: ComponentCreator(
                  '/api/operations/mutations/assign-device-routing',
                  'e42'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/auto-scan-gateways',
                component: ComponentCreator('/api/operations/mutations/auto-scan-gateways', '613'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/batch-interface-operation',
                component: ComponentCreator(
                  '/api/operations/mutations/batch-interface-operation',
                  '69f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/bulk-assign-routing',
                component: ComponentCreator('/api/operations/mutations/bulk-assign-routing', '685'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/bulk-create-address-list-entries',
                component: ComponentCreator(
                  '/api/operations/mutations/bulk-create-address-list-entries',
                  '563'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/cancel-change-set',
                component: ComponentCreator('/api/operations/mutations/cancel-change-set', '89f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/cancel-scan',
                component: ComponentCreator('/api/operations/mutations/cancel-scan', '56d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/cancel-traceroute',
                component: ComponentCreator('/api/operations/mutations/cancel-traceroute', '91f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/cancel-troubleshoot',
                component: ComponentCreator('/api/operations/mutations/cancel-troubleshoot', 'bc4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/change-password',
                component: ComponentCreator('/api/operations/mutations/change-password', 'c83'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/check-for-updates',
                component: ComponentCreator('/api/operations/mutations/check-for-updates', '842'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/check-router-health',
                component: ComponentCreator('/api/operations/mutations/check-router-health', '8ed'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/classify-wan',
                component: ComponentCreator('/api/operations/mutations/classify-wan', '285'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/cleanup-orphaned-ports',
                component: ComponentCreator(
                  '/api/operations/mutations/cleanup-orphaned-ports',
                  '232'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/cleanup-orphaned-vlans',
                component: ComponentCreator(
                  '/api/operations/mutations/cleanup-orphaned-vlans',
                  '0c8'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-bridge-port-vlan',
                component: ComponentCreator(
                  '/api/operations/mutations/configure-bridge-port-vlan',
                  'e32'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-dhcp-wan',
                component: ComponentCreator('/api/operations/mutations/configure-dhcp-wan', '036'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-external-storage',
                component: ComponentCreator(
                  '/api/operations/mutations/configure-external-storage',
                  '96a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-health-check',
                component: ComponentCreator(
                  '/api/operations/mutations/configure-health-check',
                  '0ed'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-lte-wan',
                component: ComponentCreator('/api/operations/mutations/configure-lte-wan', '99d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-pppoe-wan',
                component: ComponentCreator('/api/operations/mutations/configure-pppoe-wan', 'ef8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-static-wan',
                component: ComponentCreator(
                  '/api/operations/mutations/configure-static-wan',
                  '102'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-update-schedule',
                component: ComponentCreator(
                  '/api/operations/mutations/configure-update-schedule',
                  'a30'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/configure-wanhealth-check',
                component: ComponentCreator(
                  '/api/operations/mutations/configure-wanhealth-check',
                  'b06'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/connect-router',
                component: ComponentCreator('/api/operations/mutations/connect-router', '214'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-address-list-entry',
                component: ComponentCreator(
                  '/api/operations/mutations/create-address-list-entry',
                  '4c0'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-alert-rule',
                component: ComponentCreator('/api/operations/mutations/create-alert-rule', '46b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-bridge',
                component: ComponentCreator('/api/operations/mutations/create-bridge', 'd3e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-bridge-vlan',
                component: ComponentCreator('/api/operations/mutations/create-bridge-vlan', '9e7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-change-set',
                component: ComponentCreator('/api/operations/mutations/create-change-set', 'e82'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-egress-vlan',
                component: ComponentCreator('/api/operations/mutations/create-egress-vlan', '199'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-ip-address',
                component: ComponentCreator('/api/operations/mutations/create-ip-address', '8bb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-masquerade-rule',
                component: ComponentCreator(
                  '/api/operations/mutations/create-masquerade-rule',
                  '38a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-nat-rule',
                component: ComponentCreator('/api/operations/mutations/create-nat-rule', 'aa4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-notification-channel-config',
                component: ComponentCreator(
                  '/api/operations/mutations/create-notification-channel-config',
                  'e80'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-port-forward',
                component: ComponentCreator('/api/operations/mutations/create-port-forward', 'b7a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-port-knock-sequence',
                component: ComponentCreator(
                  '/api/operations/mutations/create-port-knock-sequence',
                  '766'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-port-mirror',
                component: ComponentCreator('/api/operations/mutations/create-port-mirror', '4ce'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-resource',
                component: ComponentCreator('/api/operations/mutations/create-resource', '7c8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-route',
                component: ComponentCreator('/api/operations/mutations/create-route', '1a6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-router',
                component: ComponentCreator('/api/operations/mutations/create-router', '212'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-routing-chain',
                component: ComponentCreator(
                  '/api/operations/mutations/create-routing-chain',
                  '32b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-schedule',
                component: ComponentCreator('/api/operations/mutations/create-schedule', '887'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-tunnel',
                component: ComponentCreator('/api/operations/mutations/create-tunnel', '6a9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-vlan',
                component: ComponentCreator('/api/operations/mutations/create-vlan', '192'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/create-webhook',
                component: ComponentCreator('/api/operations/mutations/create-webhook', '760'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-address-list-entry',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-address-list-entry',
                  '4e6'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-alert-rule',
                component: ComponentCreator('/api/operations/mutations/delete-alert-rule', '346'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-alert-template',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-alert-template',
                  'e8f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-bridge',
                component: ComponentCreator('/api/operations/mutations/delete-bridge', '648'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-bridge-vlan',
                component: ComponentCreator('/api/operations/mutations/delete-bridge-vlan', 'a0b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-change-set',
                component: ComponentCreator('/api/operations/mutations/delete-change-set', 'd3a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-custom-alert-rule-template',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-custom-alert-rule-template',
                  '5f7'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-firewall-template',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-firewall-template',
                  'f36'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-instance',
                component: ComponentCreator('/api/operations/mutations/delete-instance', '0ad'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-ip-address',
                component: ComponentCreator('/api/operations/mutations/delete-ip-address', 'bd0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-nat-rule',
                component: ComponentCreator('/api/operations/mutations/delete-nat-rule', '634'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-notification-channel-config',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-notification-channel-config',
                  '478'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-port-forward',
                component: ComponentCreator('/api/operations/mutations/delete-port-forward', '211'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-port-knock-sequence',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-port-knock-sequence',
                  '49f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-port-mirror',
                component: ComponentCreator('/api/operations/mutations/delete-port-mirror', 'e8c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-resource',
                component: ComponentCreator('/api/operations/mutations/delete-resource', '6ea'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-route',
                component: ComponentCreator('/api/operations/mutations/delete-route', '55e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-router',
                component: ComponentCreator('/api/operations/mutations/delete-router', '7d0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-schedule',
                component: ComponentCreator('/api/operations/mutations/delete-schedule', 'a19'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-service-template',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-service-template',
                  '39f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-tunnel',
                component: ComponentCreator('/api/operations/mutations/delete-tunnel', 'ce7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-vlan',
                component: ComponentCreator('/api/operations/mutations/delete-vlan', '950'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-wanconfiguration',
                component: ComponentCreator(
                  '/api/operations/mutations/delete-wanconfiguration',
                  'b45'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/delete-webhook',
                component: ComponentCreator('/api/operations/mutations/delete-webhook', '34a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/deprecate-resource',
                component: ComponentCreator('/api/operations/mutations/deprecate-resource', '6ff'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/disable-interface',
                component: ComponentCreator('/api/operations/mutations/disable-interface', '13e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/disable-port-mirror',
                component: ComponentCreator('/api/operations/mutations/disable-port-mirror', 'db6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/discard-provisioning-session',
                component: ComponentCreator(
                  '/api/operations/mutations/discard-provisioning-session',
                  '2b2'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/disconnect-router',
                component: ComponentCreator('/api/operations/mutations/disconnect-router', '1d4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/enable-interface',
                component: ComponentCreator('/api/operations/mutations/enable-interface', '0ba'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/enable-port-mirror',
                component: ComponentCreator('/api/operations/mutations/enable-port-mirror', '6eb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/export-alert-rule-template',
                component: ComponentCreator(
                  '/api/operations/mutations/export-alert-rule-template',
                  'e3b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/export-as-template',
                component: ComponentCreator('/api/operations/mutations/export-as-template', 'ab3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/export-router-config',
                component: ComponentCreator(
                  '/api/operations/mutations/export-router-config',
                  '8f9'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/export-service-config',
                component: ComponentCreator(
                  '/api/operations/mutations/export-service-config',
                  'f4b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/flush-dns-cache',
                component: ComponentCreator('/api/operations/mutations/flush-dns-cache', '798'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/generate-config-qr',
                component: ComponentCreator('/api/operations/mutations/generate-config-qr', '542'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/import-alert-rule-template',
                component: ComponentCreator(
                  '/api/operations/mutations/import-alert-rule-template',
                  '294'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/import-service-config',
                component: ComponentCreator(
                  '/api/operations/mutations/import-service-config',
                  '02e'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/import-service-template',
                component: ComponentCreator(
                  '/api/operations/mutations/import-service-template',
                  '23d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/import-star-state',
                component: ComponentCreator('/api/operations/mutations/import-star-state', 'ab7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/install-service',
                component: ComponentCreator('/api/operations/mutations/install-service', 'fd4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/install-service-template',
                component: ComponentCreator(
                  '/api/operations/mutations/install-service-template',
                  '59b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/login',
                component: ComponentCreator('/api/operations/mutations/login', '6e5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/logout',
                component: ComponentCreator('/api/operations/mutations/logout', '24f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/next-provisioning-step',
                component: ComponentCreator(
                  '/api/operations/mutations/next-provisioning-step',
                  '211'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/prev-provisioning-step',
                component: ComponentCreator(
                  '/api/operations/mutations/prev-provisioning-step',
                  '599'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/preview-notification-template',
                component: ComponentCreator(
                  '/api/operations/mutations/preview-notification-template',
                  '1ab'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/reconnect-router',
                component: ComponentCreator('/api/operations/mutations/reconnect-router', '98c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/refresh-capabilities',
                component: ComponentCreator(
                  '/api/operations/mutations/refresh-capabilities',
                  '227'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-bridge-port',
                component: ComponentCreator('/api/operations/mutations/remove-bridge-port', '804'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-change-set-item',
                component: ComponentCreator(
                  '/api/operations/mutations/remove-change-set-item',
                  '535'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-dependency',
                component: ComponentCreator('/api/operations/mutations/remove-dependency', '478'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-device-routing',
                component: ComponentCreator(
                  '/api/operations/mutations/remove-device-routing',
                  'aec'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-egress-vlan',
                component: ComponentCreator('/api/operations/mutations/remove-egress-vlan', '634'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-ingress-from-bridge',
                component: ComponentCreator(
                  '/api/operations/mutations/remove-ingress-from-bridge',
                  'b0d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-provisioning-resource',
                component: ComponentCreator(
                  '/api/operations/mutations/remove-provisioning-resource',
                  '607'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/remove-routing-chain',
                component: ComponentCreator(
                  '/api/operations/mutations/remove-routing-chain',
                  '644'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/reset-alert-template',
                component: ComponentCreator(
                  '/api/operations/mutations/reset-alert-template',
                  '2eb'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/reset-circuit-breaker',
                component: ComponentCreator(
                  '/api/operations/mutations/reset-circuit-breaker',
                  '8a0'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/reset-external-storage',
                component: ComponentCreator(
                  '/api/operations/mutations/reset-external-storage',
                  '323'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/reset-traffic-quota',
                component: ComponentCreator('/api/operations/mutations/reset-traffic-quota', 'd73'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/restart-instance',
                component: ComponentCreator('/api/operations/mutations/restart-instance', 'b5f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/reverify-instance',
                component: ComponentCreator('/api/operations/mutations/reverify-instance', '93c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/revoke-all-sessions',
                component: ComponentCreator('/api/operations/mutations/revoke-all-sessions', 'f63'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/revoke-session',
                component: ComponentCreator('/api/operations/mutations/revoke-session', '60e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/rollback-change-set',
                component: ComponentCreator('/api/operations/mutations/rollback-change-set', '32d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/rollback-firewall-template',
                component: ComponentCreator(
                  '/api/operations/mutations/rollback-firewall-template',
                  '6fd'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/rollback-instance',
                component: ComponentCreator('/api/operations/mutations/rollback-instance', 'd3d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/run-diagnostics',
                component: ComponentCreator('/api/operations/mutations/run-diagnostics', '6c4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/run-dns-lookup',
                component: ComponentCreator('/api/operations/mutations/run-dns-lookup', '3f8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/run-service-diagnostics',
                component: ComponentCreator(
                  '/api/operations/mutations/run-service-diagnostics',
                  '017'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/run-traceroute',
                component: ComponentCreator('/api/operations/mutations/run-traceroute', '0a7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/run-troubleshoot-step',
                component: ComponentCreator(
                  '/api/operations/mutations/run-troubleshoot-step',
                  '221'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/save-alert-template',
                component: ComponentCreator('/api/operations/mutations/save-alert-template', '200'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/save-custom-alert-rule-template',
                component: ComponentCreator(
                  '/api/operations/mutations/save-custom-alert-rule-template',
                  '44a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/save-firewall-template',
                component: ComponentCreator(
                  '/api/operations/mutations/save-firewall-template',
                  '065'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/scan-network',
                component: ComponentCreator('/api/operations/mutations/scan-network', '016'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/scan-storage',
                component: ComponentCreator('/api/operations/mutations/scan-storage', '5dd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/set-kill-switch',
                component: ComponentCreator('/api/operations/mutations/set-kill-switch', '9db'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/set-preferred-protocol',
                component: ComponentCreator(
                  '/api/operations/mutations/set-preferred-protocol',
                  'f2f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/set-resource-limits',
                component: ComponentCreator('/api/operations/mutations/set-resource-limits', 'e68'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/set-traffic-quota',
                component: ComponentCreator('/api/operations/mutations/set-traffic-quota', 'cff'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/setup-dual-vlanbridge',
                component: ComponentCreator(
                  '/api/operations/mutations/setup-dual-vlanbridge',
                  '2db'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/start-instance',
                component: ComponentCreator('/api/operations/mutations/start-instance', 'db7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/start-provisioning-session',
                component: ComponentCreator(
                  '/api/operations/mutations/start-provisioning-session',
                  '5b3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/start-troubleshoot',
                component: ComponentCreator('/api/operations/mutations/start-troubleshoot', '196'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/stop-instance',
                component: ComponentCreator('/api/operations/mutations/stop-instance', '2a3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/teardown-dual-vlanbridge',
                component: ComponentCreator(
                  '/api/operations/mutations/teardown-dual-vlanbridge',
                  'bed'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-all-credentials',
                component: ComponentCreator(
                  '/api/operations/mutations/test-all-credentials',
                  '79d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-notification-channel',
                component: ComponentCreator(
                  '/api/operations/mutations/test-notification-channel',
                  '844'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-port-knock-sequence',
                component: ComponentCreator(
                  '/api/operations/mutations/test-port-knock-sequence',
                  'ecb'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-router-connection',
                component: ComponentCreator(
                  '/api/operations/mutations/test-router-connection',
                  'fa9'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-router-credentials',
                component: ComponentCreator(
                  '/api/operations/mutations/test-router-credentials',
                  '268'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-tunnel',
                component: ComponentCreator('/api/operations/mutations/test-tunnel', '566'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/test-webhook',
                component: ComponentCreator('/api/operations/mutations/test-webhook', '257'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/toggle-alert-rule',
                component: ComponentCreator('/api/operations/mutations/toggle-alert-rule', '9ba'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/toggle-port-knock-sequence',
                component: ComponentCreator(
                  '/api/operations/mutations/toggle-port-knock-sequence',
                  '13f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/trigger-boot-sequence',
                component: ComponentCreator(
                  '/api/operations/mutations/trigger-boot-sequence',
                  'd99'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/trigger-digest-now',
                component: ComponentCreator('/api/operations/mutations/trigger-digest-now', 'c59'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/undo-bridge-operation',
                component: ComponentCreator(
                  '/api/operations/mutations/undo-bridge-operation',
                  'a72'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-alert-rule',
                component: ComponentCreator('/api/operations/mutations/update-alert-rule', 'c81'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-all-instances',
                component: ComponentCreator(
                  '/api/operations/mutations/update-all-instances',
                  '3da'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-bridge',
                component: ComponentCreator('/api/operations/mutations/update-bridge', '1ec'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-bridge-port',
                component: ComponentCreator('/api/operations/mutations/update-bridge-port', 'def'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-change-set-item',
                component: ComponentCreator(
                  '/api/operations/mutations/update-change-set-item',
                  '411'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-instance',
                component: ComponentCreator('/api/operations/mutations/update-instance', '238'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-interface',
                component: ComponentCreator('/api/operations/mutations/update-interface', 'f61'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-ip-address',
                component: ComponentCreator('/api/operations/mutations/update-ip-address', '054'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-nat-rule',
                component: ComponentCreator('/api/operations/mutations/update-nat-rule', '9eb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-notification-channel-config',
                component: ComponentCreator(
                  '/api/operations/mutations/update-notification-channel-config',
                  'd45'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-port-knock-sequence',
                component: ComponentCreator(
                  '/api/operations/mutations/update-port-knock-sequence',
                  '4d3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-port-mirror',
                component: ComponentCreator('/api/operations/mutations/update-port-mirror', 'd6d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-provisioning-networks',
                component: ComponentCreator(
                  '/api/operations/mutations/update-provisioning-networks',
                  '6f7'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-resource',
                component: ComponentCreator('/api/operations/mutations/update-resource', '8e6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-route',
                component: ComponentCreator('/api/operations/mutations/update-route', 'd29'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-router',
                component: ComponentCreator('/api/operations/mutations/update-router', '4d9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-router-credentials',
                component: ComponentCreator(
                  '/api/operations/mutations/update-router-credentials',
                  '850'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-routing-chain',
                component: ComponentCreator(
                  '/api/operations/mutations/update-routing-chain',
                  'b55'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-schedule',
                component: ComponentCreator('/api/operations/mutations/update-schedule', '2a7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-tunnel',
                component: ComponentCreator('/api/operations/mutations/update-tunnel', 'b98'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-vlan',
                component: ComponentCreator('/api/operations/mutations/update-vlan', '525'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-vlanpool-config',
                component: ComponentCreator(
                  '/api/operations/mutations/update-vlanpool-config',
                  'd77'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/update-webhook',
                component: ComponentCreator('/api/operations/mutations/update-webhook', '090'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/validate-change-set',
                component: ComponentCreator('/api/operations/mutations/validate-change-set', '186'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/validate-provisioning-session',
                component: ComponentCreator(
                  '/api/operations/mutations/validate-provisioning-session',
                  'f47'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/validate-resource',
                component: ComponentCreator('/api/operations/mutations/validate-resource', '20f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/validate-service-config',
                component: ComponentCreator(
                  '/api/operations/mutations/validate-service-config',
                  'dbd'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/mutations/verify-troubleshoot-fix',
                component: ComponentCreator(
                  '/api/operations/mutations/verify-troubleshoot-fix',
                  '3f6'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/address-list-entries',
                component: ComponentCreator('/api/operations/queries/address-list-entries', '6fb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/address-lists',
                component: ComponentCreator('/api/operations/queries/address-lists', '1cb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-escalations',
                component: ComponentCreator('/api/operations/queries/alert-escalations', '176'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-rule',
                component: ComponentCreator('/api/operations/queries/alert-rule', 'a2a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-rule-template',
                component: ComponentCreator('/api/operations/queries/alert-rule-template', '545'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-rule-templates',
                component: ComponentCreator('/api/operations/queries/alert-rule-templates', 'b5c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-rule-throttle-status',
                component: ComponentCreator(
                  '/api/operations/queries/alert-rule-throttle-status',
                  '46e'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-rules',
                component: ComponentCreator('/api/operations/queries/alert-rules', 'e99'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-storm-status',
                component: ComponentCreator('/api/operations/queries/alert-storm-status', '61a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-template',
                component: ComponentCreator('/api/operations/queries/alert-template', 'add'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alert-templates',
                component: ComponentCreator('/api/operations/queries/alert-templates', '902'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/alerts',
                component: ComponentCreator('/api/operations/queries/alerts', '8e5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/available-diagnostics',
                component: ComponentCreator('/api/operations/queries/available-diagnostics', '26b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/available-interfaces-for-bridge',
                component: ComponentCreator(
                  '/api/operations/queries/available-interfaces-for-bridge',
                  'd01'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/available-provisioning-resources',
                component: ComponentCreator(
                  '/api/operations/queries/available-provisioning-resources',
                  '4c3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/available-services',
                component: ComponentCreator('/api/operations/queries/available-services', '480'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/available-updates',
                component: ComponentCreator('/api/operations/queries/available-updates', '84f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/boot-sequence-progress',
                component: ComponentCreator(
                  '/api/operations/queries/boot-sequence-progress',
                  'c95'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/bridge',
                component: ComponentCreator('/api/operations/queries/bridge', '7e5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/bridge-ports',
                component: ComponentCreator('/api/operations/queries/bridge-ports', '084'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/bridge-status',
                component: ComponentCreator('/api/operations/queries/bridge-status', '985'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/bridge-vlans',
                component: ComponentCreator('/api/operations/queries/bridge-vlans', '5b5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/bridges',
                component: ComponentCreator('/api/operations/queries/bridges', 'ff6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/change-set',
                component: ComponentCreator('/api/operations/queries/change-set', 'f49'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/change-sets',
                component: ComponentCreator('/api/operations/queries/change-sets', '6d4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/check-gateway-reachability',
                component: ComponentCreator(
                  '/api/operations/queries/check-gateway-reachability',
                  '41a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/check-ip-conflict',
                component: ComponentCreator('/api/operations/queries/check-ip-conflict', '998'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/check-vlan-id-available',
                component: ComponentCreator(
                  '/api/operations/queries/check-vlan-id-available',
                  '564'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/circuit-breaker-status',
                component: ComponentCreator(
                  '/api/operations/queries/circuit-breaker-status',
                  '9ba'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/common-event-types',
                component: ComponentCreator('/api/operations/queries/common-event-types', '0d7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/compatibility-matrix',
                component: ComponentCreator('/api/operations/queries/compatibility-matrix', '1c0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/composite-resource',
                component: ComponentCreator('/api/operations/queries/composite-resource', 'df9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/connection-attempts',
                component: ComponentCreator('/api/operations/queries/connection-attempts', '44e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/connection-details',
                component: ComponentCreator('/api/operations/queries/connection-details', '7f2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/connection-stats',
                component: ComponentCreator('/api/operations/queries/connection-stats', '3e2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/default-notification-channel-config',
                component: ComponentCreator(
                  '/api/operations/queries/default-notification-channel-config',
                  '81f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/dependency-graph',
                component: ComponentCreator('/api/operations/queries/dependency-graph', 'b9c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/detect-gateway',
                component: ComponentCreator('/api/operations/queries/detect-gateway', '3b7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/detect-isp',
                component: ComponentCreator('/api/operations/queries/detect-isp', 'a29'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/detect-orphaned-ports',
                component: ComponentCreator('/api/operations/queries/detect-orphaned-ports', '53f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/detect-orphaned-vlans',
                component: ComponentCreator('/api/operations/queries/detect-orphaned-vlans', 'd0f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/detect-wan-interface',
                component: ComponentCreator('/api/operations/queries/detect-wan-interface', '6cf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/device',
                component: ComponentCreator('/api/operations/queries/device', 'e11'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/device-routing',
                component: ComponentCreator('/api/operations/queries/device-routing', 'aee'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/device-routing-matrix',
                component: ComponentCreator('/api/operations/queries/device-routing-matrix', '3d8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/device-routings',
                component: ComponentCreator('/api/operations/queries/device-routings', '675'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/diagnostic-history',
                component: ComponentCreator('/api/operations/queries/diagnostic-history', 'c8b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/digest-history',
                component: ComponentCreator('/api/operations/queries/digest-history', 'e25'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/digest-queue-count',
                component: ComponentCreator('/api/operations/queries/digest-queue-count', '664'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/discovered-wans',
                component: ComponentCreator('/api/operations/queries/discovered-wans', 'd22'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/dns-benchmark',
                component: ComponentCreator('/api/operations/queries/dns-benchmark', 'd21'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/dns-cache-stats',
                component: ComponentCreator('/api/operations/queries/dns-cache-stats', 'add'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/dns-servers',
                component: ComponentCreator('/api/operations/queries/dns-servers', 'dbe'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/egress-vlans',
                component: ComponentCreator('/api/operations/queries/egress-vlans', '8b3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/gateway-status',
                component: ComponentCreator('/api/operations/queries/gateway-status', '112'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/health',
                component: ComponentCreator('/api/operations/queries/health', '3a9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/instance-config',
                component: ComponentCreator('/api/operations/queries/instance-config', '3d2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/instance-health',
                component: ComponentCreator('/api/operations/queries/instance-health', '558'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/instance-isolation',
                component: ComponentCreator('/api/operations/queries/instance-isolation', 'd3a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/instance-update-info',
                component: ComponentCreator('/api/operations/queries/instance-update-info', 'bce'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/instance-verification-status',
                component: ComponentCreator(
                  '/api/operations/queries/instance-verification-status',
                  'bab'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/interface',
                component: ComponentCreator('/api/operations/queries/interface', 'e1a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/interface-stats-history',
                component: ComponentCreator(
                  '/api/operations/queries/interface-stats-history',
                  '417'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/interfaces',
                component: ComponentCreator('/api/operations/queries/interfaces', '07f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/ip-address',
                component: ComponentCreator('/api/operations/queries/ip-address', '4b8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/ip-address-dependencies',
                component: ComponentCreator(
                  '/api/operations/queries/ip-address-dependencies',
                  'a9d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/ip-addresses',
                component: ComponentCreator('/api/operations/queries/ip-addresses', 'b93'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/ipsec-profiles',
                component: ComponentCreator('/api/operations/queries/ipsec-profiles', 'af0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/is-feature-supported',
                component: ComponentCreator('/api/operations/queries/is-feature-supported', '8c8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/is-port-available',
                component: ComponentCreator('/api/operations/queries/is-port-available', '46b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/kill-switch-status',
                component: ComponentCreator('/api/operations/queries/kill-switch-status', 'b74'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/me',
                component: ComponentCreator('/api/operations/queries/me', '942'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/my-sessions',
                component: ComponentCreator('/api/operations/queries/my-sessions', '95e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/nat-rules',
                component: ComponentCreator('/api/operations/queries/nat-rules', 'fc8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/node',
                component: ComponentCreator('/api/operations/queries/node', 'a3d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/notification-channel-config',
                component: ComponentCreator(
                  '/api/operations/queries/notification-channel-config',
                  'b77'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/notification-channel-configs',
                component: ComponentCreator(
                  '/api/operations/queries/notification-channel-configs',
                  '697'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/notification-logs',
                component: ComponentCreator('/api/operations/queries/notification-logs', '978'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-allocations',
                component: ComponentCreator('/api/operations/queries/port-allocations', '7c4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-forwards',
                component: ComponentCreator('/api/operations/queries/port-forwards', '116'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-knock-log',
                component: ComponentCreator('/api/operations/queries/port-knock-log', '6e0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-knock-sequence',
                component: ComponentCreator('/api/operations/queries/port-knock-sequence', '3bc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-knock-sequences',
                component: ComponentCreator('/api/operations/queries/port-knock-sequences', 'eeb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-mirror',
                component: ComponentCreator('/api/operations/queries/port-mirror', '826'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/port-mirrors',
                component: ComponentCreator('/api/operations/queries/port-mirrors', '376'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/preview-alert-rule-template',
                component: ComponentCreator(
                  '/api/operations/queries/preview-alert-rule-template',
                  '832'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/preview-alert-template',
                component: ComponentCreator(
                  '/api/operations/queries/preview-alert-template',
                  'af2'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/provisioning-session',
                component: ComponentCreator('/api/operations/queries/provisioning-session', '7a3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/provisioning-sessions',
                component: ComponentCreator('/api/operations/queries/provisioning-sessions', 'fd3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/pushover-usage',
                component: ComponentCreator('/api/operations/queries/pushover-usage', 'd04'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/resource',
                component: ComponentCreator('/api/operations/queries/resource', '866'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/resources',
                component: ComponentCreator('/api/operations/queries/resources', '6ef'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/route',
                component: ComponentCreator('/api/operations/queries/route', '12f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/route-lookup',
                component: ComponentCreator('/api/operations/queries/route-lookup', '9e6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/router',
                component: ComponentCreator('/api/operations/queries/router', '505'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/router-capabilities',
                component: ComponentCreator('/api/operations/queries/router-capabilities', '6ad'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/router-credentials',
                component: ComponentCreator('/api/operations/queries/router-credentials', 'd68'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/router-health',
                component: ComponentCreator('/api/operations/queries/router-health', '7d4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/routers',
                component: ComponentCreator('/api/operations/queries/routers', 'ee3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/routes',
                component: ComponentCreator('/api/operations/queries/routes', 'e1d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/routing-chain',
                component: ComponentCreator('/api/operations/queries/routing-chain', '286'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/routing-chains',
                component: ComponentCreator('/api/operations/queries/routing-chains', '733'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/routing-schedule',
                component: ComponentCreator('/api/operations/queries/routing-schedule', '742'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/routing-schedules',
                component: ComponentCreator('/api/operations/queries/routing-schedules', 'd34'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/rules-referencing-address-list',
                component: ComponentCreator(
                  '/api/operations/queries/rules-referencing-address-list',
                  '5b8'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/scan-history',
                component: ComponentCreator('/api/operations/queries/scan-history', 'd90'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/scan-status',
                component: ComponentCreator('/api/operations/queries/scan-status', 'f5f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/search-alert-templates',
                component: ComponentCreator(
                  '/api/operations/queries/search-alert-templates',
                  '1de'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-alerts',
                component: ComponentCreator('/api/operations/queries/service-alerts', 'b48'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-config-schema',
                component: ComponentCreator('/api/operations/queries/service-config-schema', '0ec'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-dependencies',
                component: ComponentCreator('/api/operations/queries/service-dependencies', '527'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-dependents',
                component: ComponentCreator('/api/operations/queries/service-dependents', '154'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-device-breakdown',
                component: ComponentCreator(
                  '/api/operations/queries/service-device-breakdown',
                  'aef'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-instance',
                component: ComponentCreator('/api/operations/queries/service-instance', '031'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-instances',
                component: ComponentCreator('/api/operations/queries/service-instances', '9b0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-log-file',
                component: ComponentCreator('/api/operations/queries/service-log-file', '611'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-template',
                component: ComponentCreator('/api/operations/queries/service-template', 'e26'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-templates',
                component: ComponentCreator('/api/operations/queries/service-templates', '99f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/service-traffic-stats',
                component: ComponentCreator('/api/operations/queries/service-traffic-stats', '212'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/storage-config',
                component: ComponentCreator('/api/operations/queries/storage-config', '8cf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/storage-info',
                component: ComponentCreator('/api/operations/queries/storage-info', 'ffc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/storage-usage',
                component: ComponentCreator('/api/operations/queries/storage-usage', 'f4e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/supported-features',
                component: ComponentCreator('/api/operations/queries/supported-features', '415'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/system-resources',
                component: ComponentCreator('/api/operations/queries/system-resources', 'e85'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/troubleshoot-session',
                component: ComponentCreator('/api/operations/queries/troubleshoot-session', '832'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/tunnel',
                component: ComponentCreator('/api/operations/queries/tunnel', '434'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/tunnels',
                component: ComponentCreator('/api/operations/queries/tunnels', '65a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/unavailable-features',
                component: ComponentCreator('/api/operations/queries/unavailable-features', 'fcb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/unsupported-features',
                component: ComponentCreator('/api/operations/queries/unsupported-features', 'dab'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/upgrade-recommendation',
                component: ComponentCreator(
                  '/api/operations/queries/upgrade-recommendation',
                  '550'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/upgrade-recommendations',
                component: ComponentCreator(
                  '/api/operations/queries/upgrade-recommendations',
                  '5c8'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/version',
                component: ComponentCreator('/api/operations/queries/version', '5b7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/virtual-interface',
                component: ComponentCreator('/api/operations/queries/virtual-interface', '5bb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/virtual-interfaces',
                component: ComponentCreator('/api/operations/queries/virtual-interfaces', 'c91'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/vlan',
                component: ComponentCreator('/api/operations/queries/vlan', 'd7a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/vlan-allocations',
                component: ComponentCreator('/api/operations/queries/vlan-allocations', 'b4d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/vlan-dependencies',
                component: ComponentCreator('/api/operations/queries/vlan-dependencies', '4a8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/vlan-pool-status',
                component: ComponentCreator('/api/operations/queries/vlan-pool-status', '00d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/vlan-topology',
                component: ComponentCreator('/api/operations/queries/vlan-topology', 'f62'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/vlans',
                component: ComponentCreator('/api/operations/queries/vlans', '801'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/wan-connection-history',
                component: ComponentCreator(
                  '/api/operations/queries/wan-connection-history',
                  'e02'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/wan-interface',
                component: ComponentCreator('/api/operations/queries/wan-interface', 'a6b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/wan-interfaces',
                component: ComponentCreator('/api/operations/queries/wan-interfaces', 'f4c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/webhook',
                component: ComponentCreator('/api/operations/queries/webhook', 'bf9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/queries/webhooks',
                component: ComponentCreator('/api/operations/queries/webhooks', 'dfa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/alert-events',
                component: ComponentCreator('/api/operations/subscriptions/alert-events', 'fe3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/boot-sequence-events',
                component: ComponentCreator(
                  '/api/operations/subscriptions/boot-sequence-events',
                  '4c0'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/bridge-ports-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/bridge-ports-changed',
                  '278'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/bridge-stp-status-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/bridge-stp-status-changed',
                  'ee3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/change-set-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/change-set-progress',
                  '3b3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/change-set-status-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/change-set-status-changed',
                  'fc8'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/circuit-breaker-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/circuit-breaker-changed',
                  '541'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/circuit-breaker-state-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/circuit-breaker-state-changed',
                  '7a7'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/config-apply-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/config-apply-progress',
                  'c9a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/connection-health',
                component: ComponentCreator(
                  '/api/operations/subscriptions/connection-health',
                  '460'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/device-routing-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/device-routing-changed',
                  '0ef'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/diagnostics-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/diagnostics-progress',
                  '199'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/install-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/install-progress',
                  '8a5'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/instance-health-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/instance-health-changed',
                  'a22'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/instance-status-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/instance-status-changed',
                  'c27'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/interface-stats-updated',
                component: ComponentCreator(
                  '/api/operations/subscriptions/interface-stats-updated',
                  '4e9'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/interface-status-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/interface-status-changed',
                  '9f4'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/interface-traffic',
                component: ComponentCreator(
                  '/api/operations/subscriptions/interface-traffic',
                  '41e'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/ip-address-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/ip-address-changed',
                  '56d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/kill-switch-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/kill-switch-changed',
                  'd32'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/port-mirror-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/port-mirror-changed',
                  'e9f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/provisioning-session-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/provisioning-session-changed',
                  '61f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/provisioning-session-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/provisioning-session-progress',
                  '7f1'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/resource-metrics',
                component: ComponentCreator(
                  '/api/operations/subscriptions/resource-metrics',
                  '870'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/resource-runtime',
                component: ComponentCreator(
                  '/api/operations/subscriptions/resource-runtime',
                  '16b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/resource-state-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/resource-state-changed',
                  '34f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/resource-updated',
                component: ComponentCreator(
                  '/api/operations/subscriptions/resource-updated',
                  'c88'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/resource-usage-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/resource-usage-changed',
                  'ebb'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/router-added',
                component: ComponentCreator('/api/operations/subscriptions/router-added', '381'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/router-status-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/router-status-changed',
                  '759'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/routing-chain-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/routing-chain-changed',
                  'd20'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/scan-progress',
                component: ComponentCreator('/api/operations/subscriptions/scan-progress', '9ef'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/schedule-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/schedule-changed',
                  'bcd'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/service-config-shared',
                component: ComponentCreator(
                  '/api/operations/subscriptions/service-config-shared',
                  '117'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/service-logs',
                component: ComponentCreator('/api/operations/subscriptions/service-logs', '80b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/service-traffic-updated',
                component: ComponentCreator(
                  '/api/operations/subscriptions/service-traffic-updated',
                  'de1'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/storage-mount-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/storage-mount-changed',
                  '61e'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/storage-space-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/storage-space-changed',
                  'a02'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/template-install-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/template-install-progress',
                  '857'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/traceroute-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/traceroute-progress',
                  '45c'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/troubleshoot-progress',
                component: ComponentCreator(
                  '/api/operations/subscriptions/troubleshoot-progress',
                  'c2f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/tunnel-changed',
                component: ComponentCreator('/api/operations/subscriptions/tunnel-changed', 'd76'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/update-progress',
                component: ComponentCreator('/api/operations/subscriptions/update-progress', '115'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/verification-events',
                component: ComponentCreator(
                  '/api/operations/subscriptions/verification-events',
                  '777'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/vlan-changed',
                component: ComponentCreator('/api/operations/subscriptions/vlan-changed', 'dff'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/wan-health-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/wan-health-changed',
                  'f0c'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/operations/subscriptions/wan-status-changed',
                component: ComponentCreator(
                  '/api/operations/subscriptions/wan-status-changed',
                  '281'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/auth',
                component: ComponentCreator('/api/types/directives/auth', '8d8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/cache',
                component: ComponentCreator('/api/types/directives/cache', '23f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/capability',
                component: ComponentCreator('/api/types/directives/capability', '71a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/deprecated',
                component: ComponentCreator('/api/types/directives/deprecated', '108'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/migrate-from',
                component: ComponentCreator('/api/types/directives/migrate-from', '111'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/mikrotik',
                component: ComponentCreator('/api/types/directives/mikrotik', '99c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/one-of',
                component: ComponentCreator('/api/types/directives/one-of', '827'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/openwrt',
                component: ComponentCreator('/api/types/directives/openwrt', '216'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/realtime',
                component: ComponentCreator('/api/types/directives/realtime', '250'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/sensitive',
                component: ComponentCreator('/api/types/directives/sensitive', 'e67'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/specified-by',
                component: ComponentCreator('/api/types/directives/specified-by', '676'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/validate',
                component: ComponentCreator('/api/types/directives/validate', 'a01'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/directives/vyos',
                component: ComponentCreator('/api/types/directives/vyos', 'f0c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/alert-action',
                component: ComponentCreator('/api/types/enums/alert-action', '0cb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/alert-rule-template-category',
                component: ComponentCreator('/api/types/enums/alert-rule-template-category', '2f5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/alert-rule-template-variable-type',
                component: ComponentCreator(
                  '/api/types/enums/alert-rule-template-variable-type',
                  '3ab'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/alert-severity',
                component: ComponentCreator('/api/types/enums/alert-severity', '10d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/alert-template-variable-type',
                component: ComponentCreator('/api/types/enums/alert-template-variable-type', '6c3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/auth-error-code',
                component: ComponentCreator('/api/types/enums/auth-error-code', '045'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/batch-interface-action',
                component: ComponentCreator('/api/types/enums/batch-interface-action', '815'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/bonding-mode',
                component: ComponentCreator('/api/types/enums/bonding-mode', 'e69'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/bridge-port-frame-types',
                component: ComponentCreator('/api/types/enums/bridge-port-frame-types', '0b6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/cache-scope',
                component: ComponentCreator('/api/types/enums/cache-scope', 'ff5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/capability',
                component: ComponentCreator('/api/types/enums/capability', '17e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/capability-level',
                component: ComponentCreator('/api/types/enums/capability-level', '42a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/change-operation',
                component: ComponentCreator('/api/types/enums/change-operation', '765'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/change-set-item-status',
                component: ComponentCreator('/api/types/enums/change-set-item-status', '8ed'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/change-set-status',
                component: ComponentCreator('/api/types/enums/change-set-status', '719'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/change-type',
                component: ComponentCreator('/api/types/enums/change-type', '9b2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/channel-type',
                component: ComponentCreator('/api/types/enums/channel-type', '7d3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/circuit-breaker-state',
                component: ComponentCreator('/api/types/enums/circuit-breaker-state', 'ebe'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/condition-operator',
                component: ComponentCreator('/api/types/enums/condition-operator', '340'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/config-apply-status',
                component: ComponentCreator('/api/types/enums/config-apply-status', 'd79'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/config-field-type',
                component: ComponentCreator('/api/types/enums/config-field-type', 'ed3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/confirmation-severity',
                component: ComponentCreator('/api/types/enums/confirmation-severity', '02e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/conflict-resolution',
                component: ComponentCreator('/api/types/enums/conflict-resolution', 'f5a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/conflict-type',
                component: ComponentCreator('/api/types/enums/conflict-type', 'e02'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/connection-error-code',
                component: ComponentCreator('/api/types/enums/connection-error-code', 'f09'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/connection-status',
                component: ComponentCreator('/api/types/enums/connection-status', 'e99'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/credential-error-code',
                component: ComponentCreator('/api/types/enums/credential-error-code', 'ab5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/credential-test-status',
                component: ComponentCreator('/api/types/enums/credential-test-status', '7f3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/dependency-type',
                component: ComponentCreator('/api/types/enums/dependency-type', 'a0b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/diagnostic-status',
                component: ComponentCreator('/api/types/enums/diagnostic-status', '142'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/disconnect-reason',
                component: ComponentCreator('/api/types/enums/disconnect-reason', 'cba'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/dns-lookup-status',
                component: ComponentCreator('/api/types/enums/dns-lookup-status', '5d1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/dns-record-type',
                component: ComponentCreator('/api/types/enums/dns-record-type', 'eca'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/dns-server-status',
                component: ComponentCreator('/api/types/enums/dns-server-status', '5c3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/drift-action',
                component: ComponentCreator('/api/types/enums/drift-action', '7ac'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/egress-vlanstatus',
                component: ComponentCreator('/api/types/enums/egress-vlanstatus', 'fc4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/error-category',
                component: ComponentCreator('/api/types/enums/error-category', 'f35'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/escalation-status',
                component: ComponentCreator('/api/types/enums/escalation-status', 'c09'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/firewall-table',
                component: ComponentCreator('/api/types/enums/firewall-table', '403'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/fix-application-status',
                component: ComponentCreator('/api/types/enums/fix-application-status', '1a0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/fix-confidence',
                component: ComponentCreator('/api/types/enums/fix-confidence', 'fd3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/frame-types',
                component: ComponentCreator('/api/types/enums/frame-types', 'b2b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/gateway-state',
                component: ComponentCreator('/api/types/enums/gateway-state', 'aa4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/gateway-status',
                component: ComponentCreator('/api/types/enums/gateway-status', '1e1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/gateway-type',
                component: ComponentCreator('/api/types/enums/gateway-type', '863'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/health-check-status',
                component: ComponentCreator('/api/types/enums/health-check-status', 'b44'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/health-connection-state',
                component: ComponentCreator('/api/types/enums/health-connection-state', '202'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/hop-status',
                component: ComponentCreator('/api/types/enums/hop-status', 'ca1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/ingress-routing-mode',
                component: ComponentCreator('/api/types/enums/ingress-routing-mode', '80f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/ingress-vlanstatus',
                component: ComponentCreator('/api/types/enums/ingress-vlanstatus', '34d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/instance-health-state',
                component: ComponentCreator('/api/types/enums/instance-health-state', '37e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/interface-status',
                component: ComponentCreator('/api/types/enums/interface-status', '75f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/interface-type',
                component: ComponentCreator('/api/types/enums/interface-type', 'b96'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/ip-conflict-type',
                component: ComponentCreator('/api/types/enums/ip-conflict-type', 'c00'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/isolation-severity',
                component: ComponentCreator('/api/types/enums/isolation-severity', 'dd2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/job-status',
                component: ComponentCreator('/api/types/enums/job-status', '4ab'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/kill-switch-mode',
                component: ComponentCreator('/api/types/enums/kill-switch-mode', 'c67'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/knock-protocol',
                component: ComponentCreator('/api/types/enums/knock-protocol', '105'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/knock-status',
                component: ComponentCreator('/api/types/enums/knock-status', '842'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/log-level',
                component: ComponentCreator('/api/types/enums/log-level', '0b2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/mirror-direction',
                component: ComponentCreator('/api/types/enums/mirror-direction', '282'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/multi-link-strategy',
                component: ComponentCreator('/api/types/enums/multi-link-strategy', 'b42'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/nat-action',
                component: ComponentCreator('/api/types/enums/nat-action', '19b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/nat-chain',
                component: ComponentCreator('/api/types/enums/nat-chain', '224'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/notification-channel',
                component: ComponentCreator('/api/types/enums/notification-channel', '95c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/notification-status',
                component: ComponentCreator('/api/types/enums/notification-status', '74e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/port-forward-status',
                component: ComponentCreator('/api/types/enums/port-forward-status', '4bb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/port-mode',
                component: ComponentCreator('/api/types/enums/port-mode', '21e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/port-protocol',
                component: ComponentCreator('/api/types/enums/port-protocol', '894'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/protocol',
                component: ComponentCreator('/api/types/enums/protocol', 'cb7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/protocol-preference',
                component: ComponentCreator('/api/types/enums/protocol-preference', 'cf1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/provisioning-apply-status',
                component: ComponentCreator('/api/types/enums/provisioning-apply-status', 'a78'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/provisioning-firmware',
                component: ComponentCreator('/api/types/enums/provisioning-firmware', 'b78'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/provisioning-mode',
                component: ComponentCreator('/api/types/enums/provisioning-mode', '30e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/provisioning-router-mode',
                component: ComponentCreator('/api/types/enums/provisioning-router-mode', '14b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/provisioning-wanlink-type',
                component: ComponentCreator('/api/types/enums/provisioning-wanlink-type', '878'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/quota-action',
                component: ComponentCreator('/api/types/enums/quota-action', 'aec'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/quota-period',
                component: ComponentCreator('/api/types/enums/quota-period', '93e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/resource-category',
                component: ComponentCreator('/api/types/enums/resource-category', 'ded'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/resource-impact',
                component: ComponentCreator('/api/types/enums/resource-impact', '04c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/resource-layer',
                component: ComponentCreator('/api/types/enums/resource-layer', '057'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/resource-lifecycle-state',
                component: ComponentCreator('/api/types/enums/resource-lifecycle-state', '521'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/resource-relationship-type',
                component: ComponentCreator('/api/types/enums/resource-relationship-type', '77b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/resource-status',
                component: ComponentCreator('/api/types/enums/resource-status', '8a9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/rollback-operation',
                component: ComponentCreator('/api/types/enums/rollback-operation', '192'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/route-scope',
                component: ComponentCreator('/api/types/enums/route-scope', '0f3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/route-type',
                component: ComponentCreator('/api/types/enums/route-type', '88b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/router-platform',
                component: ComponentCreator('/api/types/enums/router-platform', '2c9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/routing-mode',
                component: ComponentCreator('/api/types/enums/routing-mode', '445'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/runtime-health',
                component: ComponentCreator('/api/types/enums/runtime-health', '52a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/scan-status',
                component: ComponentCreator('/api/types/enums/scan-status', '11e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/service-instance-status',
                component: ComponentCreator('/api/types/enums/service-instance-status', 'b52'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/service-status',
                component: ComponentCreator('/api/types/enums/service-status', 'a6e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/service-template-category',
                component: ComponentCreator('/api/types/enums/service-template-category', '178'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/storage-location-type',
                component: ComponentCreator('/api/types/enums/storage-location-type', '460'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/storage-threshold-status',
                component: ComponentCreator('/api/types/enums/storage-threshold-status', 'c82'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/stp-port-role',
                component: ComponentCreator('/api/types/enums/stp-port-role', 'bde'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/stp-port-state',
                component: ComponentCreator('/api/types/enums/stp-port-state', '149'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/stp-protocol',
                component: ComponentCreator('/api/types/enums/stp-protocol', '49b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/suggestion-severity',
                component: ComponentCreator('/api/types/enums/suggestion-severity', 'e98'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/template-category',
                component: ComponentCreator('/api/types/enums/template-category', 'bd4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/template-complexity',
                component: ComponentCreator('/api/types/enums/template-complexity', '5dd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/template-conflict-type',
                component: ComponentCreator('/api/types/enums/template-conflict-type', '65e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/template-installation-status',
                component: ComponentCreator('/api/types/enums/template-installation-status', '770'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/template-scope',
                component: ComponentCreator('/api/types/enums/template-scope', 'bcd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/template-variable-type',
                component: ComponentCreator('/api/types/enums/template-variable-type', '93a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/topology-node-type',
                component: ComponentCreator('/api/types/enums/topology-node-type', '7c6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/traceroute-event-type',
                component: ComponentCreator('/api/types/enums/traceroute-event-type', 'f88'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/traceroute-protocol',
                component: ComponentCreator('/api/types/enums/traceroute-protocol', '607'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/transport-protocol',
                component: ComponentCreator('/api/types/enums/transport-protocol', '8f3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/troubleshoot-session-status',
                component: ComponentCreator('/api/types/enums/troubleshoot-session-status', '4e1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/troubleshoot-step-status',
                component: ComponentCreator('/api/types/enums/troubleshoot-step-status', '521'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/troubleshoot-step-type',
                component: ComponentCreator('/api/types/enums/troubleshoot-step-type', '856'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/tunnel-status',
                component: ComponentCreator('/api/types/enums/tunnel-status', '59a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/tunnel-type',
                component: ComponentCreator('/api/types/enums/tunnel-type', 'b0d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/update-severity',
                component: ComponentCreator('/api/types/enums/update-severity', '64a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/update-stage',
                component: ComponentCreator('/api/types/enums/update-stage', '588'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/upgrade-priority',
                component: ComponentCreator('/api/types/enums/upgrade-priority', '546'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/user-role',
                component: ComponentCreator('/api/types/enums/user-role', '097'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/validate-format',
                component: ComponentCreator('/api/types/enums/validate-format', '9c9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/validation-severity',
                component: ComponentCreator('/api/types/enums/validation-severity', '069'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/validation-stage',
                component: ComponentCreator('/api/types/enums/validation-stage', '00c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/variable-type',
                component: ComponentCreator('/api/types/enums/variable-type', '8d1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/verification-status',
                component: ComponentCreator('/api/types/enums/verification-status', '18e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/virtual-interface-status',
                component: ComponentCreator('/api/types/enums/virtual-interface-status', '575'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/vlanallocation-status',
                component: ComponentCreator('/api/types/enums/vlanallocation-status', '026'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/wanclassification',
                component: ComponentCreator('/api/types/enums/wanclassification', '2b7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/wanconnection-type',
                component: ComponentCreator('/api/types/enums/wanconnection-type', '15d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/wanevent-type',
                component: ComponentCreator('/api/types/enums/wanevent-type', '246'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/wanlink-type-enum',
                component: ComponentCreator('/api/types/enums/wanlink-type-enum', '477'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/wanstatus',
                component: ComponentCreator('/api/types/enums/wanstatus', 'a8a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/webhook-auth-type',
                component: ComponentCreator('/api/types/enums/webhook-auth-type', '569'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/webhook-template',
                component: ComponentCreator('/api/types/enums/webhook-template', '384'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/enums/wizard-step',
                component: ComponentCreator('/api/types/enums/wizard-step', 'a4d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/add-bridge-port-input',
                component: ComponentCreator('/api/types/inputs/add-bridge-port-input', '0e5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/add-dependency-input',
                component: ComponentCreator('/api/types/inputs/add-dependency-input', 'e45'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/add-provisioning-resource-input',
                component: ComponentCreator(
                  '/api/types/inputs/add-provisioning-resource-input',
                  'a7f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/add-router-input',
                component: ComponentCreator('/api/types/inputs/add-router-input', 'e40'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/alert-alert-template-variable-input',
                component: ComponentCreator(
                  '/api/types/inputs/alert-alert-template-variable-input',
                  '3d7'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/alert-condition-input',
                component: ComponentCreator('/api/types/inputs/alert-condition-input', 'f56'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/alert-rule-alert-template-variable-input',
                component: ComponentCreator(
                  '/api/types/inputs/alert-rule-alert-template-variable-input',
                  '3c7'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/apply-alert-template-input',
                component: ComponentCreator('/api/types/inputs/apply-alert-template-input', '0e5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/apply-service-config-input',
                component: ComponentCreator('/api/types/inputs/apply-service-config-input', '03b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/apply-service-import-input',
                component: ComponentCreator('/api/types/inputs/apply-service-import-input', 'fbf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/assign-device-routing-input',
                component: ComponentCreator('/api/types/inputs/assign-device-routing-input', 'd34'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/batch-interface-input',
                component: ComponentCreator('/api/types/inputs/batch-interface-input', '76f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/bridge-port-vlan-input',
                component: ComponentCreator('/api/types/inputs/bridge-port-vlan-input', 'e5f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/bulk-address-input',
                component: ComponentCreator('/api/types/inputs/bulk-address-input', '1d4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/bulk-assign-routing-input',
                component: ComponentCreator('/api/types/inputs/bulk-assign-routing-input', '273'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/chain-hop-input',
                component: ComponentCreator('/api/types/inputs/chain-hop-input', '03f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/change-set-item-input',
                component: ComponentCreator('/api/types/inputs/change-set-item-input', '9a9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/check-port-availability-input',
                component: ComponentCreator(
                  '/api/types/inputs/check-port-availability-input',
                  '0db'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/cleanup-orphaned-ports-input',
                component: ComponentCreator(
                  '/api/types/inputs/cleanup-orphaned-ports-input',
                  '250'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/configure-external-storage-input',
                component: ComponentCreator(
                  '/api/types/inputs/configure-external-storage-input',
                  'de4'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/configure-health-check-input',
                component: ComponentCreator(
                  '/api/types/inputs/configure-health-check-input',
                  '6bf'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-address-list-entry-input',
                component: ComponentCreator(
                  '/api/types/inputs/create-address-list-entry-input',
                  '4ef'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-alert-rule-input',
                component: ComponentCreator('/api/types/inputs/create-alert-rule-input', '7eb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-bridge-input',
                component: ComponentCreator('/api/types/inputs/create-bridge-input', '98e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-bridge-vlan-input',
                component: ComponentCreator('/api/types/inputs/create-bridge-vlan-input', 'ebc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-change-set-input',
                component: ComponentCreator('/api/types/inputs/create-change-set-input', 'ad2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-egress-vlaninput',
                component: ComponentCreator('/api/types/inputs/create-egress-vlaninput', '31d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-nat-rule-input',
                component: ComponentCreator('/api/types/inputs/create-nat-rule-input', '7d0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-notification-channel-config-input',
                component: ComponentCreator(
                  '/api/types/inputs/create-notification-channel-config-input',
                  'd6b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-port-mirror-input',
                component: ComponentCreator('/api/types/inputs/create-port-mirror-input', '3d0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-resource-input',
                component: ComponentCreator('/api/types/inputs/create-resource-input', 'c01'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-router-input',
                component: ComponentCreator('/api/types/inputs/create-router-input', 'af7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-routing-chain-input',
                component: ComponentCreator('/api/types/inputs/create-routing-chain-input', '5b2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-schedule-input',
                component: ComponentCreator('/api/types/inputs/create-schedule-input', 'e06'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/create-webhook-input',
                component: ComponentCreator('/api/types/inputs/create-webhook-input', '33a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/credentials-input',
                component: ComponentCreator('/api/types/inputs/credentials-input', '598'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/delete-instance-input',
                component: ComponentCreator('/api/types/inputs/delete-instance-input', '499'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/dhcp-client-input',
                component: ComponentCreator('/api/types/inputs/dhcp-client-input', 'c26'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/digest-config-input',
                component: ComponentCreator('/api/types/inputs/digest-config-input', 'ef6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/dns-lookup-input',
                component: ComponentCreator('/api/types/inputs/dns-lookup-input', '99e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/email-config-input',
                component: ComponentCreator('/api/types/inputs/email-config-input', '8c5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/escalation-config-input',
                component: ComponentCreator('/api/types/inputs/escalation-config-input', '08d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/export-as-template-input',
                component: ComponentCreator('/api/types/inputs/export-as-template-input', 'a13'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/export-config-input',
                component: ComponentCreator('/api/types/inputs/export-config-input', '604'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/export-service-config-input',
                component: ComponentCreator('/api/types/inputs/export-service-config-input', 'f5a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/feature-compatibility-input',
                component: ComponentCreator('/api/types/inputs/feature-compatibility-input', 'c26'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/firewall-template-variable-input',
                component: ComponentCreator(
                  '/api/types/inputs/firewall-template-variable-input',
                  '97f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/generate-config-qrinput',
                component: ComponentCreator('/api/types/inputs/generate-config-qrinput', '187'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/import-service-config-input',
                component: ComponentCreator('/api/types/inputs/import-service-config-input', '552'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/import-service-template-input',
                component: ComponentCreator(
                  '/api/types/inputs/import-service-template-input',
                  '690'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/import-star-state-input',
                component: ComponentCreator('/api/types/inputs/import-star-state-input', '312'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/install-service-input',
                component: ComponentCreator('/api/types/inputs/install-service-input', '380'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/install-service-template-input',
                component: ComponentCreator(
                  '/api/types/inputs/install-service-template-input',
                  'aca'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/int-range',
                component: ComponentCreator('/api/types/inputs/int-range', '59f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/ip-address-input',
                component: ComponentCreator('/api/types/inputs/ip-address-input', 'fad'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/knock-port-input',
                component: ComponentCreator('/api/types/inputs/knock-port-input', 'c04'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/lte-modem-input',
                component: ComponentCreator('/api/types/inputs/lte-modem-input', '2e4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/ntfy-channel-input',
                component: ComponentCreator('/api/types/inputs/ntfy-channel-input', 'ccb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/pagination-input',
                component: ComponentCreator('/api/types/inputs/pagination-input', 'bd8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/port-forward-input',
                component: ComponentCreator('/api/types/inputs/port-forward-input', '9bc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/port-knock-log-filters',
                component: ComponentCreator('/api/types/inputs/port-knock-log-filters', '740'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/port-knock-sequence-input',
                component: ComponentCreator('/api/types/inputs/port-knock-sequence-input', '838'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/pppoe-client-input',
                component: ComponentCreator('/api/types/inputs/pppoe-client-input', 'dde'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/preview-notification-template-input',
                component: ComponentCreator(
                  '/api/types/inputs/preview-notification-template-input',
                  'e77'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/provisioning-relationships-input',
                component: ComponentCreator(
                  '/api/types/inputs/provisioning-relationships-input',
                  '298'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/quiet-hours-config-input',
                component: ComponentCreator('/api/types/inputs/quiet-hours-config-input', 'e3b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/remove-dependency-input',
                component: ComponentCreator('/api/types/inputs/remove-dependency-input', '791'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/reset-external-storage-input',
                component: ComponentCreator(
                  '/api/types/inputs/reset-external-storage-input',
                  'd29'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/resource-relationships-input',
                component: ComponentCreator(
                  '/api/types/inputs/resource-relationships-input',
                  '1d8'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/restart-instance-input',
                component: ComponentCreator('/api/types/inputs/restart-instance-input', 'd15'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/route-input',
                component: ComponentCreator('/api/types/inputs/route-input', 'afb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/run-diagnostics-input',
                component: ComponentCreator('/api/types/inputs/run-diagnostics-input', 'c97'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/save-alert-rule-template-input',
                component: ComponentCreator(
                  '/api/types/inputs/save-alert-rule-template-input',
                  '5fb'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/save-alert-template-input',
                component: ComponentCreator('/api/types/inputs/save-alert-template-input', '67a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/save-template-input',
                component: ComponentCreator('/api/types/inputs/save-template-input', 'e81'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/scan-network-input',
                component: ComponentCreator('/api/types/inputs/scan-network-input', 'b72'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/set-kill-switch-input',
                component: ComponentCreator('/api/types/inputs/set-kill-switch-input', '06e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/set-resource-limits-input',
                component: ComponentCreator('/api/types/inputs/set-resource-limits-input', '36a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/set-traffic-quota-input',
                component: ComponentCreator('/api/types/inputs/set-traffic-quota-input', '12c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/setup-dual-vlanbridge-input',
                component: ComponentCreator('/api/types/inputs/setup-dual-vlanbridge-input', 'e17'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/single-device-routing-input',
                component: ComponentCreator('/api/types/inputs/single-device-routing-input', '32f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/start-instance-input',
                component: ComponentCreator('/api/types/inputs/start-instance-input', '094'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/start-provisioning-session-input',
                component: ComponentCreator(
                  '/api/types/inputs/start-provisioning-session-input',
                  'c0a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/static-ipinput',
                component: ComponentCreator('/api/types/inputs/static-ipinput', 'c2a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/stats-time-range-input',
                component: ComponentCreator('/api/types/inputs/stats-time-range-input', '726'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/stop-instance-input',
                component: ComponentCreator('/api/types/inputs/stop-instance-input', '14b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/template-rule-input',
                component: ComponentCreator('/api/types/inputs/template-rule-input', 'd2e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/throttle-config-input',
                component: ComponentCreator('/api/types/inputs/throttle-config-input', 'caa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/traceroute-input',
                component: ComponentCreator('/api/types/inputs/traceroute-input', '1d5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/tunnel-input',
                component: ComponentCreator('/api/types/inputs/tunnel-input', '303'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-alert-rule-input',
                component: ComponentCreator('/api/types/inputs/update-alert-rule-input', '22c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-bridge-input',
                component: ComponentCreator('/api/types/inputs/update-bridge-input', '88d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-bridge-port-input',
                component: ComponentCreator('/api/types/inputs/update-bridge-port-input', 'dc1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-change-set-item-input',
                component: ComponentCreator(
                  '/api/types/inputs/update-change-set-item-input',
                  '786'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-check-schedule-input',
                component: ComponentCreator('/api/types/inputs/update-check-schedule-input', '97d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-interface-input',
                component: ComponentCreator('/api/types/inputs/update-interface-input', '736'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-notification-channel-config-input',
                component: ComponentCreator(
                  '/api/types/inputs/update-notification-channel-config-input',
                  '26c'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-port-mirror-input',
                component: ComponentCreator('/api/types/inputs/update-port-mirror-input', 'bf3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-resource-input',
                component: ComponentCreator('/api/types/inputs/update-resource-input', 'b21'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-router-input',
                component: ComponentCreator('/api/types/inputs/update-router-input', 'e99'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-schedule-input',
                component: ComponentCreator('/api/types/inputs/update-schedule-input', 'e0c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/update-webhook-input',
                component: ComponentCreator('/api/types/inputs/update-webhook-input', '295'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/validate-service-config-input',
                component: ComponentCreator(
                  '/api/types/inputs/validate-service-config-input',
                  '5e6'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/vlan-filter',
                component: ComponentCreator('/api/types/inputs/vlan-filter', '86d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/vlan-input',
                component: ComponentCreator('/api/types/inputs/vlan-input', '601'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/inputs/wanhealth-check-input',
                component: ComponentCreator('/api/types/inputs/wanhealth-check-input', 'b63'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/interfaces/connection',
                component: ComponentCreator('/api/types/interfaces/connection', 'd35'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/interfaces/edge',
                component: ComponentCreator('/api/types/interfaces/edge', '9d8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/interfaces/node',
                component: ComponentCreator('/api/types/interfaces/node', '1e2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/interfaces/resource',
                component: ComponentCreator('/api/types/interfaces/resource', '4ac'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/add-change-set-item-payload',
                component: ComponentCreator(
                  '/api/types/objects/add-change-set-item-payload',
                  '1d3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/add-router-payload',
                component: ComponentCreator('/api/types/objects/add-router-payload', 'c56'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/address-list',
                component: ComponentCreator('/api/types/objects/address-list', '6e6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/address-list-entry',
                component: ComponentCreator('/api/types/objects/address-list-entry', '7cb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/address-list-entry-connection',
                component: ComponentCreator(
                  '/api/types/objects/address-list-entry-connection',
                  '1f4'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/address-list-entry-edge',
                component: ComponentCreator('/api/types/objects/address-list-entry-edge', '0cd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/affected-resource',
                component: ComponentCreator('/api/types/objects/affected-resource', '44a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert',
                component: ComponentCreator('/api/types/objects/alert', 'bc5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-condition',
                component: ComponentCreator('/api/types/objects/alert-condition', '0ba'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-connection',
                component: ComponentCreator('/api/types/objects/alert-connection', 'b4d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-edge',
                component: ComponentCreator('/api/types/objects/alert-edge', 'e16'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-escalation',
                component: ComponentCreator('/api/types/objects/alert-escalation', '707'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-event',
                component: ComponentCreator('/api/types/objects/alert-event', 'cee'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-payload',
                component: ComponentCreator('/api/types/objects/alert-payload', '3bb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-rule',
                component: ComponentCreator('/api/types/objects/alert-rule', 'f04'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-rule-payload',
                component: ComponentCreator('/api/types/objects/alert-rule-payload', '0a7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-rule-template',
                component: ComponentCreator('/api/types/objects/alert-rule-template', '533'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-rule-template-payload',
                component: ComponentCreator(
                  '/api/types/objects/alert-rule-template-payload',
                  '962'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-rule-template-preview',
                component: ComponentCreator(
                  '/api/types/objects/alert-rule-template-preview',
                  '45d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-rule-template-variable',
                component: ComponentCreator(
                  '/api/types/objects/alert-rule-template-variable',
                  '266'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-template',
                component: ComponentCreator('/api/types/objects/alert-template', '52b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-template-payload',
                component: ComponentCreator('/api/types/objects/alert-template-payload', 'aa3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/alert-template-variable',
                component: ComponentCreator('/api/types/objects/alert-template-variable', '96f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/apply-change-set-payload',
                component: ComponentCreator('/api/types/objects/apply-change-set-payload', '908'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/apply-config-payload',
                component: ComponentCreator('/api/types/objects/apply-config-payload', '330'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/apply-fix-payload',
                component: ComponentCreator('/api/types/objects/apply-fix-payload', '8e8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/apply-provisioning-session-payload',
                component: ComponentCreator(
                  '/api/types/objects/apply-provisioning-session-payload',
                  '575'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/apply-resource-payload',
                component: ComponentCreator('/api/types/objects/apply-resource-payload', 'b39'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/apply-service-import-payload',
                component: ComponentCreator(
                  '/api/types/objects/apply-service-import-payload',
                  '4d1'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/archive-resource-payload',
                component: ComponentCreator('/api/types/objects/archive-resource-payload', 'cfc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/auth-payload',
                component: ComponentCreator('/api/types/objects/auth-payload', '72d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/auth-status',
                component: ComponentCreator('/api/types/objects/auth-status', 'bde'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/available-service',
                component: ComponentCreator('/api/types/objects/available-service', '2e9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bandwidth-data-point',
                component: ComponentCreator('/api/types/objects/bandwidth-data-point', 'adf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/batch-interface-payload',
                component: ComponentCreator('/api/types/objects/batch-interface-payload', 'c06'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/binary-verification',
                component: ComponentCreator('/api/types/objects/binary-verification', '95e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bonding-config',
                component: ComponentCreator('/api/types/objects/bonding-config', 'f8e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/boot-sequence-event',
                component: ComponentCreator('/api/types/objects/boot-sequence-event', '1e3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/boot-sequence-progress',
                component: ComponentCreator('/api/types/objects/boot-sequence-progress', '77e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge',
                component: ComponentCreator('/api/types/objects/bridge', 'e53'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-mutation-result',
                component: ComponentCreator('/api/types/objects/bridge-mutation-result', 'abe'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-port',
                component: ComponentCreator('/api/types/objects/bridge-port', 'ae4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-port-mutation-result',
                component: ComponentCreator(
                  '/api/types/objects/bridge-port-mutation-result',
                  '8eb'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-port-vlan-config',
                component: ComponentCreator('/api/types/objects/bridge-port-vlan-config', '769'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-resource',
                component: ComponentCreator('/api/types/objects/bridge-resource', 'b1b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-status',
                component: ComponentCreator('/api/types/objects/bridge-status', '69c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-stp-status',
                component: ComponentCreator('/api/types/objects/bridge-stp-status', '922'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-vlan',
                component: ComponentCreator('/api/types/objects/bridge-vlan', 'd80'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bridge-vlan-mutation-result',
                component: ComponentCreator(
                  '/api/types/objects/bridge-vlan-mutation-result',
                  '23f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bulk-alert-payload',
                component: ComponentCreator('/api/types/objects/bulk-alert-payload', '98b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bulk-create-error',
                component: ComponentCreator('/api/types/objects/bulk-create-error', 'bfc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bulk-create-result',
                component: ComponentCreator('/api/types/objects/bulk-create-result', 'ce7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bulk-routing-failure',
                component: ComponentCreator('/api/types/objects/bulk-routing-failure', '546'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/bulk-routing-result',
                component: ComponentCreator('/api/types/objects/bulk-routing-result', 'f5a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/cancel-change-set-payload',
                component: ComponentCreator('/api/types/objects/cancel-change-set-payload', '5cf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/cancel-scan-payload',
                component: ComponentCreator('/api/types/objects/cancel-scan-payload', '5f0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/capability-entry',
                component: ComponentCreator('/api/types/objects/capability-entry', 'cec'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/chain-hop',
                component: ComponentCreator('/api/types/objects/chain-hop', '6ba'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-log-entry',
                component: ComponentCreator('/api/types/objects/change-log-entry', '553'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set',
                component: ComponentCreator('/api/types/objects/change-set', 'd56'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-conflict',
                component: ComponentCreator('/api/types/objects/change-set-conflict', '126'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-error',
                component: ComponentCreator('/api/types/objects/change-set-error', '3c6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-item',
                component: ComponentCreator('/api/types/objects/change-set-item', '1cd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-progress-event',
                component: ComponentCreator('/api/types/objects/change-set-progress-event', '7fb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-status-event',
                component: ComponentCreator('/api/types/objects/change-set-status-event', 'a00'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-summary',
                component: ComponentCreator('/api/types/objects/change-set-summary', '92b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-validation-error',
                component: ComponentCreator(
                  '/api/types/objects/change-set-validation-error',
                  '8fb'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/change-set-validation-result',
                component: ComponentCreator(
                  '/api/types/objects/change-set-validation-result',
                  'd9b'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/channel-config-payload',
                component: ComponentCreator('/api/types/objects/channel-config-payload', '4e9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/circuit-breaker-event',
                component: ComponentCreator('/api/types/objects/circuit-breaker-event', '3fa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/circuit-breaker-status',
                component: ComponentCreator('/api/types/objects/circuit-breaker-status', 'ffd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/composite-resource',
                component: ComponentCreator('/api/types/objects/composite-resource', '925'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/config-preview',
                component: ComponentCreator('/api/types/objects/config-preview', '099'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/config-progress',
                component: ComponentCreator('/api/types/objects/config-progress', '0eb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/config-schema',
                component: ComponentCreator('/api/types/objects/config-schema', '771'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/config-schema-field',
                component: ComponentCreator('/api/types/objects/config-schema-field', 'b45'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/config-validation-error',
                component: ComponentCreator('/api/types/objects/config-validation-error', '3dc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/config-validation-result',
                component: ComponentCreator('/api/types/objects/config-validation-result', '438'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/configure-external-storage-payload',
                component: ComponentCreator(
                  '/api/types/objects/configure-external-storage-payload',
                  '68a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/connect-router-payload',
                component: ComponentCreator('/api/types/objects/connect-router-payload', '69f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/connection-attempt',
                component: ComponentCreator('/api/types/objects/connection-attempt', 'ea8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/connection-details',
                component: ComponentCreator('/api/types/objects/connection-details', '51d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/connection-error',
                component: ComponentCreator('/api/types/objects/connection-error', '8d0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/connection-stats',
                component: ComponentCreator('/api/types/objects/connection-stats', '268'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/connection-test-result',
                component: ComponentCreator('/api/types/objects/connection-test-result', '158'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/container-info',
                component: ComponentCreator('/api/types/objects/container-info', 'c85'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/cpumetrics',
                component: ComponentCreator('/api/types/objects/cpumetrics', 'dd7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/create-change-set-payload',
                component: ComponentCreator('/api/types/objects/create-change-set-payload', 'b30'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/create-resource-payload',
                component: ComponentCreator('/api/types/objects/create-resource-payload', '02a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/create-router-payload',
                component: ComponentCreator('/api/types/objects/create-router-payload', '133'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/credential-test-result',
                component: ComponentCreator('/api/types/objects/credential-test-result', '032'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/credential-update-payload',
                component: ComponentCreator('/api/types/objects/credential-update-payload', '425'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/current-item-info',
                component: ComponentCreator('/api/types/objects/current-item-info', '9a6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/daily-stats',
                component: ComponentCreator('/api/types/objects/daily-stats', '83d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/delete-change-set-payload',
                component: ComponentCreator('/api/types/objects/delete-change-set-payload', '3de'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/delete-payload',
                component: ComponentCreator('/api/types/objects/delete-payload', 'c4d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/delete-resource-payload',
                component: ComponentCreator('/api/types/objects/delete-resource-payload', '6b9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/delete-result',
                component: ComponentCreator('/api/types/objects/delete-result', 'be5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/delete-router-payload',
                component: ComponentCreator('/api/types/objects/delete-router-payload', '4f0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dependency-graph',
                component: ComponentCreator('/api/types/objects/dependency-graph', '00f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dependency-graph-edge',
                component: ComponentCreator('/api/types/objects/dependency-graph-edge', '0f9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dependency-graph-node',
                component: ComponentCreator('/api/types/objects/dependency-graph-node', '188'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dependency-status',
                component: ComponentCreator('/api/types/objects/dependency-status', '11b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/deployment-state',
                component: ComponentCreator('/api/types/objects/deployment-state', '035'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/deprecate-resource-payload',
                component: ComponentCreator('/api/types/objects/deprecate-resource-payload', 'f58'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/device',
                component: ComponentCreator('/api/types/objects/device', '0dd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/device-routing',
                component: ComponentCreator('/api/types/objects/device-routing', 'b88'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/device-routing-event',
                component: ComponentCreator('/api/types/objects/device-routing-event', 'f8c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/device-routing-matrix',
                component: ComponentCreator('/api/types/objects/device-routing-matrix', '468'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/device-routing-matrix-stats',
                component: ComponentCreator(
                  '/api/types/objects/device-routing-matrix-stats',
                  '78a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/device-traffic-breakdown',
                component: ComponentCreator('/api/types/objects/device-traffic-breakdown', '239'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dhcp-client',
                component: ComponentCreator('/api/types/objects/dhcp-client', '117'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dhcp-server',
                component: ComponentCreator('/api/types/objects/dhcp-server', '6f3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dhcpserver-resource',
                component: ComponentCreator('/api/types/objects/dhcpserver-resource', 'ba5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/diagnostic-report',
                component: ComponentCreator('/api/types/objects/diagnostic-report', '634'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/diagnostic-result',
                component: ComponentCreator('/api/types/objects/diagnostic-result', 'b40'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/diagnostic-suggestion',
                component: ComponentCreator('/api/types/objects/diagnostic-suggestion', '756'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/diagnostic-suite',
                component: ComponentCreator('/api/types/objects/diagnostic-suite', '626'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/diagnostic-test',
                component: ComponentCreator('/api/types/objects/diagnostic-test', 'c03'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/diagnostics-progress',
                component: ComponentCreator('/api/types/objects/diagnostics-progress', '322'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/digest-config',
                component: ComponentCreator('/api/types/objects/digest-config', 'afb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/digest-summary',
                component: ComponentCreator('/api/types/objects/digest-summary', '2cf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/discard-provisioning-session-payload',
                component: ComponentCreator(
                  '/api/types/objects/discard-provisioning-session-payload',
                  'eb3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/disconnect-router-payload',
                component: ComponentCreator('/api/types/objects/disconnect-router-payload', '619'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/discovered-device',
                component: ComponentCreator('/api/types/objects/discovered-device', 'aed'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/discovered-wan',
                component: ComponentCreator('/api/types/objects/discovered-wan', 'c24'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-benchmark-result',
                component: ComponentCreator('/api/types/objects/dns-benchmark-result', '337'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-benchmark-server-result',
                component: ComponentCreator(
                  '/api/types/objects/dns-benchmark-server-result',
                  'a5d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-cache-stats',
                component: ComponentCreator('/api/types/objects/dns-cache-stats', '61f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-lookup-result',
                component: ComponentCreator('/api/types/objects/dns-lookup-result', '387'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-record',
                component: ComponentCreator('/api/types/objects/dns-record', '5e7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-server',
                component: ComponentCreator('/api/types/objects/dns-server', '6f9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-servers',
                component: ComponentCreator('/api/types/objects/dns-servers', '140'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/dns-top-domain',
                component: ComponentCreator('/api/types/objects/dns-top-domain', '579'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/drift-field',
                component: ComponentCreator('/api/types/objects/drift-field', '39b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/drift-info',
                component: ComponentCreator('/api/types/objects/drift-info', '7b0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/egress-vlan',
                component: ComponentCreator('/api/types/objects/egress-vlan', 'b8e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/email-config',
                component: ComponentCreator('/api/types/objects/email-config', '6cf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/eo-iptunnel',
                component: ComponentCreator('/api/types/objects/eo-iptunnel', '739'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/eo-iptunnel-config',
                component: ComponentCreator('/api/types/objects/eo-iptunnel-config', '95b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/eo-iptunnel-deployment',
                component: ComponentCreator('/api/types/objects/eo-iptunnel-deployment', 'abd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/eo-iptunnel-runtime',
                component: ComponentCreator('/api/types/objects/eo-iptunnel-runtime', '02c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/error-extensions',
                component: ComponentCreator('/api/types/objects/error-extensions', '46d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/escalation-config',
                component: ComponentCreator('/api/types/objects/escalation-config', 'f86'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/export-config-payload',
                component: ComponentCreator('/api/types/objects/export-config-payload', '951'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/export-service-config-payload',
                component: ComponentCreator(
                  '/api/types/objects/export-service-config-payload',
                  '14d'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/failover-config',
                component: ComponentCreator('/api/types/objects/failover-config', 'b4b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/feature-compatibility-info',
                component: ComponentCreator('/api/types/objects/feature-compatibility-info', '21e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/feature-deployment',
                component: ComponentCreator('/api/types/objects/feature-deployment', '50a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/feature-resource',
                component: ComponentCreator('/api/types/objects/feature-resource', 'bda'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/feature-runtime',
                component: ComponentCreator('/api/types/objects/feature-runtime', 'bc2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/feature-storage-usage',
                component: ComponentCreator('/api/types/objects/feature-storage-usage', '9b1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/feature-support',
                component: ComponentCreator('/api/types/objects/feature-support', '360'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/firewall-rule',
                component: ComponentCreator('/api/types/objects/firewall-rule', 'edd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/firewall-rule-reference',
                component: ComponentCreator('/api/types/objects/firewall-rule-reference', 'cf1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/firewall-rule-resource',
                component: ComponentCreator('/api/types/objects/firewall-rule-resource', '51f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/firewall-template',
                component: ComponentCreator('/api/types/objects/firewall-template', 'ff3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/firewall-template-result',
                component: ComponentCreator('/api/types/objects/firewall-template-result', '1d9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/firewall-template-variable',
                component: ComponentCreator('/api/types/objects/firewall-template-variable', '150'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/flush-dns-cache-result',
                component: ComponentCreator('/api/types/objects/flush-dns-cache-result', 'b92'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/gateway-info',
                component: ComponentCreator('/api/types/objects/gateway-info', 'b98'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/gateway-reachability-result',
                component: ComponentCreator(
                  '/api/types/objects/gateway-reachability-result',
                  '518'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/generate-config-qrpayload',
                component: ComponentCreator('/api/types/objects/generate-config-qrpayload', '8a0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/gretunnel',
                component: ComponentCreator('/api/types/objects/gretunnel', '87b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/gretunnel-config',
                component: ComponentCreator('/api/types/objects/gretunnel-config', '8b4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/gretunnel-deployment',
                component: ComponentCreator('/api/types/objects/gretunnel-deployment', '054'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/gretunnel-runtime',
                component: ComponentCreator('/api/types/objects/gretunnel-runtime', 'c1e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/hardware-info',
                component: ComponentCreator('/api/types/objects/hardware-info', 'fcb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/health-check-result',
                component: ComponentCreator('/api/types/objects/health-check-result', '9aa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/health-status',
                component: ComponentCreator('/api/types/objects/health-status', 'ac0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/hop-probe',
                component: ComponentCreator('/api/types/objects/hop-probe', '3dc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/hourly-stats',
                component: ComponentCreator('/api/types/objects/hourly-stats', '6f8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-client',
                component: ComponentCreator('/api/types/objects/ikev-2-client', 'f71'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-client-config',
                component: ComponentCreator('/api/types/objects/ikev-2-client-config', '7bb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-deployment',
                component: ComponentCreator('/api/types/objects/ikev-2-deployment', '5de'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-runtime',
                component: ComponentCreator('/api/types/objects/ikev-2-runtime', '7ae'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-server',
                component: ComponentCreator('/api/types/objects/ikev-2-server', 'fe6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-server-config',
                component: ComponentCreator('/api/types/objects/ikev-2-server-config', '54b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-server-deployment',
                component: ComponentCreator('/api/types/objects/ikev-2-server-deployment', '724'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ikev-2-server-runtime',
                component: ComponentCreator('/api/types/objects/ikev-2-server-runtime', '41e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/impact-analysis',
                component: ComponentCreator('/api/types/objects/impact-analysis', '343'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/import-service-config-payload',
                component: ComponentCreator(
                  '/api/types/objects/import-service-config-payload',
                  'd53'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/import-validation-error',
                component: ComponentCreator('/api/types/objects/import-validation-error', '53c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/import-validation-result',
                component: ComponentCreator('/api/types/objects/import-validation-result', '0d1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/import-validation-warning',
                component: ComponentCreator('/api/types/objects/import-validation-warning', '9d2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ingress-vlan',
                component: ComponentCreator('/api/types/objects/ingress-vlan', 'bee'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/install-progress',
                component: ComponentCreator('/api/types/objects/install-progress', '172'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/instance-resource-usage',
                component: ComponentCreator('/api/types/objects/instance-resource-usage', '547'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/instance-status-changed',
                component: ComponentCreator('/api/types/objects/instance-status-changed', '4be'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface',
                component: ComponentCreator('/api/types/objects/interface', '1f4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-connection',
                component: ComponentCreator('/api/types/objects/interface-connection', 'da3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-edge',
                component: ComponentCreator('/api/types/objects/interface-edge', '8ce'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-operation-error',
                component: ComponentCreator('/api/types/objects/interface-operation-error', '115'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-stats',
                component: ComponentCreator('/api/types/objects/interface-stats', 'ebf'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-stats-history',
                component: ComponentCreator('/api/types/objects/interface-stats-history', 'aaa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-status-event',
                component: ComponentCreator('/api/types/objects/interface-status-event', '1e9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/interface-traffic-event',
                component: ComponentCreator('/api/types/objects/interface-traffic-event', 'b7f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-address',
                component: ComponentCreator('/api/types/objects/ip-address', 'a43'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-address-change-event',
                component: ComponentCreator('/api/types/objects/ip-address-change-event', '56b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-address-delete-result',
                component: ComponentCreator('/api/types/objects/ip-address-delete-result', 'ba7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-address-dependencies',
                component: ComponentCreator('/api/types/objects/ip-address-dependencies', '990'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-address-impact-analysis',
                component: ComponentCreator('/api/types/objects/ip-address-impact-analysis', '2f2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-address-mutation-result',
                component: ComponentCreator('/api/types/objects/ip-address-mutation-result', 'ccd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-conflict',
                component: ComponentCreator('/api/types/objects/ip-conflict', '392'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ip-conflict-result',
                component: ComponentCreator('/api/types/objects/ip-conflict-result', 'd04'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ipiptunnel',
                component: ComponentCreator('/api/types/objects/ipiptunnel', 'b83'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ipiptunnel-config',
                component: ComponentCreator('/api/types/objects/ipiptunnel-config', 'a1b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ipiptunnel-deployment',
                component: ComponentCreator('/api/types/objects/ipiptunnel-deployment', '407'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ipiptunnel-runtime',
                component: ComponentCreator('/api/types/objects/ipiptunnel-runtime', 'f8d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ipsec-profile',
                component: ComponentCreator('/api/types/objects/ipsec-profile', '271'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/isolation-status',
                component: ComponentCreator('/api/types/objects/isolation-status', '308'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/isolation-violation',
                component: ComponentCreator('/api/types/objects/isolation-violation', '87d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/ispinfo',
                component: ComponentCreator('/api/types/objects/ispinfo', 'f5d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/kill-switch-status',
                component: ComponentCreator('/api/types/objects/kill-switch-status', 'c23'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/knock-port',
                component: ComponentCreator('/api/types/objects/knock-port', 'd5e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/l2-tpclient',
                component: ComponentCreator('/api/types/objects/l2-tpclient', '0aa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/l2-tpclient-config',
                component: ComponentCreator('/api/types/objects/l2-tpclient-config', 'abd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/l2-tpdeployment',
                component: ComponentCreator('/api/types/objects/l2-tpdeployment', '51a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/l2-tpruntime',
                component: ComponentCreator('/api/types/objects/l2-tpruntime', '3b2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/lannetwork',
                component: ComponentCreator('/api/types/objects/lannetwork', '9b6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/lannetwork-config',
                component: ComponentCreator('/api/types/objects/lannetwork-config', '0d2'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/lannetwork-deployment',
                component: ComponentCreator('/api/types/objects/lannetwork-deployment', 'cb0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/lannetwork-runtime',
                component: ComponentCreator('/api/types/objects/lannetwork-runtime', '530'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/log-entry',
                component: ComponentCreator('/api/types/objects/log-entry', 'a66'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/lte-modem',
                component: ComponentCreator('/api/types/objects/lte-modem', '788'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/memory-metrics',
                component: ComponentCreator('/api/types/objects/memory-metrics', '1d5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/missing-dependency',
                component: ComponentCreator('/api/types/objects/missing-dependency', 'd46'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/mtu-guidance',
                component: ComponentCreator('/api/types/objects/mtu-guidance', '882'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/multi-link-config',
                component: ComponentCreator('/api/types/objects/multi-link-config', '106'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/multi-link-link-config',
                component: ComponentCreator('/api/types/objects/multi-link-link-config', 'dc4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/mutation-error',
                component: ComponentCreator('/api/types/objects/mutation-error', 'cce'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/nat-rule',
                component: ComponentCreator('/api/types/objects/nat-rule', '030'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/nat-rule-reference',
                component: ComponentCreator('/api/types/objects/nat-rule-reference', 'a4c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/network-config-detection',
                component: ComponentCreator('/api/types/objects/network-config-detection', 'c96'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/network-device',
                component: ComponentCreator('/api/types/objects/network-device', '012'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/notification-channel-config',
                component: ComponentCreator(
                  '/api/types/objects/notification-channel-config',
                  'bcf'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/notification-log',
                component: ComponentCreator('/api/types/objects/notification-log', '13c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/notification-template-preview',
                component: ComponentCreator(
                  '/api/types/objects/notification-template-preview',
                  '665'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/open-vpnclient',
                component: ComponentCreator('/api/types/objects/open-vpnclient', '08c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/open-vpnclient-config',
                component: ComponentCreator('/api/types/objects/open-vpnclient-config', 'd65'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/open-vpndeployment',
                component: ComponentCreator('/api/types/objects/open-vpndeployment', '8a6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/open-vpnruntime',
                component: ComponentCreator('/api/types/objects/open-vpnruntime', 'f1c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/operation-counts',
                component: ComponentCreator('/api/types/objects/operation-counts', '3dc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/orphan-cleanup-payload',
                component: ComponentCreator('/api/types/objects/orphan-cleanup-payload', '871'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/orphaned-port',
                component: ComponentCreator('/api/types/objects/orphaned-port', '4ba'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/page-info',
                component: ComponentCreator('/api/types/objects/page-info', '9ff'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/platform-capabilities',
                component: ComponentCreator('/api/types/objects/platform-capabilities', 'df0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/platform-feature',
                component: ComponentCreator('/api/types/objects/platform-feature', '032'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/platform-info',
                component: ComponentCreator('/api/types/objects/platform-info', '82c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/platform-limitation',
                component: ComponentCreator('/api/types/objects/platform-limitation', '972'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-allocation',
                component: ComponentCreator('/api/types/objects/port-allocation', '6ed'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-availability',
                component: ComponentCreator('/api/types/objects/port-availability', '64e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-forward',
                component: ComponentCreator('/api/types/objects/port-forward', 'a64'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-knock-attempt',
                component: ComponentCreator('/api/types/objects/port-knock-attempt', 'ce5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-knock-attempt-connection',
                component: ComponentCreator(
                  '/api/types/objects/port-knock-attempt-connection',
                  'cdf'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-knock-attempt-edge',
                component: ComponentCreator('/api/types/objects/port-knock-attempt-edge', '9d3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-knock-sequence',
                component: ComponentCreator('/api/types/objects/port-knock-sequence', 'fbb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-mapping',
                component: ComponentCreator('/api/types/objects/port-mapping', 'eec'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-mirror',
                component: ComponentCreator('/api/types/objects/port-mirror', 'cd8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-mirror-mutation-result',
                component: ComponentCreator(
                  '/api/types/objects/port-mirror-mutation-result',
                  '193'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-mirror-stats',
                component: ComponentCreator('/api/types/objects/port-mirror-stats', 'fde'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/port-status',
                component: ComponentCreator('/api/types/objects/port-status', 'af7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pppoe-client',
                component: ComponentCreator('/api/types/objects/pppoe-client', '5ef'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pppserver',
                component: ComponentCreator('/api/types/objects/pppserver', '795'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pppserver-config',
                component: ComponentCreator('/api/types/objects/pppserver-config', '2b7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pppserver-deployment',
                component: ComponentCreator('/api/types/objects/pppserver-deployment', 'ce4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pppserver-runtime',
                component: ComponentCreator('/api/types/objects/pppserver-runtime', 'c87'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pptpclient',
                component: ComponentCreator('/api/types/objects/pptpclient', 'b21'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pptpclient-config',
                component: ComponentCreator('/api/types/objects/pptpclient-config', 'e05'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pptpdeployment',
                component: ComponentCreator('/api/types/objects/pptpdeployment', 'e6b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pptpruntime',
                component: ComponentCreator('/api/types/objects/pptpruntime', 'b7d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/provisioning-progress-event',
                component: ComponentCreator(
                  '/api/types/objects/provisioning-progress-event',
                  'a3f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/provisioning-session',
                component: ComponentCreator('/api/types/objects/provisioning-session', 'a00'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/provisioning-session-connection',
                component: ComponentCreator(
                  '/api/types/objects/provisioning-session-connection',
                  'fd3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/provisioning-session-edge',
                component: ComponentCreator('/api/types/objects/provisioning-session-edge', '419'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/provisioning-session-payload',
                component: ComponentCreator(
                  '/api/types/objects/provisioning-session-payload',
                  'bda'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/pushover-usage',
                component: ComponentCreator('/api/types/objects/pushover-usage', 'c38'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/quiet-hours-config',
                component: ComponentCreator('/api/types/objects/quiet-hours-config', '66f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/reconnect-router-payload',
                component: ComponentCreator('/api/types/objects/reconnect-router-payload', '9e4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/refresh-capabilities-payload',
                component: ComponentCreator(
                  '/api/types/objects/refresh-capabilities-payload',
                  '5f0'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/remove-change-set-item-payload',
                component: ComponentCreator(
                  '/api/types/objects/remove-change-set-item-payload',
                  '772'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/reset-external-storage-payload',
                component: ComponentCreator(
                  '/api/types/objects/reset-external-storage-payload',
                  '35f'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-conflict',
                component: ComponentCreator('/api/types/objects/resource-conflict', '227'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-connection',
                component: ComponentCreator('/api/types/objects/resource-connection', '138'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-edge',
                component: ComponentCreator('/api/types/objects/resource-edge', 'd1b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-estimate',
                component: ComponentCreator('/api/types/objects/resource-estimate', '109'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-limits',
                component: ComponentCreator('/api/types/objects/resource-limits', 'ce8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-limits-payload',
                component: ComponentCreator('/api/types/objects/resource-limits-payload', '85b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-metadata',
                component: ComponentCreator('/api/types/objects/resource-metadata', '4d7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-metrics',
                component: ComponentCreator('/api/types/objects/resource-metrics', '548'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-reference',
                component: ComponentCreator('/api/types/objects/resource-reference', '893'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-relationship-edge',
                component: ComponentCreator('/api/types/objects/resource-relationship-edge', '9d3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-relationships',
                component: ComponentCreator('/api/types/objects/resource-relationships', 'be1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-requirements',
                component: ComponentCreator('/api/types/objects/resource-requirements', '98a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-runtime-event',
                component: ComponentCreator('/api/types/objects/resource-runtime-event', '212'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-state-event',
                component: ComponentCreator('/api/types/objects/resource-state-event', 'dd3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-updated-event',
                component: ComponentCreator('/api/types/objects/resource-updated-event', 'bb3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-usage',
                component: ComponentCreator('/api/types/objects/resource-usage', 'cb8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/resource-validation-result',
                component: ComponentCreator('/api/types/objects/resource-validation-result', 'dc4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/reverify-payload',
                component: ComponentCreator('/api/types/objects/reverify-payload', '0dd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/rollback-change-set-payload',
                component: ComponentCreator(
                  '/api/types/objects/rollback-change-set-payload',
                  'd63'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/rollback-step',
                component: ComponentCreator('/api/types/objects/rollback-step', 'bf9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route',
                component: ComponentCreator('/api/types/objects/route', 'd14'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route-delete-result',
                component: ComponentCreator('/api/types/objects/route-delete-result', '383'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route-impact-analysis',
                component: ComponentCreator('/api/types/objects/route-impact-analysis', '567'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route-lookup-candidate',
                component: ComponentCreator('/api/types/objects/route-lookup-candidate', '7f4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route-lookup-result',
                component: ComponentCreator('/api/types/objects/route-lookup-result', '2ca'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route-mutation-result',
                component: ComponentCreator('/api/types/objects/route-mutation-result', 'e93'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/route-resource',
                component: ComponentCreator('/api/types/objects/route-resource', '1cd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router',
                component: ComponentCreator('/api/types/objects/router', 'e42'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-added-event',
                component: ComponentCreator('/api/types/objects/router-added-event', '51c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-capabilities',
                component: ComponentCreator('/api/types/objects/router-capabilities', '23c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-connection',
                component: ComponentCreator('/api/types/objects/router-connection', '843'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-credentials',
                component: ComponentCreator('/api/types/objects/router-credentials', '07d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-edge',
                component: ComponentCreator('/api/types/objects/router-edge', '489'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-osinfo',
                component: ComponentCreator('/api/types/objects/router-osinfo', '1fb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-osversion',
                component: ComponentCreator('/api/types/objects/router-osversion', '933'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/router-status-event',
                component: ComponentCreator('/api/types/objects/router-status-event', 'eef'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/routing-chain',
                component: ComponentCreator('/api/types/objects/routing-chain', '286'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/routing-chain-mutation-result',
                component: ComponentCreator(
                  '/api/types/objects/routing-chain-mutation-result',
                  '78a'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/routing-rule',
                component: ComponentCreator('/api/types/objects/routing-rule', '6d0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/routing-schedule',
                component: ComponentCreator('/api/types/objects/routing-schedule', '332'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/run-diagnostics-payload',
                component: ComponentCreator('/api/types/objects/run-diagnostics-payload', 'f24'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/run-troubleshoot-step-payload',
                component: ComponentCreator(
                  '/api/types/objects/run-troubleshoot-step-payload',
                  '791'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/runtime-metrics',
                component: ComponentCreator('/api/types/objects/runtime-metrics', '426'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/runtime-state',
                component: ComponentCreator('/api/types/objects/runtime-state', '316'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/scan-network-payload',
                component: ComponentCreator('/api/types/objects/scan-network-payload', '8a7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/scan-progress-event',
                component: ComponentCreator('/api/types/objects/scan-progress-event', 'cb7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/scan-storage-payload',
                component: ComponentCreator('/api/types/objects/scan-storage-payload', 'dfa'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/scan-task',
                component: ComponentCreator('/api/types/objects/scan-task', 'ae5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/schedule-event',
                component: ComponentCreator('/api/types/objects/schedule-event', 'fc7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-config-shared-event',
                component: ComponentCreator(
                  '/api/types/objects/service-config-shared-event',
                  '833'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-dependency',
                component: ComponentCreator('/api/types/objects/service-dependency', '9fb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-export-package',
                component: ComponentCreator('/api/types/objects/service-export-package', '703'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-instance',
                component: ComponentCreator('/api/types/objects/service-instance', 'f49'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-instance-health',
                component: ComponentCreator('/api/types/objects/service-instance-health', '771'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-instance-health-config',
                component: ComponentCreator(
                  '/api/types/objects/service-instance-health-config',
                  '540'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-instance-payload',
                component: ComponentCreator('/api/types/objects/service-instance-payload', '137'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-log-file',
                component: ComponentCreator('/api/types/objects/service-log-file', '38d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-result',
                component: ComponentCreator('/api/types/objects/service-result', 'b05'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-spec',
                component: ComponentCreator('/api/types/objects/service-spec', '9bd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-template',
                component: ComponentCreator('/api/types/objects/service-template', '137'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/service-traffic-stats',
                component: ComponentCreator('/api/types/objects/service-traffic-stats', 'd7b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/session',
                component: ComponentCreator('/api/types/objects/session', '798'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/set-preferred-protocol-payload',
                component: ComponentCreator(
                  '/api/types/objects/set-preferred-protocol-payload',
                  '63e'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/software-info',
                component: ComponentCreator('/api/types/objects/software-info', 'c10'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/sstpclient',
                component: ComponentCreator('/api/types/objects/sstpclient', '5ab'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/sstpclient-config',
                component: ComponentCreator('/api/types/objects/sstpclient-config', 'd7b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/sstpdeployment',
                component: ComponentCreator('/api/types/objects/sstpdeployment', '9bc'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/sstpruntime',
                component: ComponentCreator('/api/types/objects/sstpruntime', 'f31'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/start-troubleshoot-payload',
                component: ComponentCreator('/api/types/objects/start-troubleshoot-payload', '888'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/startup-diagnostics',
                component: ComponentCreator('/api/types/objects/startup-diagnostics', '7d4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/static-ipconfig',
                component: ComponentCreator('/api/types/objects/static-ipconfig', '9c7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/stats-data-point',
                component: ComponentCreator('/api/types/objects/stats-data-point', '544'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-breakdown',
                component: ComponentCreator('/api/types/objects/storage-breakdown', '229'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-config',
                component: ComponentCreator('/api/types/objects/storage-config', '76d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-info',
                component: ComponentCreator('/api/types/objects/storage-info', 'c5c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-metrics',
                component: ComponentCreator('/api/types/objects/storage-metrics', 'a21'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-mounted-event',
                component: ComponentCreator('/api/types/objects/storage-mounted-event', 'c62'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-space-event',
                component: ComponentCreator('/api/types/objects/storage-space-event', 'f1e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-unmounted-event',
                component: ComponentCreator('/api/types/objects/storage-unmounted-event', '35a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storage-usage',
                component: ComponentCreator('/api/types/objects/storage-usage', 'd5d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storm-rule-contribution',
                component: ComponentCreator('/api/types/objects/storm-rule-contribution', 'e88'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/storm-status',
                component: ComponentCreator('/api/types/objects/storm-status', '16b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/suggested-routing-rule',
                component: ComponentCreator('/api/types/objects/suggested-routing-rule', '3a9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/system-resources',
                component: ComponentCreator('/api/types/objects/system-resources', 'c6a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/telemetry-data',
                component: ComponentCreator('/api/types/objects/telemetry-data', '224'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-conflict',
                component: ComponentCreator('/api/types/objects/template-conflict', '35e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-install-progress',
                component: ComponentCreator('/api/types/objects/template-install-progress', '1ab'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-install-result',
                component: ComponentCreator('/api/types/objects/template-install-result', '071'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-preview',
                component: ComponentCreator('/api/types/objects/template-preview', '67e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-preview-payload',
                component: ComponentCreator('/api/types/objects/template-preview-payload', '64d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-preview-result',
                component: ComponentCreator('/api/types/objects/template-preview-result', '451'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-rule',
                component: ComponentCreator('/api/types/objects/template-rule', 'd30'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-validation-info',
                component: ComponentCreator('/api/types/objects/template-validation-info', '508'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/template-variable',
                component: ComponentCreator('/api/types/objects/template-variable', '61c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/test-all-credentials-payload',
                component: ComponentCreator(
                  '/api/types/objects/test-all-credentials-payload',
                  '0ae'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/test-connection-payload',
                component: ComponentCreator('/api/types/objects/test-connection-payload', 'bab'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/test-notification-payload',
                component: ComponentCreator('/api/types/objects/test-notification-payload', '690'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/test-port-knock-result',
                component: ComponentCreator('/api/types/objects/test-port-knock-result', '837'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/throttle-config',
                component: ComponentCreator('/api/types/objects/throttle-config', 'bcb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/throttle-group-status',
                component: ComponentCreator('/api/types/objects/throttle-group-status', '4a5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/throttle-status',
                component: ComponentCreator('/api/types/objects/throttle-status', 'cfd'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/tlsstatus',
                component: ComponentCreator('/api/types/objects/tlsstatus', '611'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/topology-edge',
                component: ComponentCreator('/api/types/objects/topology-edge', 'e1d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/topology-edge-style',
                component: ComponentCreator('/api/types/objects/topology-edge-style', 'b18'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/topology-node',
                component: ComponentCreator('/api/types/objects/topology-node', 'c2b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/topology-node-style',
                component: ComponentCreator('/api/types/objects/topology-node-style', 'b50'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/topology-position',
                component: ComponentCreator('/api/types/objects/topology-position', 'c4b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traceroute-hop',
                component: ComponentCreator('/api/types/objects/traceroute-hop', '301'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traceroute-job',
                component: ComponentCreator('/api/types/objects/traceroute-job', '39f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traceroute-progress-event',
                component: ComponentCreator('/api/types/objects/traceroute-progress-event', '6a0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traceroute-result',
                component: ComponentCreator('/api/types/objects/traceroute-result', 'cf1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traffic-data-point',
                component: ComponentCreator('/api/types/objects/traffic-data-point', '198'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traffic-quota',
                component: ComponentCreator('/api/types/objects/traffic-quota', 'e32'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traffic-quota-payload',
                component: ComponentCreator('/api/types/objects/traffic-quota-payload', '5af'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/traffic-stats-event',
                component: ComponentCreator('/api/types/objects/traffic-stats-event', '741'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/troubleshoot-fix-suggestion',
                component: ComponentCreator(
                  '/api/types/objects/troubleshoot-fix-suggestion',
                  '342'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/troubleshoot-session',
                component: ComponentCreator('/api/types/objects/troubleshoot-session', '1af'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/troubleshoot-step',
                component: ComponentCreator('/api/types/objects/troubleshoot-step', '76f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/troubleshoot-step-result',
                component: ComponentCreator('/api/types/objects/troubleshoot-step-result', '8ef'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/tunnel',
                component: ComponentCreator('/api/types/objects/tunnel', 'a35'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/tunnel-mutation-result',
                component: ComponentCreator('/api/types/objects/tunnel-mutation-result', 'd29'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/tunnel-test-result',
                component: ComponentCreator('/api/types/objects/tunnel-test-result', '092'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-change-set-item-payload',
                component: ComponentCreator(
                  '/api/types/objects/update-change-set-item-payload',
                  'aa3'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-info',
                component: ComponentCreator('/api/types/objects/update-info', '3e6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-interface-payload',
                component: ComponentCreator('/api/types/objects/update-interface-payload', '0a5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-progress',
                component: ComponentCreator('/api/types/objects/update-progress', '83b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-resource-payload',
                component: ComponentCreator('/api/types/objects/update-resource-payload', '791'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-result',
                component: ComponentCreator('/api/types/objects/update-result', '23e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/update-router-payload',
                component: ComponentCreator('/api/types/objects/update-router-payload', '218'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/upgrade-impact',
                component: ComponentCreator('/api/types/objects/upgrade-impact', '9ca'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/upgrade-recommendation',
                component: ComponentCreator('/api/types/objects/upgrade-recommendation', 'c4b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/upgrade-step',
                component: ComponentCreator('/api/types/objects/upgrade-step', '902'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/uptime-data-point',
                component: ComponentCreator('/api/types/objects/uptime-data-point', '746'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/user',
                component: ComponentCreator('/api/types/objects/user', '67d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/validate-change-set-payload',
                component: ComponentCreator(
                  '/api/types/objects/validate-change-set-payload',
                  '610'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/validate-provisioning-session-payload',
                component: ComponentCreator(
                  '/api/types/objects/validate-provisioning-session-payload',
                  '9df'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/validate-resource-payload',
                component: ComponentCreator('/api/types/objects/validate-resource-payload', '822'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/validation-error',
                component: ComponentCreator('/api/types/objects/validation-error', '3fe'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/validation-issue',
                component: ComponentCreator('/api/types/objects/validation-issue', 'f79'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/validation-result',
                component: ComponentCreator('/api/types/objects/validation-result', 'ce8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/verification-event',
                component: ComponentCreator('/api/types/objects/verification-event', '470'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vifguidance-step',
                component: ComponentCreator('/api/types/objects/vifguidance-step', '6c8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vifrequirements',
                component: ComponentCreator('/api/types/objects/vifrequirements', '207'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/virtual-interface',
                component: ComponentCreator('/api/types/objects/virtual-interface', '102'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/virtual-interface-info',
                component: ComponentCreator('/api/types/objects/virtual-interface-info', '2c9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vlan',
                component: ComponentCreator('/api/types/objects/vlan', '839'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vlan-dependencies',
                component: ComponentCreator('/api/types/objects/vlan-dependencies', '361'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vlan-mutation-result',
                component: ComponentCreator('/api/types/objects/vlan-mutation-result', 'd3f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vlan-topology',
                component: ComponentCreator('/api/types/objects/vlan-topology', '20a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vlanallocation',
                component: ComponentCreator('/api/types/objects/vlanallocation', '240'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vlanpool-status',
                component: ComponentCreator('/api/types/objects/vlanpool-status', 'c41'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vpntunnel-info',
                component: ComponentCreator('/api/types/objects/vpntunnel-info', '9b6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vxlantunnel',
                component: ComponentCreator('/api/types/objects/vxlantunnel', 'dea'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vxlantunnel-config',
                component: ComponentCreator('/api/types/objects/vxlantunnel-config', '6f8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vxlantunnel-deployment',
                component: ComponentCreator('/api/types/objects/vxlantunnel-deployment', '6f3'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/vxlantunnel-runtime',
                component: ComponentCreator('/api/types/objects/vxlantunnel-runtime', '3af'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanconnection-event',
                component: ComponentCreator('/api/types/objects/wanconnection-event', '78d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanconnection-event-connection',
                component: ComponentCreator(
                  '/api/types/objects/wanconnection-event-connection',
                  '3b0'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanconnection-event-edge',
                component: ComponentCreator('/api/types/objects/wanconnection-event-edge', '656'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wandnsconfig',
                component: ComponentCreator('/api/types/objects/wandnsconfig', 'b70'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanhealth-status',
                component: ComponentCreator('/api/types/objects/wanhealth-status', 'e4a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/waninterface',
                component: ComponentCreator('/api/types/objects/waninterface', '4f6'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanlink',
                component: ComponentCreator('/api/types/objects/wanlink', 'abe'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanlink-config',
                component: ComponentCreator('/api/types/objects/wanlink-config', 'bdb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanlink-deployment',
                component: ComponentCreator('/api/types/objects/wanlink-deployment', '556'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanlink-resource',
                component: ComponentCreator('/api/types/objects/wanlink-resource', '4e4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanlink-runtime',
                component: ComponentCreator('/api/types/objects/wanlink-runtime', '77d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wanmutation-result',
                component: ComponentCreator('/api/types/objects/wanmutation-result', 'c94'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/webhook',
                component: ComponentCreator('/api/types/objects/webhook', 'bc7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/webhook-delivery-stats',
                component: ComponentCreator('/api/types/objects/webhook-delivery-stats', '27b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/webhook-payload',
                component: ComponentCreator('/api/types/objects/webhook-payload', 'b77'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/webhook-test-payload',
                component: ComponentCreator('/api/types/objects/webhook-test-payload', '4a0'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/webhook-test-result',
                component: ComponentCreator('/api/types/objects/webhook-test-result', 'ca1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-client',
                component: ComponentCreator('/api/types/objects/wire-guard-client', 'fc7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-client-config',
                component: ComponentCreator('/api/types/objects/wire-guard-client-config', 'e68'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-deployment',
                component: ComponentCreator('/api/types/objects/wire-guard-deployment', 'e92'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-peer',
                component: ComponentCreator('/api/types/objects/wire-guard-peer', '8df'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-peer-config',
                component: ComponentCreator('/api/types/objects/wire-guard-peer-config', 'c6f'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-peer-deployment',
                component: ComponentCreator('/api/types/objects/wire-guard-peer-deployment', '932'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-peer-runtime',
                component: ComponentCreator('/api/types/objects/wire-guard-peer-runtime', '60a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-runtime',
                component: ComponentCreator('/api/types/objects/wire-guard-runtime', 'f2a'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-server',
                component: ComponentCreator('/api/types/objects/wire-guard-server', '9ff'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-server-config',
                component: ComponentCreator('/api/types/objects/wire-guard-server-config', '528'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-server-deployment',
                component: ComponentCreator(
                  '/api/types/objects/wire-guard-server-deployment',
                  '1ce'
                ),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/objects/wire-guard-server-runtime',
                component: ComponentCreator('/api/types/objects/wire-guard-server-runtime', 'fe7'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/bandwidth',
                component: ComponentCreator('/api/types/scalars/bandwidth', '707'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/boolean',
                component: ComponentCreator('/api/types/scalars/boolean', '72e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/cidr',
                component: ComponentCreator('/api/types/scalars/cidr', '2d4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/date-time',
                component: ComponentCreator('/api/types/scalars/date-time', 'afb'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/duration',
                component: ComponentCreator('/api/types/scalars/duration', '782'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/float',
                component: ComponentCreator('/api/types/scalars/float', '3b4'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/id',
                component: ComponentCreator('/api/types/scalars/id', '258'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/int',
                component: ComponentCreator('/api/types/scalars/int', '8db'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/ipv-4',
                component: ComponentCreator('/api/types/scalars/ipv-4', 'bf1'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/ipv-6',
                component: ComponentCreator('/api/types/scalars/ipv-6', 'ced'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/json',
                component: ComponentCreator('/api/types/scalars/json', '0f9'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/mac',
                component: ComponentCreator('/api/types/scalars/mac', '11b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/port',
                component: ComponentCreator('/api/types/scalars/port', 'e52'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/port-range',
                component: ComponentCreator('/api/types/scalars/port-range', '96d'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/size',
                component: ComponentCreator('/api/types/scalars/size', 'e25'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/string',
                component: ComponentCreator('/api/types/scalars/string', '14b'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/scalars/ulid',
                component: ComponentCreator('/api/types/scalars/ulid', 'b75'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/api/types/unions/storage-mount-event',
                component: ComponentCreator('/api/types/unions/storage-mount-event', '637'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/directives',
                component: ComponentCreator('/category/directives', 'a88'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/directives-1',
                component: ComponentCreator('/category/directives-1', 'f9c'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/enums',
                component: ComponentCreator('/category/enums', 'b67'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/inputs',
                component: ComponentCreator('/category/inputs', '885'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/interfaces',
                component: ComponentCreator('/category/interfaces', '9ee'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/mutations',
                component: ComponentCreator('/category/mutations', '7ff'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/objects',
                component: ComponentCreator('/category/objects', '54e'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/operations',
                component: ComponentCreator('/category/operations', 'e48'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/queries',
                component: ComponentCreator('/category/queries', '6fe'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/scalars',
                component: ComponentCreator('/category/scalars', '188'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/subscriptions',
                component: ComponentCreator('/category/subscriptions', 'df8'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/types',
                component: ComponentCreator('/category/types', 'ad5'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
              {
                path: '/category/unions',
                component: ComponentCreator('/category/unions', 'f48'),
                exact: true,
                sidebar: 'defaultSidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
