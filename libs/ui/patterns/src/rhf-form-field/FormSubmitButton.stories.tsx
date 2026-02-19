/**
 * FormSubmitButton Stories
 *
 * Storybook stories for the FormSubmitButton component.
 * Demonstrates idle, submitting, disabled, and disableOnInvalid states
 * within real React Hook Form contexts.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Input } from '@nasnet/ui/primitives';

import { FormSubmitButton } from './FormSubmitButton';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const simpleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
});

type SimpleValues = z.infer<typeof simpleSchema>;

/** Minimal form wrapper that provides FormContext and an optional submit handler. */
function FormWrapper({
  children,
  defaultValues = { name: '' },
  onSubmit = (d: SimpleValues) => console.log('submitted', d),
  mode = 'onBlur' as const,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<SimpleValues>;
  onSubmit?: (d: SimpleValues) => void | Promise<void>;
  mode?: 'onBlur' | 'onChange' | 'onSubmit';
}) {
  const methods = useForm<SimpleValues>({
    defaultValues,
    resolver: zodResolver(simpleSchema),
    mode,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 w-72">
        {children}
      </form>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

/**
 * FormSubmitButton
 *
 * A submit button that integrates with React Hook Form's context. It reads
 * `formState.isSubmitting` and `formState.isValid` from the nearest
 * `<FormProvider>` to automatically manage its disabled state and show a
 * spinner during async submission.
 *
 * ## Behaviour
 *
 * | Condition | Button state |
 * |-----------|-------------|
 * | Normal idle | Enabled, renders `children` |
 * | `isSubmitting === true` | Disabled, shows Loader2 spinner + `loadingText` |
 * | `disabled` prop is `true` | Disabled unconditionally |
 * | `disableOnInvalid && !isValid` | Disabled when form has validation errors |
 *
 * ## Usage
 *
 * ```tsx
 * <FormProvider {...methods}>
 *   <form onSubmit={methods.handleSubmit(onSubmit)}>
 *     <FormSubmitButton loadingText="Saving..." disableOnInvalid>
 *       Save Configuration
 *     </FormSubmitButton>
 *   </form>
 * </FormProvider>
 * ```
 *
 * Must be rendered inside a `<FormProvider>` tree.
 */
const meta: Meta<typeof FormSubmitButton> = {
  title: 'Patterns/Forms/FormSubmitButton',
  component: FormSubmitButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Submit button with automatic React Hook Form integration. Reads form submission and validity state from context to manage disabled state and loading indicator.',
      },
    },
  },
  argTypes: {
    loadingText: {
      control: 'text',
      description: 'Text displayed alongside the spinner while isSubmitting is true',
    },
    disableOnInvalid: {
      control: 'boolean',
      description: 'Disable the button when the form has unresolved validation errors',
    },
    disabled: {
      control: 'boolean',
      description: 'Unconditionally disable the button regardless of form state',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual variant forwarded to the underlying Button primitive',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size variant forwarded to the underlying Button primitive',
    },
  },
  decorators: [
    (Story) => (
      <FormWrapper>
        <Story />
      </FormWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormSubmitButton>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default
 *
 * Idle submit button inside a valid form. The button is enabled and renders
 * its children label with no spinner.
 */
export const Default: Story = {
  args: {
    children: 'Save Changes',
    loadingText: 'Saving...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default idle state. The button is enabled and shows the children label.',
      },
    },
  },
};

/**
 * With Custom Loading Text
 *
 * Demonstrates that `loadingText` replaces the spinner label during submission.
 * Trigger submission in the canvas to see the transition.
 */
export const CustomLoadingText: Story = {
  args: {
    children: 'Apply Configuration',
    loadingText: 'Applying to router...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom loadingText shown during async submission. Submit the form in the canvas to observe the transition.',
      },
    },
  },
};

/**
 * Disabled on Invalid
 *
 * The button is disabled until all form fields satisfy the Zod schema.
 * Type at least 3 characters in the name field to enable the button.
 */
export const DisabledOnInvalid: Story = {
  render: () => (
    <FormWrapper mode="onChange">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name (min 3 chars)</label>
        {/* Plain input connected via RHF register pattern shown inline */}
        <p className="text-xs text-muted-foreground">
          Type at least 3 characters to enable the submit button.
        </p>
      </div>
      <FormSubmitButton disableOnInvalid>
        Save (requires valid form)
      </FormSubmitButton>
    </FormWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'disableOnInvalid=true keeps the button disabled while the form has validation errors. The button becomes enabled once all fields are valid.',
      },
    },
  },
};

/**
 * Explicitly Disabled
 *
 * The `disabled` prop is set to true unconditionally, regardless of form state.
 * Useful for guards based on external conditions (e.g., missing permissions).
 */
export const ExplicitlyDisabled: Story = {
  args: {
    children: 'Save Changes',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled unconditionally via the disabled prop. Used when save is blocked by an external condition.',
      },
    },
  },
};

/**
 * Destructive Variant
 *
 * Submit button styled with the destructive variant for dangerous operations
 * such as factory reset or bulk deletion.
 */
export const DestructiveVariant: Story = {
  args: {
    children: 'Reset to Factory Defaults',
    loadingText: 'Resetting...',
    variant: 'destructive',
  },
  parameters: {
    docs: {
      description: {
        story: 'Destructive variant used for dangerous submit actions such as factory reset or bulk delete.',
      },
    },
  },
};

/**
 * All Sizes
 *
 * Renders the button at each available size for visual comparison.
 */
export const AllSizes: Story = {
  render: () => (
    <FormWrapper>
      <div className="flex flex-col gap-3 items-start">
        <FormSubmitButton size="sm">Small</FormSubmitButton>
        <FormSubmitButton size="default">Default</FormSubmitButton>
        <FormSubmitButton size="lg">Large</FormSubmitButton>
      </div>
    </FormWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all three size variants (sm, default, lg).',
      },
    },
  },
};
