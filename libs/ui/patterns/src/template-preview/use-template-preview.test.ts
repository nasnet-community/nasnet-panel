/**
 * Unit Tests for useTemplatePreview Hook
 *
 * Tests form validation, variable management, preview generation, and error handling.
 *
 * Coverage:
 * - React Hook Form integration with Zod validation
 * - Variable value management
 * - Preview generation and error handling
 * - Auto-preview with debouncing
 * - Conflict/warning detection
 * - Preview mode switching
 *
 * @see libs/ui/patterns/src/template-preview/use-template-preview.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useTemplatePreview } from './use-template-preview';
import {
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
  mockPreviewResult,
  mockPreviewResultWithConflicts,
} from '../__test-utils__/firewall-templates/template-fixtures';

import type { TemplatePreviewResult, TemplateVariableValues } from './template-preview.types';

describe('useTemplatePreview', () => {
  describe('Initialization', () => {
    it('should initialize with template variables', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      const variables = result.current.variables;
      expect(variables['LAN_INTERFACE']).toBeDefined();
      expect(variables['LAN_SUBNET']).toBeDefined();
    });

    it('should use default values from template', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      const variables = result.current.variables;
      expect(variables['LAN_INTERFACE']).toBe('bridge1');
      expect(variables['LAN_SUBNET']).toBe('192.168.88.0/24');
    });

    it('should use initial values when provided', () => {
      const initialValues: TemplateVariableValues = {
        LAN_INTERFACE: 'ether2',
        LAN_SUBNET: '10.0.0.0/24',
      };

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          initialValues,
        })
      );

      expect(result.current.variables['LAN_INTERFACE']).toBe('ether2');
      expect(result.current.variables['LAN_SUBNET']).toBe('10.0.0.0/24');
    });

    it('should initialize preview state as null', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      expect(result.current.previewResult).toBeNull();
      expect(result.current.isGeneratingPreview).toBe(false);
      expect(result.current.previewError).toBeNull();
    });

    it('should initialize active mode as "variables"', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      expect(result.current.activeMode).toBe('variables');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      // Clear required field
      act(() => {
        result.current.setVariable('LAN_INTERFACE', '');
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('should validate subnet format', async () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      // Set invalid subnet
      act(() => {
        result.current.setVariable('LAN_SUBNET', 'invalid-subnet');
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('should validate interface options', async () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      // Set invalid interface (not in options)
      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'nonexistent-interface');
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('should be valid when all fields are correct', async () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      // Default values should be valid
      expect(result.current.isValid).toBe(true);
    });

    it('should track dirty state', async () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether2');
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });
  });

  describe('Variable Management', () => {
    it('should set individual variable', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether3');
      });

      expect(result.current.variables['LAN_INTERFACE']).toBe('ether3');
    });

    it('should reset variables to defaults', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      // Change variables
      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether2');
        result.current.setVariable('LAN_SUBNET', '10.0.0.0/24');
      });

      // Reset
      act(() => {
        result.current.resetVariables();
      });

      expect(result.current.variables['LAN_INTERFACE']).toBe('bridge1');
      expect(result.current.variables['LAN_SUBNET']).toBe('192.168.88.0/24');
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset preview result when resetting variables', () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      act(() => {
        result.current.generatePreview();
      });

      act(() => {
        result.current.resetVariables();
      });

      expect(result.current.previewResult).toBeNull();
      expect(result.current.activeMode).toBe('variables');
    });
  });

  describe('Preview Generation', () => {
    it('should generate preview successfully', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(onGeneratePreview).toHaveBeenCalledWith(result.current.variables);
      expect(result.current.previewResult).toEqual(mockPreviewResult);
      expect(result.current.previewError).toBeNull();
    });

    it('should set loading state during preview', async () => {
      const onGeneratePreview = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockPreviewResult), 100))
        );

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      act(() => {
        result.current.generatePreview();
      });

      expect(result.current.isGeneratingPreview).toBe(true);

      await waitFor(() => {
        expect(result.current.isGeneratingPreview).toBe(false);
      });
    });

    it('should handle preview error', async () => {
      const errorMessage = 'Failed to connect to router';
      const onGeneratePreview = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.previewError).toBe(errorMessage);
      expect(result.current.previewResult).toBeNull();
      expect(result.current.isGeneratingPreview).toBe(false);
    });

    it('should not generate preview if form is invalid', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      // Make form invalid
      act(() => {
        result.current.setVariable('LAN_SUBNET', 'invalid');
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(onGeneratePreview).not.toHaveBeenCalled();
      expect(result.current.previewError).toBe('Please fix validation errors before previewing');
    });

    it('should warn if onGeneratePreview is not provided', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('onGeneratePreview callback not provided');

      consoleWarnSpy.mockRestore();
    });

    it('should switch to conflicts mode when conflicts exist', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResultWithConflicts);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockHomeNetworkTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.activeMode).toBe('conflicts');
      expect(result.current.hasConflicts).toBe(true);
    });

    it('should switch to rules mode when no conflicts', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.activeMode).toBe('rules');
      expect(result.current.hasConflicts).toBe(false);
    });
  });

  describe('Auto-Preview', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should auto-generate preview on variable change when enabled', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
          autoPreview: true,
          autoPreviewDelay: 1000,
        })
      );

      // Change variable
      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether2');
      });

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onGeneratePreview).toHaveBeenCalled();
      });
    });

    it('should debounce auto-preview', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
          autoPreview: true,
          autoPreviewDelay: 1000,
        })
      );

      // Change variable multiple times
      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether2');
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether3');
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Should only call once after debounce
        expect(onGeneratePreview).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-preview if form is invalid', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
          autoPreview: true,
          autoPreviewDelay: 1000,
        })
      );

      // Set invalid value
      act(() => {
        result.current.setVariable('LAN_SUBNET', 'invalid');
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onGeneratePreview).not.toHaveBeenCalled();
    });

    it('should not auto-preview when autoPreview is false', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
          autoPreview: false,
        })
      );

      act(() => {
        result.current.setVariable('LAN_INTERFACE', 'ether2');
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onGeneratePreview).not.toHaveBeenCalled();
    });
  });

  describe('Preview Mode', () => {
    it('should switch preview mode', () => {
      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
        })
      );

      act(() => {
        result.current.setActiveMode('rules');
      });

      expect(result.current.activeMode).toBe('rules');

      act(() => {
        result.current.setActiveMode('conflicts');
      });

      expect(result.current.activeMode).toBe('conflicts');
    });
  });

  describe('Computed Properties', () => {
    it('should detect conflicts', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResultWithConflicts);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockHomeNetworkTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.hasConflicts).toBe(true);
    });

    it('should detect warnings', async () => {
      const resultWithWarnings: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: {
          ...mockPreviewResult.impactAnalysis,
          warnings: ['This is a warning'],
        },
      };

      const onGeneratePreview = vi.fn().mockResolvedValue(resultWithWarnings);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.hasWarnings).toBe(true);
    });

    it('should calculate canApply correctly', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      // Initially cannot apply (no preview)
      expect(result.current.canApply).toBe(false);

      // After successful preview
      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.canApply).toBe(true);
    });

    it('should not allow apply if conflicts exist', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResultWithConflicts);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockHomeNetworkTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.canApply).toBe(false);
    });

    it('should not allow apply if form is invalid', async () => {
      const onGeneratePreview = vi.fn().mockResolvedValue(mockPreviewResult);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      // Make form invalid
      act(() => {
        result.current.setVariable('LAN_SUBNET', 'invalid');
      });

      await waitFor(() => {
        expect(result.current.canApply).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle template with no variables', () => {
      const templateNoVars = {
        ...mockBasicSecurityTemplate,
        variables: [],
      };

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: templateNoVars,
        })
      );

      expect(result.current.variables).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should handle preview result with no conflicts', async () => {
      const resultNoConflicts: TemplatePreviewResult = {
        ...mockPreviewResult,
        conflicts: [],
      };

      const onGeneratePreview = vi.fn().mockResolvedValue(resultNoConflicts);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.hasConflicts).toBe(false);
      expect(result.current.canApply).toBe(true);
    });

    it('should handle preview result with no warnings', async () => {
      const resultNoWarnings: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: {
          ...mockPreviewResult.impactAnalysis,
          warnings: [],
        },
      };

      const onGeneratePreview = vi.fn().mockResolvedValue(resultNoWarnings);

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.hasWarnings).toBe(false);
    });

    it('should handle non-Error rejections', async () => {
      const onGeneratePreview = vi.fn().mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useTemplatePreview({
          template: mockBasicSecurityTemplate,
          onGeneratePreview,
        })
      );

      await act(async () => {
        await result.current.generatePreview();
      });

      expect(result.current.previewError).toBe('Failed to generate preview');
    });
  });
});
