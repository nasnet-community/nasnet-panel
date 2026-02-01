/**
 * RHFFormField Stories
 *
 * Storybook stories for React Hook Form integrated field components.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@nasnet/ui/primitives';

import { FormArrayField } from './FormArrayField';
import { FormFieldDescription } from './FormFieldDescription';
import { FormFieldError } from './FormFieldError';
import { FormSubmitButton } from './FormSubmitButton';
import { RHFFormField } from './RHFFormField';

import type { Meta, StoryObj } from '@storybook/react';

// Wrapper component to provide form context
function FormWrapper({
  children,
  onSubmit = (data) => console.log('Form submitted:', data),
}: {
  children: React.ReactNode;
  onSubmit?: (data: Record<string, unknown>) => void;
}) {
  const schema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

  const methods = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: 'John',
      lastName: 'Doe',
      fullName: '',
    },
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        {children}
      </form>
    </FormProvider>
  );
}

const meta: Meta<typeof RHFFormField> = {
  title: 'Patterns/Forms/RHFFormField',
  component: RHFFormField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'React Hook Form integrated field component with automatic validation, error handling, and accessibility support.',
      },
    },
  },
  decorators: [
    (Story) => (
      <FormWrapper>
        <Story />
        <FormSubmitButton className="mt-4">Submit</FormSubmitButton>
      </FormWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RHFFormField>;

/**
 * Basic text field
 */
export const Default: Story = {
  args: {
    name: 'username',
    label: 'Username',
    placeholder: 'Enter your username',
  },
};

/**
 * Required field with indicator
 */
export const Required: Story = {
  args: {
    name: 'email',
    label: 'Email Address',
    required: true,
    type: 'email',
    placeholder: 'you@example.com',
  },
};

/**
 * With description text
 */
export const WithDescription: Story = {
  args: {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    description: 'Must be at least 8 characters with one uppercase and one number',
    placeholder: 'Enter password',
  },
};

/**
 * Readonly mode
 */
export const ReadonlyMode: Story = {
  args: {
    name: 'firstName',
    label: 'First Name',
    mode: 'readonly',
  },
};

/**
 * Computed field mode
 */
export const ComputedMode: Story = {
  render: () => (
    <FormWrapper>
      <RHFFormField name="firstName" label="First Name" />
      <RHFFormField name="lastName" label="Last Name" />
      <RHFFormField
        name="fullName"
        label="Full Name"
        mode="computed"
        computeFn={(values) =>
          `${values.firstName || ''} ${values.lastName || ''}`.trim()
        }
        description="Automatically computed from first and last name"
      />
    </FormWrapper>
  ),
};

// ===== FormFieldError Stories =====

/**
 * Standalone error message
 */
export const ErrorMessage: StoryObj<typeof FormFieldError> = {
  render: () => (
    <FormFieldError message="This field is required" />
  ),
};

/**
 * No error (renders nothing)
 */
export const NoError: StoryObj<typeof FormFieldError> = {
  render: () => (
    <div className="p-4 border rounded">
      <p className="text-sm text-muted-foreground mb-2">FormFieldError with no message:</p>
      <FormFieldError />
      <p className="text-sm text-muted-foreground mt-2">(Nothing renders above)</p>
    </div>
  ),
};

// ===== FormFieldDescription Stories =====

/**
 * Help text description
 */
export const DescriptionText: StoryObj<typeof FormFieldDescription> = {
  render: () => (
    <FormFieldDescription>
      Enter your preferred username. This will be visible to other users.
    </FormFieldDescription>
  ),
};

// ===== FormSubmitButton Stories =====

/**
 * Submit button states
 */
export const SubmitButtonStates: StoryObj<typeof FormSubmitButton> = {
  render: () => (
    <div className="space-y-4">
      <FormWrapper>
        <p className="text-sm text-muted-foreground mb-2">Normal state:</p>
        <FormSubmitButton>Save Changes</FormSubmitButton>
      </FormWrapper>

      <FormWrapper>
        <p className="text-sm text-muted-foreground mb-2">With loading text:</p>
        <FormSubmitButton loadingText="Saving...">Save Changes</FormSubmitButton>
      </FormWrapper>
    </div>
  ),
};

// ===== FormArrayField Stories =====

/**
 * Dynamic array field for peers
 */
export const ArrayField: StoryObj<typeof FormArrayField> = {
  render: () => {
    const schema = z.object({
      peers: z.array(
        z.object({
          publicKey: z.string().min(1, 'Public key required'),
          allowedIPs: z.string().min(1, 'Allowed IPs required'),
        })
      ),
    });

    function ArrayFieldDemo() {
      const methods = useForm({
        defaultValues: {
          peers: [{ publicKey: '', allowedIPs: '' }],
        },
        resolver: zodResolver(schema),
      });

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((data) => console.log(data))} className="space-y-4">
            <FormArrayField
              name="peers"
              label="VPN Peers"
              description="Add WireGuard peers for this interface"
              defaultItem={{ publicKey: '', allowedIPs: '' }}
              maxItems={5}
              minItems={1}
              addButtonText="Add Peer"
              renderItem={({ index, remove, canRemove, fieldPrefix }) => (
                <div className="space-y-3">
                  <RHFFormField
                    name={`${fieldPrefix}.publicKey`}
                    label="Public Key"
                    placeholder="Base64 encoded public key"
                    required
                  />
                  <RHFFormField
                    name={`${fieldPrefix}.allowedIPs`}
                    label="Allowed IPs"
                    placeholder="10.0.0.2/32"
                    required
                  />
                  {canRemove && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={remove}
                      className="mt-2"
                    >
                      Remove Peer
                    </Button>
                  )}
                </div>
              )}
            />
            <FormSubmitButton>Save Configuration</FormSubmitButton>
          </form>
        </FormProvider>
      );
    }

    return <ArrayFieldDemo />;
  },
};

/**
 * Complete form example
 */
export const CompleteForm: Story = {
  render: () => (
    <FormWrapper onSubmit={(data) => alert(JSON.stringify(data, null, 2))}>
      <RHFFormField
        name="username"
        label="Username"
        required
        placeholder="Choose a username"
        description="Alphanumeric characters only"
      />
      <RHFFormField
        name="email"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
      />
      <RHFFormField
        name="password"
        label="Password"
        type="password"
        required
        description="Minimum 8 characters"
      />
      <RHFFormField
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        required
      />
      <FormSubmitButton>Create Account</FormSubmitButton>
    </FormWrapper>
  ),
};
