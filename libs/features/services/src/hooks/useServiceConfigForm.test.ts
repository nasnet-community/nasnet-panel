import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useServiceConfigForm } from './useServiceConfigForm';
import type { ConfigSchema } from '@nasnet/api-client/queries';

// Mock the API client queries module
vi.mock('@nasnet/api-client/queries', () => ({
  useServiceConfigOperations: vi.fn(),
}));

import { useServiceConfigOperations } from '@nasnet/api-client/queries';

const mockUseServiceConfigOperations = vi.mocked(useServiceConfigOperations);

describe('useServiceConfigForm', () => {
  const mockSchema: ConfigSchema = {
    serviceType: 'tor',
    version: '1.0.0',
    fields: [
      {
        name: 'nickname',
        type: 'TEXT',
        label: 'Nickname',
        required: true,
        description: 'Relay nickname',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: null,
        sensitive: false,
      },
      {
        name: 'orport',
        type: 'PORT',
        label: 'OR Port',
        required: true,
        description: 'Onion Router port',
        defaultValue: 9001,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: null,
        sensitive: false,
      },
      {
        name: 'bridge_mode',
        type: 'TOGGLE',
        label: 'Bridge Mode',
        required: false,
        description: 'Enable bridge mode',
        defaultValue: false,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: null,
        sensitive: false,
      },
      {
        name: 'bridge_line',
        type: 'TEXT',
        label: 'Bridge Line',
        required: false,
        description: 'Bridge configuration line',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: 'bridge_mode === true',
        sensitive: false,
      },
    ],
  };

  const mockConfig = {
    nickname: 'MyRelay',
    orport: 9001,
    bridge_mode: false,
  };

  const defaultMockReturn = {
    schema: mockSchema,
    config: mockConfig,
    validateConfig: vi.fn(),
    applyConfig: vi.fn(),
    refetchSchema: vi.fn(),
    refetchConfig: vi.fn(),
    loading: {
      schema: false,
      config: false,
      validating: false,
      applying: false,
    },
    errors: {
      schema: undefined,
      config: undefined,
      validation: undefined,
      application: undefined,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseServiceConfigOperations.mockReturnValue(defaultMockReturn);
  });

  describe('Hook Initialization', () => {
    it('should initialize with schema and populate form with current config', async () => {
      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        expect(result.current.schema).toBeDefined();
        expect(result.current.schema?.serviceType).toBe('tor');
      });

      // Form should be populated with current config
      await waitFor(() => {
        const formValues = result.current.form.getValues();
        expect(formValues.nickname).toBe('MyRelay');
        expect(formValues.orport).toBe(9001);
        expect(formValues.bridge_mode).toBe(false);
      });
    });

    it('should use schema default values when config is missing fields', async () => {
      const partialConfig = {
        nickname: 'MyRelay',
        // orport missing - should use schema default (9001)
        // bridge_mode missing - should use schema default (false)
      };

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        config: partialConfig,
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        const formValues = result.current.form.getValues();
        expect(formValues.nickname).toBe('MyRelay');
        expect(formValues.orport).toBe(9001); // Schema default
        expect(formValues.bridge_mode).toBe(false); // Schema default
      });
    });

    it('should use type-based fallback defaults when no schema default exists', async () => {
      const schemaWithoutDefaults: ConfigSchema = {
        serviceType: 'test',
        version: '1.0.0',
        fields: [
          {
            name: 'text_field',
            type: 'TEXT',
            label: 'Text',
            required: false,
            description: null,
            defaultValue: null,
            options: null,
            min: null,
            max: null,
            pattern: null,
            showIf: null,
            sensitive: false,
          },
          {
            name: 'number_field',
            type: 'NUMBER',
            label: 'Number',
            required: false,
            description: null,
            defaultValue: null,
            options: null,
            min: null,
            max: null,
            pattern: null,
            showIf: null,
            sensitive: false,
          },
          {
            name: 'array_field',
            type: 'TEXT_ARRAY',
            label: 'Array',
            required: false,
            description: null,
            defaultValue: null,
            options: null,
            min: null,
            max: null,
            pattern: null,
            showIf: null,
            sensitive: false,
          },
        ],
      };

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        schema: schemaWithoutDefaults,
        config: {},
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'test',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        const formValues = result.current.form.getValues();
        expect(formValues.text_field).toBe(''); // String default
        expect(formValues.number_field).toBe(0); // Number default
        expect(formValues.array_field).toEqual([]); // Array default
      });
    });

    it('should handle loading states correctly', () => {
      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        loading: {
          schema: true,
          config: true,
          validating: false,
          applying: false,
        },
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      expect(result.current.loading.schema).toBe(true);
      expect(result.current.loading.config).toBe(true);
    });

    it('should handle error states correctly', () => {
      const schemaError = new Error('Failed to load schema');
      const configError = new Error('Failed to load config');

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          schema: schemaError,
          config: configError,
          validation: undefined,
          application: undefined,
        },
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      expect(result.current.errors.schema).toBe(schemaError);
      expect(result.current.errors.config).toBe(configError);
    });
  });

  describe('Conditional Field Visibility', () => {
    it('should show fields with no showIf condition', () => {
      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      // Fields without showIf: nickname, orport, bridge_mode
      const visibleFieldNames = result.current.visibleFields.map((f) => f.name);
      expect(visibleFieldNames).toContain('nickname');
      expect(visibleFieldNames).toContain('orport');
      expect(visibleFieldNames).toContain('bridge_mode');
    });

    it('should hide fields when showIf condition is false', () => {
      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      // bridge_line has showIf: 'bridge_mode === true'
      // bridge_mode is false, so bridge_line should be hidden
      const visibleFieldNames = result.current.visibleFields.map((f) => f.name);
      expect(visibleFieldNames).not.toContain('bridge_line');
    });

    it('should show fields when showIf condition becomes true', async () => {
      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      // Initially bridge_line is hidden
      let visibleFieldNames = result.current.visibleFields.map((f) => f.name);
      expect(visibleFieldNames).not.toContain('bridge_line');

      // Enable bridge_mode
      await act(async () => {
        result.current.form.setValue('bridge_mode', true);
      });

      // Wait for visibility update
      await waitFor(() => {
        visibleFieldNames = result.current.visibleFields.map((f) => f.name);
        expect(visibleFieldNames).toContain('bridge_line');
      });
    });

    it('should reactively update visible fields when form values change', async () => {
      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      // Toggle bridge_mode on
      await act(async () => {
        result.current.form.setValue('bridge_mode', true);
      });

      await waitFor(() => {
        const visibleFieldNames = result.current.visibleFields.map((f) => f.name);
        expect(visibleFieldNames).toContain('bridge_line');
      });

      // Toggle bridge_mode off
      await act(async () => {
        result.current.form.setValue('bridge_mode', false);
      });

      await waitFor(() => {
        const visibleFieldNames = result.current.visibleFields.map((f) => f.name);
        expect(visibleFieldNames).not.toContain('bridge_line');
      });
    });
  });

  describe('Validation Flow', () => {
    it('should validate with Zod schema first (client-side)', async () => {
      // Add a field with min length validation to test client-side failure
      const schemaWithMinLength: ConfigSchema = {
        serviceType: 'tor',
        version: '1.0.0',
        fields: [
          {
            name: 'nickname',
            type: 'TEXT',
            label: 'Nickname',
            required: true,
            description: 'Relay nickname',
            defaultValue: null,
            options: null,
            min: 3, // Minimum 3 characters
            max: null,
            pattern: null,
            showIf: null,
            sensitive: false,
          },
        ],
      };

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        schema: schemaWithMinLength,
        config: { nickname: '' },
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      // Wait for form to be ready
      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Set invalid value (nickname is too short - less than 3 chars)
      await act(async () => {
        result.current.form.setValue('nickname', 'ab');
      });

      // Trigger validation
      let isValid = false;
      await act(async () => {
        isValid = await result.current.validate();
      });

      // Should fail client-side validation
      expect(isValid).toBe(false);
      expect(result.current.isValidating).toBe(false);

      // Server validation should NOT be called if client validation fails
      expect(defaultMockReturn.validateConfig).not.toHaveBeenCalled();
    });

    it('should call server validation after client validation passes', async () => {
      const mockValidateConfig = vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
      });

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        validateConfig: mockValidateConfig,
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Set valid values
      await act(async () => {
        result.current.form.setValue('nickname', 'ValidRelay');
        result.current.form.setValue('orport', 9001);
      });

      // Trigger validation
      let isValid = false;
      await act(async () => {
        isValid = await result.current.validate();
      });

      // Should pass both validations
      expect(isValid).toBe(true);
      expect(mockValidateConfig).toHaveBeenCalledWith({
        routerID: 'router-1',
        instanceID: 'instance-1',
        config: expect.objectContaining({
          nickname: 'ValidRelay',
          orport: 9001,
        }),
      });
    });

    it('should return false when server validation fails', async () => {
      const mockValidateConfig = vi.fn().mockResolvedValue({
        valid: false,
        errors: [
          {
            field: 'nickname',
            message: 'Nickname already in use',
          },
        ],
      });

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        validateConfig: mockValidateConfig,
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Set valid values (pass client validation)
      await act(async () => {
        result.current.form.setValue('nickname', 'DuplicateNickname');
      });

      // Trigger validation and wait for it to complete
      let isValid = false;
      await act(async () => {
        isValid = await result.current.validate();
      });

      // Should fail server validation
      expect(isValid).toBe(false);

      // Verify server validation was called with correct params
      expect(mockValidateConfig).toHaveBeenCalledWith({
        routerID: 'router-1',
        instanceID: 'instance-1',
        config: expect.objectContaining({
          nickname: 'DuplicateNickname',
        }),
      });

      // Verify validation is no longer in progress
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('Submit Flow', () => {
    it('should validate before applying configuration', async () => {
      const mockValidateConfig = vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
      });

      const mockApplyConfig = vi.fn().mockResolvedValue({
        success: true,
        configPath: '/etc/tor/torrc',
        message: 'Configuration applied successfully',
        errors: [],
      });

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        validateConfig: mockValidateConfig,
        applyConfig: mockApplyConfig,
      });

      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
          onSuccess,
        })
      );

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Set valid values
      await act(async () => {
        result.current.form.setValue('nickname', 'ValidRelay');
      });

      // Submit
      await act(async () => {
        await result.current.handleSubmit();
      });

      // Validation should be called first
      expect(mockValidateConfig).toHaveBeenCalled();

      // Then apply should be called
      expect(mockApplyConfig).toHaveBeenCalledWith({
        routerID: 'router-1',
        instanceID: 'instance-1',
        config: expect.objectContaining({
          nickname: 'ValidRelay',
        }),
      });

      // Success callback should be called with config path
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('/etc/tor/torrc');
      });
    });

    it('should not apply configuration if validation fails', async () => {
      const mockValidateConfig = vi.fn().mockResolvedValue({
        valid: false,
        errors: [
          {
            field: 'orport',
            message: 'Port already in use',
          },
        ],
      });

      const mockApplyConfig = vi.fn();

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        validateConfig: mockValidateConfig,
        applyConfig: mockApplyConfig,
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Submit
      await act(async () => {
        await result.current.handleSubmit();
      });

      // Validation fails
      expect(mockValidateConfig).toHaveBeenCalled();

      // Apply should NOT be called
      expect(mockApplyConfig).not.toHaveBeenCalled();
    });

    it('should call onError when apply fails', async () => {
      const mockValidateConfig = vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
      });

      const mockApplyConfig = vi.fn().mockResolvedValue({
        success: false,
        message: 'Failed to write configuration file',
        errors: [],
      });

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        validateConfig: mockValidateConfig,
        applyConfig: mockApplyConfig,
      });

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Submit
      await act(async () => {
        await result.current.handleSubmit();
      });

      // Error callback should be called
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to write configuration file');
      });
    });

    it('should set isSubmitting state during submit', async () => {
      const mockValidateConfig = vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
      });

      const mockApplyConfig = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  configPath: '/etc/tor/torrc',
                  message: 'Success',
                  errors: [],
                }),
              100
            );
          })
      );

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        validateConfig: mockValidateConfig,
        applyConfig: mockApplyConfig,
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });

      // Initially not submitting
      expect(result.current.isSubmitting).toBe(false);

      // Start submit
      act(() => {
        void result.current.handleSubmit();
      });

      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(result.current.isSubmitting).toBe(false);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Refetch Operations', () => {
    it('should call refetchSchema and refetchConfig when refetch is called', () => {
      const mockRefetchSchema = vi.fn();
      const mockRefetchConfig = vi.fn();

      mockUseServiceConfigOperations.mockReturnValue({
        ...defaultMockReturn,
        refetchSchema: mockRefetchSchema,
        refetchConfig: mockRefetchConfig,
      });

      const { result } = renderHook(() =>
        useServiceConfigForm({
          serviceType: 'tor',
          routerID: 'router-1',
          instanceID: 'instance-1',
        })
      );

      act(() => {
        result.current.refetch();
      });

      expect(mockRefetchSchema).toHaveBeenCalled();
      expect(mockRefetchConfig).toHaveBeenCalled();
    });
  });
});
