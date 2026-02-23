/**
 * TemplatesPage Storybook Stories
 *
 * Interactive stories for the Firewall Templates page domain component.
 * Demonstrates template browsing, apply flow, custom template management, and empty states.
 *
 * @module @nasnet/features/firewall/pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TemplatesPage } from './TemplatesPage';

import type { TemplatesPageProps } from './TemplatesPage';
import type { FirewallTemplate } from '../schemas/templateSchemas';
import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

// ============================================================================
// Mock Data
// ============================================================================

const mockBasicSecurityTemplate: FirewallTemplate = {
  id: 'basic-security-v1',
  name: 'Basic Security Hardening',
  description:
    'Essential firewall rules for home and small office routers. Blocks common attack vectors, allows established connections, and protects the router management interface.',
  category: 'SECURITY',
  complexity: 'SIMPLE',
  version: '1.0.0',
  ruleCount: 8,
  isBuiltIn: true,
  variables: [
    {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      description: 'The bridge or interface connected to your local network',
      isRequired: true,
      defaultValue: 'bridge1',
    },
    {
      name: 'LAN_SUBNET',
      label: 'LAN Subnet',
      type: 'SUBNET',
      description: 'Your local network in CIDR notation',
      isRequired: true,
      defaultValue: '192.168.88.0/24',
    },
  ],
  rules: [
    {
      table: 'FILTER',
      chain: 'input',
      action: 'accept',
      position: 0,
      comment: 'Accept established/related',
      properties: { connectionState: ['established', 'related'] },
    },
    {
      table: 'FILTER',
      chain: 'input',
      action: 'drop',
      position: 1,
      comment: 'Drop invalid connections',
      properties: { connectionState: ['invalid'] },
    },
    {
      table: 'FILTER',
      chain: 'input',
      action: 'accept',
      position: 2,
      comment: 'Accept ICMP',
      properties: { protocol: 'icmp' },
    },
    {
      table: 'FILTER',
      chain: 'input',
      action: 'accept',
      position: 3,
      comment: 'Accept from LAN',
      properties: { inInterface: '{{LAN_INTERFACE}}' },
    },
    {
      table: 'FILTER',
      chain: 'input',
      action: 'drop',
      position: 4,
      comment: 'Drop all other input',
      properties: {},
    },
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'accept',
      position: 5,
      comment: 'Accept established/related forwarded',
      properties: { connectionState: ['established', 'related'] },
    },
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'accept',
      position: 6,
      comment: 'Accept forwarded from LAN',
      properties: { inInterface: '{{LAN_INTERFACE}}' },
    },
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'drop',
      position: 7,
      comment: 'Drop all other forwarded',
      properties: {},
    },
  ],
};

const mockDDoSProtectionTemplate: FirewallTemplate = {
  id: 'ddos-protection-v2',
  name: 'DDoS Protection Suite',
  description:
    'Advanced DDoS mitigation rules including SYN flood protection, ICMP flood limiting, UDP reflection defense, and connection rate limiting. Suitable for small business and ISP edge routers.',
  category: 'SECURITY',
  complexity: 'ADVANCED',
  version: '2.1.0',
  ruleCount: 15,
  isBuiltIn: true,
  variables: [
    {
      name: 'WAN_INTERFACE',
      label: 'WAN Interface',
      type: 'INTERFACE',
      description: 'Your internet-facing interface',
      isRequired: true,
      defaultValue: 'ether1',
    },
    {
      name: 'SYN_LIMIT',
      label: 'SYN Packet Limit',
      type: 'STRING',
      description: 'Maximum SYN packets per second (e.g., 50/s)',
      isRequired: true,
      defaultValue: '50/s',
    },
  ],
  rules: [
    {
      table: 'FILTER' as const,
      chain: 'input',
      action: 'drop',
      position: 0,
      comment: 'Drop SYN floods',
      properties: { protocol: 'tcp', tcpFlags: 'syn', limit: '{{SYN_LIMIT}}' },
    },
  ],
};

const mockVoIPQoSTemplate: FirewallTemplate = {
  id: 'voip-qos-v1',
  name: 'VoIP QoS Priority',
  description:
    'Mangle rules for prioritizing VoIP traffic (SIP + RTP). Marks connections and packets for queue tree processing. Ensures low latency and jitter for voice calls.',
  category: 'SECURITY',
  complexity: 'ADVANCED',
  version: '1.0.0',
  ruleCount: 6,
  isBuiltIn: true,
  variables: [
    {
      name: 'VOIP_PROVIDER_IP',
      label: 'VoIP Provider IP/Subnet',
      type: 'SUBNET',
      description: 'IP range of your VoIP provider (leave blank for all)',
      isRequired: false,
    },
  ],
  rules: [
    {
      table: 'MANGLE' as const,
      chain: 'forward',
      action: 'mark-connection',
      position: 0,
      comment: 'Mark VoIP connections',
      properties: { srcAddress: '{{VOIP_PROVIDER_IP}}', dstPort: '5060' },
    },
  ],
};

const mockCustomTemplate: FirewallTemplate = {
  id: 'custom-office-rules-v1',
  name: 'My Office Rules',
  description: 'Custom template saved from our production firewall configuration.',
  category: 'SECURITY',
  complexity: 'ADVANCED',
  version: '1.0.0',
  ruleCount: 12,
  isBuiltIn: false,
  variables: [],
  rules: [
    {
      table: 'FILTER' as const,
      chain: 'input',
      action: 'accept',
      position: 0,
      comment: 'Accept established',
      properties: { connectionState: ['established', 'related'] },
    },
  ],
};

const mockCurrentRules = [
  { id: '*1', chain: 'input', action: 'accept', comment: 'Accept established', disabled: false },
  { id: '*2', chain: 'input', action: 'drop', comment: 'Drop invalid', disabled: false },
  { id: '*3', chain: 'forward', action: 'accept', comment: 'Accept LAN forwarded', disabled: false },
];

/**
 * TemplatesPage - Firewall template management page
 *
 * The TemplatesPage provides a two-tab interface for browsing and applying pre-configured
 * firewall rule templates — both built-in and custom (saved to IndexedDB).
 *
 * ## Features
 *
 * - **Browse Tab**: TemplateGallery with filtering by category/complexity/search
 * - **Configure & Apply Tab**: TemplateApplyFlow (disabled until a template is selected)
 * - **Import Template**: Upload JSON template file via ImportTemplateDialog
 * - **Create Template**: SaveTemplateDialog to save current rules as a template
 * - **Export Custom**: Download all custom templates as JSON (shown when custom templates exist)
 * - **Safety Pipeline**: Apply → Preview → Confirm → Undo within 10s
 * - **Rollback**: Full undo support if apply causes issues
 * - **Toast Notifications**: Success/error feedback via Sonner
 * - **Error State**: Graceful display when built-in templates fail to load
 * - **Empty State**: Settings icon + guidance when no templates available
 *
 * ## Props
 *
 * - `routerId` (required): Router ID for template apply/rollback API calls
 * - `currentRules` (optional): Existing firewall rules for "Create Template" feature
 *
 * ## Usage
 *
 * ```tsx
 * import { TemplatesPage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <TemplatesPage routerId="192.168.88.1" currentRules={rules} />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/Pages/TemplatesPage',
  component: TemplatesPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main page for firewall template management. Browse built-in and custom templates, apply them with variable configuration, save current rules as templates, and import/export template files.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  tags: ['autodocs'],
  args: {
    routerId: '192.168.88.1',
    currentRules: [],
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof TemplatesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Empty State - No Templates
 *
 * No built-in templates loaded and no custom templates saved.
 * Shows the empty state with a Settings icon, heading, and context-aware description.
 * "Create Your First Template" button only appears if currentRules.length > 0.
 */
export const EmptyNoTemplates: Story = {
  args: {
    routerId: '192.168.88.1',
    currentRules: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no templates are available. Shows Settings icon with guidance. Without currentRules, only the Import button is shown in the header. The "Create Your First Template" CTA is hidden when there are no rules to save.',
      },
    },
    mockData: {
      builtInTemplates: [],
      customTemplates: [],
      isLoading: false,
    },
  },
};

/**
 * Empty State - With Current Rules
 *
 * No templates loaded but current firewall rules are available.
 * The "Create Template" button appears in the header and the "Create Your First Template"
 * CTA appears in the empty state body.
 */
export const EmptyWithCurrentRules: Story = {
  args: {
    routerId: '192.168.88.1',
    currentRules: mockCurrentRules,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with existing firewall rules. Both the header "Create Template" button and the empty state "Create Your First Template" CTA are visible. Clicking either opens the SaveTemplateDialog.',
      },
    },
    mockData: {
      builtInTemplates: [],
      customTemplates: [],
      isLoading: false,
    },
  },
};

/**
 * Browse Tab - With Built-In Templates
 *
 * Fully populated Browse tab with built-in templates: Basic Security, DDoS Protection,
 * and VoIP QoS. Shows the TemplateGallery with category/complexity filters and search.
 */
export const BrowseWithBuiltInTemplates: Story = {
  args: {
    routerId: '192.168.88.1',
    currentRules: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Browse tab with three built-in templates: Basic Security (Beginner), DDoS Protection (Advanced), and VoIP QoS (Intermediate). TemplateGallery shows category badges, complexity indicators, rule counts, and Apply buttons.',
      },
    },
    mockData: {
      builtInTemplates: [
        mockBasicSecurityTemplate,
        mockDDoSProtectionTemplate,
        mockVoIPQoSTemplate,
      ],
      customTemplates: [],
      isLoading: false,
    },
  },
};

/**
 * With Custom Templates - Export Button Visible
 *
 * Built-in and custom templates shown together. The "Export Custom (1)" button appears
 * in the header when customTemplates.length > 0.
 */
export const WithCustomTemplates: Story = {
  args: {
    routerId: '192.168.88.1',
    currentRules: mockCurrentRules,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Browse tab with both built-in and one custom template. The "Export Custom (1)" button appears in the header showing the count of custom templates. "Create Template" button also visible since currentRules is populated.',
      },
    },
    mockData: {
      builtInTemplates: [mockBasicSecurityTemplate, mockDDoSProtectionTemplate],
      customTemplates: [mockCustomTemplate],
      isLoading: false,
    },
  },
};
