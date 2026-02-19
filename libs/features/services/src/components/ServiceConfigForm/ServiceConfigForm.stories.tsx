/**
 * ServiceConfigForm Storybook Stories
 *
 * ServiceConfigForm is a headless + platform presenter component:
 * - Desktop/Tablet (≥640px): tabbed card layout with 2-column field grid
 * - Mobile (<640px): accordion card layout with sticky bottom submit button
 *
 * The component accepts a `formState` prop that mirrors the return value of
 * `useServiceConfigForm`. Stories supply a fully-typed mock formState so
 * the form renders without a live GraphQL backend.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { ServiceConfigForm } from './ServiceConfigForm';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

// ---------------------------------------------------------------------------
// Mock ConfigSchemaField + ConfigSchema types (mirrors generated GQL types)
// ---------------------------------------------------------------------------

type FieldType =
  | 'TEXT' | 'EMAIL' | 'URL' | 'IP' | 'PATH'
  | 'TEXT_AREA' | 'PASSWORD'
  | 'NUMBER' | 'PORT'
  | 'TOGGLE'
  | 'SELECT' | 'MULTI_SELECT'
  | 'TEXT_ARRAY';

interface MockField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  description?: string;
  placeholder?: string;
  sensitive?: boolean;
  group?: string;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: any;
}

// ---------------------------------------------------------------------------
// Fake form state builder
// ---------------------------------------------------------------------------

/**
 * Builds a UseServiceConfigFormReturn-compatible object backed by a real
 * react-hook-form instance. This lets Storybook render the form with
 * genuine onChange / validation behaviour without a GraphQL server.
 */
function useMockFormState(
  fields: MockField[],
  options: {
    loadingSchema?: boolean;
    loadingConfig?: boolean;
    isSubmitting?: boolean;
    isValidating?: boolean;
    noSchema?: boolean;
    onSubmit?: () => Promise<void>;
  } = {}
): UseServiceConfigFormReturn {
  const {
    loadingSchema = false,
    loadingConfig = false,
    isSubmitting = false,
    isValidating = false,
    noSchema = false,
    onSubmit = async () => { console.log('Configuration submitted'); },
  } = options;

  const defaultValues = Object.fromEntries(
    fields.map((f) => {
      const v =
        f.defaultValue !== undefined
          ? f.defaultValue
          : f.type === 'TOGGLE'
          ? false
          : f.type === 'NUMBER' || f.type === 'PORT'
          ? 0
          : f.type === 'MULTI_SELECT' || f.type === 'TEXT_ARRAY'
          ? []
          : '';
      return [f.name, v];
    })
  );

  // Real RHF instance so field rendering actually works
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const form: UseFormReturn<any> = useForm({ defaultValues, mode: 'onBlur' });

  const schema = noSchema
    ? undefined
    : {
        serviceType: 'mock-service',
        version: '1.0.0',
        fields: fields as any,
      };

  return {
    schema: schema as any,
    form,
    visibleFields: fields as any[],
    handleSubmit: onSubmit,
    isSubmitting,
    isValidating,
    loading: { schema: loadingSchema, config: loadingConfig },
    errors:  { schema: undefined, config: undefined },
    validate: async () => true,
    refetch: fn(),
  };
}

// ---------------------------------------------------------------------------
// Shared field sets
// ---------------------------------------------------------------------------

const torFields: MockField[] = [
  {
    name: 'socksPort',
    label: 'SOCKS Port',
    type: 'PORT',
    required: true,
    group: 'Network',
    min: 1024,
    max: 65535,
    defaultValue: 9050,
    description: 'Port the Tor SOCKS5 proxy listens on.',
  },
  {
    name: 'controlPort',
    label: 'Control Port',
    type: 'PORT',
    required: false,
    group: 'Network',
    min: 1024,
    max: 65535,
    defaultValue: 9051,
    description: 'Tor controller port (leave blank to disable).',
  },
  {
    name: 'exitPolicy',
    label: 'Exit Policy',
    type: 'TEXT_AREA',
    required: false,
    group: 'Relay',
    placeholder: 'reject *:*',
    defaultValue: 'reject *:*',
    description: 'One rule per line. Controls which traffic may exit through this node.',
  },
  {
    name: 'relayMode',
    label: 'Relay Mode',
    type: 'SELECT',
    required: true,
    group: 'Relay',
    defaultValue: 'client',
    description: 'Determines the role this Tor instance plays in the network.',
    options: [
      { label: 'Client only', value: 'client' },
      { label: 'Middle relay',  value: 'middle' },
      { label: 'Exit relay',    value: 'exit' },
      { label: 'Bridge',        value: 'bridge' },
    ],
  },
  {
    name: 'enableLogging',
    label: 'Enable Verbose Logging',
    type: 'TOGGLE',
    group: 'Advanced',
    defaultValue: false,
    description: 'Write DEBUG-level messages to the log buffer.',
  },
  {
    name: 'dnsServers',
    label: 'DNS Servers',
    type: 'TEXT_ARRAY',
    group: 'Advanced',
    description: 'Custom upstream DNS resolvers. One IP per entry.',
    defaultValue: [],
  },
];

const adguardFields: MockField[] = [
  {
    name: 'listenIp',
    label: 'Listen IP',
    type: 'IP',
    required: true,
    group: 'Network',
    defaultValue: '0.0.0.0',
    description: 'IP address AdGuard Home binds to.',
  },
  {
    name: 'dnsPort',
    label: 'DNS Port',
    type: 'PORT',
    required: true,
    group: 'Network',
    defaultValue: 53,
    description: 'UDP/TCP port for DNS queries.',
  },
  {
    name: 'webPort',
    label: 'Web Interface Port',
    type: 'PORT',
    required: true,
    group: 'Network',
    defaultValue: 3000,
    description: 'HTTP port for the AdGuard Home dashboard.',
  },
  {
    name: 'adminPassword',
    label: 'Admin Password',
    type: 'PASSWORD',
    required: true,
    group: 'Authentication',
    description: 'Password for the web dashboard login.',
  },
  {
    name: 'safeBrowsing',
    label: 'Enable Safe Browsing',
    type: 'TOGGLE',
    group: 'Filtering',
    defaultValue: true,
    description: 'Block known phishing and malware domains.',
  },
  {
    name: 'blocklists',
    label: 'Blocklist URLs',
    type: 'TEXT_ARRAY',
    group: 'Filtering',
    description: 'Remote filter list URLs (one per entry).',
    defaultValue: ['https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt'],
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ServiceConfigForm> = {
  title: 'Features/Services/ServiceConfigForm/ServiceConfigForm',
  component: ServiceConfigForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive configuration form for installed service instances. ' +
          'Accepts a `formState` object from `useServiceConfigForm` and renders ' +
          'the appropriate platform presenter:\n\n' +
          '- **Desktop/Tablet (≥640px):** Card with tabs (one per field group), ' +
          '2-column grid, inline Save + Reset buttons.\n' +
          '- **Mobile (<640px):** Accordion-style section cards, single-column layout, ' +
          'sticky bottom Save button.\n\n' +
          'Field types are rendered by `DynamicField` which delegates to ' +
          'TextField, NumberField, PasswordField, Select, MultiSelect, ArrayField, ' +
          'or Switch.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceConfigForm>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Tor service configuration with two groups (Network + Relay + Advanced tabs).
 * Demonstrates the multi-group tabbed desktop layout.
 */
export const TorConfiguration: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState(torFields);
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="Tor Configuration"
          description="Configure your Tor service instance. Changes take effect on next restart."
        />
      );
    }
    return <Inner />;
  },
};

/**
 * AdGuard Home configuration demonstrating PASSWORD and TEXT_ARRAY field types.
 */
export const AdGuardConfiguration: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState(adguardFields);
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="AdGuard Home Configuration"
          description="DNS filtering and ad-blocking settings."
        />
      );
    }
    return <Inner />;
  },
};

/**
 * Loading state — schema is still being fetched from the backend.
 * Desktop presenter shows a centered spinner inside the Card.
 */
export const LoadingSchema: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState([], { loadingSchema: true });
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="Loading..."
        />
      );
    }
    return <Inner />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shown while the configuration schema is being fetched from the router.',
      },
    },
  },
};

/**
 * Empty schema — the backend returned no schema for this service type.
 * Desktop presenter renders the "No configuration schema available" fallback.
 */
export const NoSchema: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState([], { noSchema: true });
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="Service Configuration"
        />
      );
    }
    return <Inner />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Fallback state when the backend returns no schema for this service type.',
      },
    },
  },
};

/**
 * Read-only mode — all fields are disabled and the action buttons are hidden.
 * Useful for auditing or viewing config without risk of accidental changes.
 */
export const ReadOnly: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState(torFields);
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="Tor Configuration (Read-Only)"
          description="View-only mode. No changes can be saved."
          readOnly
        />
      );
    }
    return <Inner />;
  },
  parameters: {
    docs: {
      description: {
        story: 'All inputs are disabled and the Save / Reset footer is hidden.',
      },
    },
  },
};

/**
 * Submitting state — save button shows spinner while the mutation is in-flight.
 */
export const Submitting: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState(torFields, { isSubmitting: true });
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="Tor Configuration"
          description="Applying your changes..."
        />
      );
    }
    return <Inner />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Spinner state on the Save button while the mutation is awaiting a router response.',
      },
    },
  },
};

/**
 * Mobile viewport — forces the mobile accordion layout with sticky bottom button.
 */
export const MobileLayout: Story = {
  render: (args) => {
    function Inner() {
      const formState = useMockFormState(torFields);
      return (
        <ServiceConfigForm
          {...args}
          formState={formState}
          title="Tor Configuration"
        />
      );
    }
    return <Inner />;
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile presenter: accordion cards (one per field group), full-width inputs, ' +
          '44px touch targets, sticky bottom Save button.',
      },
    },
  },
};
