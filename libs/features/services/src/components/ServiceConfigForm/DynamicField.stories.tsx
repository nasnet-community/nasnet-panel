/**
 * DynamicField Storybook Stories
 *
 * DynamicField selects the appropriate form input based on the ConfigSchemaField
 * `type` property. All variants require a React Hook Form context, supplied here
 * by a FormProvider decorator.
 *
 * Supported types:
 *   TEXT, EMAIL, URL, IP, PATH, TEXT_AREA, PASSWORD,
 *   NUMBER, PORT, TOGGLE, SELECT, MULTI_SELECT, TEXT_ARRAY
 */

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/react';

import { DynamicField } from './DynamicField';

// ---------------------------------------------------------------------------
// FormProvider decorator
// ---------------------------------------------------------------------------

/**
 * Wraps each story in a FormProvider so DynamicField can call useFormContext.
 * Default values are keyed by field name so every variant pre-populates nicely.
 */
function FormDecorator({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: Record<string, any> }) {
  const methods = useForm({ defaultValues, mode: 'onBlur' });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((d) => console.log('submitted', d))} className="space-y-4 max-w-md p-4">
        {children}
      </form>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// Mock ConfigSchemaField factory
// ---------------------------------------------------------------------------

type FieldType =
  | 'TEXT' | 'EMAIL' | 'URL' | 'IP' | 'PATH'
  | 'TEXT_AREA' | 'PASSWORD'
  | 'NUMBER' | 'PORT'
  | 'TOGGLE'
  | 'SELECT' | 'MULTI_SELECT'
  | 'TEXT_ARRAY';

function makeField(overrides: Partial<{
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  description: string;
  placeholder: string;
  sensitive: boolean;
  group: string;
  min: number;
  max: number;
  options: Array<{ label: string; value: string }>;
  defaultValue: any;
}>): any {
  return {
    name: 'fieldName',
    label: 'Field Label',
    type: 'TEXT' as FieldType,
    required: false,
    description: undefined,
    placeholder: undefined,
    sensitive: false,
    group: 'General',
    min: undefined,
    max: undefined,
    options: [],
    defaultValue: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DynamicField> = {
  title: 'Features/Services/ServiceConfigForm/DynamicField',
  component: DynamicField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dynamic field renderer that maps a `ConfigSchemaField.type` to the ' +
          'appropriate input component (TextField, TextArea, PasswordField, NumberField, ' +
          'Switch, Select, MultiSelect, ArrayField). Requires a React Hook Form ' +
          '`FormProvider` ancestor.',
      },
    },
  },
  decorators: [
    (Story) => (
      <FormDecorator
        defaultValues={{
          socksPort: 9050,
          relayEmail: 'admin@example.com',
          exitPolicy: 'reject *:*',
          configPath: '/etc/tor/torrc',
          configUrl: 'https://example.com/config',
          bindIp: '10.0.0.1',
          nodeDescription: 'My exit relay — running for privacy',
          adminPassword: '',
          isEnabled: false,
          exitMode: '',
          allowedCountries: [],
          dnsServers: [],
        }}
      >
        <Story />
      </FormDecorator>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DynamicField>;

// ---------------------------------------------------------------------------
// Stories — one per supported field type
// ---------------------------------------------------------------------------

/**
 * TEXT field — generic single-line text input.
 */
export const TextInput: Story = {
  args: {
    field: makeField({
      name: 'bindIp',
      label: 'Bind IP Address',
      type: 'TEXT',
      placeholder: '0.0.0.0',
      description: 'IP address the daemon will listen on.',
    }),
    form: undefined as any, // provided by FormProvider inside the component
  },
};

/**
 * EMAIL field — uses type="email" for keyboard hint on mobile.
 */
export const EmailInput: Story = {
  args: {
    field: makeField({
      name: 'relayEmail',
      label: 'Operator Email',
      type: 'EMAIL',
      required: true,
      placeholder: 'operator@example.com',
      description: 'Contact email published in the relay descriptor.',
    }),
  },
};

/**
 * URL field — intended for remote config or API endpoints.
 */
export const UrlInput: Story = {
  args: {
    field: makeField({
      name: 'configUrl',
      label: 'Remote Config URL',
      type: 'URL',
      placeholder: 'https://config.example.com/settings.json',
      description: 'Optional remote configuration source.',
    }),
  },
};

/**
 * PATH field — file path on the router filesystem.
 */
export const PathInput: Story = {
  args: {
    field: makeField({
      name: 'configPath',
      label: 'Config File Path',
      type: 'PATH',
      placeholder: '/etc/tor/torrc',
      description: 'Absolute path to the service configuration file.',
    }),
  },
};

/**
 * TEXT_AREA field — multi-line free-form text (e.g., exit policy).
 */
export const TextAreaInput: Story = {
  args: {
    field: makeField({
      name: 'exitPolicy',
      label: 'Exit Policy',
      type: 'TEXT_AREA',
      placeholder: 'reject *:*',
      description: 'One rule per line. Use "accept" or "reject" followed by address:port.',
    }),
  },
};

/**
 * PASSWORD field — masked input with reveal toggle.
 */
export const PasswordInput: Story = {
  args: {
    field: makeField({
      name: 'adminPassword',
      label: 'Admin Password',
      type: 'PASSWORD',
      required: true,
      description: 'Password for the service web interface.',
    }),
  },
};

/**
 * NUMBER field with min/max constraints.
 */
export const NumberInput: Story = {
  args: {
    field: makeField({
      name: 'socksPort',
      label: 'SOCKS Port',
      type: 'PORT',
      required: true,
      min: 1024,
      max: 65535,
      description: 'TCP port the SOCKS5 proxy will listen on (1024–65535).',
    }),
  },
};

/**
 * TOGGLE field — boolean switch for feature flags.
 */
export const ToggleSwitch: Story = {
  args: {
    field: makeField({
      name: 'isEnabled',
      label: 'Enable IPv6',
      type: 'TOGGLE',
      description: 'Allow the service to bind on IPv6 addresses.',
    }),
  },
};

/**
 * SELECT field — single-choice dropdown.
 */
export const SelectDropdown: Story = {
  args: {
    field: makeField({
      name: 'exitMode',
      label: 'Exit Mode',
      type: 'SELECT',
      required: true,
      description: 'Controls whether this node acts as an exit relay.',
      options: [
        { label: 'Exit relay (full)', value: 'exit' },
        { label: 'Middle relay (no exit)', value: 'middle' },
        { label: 'Bridge relay (hidden)', value: 'bridge' },
      ],
    }),
  },
};

/**
 * MULTI_SELECT field — multiple choice checkboxes.
 */
export const MultiSelectField: Story = {
  args: {
    field: makeField({
      name: 'allowedCountries',
      label: 'Allowed Exit Countries',
      type: 'MULTI_SELECT',
      description: 'Restrict exit traffic to selected countries (ISO 3166-1 alpha-2).',
      options: [
        { label: 'United States (US)', value: 'US' },
        { label: 'Germany (DE)', value: 'DE' },
        { label: 'Netherlands (NL)', value: 'NL' },
        { label: 'Sweden (SE)', value: 'SE' },
        { label: 'Finland (FI)', value: 'FI' },
      ],
    }),
  },
};

/**
 * TEXT_ARRAY field — dynamic list of text entries.
 */
export const TextArrayField: Story = {
  args: {
    field: makeField({
      name: 'dnsServers',
      label: 'DNS Servers',
      type: 'TEXT_ARRAY',
      description: 'Add one IP address per entry. Used for DNS-over-TCP resolution.',
      placeholder: '8.8.8.8',
    }),
  },
};

/**
 * Required field — shows the asterisk and aria-label for screen readers.
 */
export const RequiredField: Story = {
  args: {
    field: makeField({
      name: 'bindIp',
      label: 'Bind IP Address',
      type: 'TEXT',
      required: true,
      placeholder: '0.0.0.0',
    }),
  },
};

/**
 * Disabled field — entire input is read-only (readOnly prop passed as disabled).
 */
export const DisabledField: Story = {
  args: {
    field: makeField({
      name: 'bindIp',
      label: 'Bind IP Address (read-only)',
      type: 'TEXT',
      placeholder: '0.0.0.0',
    }),
    disabled: true,
  },
};
