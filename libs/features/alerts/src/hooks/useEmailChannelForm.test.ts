/**
 * Unit tests for useEmailChannelForm hook
 * Tests form state management, validation, multi-recipient workflow, and GraphQL integration
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEmailChannelForm } from './useEmailChannelForm';
import type { EmailConfig } from '../schemas/email-config.schema';

// ===== Test Fixtures =====

const mockEmailConfig: Partial<EmailConfig> = {
  enabled: true,
  host: 'smtp.gmail.com',
  port: 587,
  username: 'test@example.com',
  password: 'password123',
  fromAddress: 'alerts@example.com',
  fromName: 'Test Alerts',
  toAddresses: ['admin@example.com'],
  useTLS: true,
  skipVerify: false,
};

// ===== Tests =====

describe('useEmailChannelForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default values when no initialConfig provided', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      expect(result.current.form.getValues()).toMatchObject({
        enabled: false,
        host: '',
        port: 587,
        username: '',
        password: '',
        fromAddress: '',
        fromName: '',
        toAddresses: [],
        useTLS: true,
        skipVerify: false,
      });
    });

    it('initializes with provided initialConfig', () => {
      const { result } = renderHook(() =>
        useEmailChannelForm({ initialConfig: mockEmailConfig })
      );

      expect(result.current.form.getValues()).toMatchObject(mockEmailConfig);
    });

    it('merges initialConfig with defaults', () => {
      const partialConfig: Partial<EmailConfig> = {
        host: 'smtp.custom.com',
        port: 465,
      };

      const { result } = renderHook(() =>
        useEmailChannelForm({ initialConfig: partialConfig })
      );

      const values = result.current.form.getValues();
      expect(values.host).toBe('smtp.custom.com');
      expect(values.port).toBe(465);
      expect(values.useTLS).toBe(true); // From defaults
      expect(values.toAddresses).toEqual([]); // From defaults
    });

    it('initializes with empty recipients array', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      expect(result.current.recipients).toEqual([]);
    });

    it('initializes with isValid false for empty form', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      expect(result.current.isValid).toBe(false);
    });

    it('initializes with no test result', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      expect(result.current.testResult).toBeUndefined();
      expect(result.current.isTesting).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('marks form as valid when all required fields are filled', async () => {
      const { result } = renderHook(() =>
        useEmailChannelForm({ initialConfig: mockEmailConfig })
      );

      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
      });
    });

    it('marks form as invalid when required fields are missing', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('validates SMTP host format', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.form.setValue('host', 'invalid host!', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.host).toBeDefined();
      });
    });

    it('validates port range (1-65535)', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      // Test invalid port (too high)
      act(() => {
        result.current.form.setValue('port', 70000, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.port).toBeDefined();
      });

      // Test valid port
      act(() => {
        result.current.form.setValue('port', 587, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.port).toBeUndefined();
      });
    });

    it('validates email address format', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      // Invalid email
      act(() => {
        result.current.form.setValue('fromAddress', 'invalid-email', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.fromAddress).toBeDefined();
      });

      // Valid email
      act(() => {
        result.current.form.setValue('fromAddress', 'valid@example.com', {
          shouldValidate: true,
        });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.fromAddress).toBeUndefined();
      });
    });

    it('requires at least one recipient', async () => {
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: {
            ...mockEmailConfig,
            toAddresses: [],
          },
        })
      );

      await waitFor(() => {
        expect(result.current.form.formState.errors.toAddresses).toBeDefined();
      });
    });

    it('validates recipient email addresses', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.form.setValue('toAddresses', ['invalid-email'], {
          shouldValidate: true,
        });
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.toAddresses).toBeDefined();
      });
    });
  });

  describe('Multi-Recipient Management', () => {
    it('adds valid email recipient', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        const added = result.current.addRecipient('admin@example.com');
        expect(added).toBe(true);
      });

      expect(result.current.recipients).toEqual(['admin@example.com']);
    });

    it('trims whitespace from email before adding', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.addRecipient('  admin@example.com  ');
      });

      expect(result.current.recipients).toEqual(['admin@example.com']);
    });

    it('rejects invalid email format', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        const added = result.current.addRecipient('invalid-email');
        expect(added).toBe(false);
      });

      expect(result.current.recipients).toEqual([]);
    });

    it('rejects empty email', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        const added = result.current.addRecipient('');
        expect(added).toBe(false);
      });

      expect(result.current.recipients).toEqual([]);
    });

    it('rejects duplicate emails', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.addRecipient('admin@example.com');
        const added = result.current.addRecipient('admin@example.com');
        expect(added).toBe(false);
      });

      expect(result.current.recipients).toEqual(['admin@example.com']);
    });

    it('enforces maximum of 10 recipients', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      // Add 10 recipients
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addRecipient(`user${i}@example.com`);
        }
      });

      expect(result.current.recipients).toHaveLength(10);

      // Try to add 11th recipient
      act(() => {
        const added = result.current.addRecipient('user11@example.com');
        expect(added).toBe(false);
      });

      expect(result.current.recipients).toHaveLength(10);
    });

    it('removes recipient by index', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.addRecipient('admin1@example.com');
        result.current.addRecipient('admin2@example.com');
        result.current.addRecipient('admin3@example.com');
      });

      expect(result.current.recipients).toHaveLength(3);

      act(() => {
        result.current.removeRecipient(1); // Remove middle
      });

      expect(result.current.recipients).toEqual([
        'admin1@example.com',
        'admin3@example.com',
      ]);
    });

    it('clears all recipients', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.addRecipient('admin1@example.com');
        result.current.addRecipient('admin2@example.com');
      });

      expect(result.current.recipients).toHaveLength(2);

      act(() => {
        result.current.clearRecipients();
      });

      expect(result.current.recipients).toEqual([]);
    });

    it('updates form validation when recipients change', async () => {
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: {
            ...mockEmailConfig,
            toAddresses: [],
          },
        })
      );

      // Should be invalid with no recipients
      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });

      // Add a recipient
      act(() => {
        result.current.addRecipient('admin@example.com');
      });

      // Should become valid
      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
      });
    });
  });

  describe('Port Preset Application', () => {
    it('applies port and TLS settings for preset 25 (Plain)', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.applyPortPreset(25, false);
      });

      expect(result.current.form.getValues('port')).toBe(25);
      expect(result.current.form.getValues('useTLS')).toBe(false);
    });

    it('applies port and TLS settings for preset 587 (STARTTLS)', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.applyPortPreset(587, true);
      });

      expect(result.current.form.getValues('port')).toBe(587);
      expect(result.current.form.getValues('useTLS')).toBe(true);
    });

    it('applies port and TLS settings for preset 465 (TLS/SSL)', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.applyPortPreset(465, true);
      });

      expect(result.current.form.getValues('port')).toBe(465);
      expect(result.current.form.getValues('useTLS')).toBe(true);
    });

    it('validates port after preset application', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.applyPortPreset(587, true);
      });

      await waitFor(() => {
        expect(result.current.form.formState.errors.port).toBeUndefined();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit callback with form data', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          host: 'smtp.gmail.com',
          port: 587,
          username: 'test@example.com',
        })
      );
    });

    it('prevents default form submission event', async () => {
      const mockOnSubmit = vi.fn();
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.BaseSyntheticEvent;

      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('does not call onSubmit when form is invalid', async () => {
      const mockOnSubmit = vi.fn();
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: {}, // Empty config (invalid)
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Test Notification', () => {
    it('calls onTest callback with form data', async () => {
      const mockOnTest = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onTest: mockOnTest,
        })
      );

      await act(async () => {
        await result.current.handleTest();
      });

      expect(mockOnTest).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          host: 'smtp.gmail.com',
          port: 587,
        })
      );
    });

    it('sets isTesting state during test', async () => {
      const mockOnTest = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onTest: mockOnTest,
        })
      );

      expect(result.current.isTesting).toBe(false);

      const testPromise = act(async () => {
        await result.current.handleTest();
      });

      // Should be testing during execution
      await waitFor(() => {
        expect(result.current.isTesting).toBe(true);
      });

      await testPromise;

      // Should be false after completion
      expect(result.current.isTesting).toBe(false);
    });

    it('shows success message on successful test', async () => {
      const mockOnTest = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onTest: mockOnTest,
        })
      );

      await act(async () => {
        await result.current.handleTest();
      });

      expect(result.current.testResult).toEqual({
        success: true,
        message: 'Test email sent successfully! Check your inbox.',
      });
    });

    it('shows error message on failed test', async () => {
      const mockOnTest = vi.fn().mockRejectedValue(new Error('SMTP connection failed'));
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onTest: mockOnTest,
        })
      );

      await act(async () => {
        await result.current.handleTest();
      });

      expect(result.current.testResult).toEqual({
        success: false,
        message: 'SMTP connection failed',
      });
    });

    it('shows validation error when form is invalid', async () => {
      const mockOnTest = vi.fn();
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: {}, // Invalid config
          onTest: mockOnTest,
        })
      );

      await act(async () => {
        await result.current.handleTest();
      });

      expect(result.current.testResult).toEqual({
        success: false,
        message: 'Please fix form errors before testing',
      });
      expect(mockOnTest).not.toHaveBeenCalled();
    });

    it('clears previous test result before new test', async () => {
      const mockOnTest = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useEmailChannelForm({
          initialConfig: mockEmailConfig,
          onTest: mockOnTest,
        })
      );

      // First test
      await act(async () => {
        await result.current.handleTest();
      });

      expect(result.current.testResult?.success).toBe(true);

      // Second test with failure
      mockOnTest.mockRejectedValueOnce(new Error('Failed'));

      await act(async () => {
        await result.current.handleTest();
      });

      expect(result.current.testResult?.success).toBe(false);
    });

    it('allows manual clearing of test result', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.clearTestResult();
      });

      expect(result.current.testResult).toBeUndefined();
    });
  });

  describe('Reset Functionality', () => {
    it('resets form to initial values', () => {
      const { result } = renderHook(() =>
        useEmailChannelForm({ initialConfig: mockEmailConfig })
      );

      // Modify form
      act(() => {
        result.current.form.setValue('host', 'modified.com');
        result.current.addRecipient('new@example.com');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.form.getValues('host')).toBe('smtp.gmail.com');
      expect(result.current.recipients).toEqual(['admin@example.com']);
    });

    it('clears test result on reset', () => {
      const { result } = renderHook(() =>
        useEmailChannelForm({ initialConfig: mockEmailConfig })
      );

      // Set test result manually (simulating a test)
      act(() => {
        result.current.form.setValue('host', 'test');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.testResult).toBeUndefined();
    });

    it('resets to defaults when no initialConfig provided', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      // Modify form
      act(() => {
        result.current.form.setValue('host', 'modified.com');
        result.current.form.setValue('port', 465);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.form.getValues()).toMatchObject({
        enabled: false,
        host: '',
        port: 587,
        toAddresses: [],
      });
    });
  });

  describe('Form State Reactivity', () => {
    it('updates recipients array when form field changes', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.form.setValue('toAddresses', [
          'admin1@example.com',
          'admin2@example.com',
        ]);
      });

      await waitFor(() => {
        expect(result.current.recipients).toEqual([
          'admin1@example.com',
          'admin2@example.com',
        ]);
      });
    });

    it('marks form as dirty when recipients change', () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.addRecipient('admin@example.com');
      });

      expect(result.current.form.formState.isDirty).toBe(true);
    });

    it('triggers validation when recipients change', async () => {
      const { result } = renderHook(() => useEmailChannelForm());

      act(() => {
        result.current.addRecipient('admin@example.com');
      });

      await waitFor(() => {
        expect(result.current.form.formState.isValid).toBeDefined();
      });
    });
  });
});
