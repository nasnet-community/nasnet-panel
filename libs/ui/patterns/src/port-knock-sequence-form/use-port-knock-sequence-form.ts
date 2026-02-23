/**
 * Headless Hook: usePortKnockSequenceForm
 *
 * Business logic for port knock sequence form:
 * - React Hook Form integration with Zod validation
 * - Knock ports array field management (add/remove/reorder)
 * - Real-time preview computation
 * - Lockout detection (SSH protection warning)
 * - Port uniqueness validation
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-12-implement-port-knocking.md
 */

import { useState, useCallback, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  PortKnockSequenceSchema,
  type PortKnockSequenceInput,
  type KnockPort,
  isSSHProtected,
  DEFAULT_DURATIONS,
} from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Preview of generated firewall rules
 */
export interface RulePreview {
  stage: number;
  description: string;
  ruleType: 'knock' | 'accept';
  addressList?: string;
  port?: number;
  protocol?: string;
}

/**
 * Hook return type
 */
export interface UsePortKnockSequenceFormReturn {
  /** React Hook Form instance */
  form: ReturnType<typeof useForm<PortKnockSequenceInput>>;

  /** Current knock ports array */
  knockPorts: KnockPort[];

  /** Add a new knock port */
  addKnockPort: () => void;

  /** Remove knock port by index */
  removeKnockPort: (index: number) => void;

  /** Reorder knock ports */
  reorderKnockPorts: (fromIndex: number, toIndex: number) => void;

  /** Preview of generated rules */
  preview: RulePreview[];

  /** Whether sequence protects SSH (lockout risk) */
  isLockoutRisk: boolean;

  /** Form submission handler */
  onSubmit: (data: PortKnockSequenceInput) => void | Promise<void>;
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UsePortKnockSequenceFormOptions {
  /** Initial values for editing */
  initialValues?: PortKnockSequenceInput;

  /** Submit handler */
  onSubmit: (data: PortKnockSequenceInput) => void | Promise<void>;

  /** Whether form is in edit mode */
  isEditMode?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for port knock sequence form logic
 */
export function usePortKnockSequenceForm(
  options: UsePortKnockSequenceFormOptions
): UsePortKnockSequenceFormReturn {
  const { initialValues, onSubmit, isEditMode = false } = options;

  // Initialize form with Zod validation
  const form = useForm<PortKnockSequenceInput>({
    resolver: zodResolver(PortKnockSequenceSchema),
    defaultValues: initialValues || {
      name: '',
      knockPorts: [
        { port: 1234, protocol: 'tcp', order: 1 },
        { port: 5678, protocol: 'tcp', order: 2 },
      ],
      protectedPort: 22,
      protectedProtocol: 'tcp',
      accessTimeout: DEFAULT_DURATIONS.accessTimeout,
      knockTimeout: DEFAULT_DURATIONS.knockTimeout,
      isEnabled: true,
    },
    mode: 'onChange',
  });

  // Watch form values for reactive updates
  const watchedValues = form.watch();
  const knockPorts = watchedValues.knockPorts || [];

  // Track custom state for knock ports management
  const [knockPortsState, setKnockPortsState] = useState<KnockPort[]>(
    initialValues?.knockPorts || [
      { port: 1234, protocol: 'tcp', order: 1 },
      { port: 5678, protocol: 'tcp', order: 2 },
    ]
  );

  /**
   * Add new knock port to sequence
   */
  const addKnockPort = useCallback(() => {
    const currentPorts = form.getValues('knockPorts') || [];
    const nextOrder = currentPorts.length + 1;

    if (nextOrder > 8) {
      form.setError('knockPorts', {
        type: 'manual',
        message: 'Maximum 8 knock ports allowed',
      });
      return;
    }

    const newPort: KnockPort = {
      port: 9000 + nextOrder * 10, // Generate unique default port
      protocol: 'tcp',
      order: nextOrder,
    };

    const updatedPorts = [...currentPorts, newPort];
    form.setValue('knockPorts', updatedPorts, { shouldValidate: true });
    setKnockPortsState(updatedPorts);
  }, [form]);

  /**
   * Remove knock port by index
   */
  const removeKnockPort = useCallback(
    (index: number) => {
      const currentPorts = form.getValues('knockPorts') || [];

      if (currentPorts.length <= 2) {
        form.setError('knockPorts', {
          type: 'manual',
          message: 'At least 2 knock ports are required',
        });
        return;
      }

      const updatedPorts = currentPorts.filter((_, i) => i !== index);
      // Re-index order field
      const reindexedPorts = updatedPorts.map((port, i) => ({
        ...port,
        order: i + 1,
      }));

      form.setValue('knockPorts', reindexedPorts, { shouldValidate: true });
      setKnockPortsState(reindexedPorts);
    },
    [form]
  );

  /**
   * Reorder knock ports (for drag-drop)
   */
  const reorderKnockPorts = useCallback(
    (fromIndex: number, toIndex: number) => {
      const currentPorts = form.getValues('knockPorts') || [];
      const updatedPorts = [...currentPorts];
      const [movedPort] = updatedPorts.splice(fromIndex, 1);
      updatedPorts.splice(toIndex, 0, movedPort);

      // Re-index order field
      const reindexedPorts = updatedPorts.map((port, i) => ({
        ...port,
        order: i + 1,
      }));

      form.setValue('knockPorts', reindexedPorts, { shouldValidate: true });
      setKnockPortsState(reindexedPorts);
    },
    [form]
  );

  /**
   * Generate preview of firewall rules
   */
  const preview = useMemo((): RulePreview[] => {
    const ports = knockPorts;
    const sequenceName = watchedValues.name || 'sequence';
    const protectedPort = watchedValues.protectedPort;
    const protectedProtocol = watchedValues.protectedProtocol;

    const rules: RulePreview[] = [];

    // Stage rules (knock progression)
    ports.forEach((knockPort, index) => {
      const stage = index + 1;
      const isLastStage = index === ports.length - 1;

      rules.push({
        stage,
        description: isLastStage
          ? `Hit port ${knockPort.port} (${knockPort.protocol.toUpperCase()}) → Grant access`
          : `Hit port ${knockPort.port} (${knockPort.protocol.toUpperCase()}) → Advance to stage ${stage + 1}`,
        ruleType: 'knock',
        addressList: isLastStage
          ? `${sequenceName}_allowed`
          : `knock_stage${stage}_${sequenceName}`,
        port: knockPort.port,
        protocol: knockPort.protocol,
      });
    });

    // Accept rule (allow protected service)
    rules.push({
      stage: ports.length + 1,
      description: `Accept ${protectedProtocol.toUpperCase()}:${protectedPort} from allowed list`,
      ruleType: 'accept',
      addressList: `${sequenceName}_allowed`,
      port: protectedPort,
      protocol: protectedProtocol,
    });

    return rules;
  }, [knockPorts, watchedValues]);

  /**
   * Check if sequence protects SSH (lockout risk)
   */
  const isLockoutRisk = useMemo(() => {
    return isSSHProtected({
      protectedPort: watchedValues.protectedPort,
      protectedProtocol: watchedValues.protectedProtocol,
    } as PortKnockSequenceInput);
  }, [watchedValues.protectedPort, watchedValues.protectedProtocol]);

  /**
   * Form submission handler
   */
  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return {
    form,
    knockPorts,
    addKnockPort,
    removeKnockPort,
    reorderKnockPorts,
    preview,
    isLockoutRisk,
    onSubmit: handleSubmit as any,
  };
}
