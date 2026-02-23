import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { DynamicField } from './DynamicField';
import type { ConfigSchemaField } from '@nasnet/api-client/generated';

// Wrapper component that provides React Hook Form context
function TestWrapper({ field, defaultValue }: { field: ConfigSchemaField; defaultValue?: any }) {
  const form = useForm({
    defaultValues: {
      [field.name]: defaultValue,
    },
  });

  return (
    <FormProvider {...form}>
      <form>
        <DynamicField field={field} form={form} />
      </form>
    </FormProvider>
  );
}

describe('DynamicField', () => {
  describe('Field Rendering', () => {
    it('should render TEXT field type', () => {
      const field: ConfigSchemaField = {
        name: 'username',
        type: 'TEXT',
        label: 'Username',
        required: true,
        description: 'Enter your username',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
      expect(screen.getByText('Enter your username')).toBeInTheDocument();
    });

    it('should render PASSWORD field type', () => {
      const field: ConfigSchemaField = {
        name: 'password',
        type: 'PASSWORD',
        label: 'Password',
        required: true,
        description: 'Enter password',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: true,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    });

    it('should render NUMBER field type', () => {
      const field: ConfigSchemaField = {
        name: 'workers',
        type: 'NUMBER',
        label: 'Workers',
        required: true,
        description: 'Number of workers',
        defaultValue: null,
        options: null,
        min: 1,
        max: 10,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} defaultValue={5} />);

      expect(screen.getByLabelText(/Workers/)).toBeInTheDocument();
    });

    it('should render PORT field type', () => {
      const field: ConfigSchemaField = {
        name: 'port',
        type: 'PORT',
        label: 'Port',
        required: true,
        description: 'Service port',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} defaultValue={8080} />);

      expect(screen.getByLabelText(/Port/)).toBeInTheDocument();
    });

    it('should render EMAIL field type', () => {
      const field: ConfigSchemaField = {
        name: 'email',
        type: 'EMAIL',
        label: 'Email Address',
        required: true,
        description: 'Contact email',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      const input = screen.getByLabelText(/Email Address/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render URL field type', () => {
      const field: ConfigSchemaField = {
        name: 'webhook_url',
        type: 'URL',
        label: 'Webhook URL',
        required: false,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByLabelText(/Webhook URL/)).toBeInTheDocument();
    });

    it('should render IP field type', () => {
      const field: ConfigSchemaField = {
        name: 'bind_ip',
        type: 'IP',
        label: 'Bind IP',
        required: true,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByLabelText(/Bind IP/)).toBeInTheDocument();
    });

    it('should render TEXT_AREA field type', () => {
      const field: ConfigSchemaField = {
        name: 'notes',
        type: 'TEXT_AREA',
        label: 'Notes',
        required: false,
        description: 'Additional notes',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
    });

    it('should render TOGGLE field type', () => {
      const field: ConfigSchemaField = {
        name: 'enabled',
        type: 'TOGGLE',
        label: 'Enabled',
        required: false,
        description: 'Enable service',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} defaultValue={false} />);

      expect(screen.getByLabelText(/Enabled/)).toBeInTheDocument();
    });

    it('should render SELECT field type', () => {
      const field: ConfigSchemaField = {
        name: 'mode',
        type: 'SELECT',
        label: 'Mode',
        required: true,
        description: 'Operating mode',
        defaultValue: null,
        options: ['relay', 'bridge', 'exit'],
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      // SELECT uses Radix UI Select which has a button trigger, not a traditional select
      expect(screen.getByText('Mode')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render MULTI_SELECT field type', () => {
      const field: ConfigSchemaField = {
        name: 'protocols',
        type: 'MULTI_SELECT',
        label: 'Protocols',
        required: true,
        description: 'Supported protocols',
        defaultValue: null,
        options: ['http', 'https', 'socks5'],
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} defaultValue={[]} />);

      // MULTI_SELECT uses Popover with a button trigger
      expect(screen.getByText('Protocols')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render TEXT_ARRAY field type', () => {
      const field: ConfigSchemaField = {
        name: 'dns_servers',
        type: 'TEXT_ARRAY',
        label: 'DNS Servers',
        required: true,
        description: 'List of DNS servers',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} defaultValue={[]} />);

      // ArrayField is a composite component, so check for the label text instead
      expect(screen.getByText('DNS Servers')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter value and press Enter or click Add/)).toBeInTheDocument();
    });

    it('should render TEXT field type for file paths', () => {
      const field: ConfigSchemaField = {
        name: 'cert_path',
        type: 'TEXT',
        label: 'Certificate Path',
        required: false,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByLabelText(/Certificate Path/)).toBeInTheDocument();
    });
  });

  describe('Required Field Indicator', () => {
    it('should display asterisk (*) for required fields', () => {
      const field: ConfigSchemaField = {
        name: 'required_field',
        type: 'TEXT',
        label: 'Required Field',
        required: true,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      // Check for the asterisk
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not display asterisk for optional fields', () => {
      const field: ConfigSchemaField = {
        name: 'optional_field',
        type: 'TEXT',
        label: 'Optional Field',
        required: false,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      // Asterisk should not be present
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Field Description', () => {
    it('should display description when provided', () => {
      const field: ConfigSchemaField = {
        name: 'test_field',
        type: 'TEXT',
        label: 'Test Field',
        required: false,
        description: 'This is a helpful description',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
    });

    it('should not display description when null', () => {
      const field: ConfigSchemaField = {
        name: 'test_field',
        type: 'TEXT',
        label: 'Test Field',
        required: false,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      // No description should be rendered
      expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (WCAG AAA)', () => {
    it('should have proper ARIA label association', () => {
      const field: ConfigSchemaField = {
        name: 'accessible_field',
        type: 'TEXT',
        label: 'Accessible Field',
        required: true,
        description: 'Field description',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      const input = screen.getByLabelText(/Accessible Field/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAccessibleName();
    });

    it('should have accessible description', () => {
      const field: ConfigSchemaField = {
        name: 'test_field',
        type: 'NUMBER',
        label: 'Workers',
        required: true,
        description: 'Number of worker processes',
        defaultValue: null,
        options: null,
        min: 1,
        max: 10,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} defaultValue={5} />);

      expect(screen.getByText('Number of worker processes')).toBeInTheDocument();
    });

    it('should be keyboard accessible (all inputs should be focusable)', () => {
      const field: ConfigSchemaField = {
        name: 'keyboard_field',
        type: 'TEXT',
        label: 'Keyboard Accessible Field',
        required: false,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      render(<TestWrapper field={field} />);

      const input = screen.getByLabelText(/Keyboard Accessible Field/);
      expect(input).toBeInTheDocument();
      // Input should not have tabindex that prevents keyboard access
      expect(input).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Disabled State', () => {
    it('should disable field when disabled prop is true', () => {
      const field: ConfigSchemaField = {
        name: 'disabled_field',
        type: 'TEXT',
        label: 'Disabled Field',
        required: false,
        description: null,
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        placeholder: null,
        validateFunc: null,
        group: null,
        sensitive: false,
      };

      // Use TestWrapper with disabled prop
      function DisabledTestWrapper() {
        const form = useForm({
          defaultValues: {
            disabled_field: '',
          },
        });

        return (
          <FormProvider {...form}>
            <form>
              <DynamicField field={field} form={form} disabled={true} />
            </form>
          </FormProvider>
        );
      }

      render(<DisabledTestWrapper />);

      const input = screen.getByLabelText(/Disabled Field/);
      expect(input).toBeDisabled();
    });
  });
});
