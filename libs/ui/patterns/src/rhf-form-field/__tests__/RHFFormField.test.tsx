/**
 * Tests for RHFFormField components
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, type FieldValues } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

import { FormFieldDescription } from '../FormFieldDescription';
import { FormFieldError } from '../FormFieldError';
import { FormSubmitButton } from '../FormSubmitButton';
import { RHFFormField } from '../RHFFormField';

// Wrapper to provide form context
function FormWrapper({
  children,
  defaultValues = {},
  schema,
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  schema?: z.ZodSchema;
  onSubmit?: (data: unknown) => void;
}) {
  const methods = useForm({
    defaultValues,
    resolver: schema ? zodResolver(schema as any) : undefined,
    mode: 'onBlur',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}

describe('FormFieldError', () => {
  it('renders error message with icon', () => {
    render(<FormFieldError message="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('returns null when no message', () => {
    const { container } = render(<FormFieldError />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FormFieldDescription', () => {
  it('renders description text', () => {
    render(<FormFieldDescription>Help text here</FormFieldDescription>);
    expect(screen.getByText('Help text here')).toBeInTheDocument();
  });
});

describe('RHFFormField', () => {
  it('renders label and input', () => {
    render(
      <FormWrapper defaultValues={{ name: '' }}>
        <RHFFormField name="name" label="Username" />
      </FormWrapper>
    );

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <FormWrapper defaultValues={{ name: '' }}>
        <RHFFormField name="name" label="Username" required />
      </FormWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(
      <FormWrapper defaultValues={{ name: '' }}>
        <RHFFormField
          name="name"
          label="Username"
          description="Enter your preferred username"
        />
      </FormWrapper>
    );

    expect(screen.getByText('Enter your preferred username')).toBeInTheDocument();
  });

  it('displays validation error on blur', async () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
    });

    render(
      <FormWrapper defaultValues={{ name: '' }} schema={schema}>
        <RHFFormField name="name" label="Name" />
      </FormWrapper>
    );

    const input = screen.getByLabelText('Name');

    // Focus and blur to trigger validation
    await userEvent.click(input);
    await userEvent.tab();

    // Wait for error to appear
    expect(await screen.findByRole('alert')).toHaveTextContent('Name is required');
  });

  describe('Field Modes', () => {
    it('renders editable field by default', () => {
      render(
        <FormWrapper defaultValues={{ name: 'test' }}>
          <RHFFormField name="name" label="Name" />
        </FormWrapper>
      );

      const input = screen.getByLabelText('Name');
      expect(input).not.toHaveAttribute('readonly');
      expect(input).not.toBeDisabled();
    });

    it('renders readonly field when mode is readonly', () => {
      render(
        <FormWrapper defaultValues={{ name: 'test' }}>
          <RHFFormField name="name" label="Name" mode="readonly" />
        </FormWrapper>
      );

      const input = screen.getByLabelText('Name');
      expect(input).toHaveAttribute('readonly');
      expect(input).toBeDisabled();
    });

    it('renders nothing when mode is hidden', () => {
      const { container } = render(
        <FormWrapper defaultValues={{ name: 'test' }}>
          <RHFFormField name="name" label="Name" mode="hidden" />
        </FormWrapper>
      );

      // The form wrapper adds a form element, but the field should not be rendered
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    it('renders computed field with computeFn value', () => {
      render(
        <FormWrapper defaultValues={{ firstName: 'John', lastName: 'Doe' }}>
          <RHFFormField
            name="fullName"
            label="Full Name"
            mode="computed"
            computeFn={(values) =>
              `${values.firstName || ''} ${values.lastName || ''}`.trim()
            }
          />
        </FormWrapper>
      );

      const input = screen.getByLabelText('Full Name');
      expect(input).toHaveValue('John Doe');
      expect(input).toHaveAttribute('readonly');
    });

    it('computed field has correct styling', () => {
      render(
        <FormWrapper defaultValues={{ a: 1, b: 2 }}>
          <RHFFormField
            name="sum"
            label="Sum"
            mode="computed"
            computeFn={(values) => (values.a || 0) + (values.b || 0)}
          />
        </FormWrapper>
      );

      const input = screen.getByLabelText('Sum');
      expect(input).toHaveClass('italic');
    });
  });
});

describe('FormSubmitButton', () => {
  it('renders submit button', () => {
    render(
      <FormWrapper>
        <FormSubmitButton>Submit</FormSubmitButton>
      </FormWrapper>
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('has type submit', () => {
    render(
      <FormWrapper>
        <FormSubmitButton>Submit</FormSubmitButton>
      </FormWrapper>
    );

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
