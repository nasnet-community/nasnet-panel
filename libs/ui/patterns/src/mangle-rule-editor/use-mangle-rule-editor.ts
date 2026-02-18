/**
 * Headless useMangleRuleEditor Hook
 *
 * Manages mangle rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 * @see NAS-7.5: Implement Mangle Rules
 */

import { useCallback, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';

import {
  MangleRuleSchema,
  getVisibleFieldsForAction,
  getRequiredFieldsForAction,
  isValidMarkName,
  DSCP_CLASSES,
  getDscpClassName,
  type MangleRule,
  type MangleRuleInput,
  type MangleAction,
  type MangleChain,
} from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

export interface UseMangleRuleEditorOptions {
  /** Initial rule values for editing */
  initialRule?: Partial<MangleRule>;
  /** Callback when form is successfully submitted */
  onSubmit?: (rule: MangleRuleInput) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

export interface UseMangleRuleEditorReturn {
  /** React Hook Form instance */
  form: UseFormReturn<MangleRuleInput>;
  /** Current rule state (from form.watch()) */
  rule: Partial<MangleRule>;
  /** Is form valid */
  isValid: boolean;
  /** Field errors */
  errors: Record<string, string>;
  /** Human-readable preview */
  preview: string;
  /** Reset form to initial state */
  reset: () => void;
  /** Duplicate rule (copy another rule's values) */
  duplicate: (sourceRule: Partial<MangleRule>) => void;
  /** Visible fields for current action */
  visibleFields: string[];
  /** Handle form submission */
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for mangle rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useMangleRuleEditor({
 *   initialRule: { chain: 'prerouting', action: 'mark-connection' },
 *   onSubmit: async (rule) => {
 *     await createMangleRule({ routerId, rule });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.onSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="action"
 *       render={({ field }) => <Select {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useMangleRuleEditor(
  options: UseMangleRuleEditorOptions = {}
): UseMangleRuleEditorReturn {
  const { initialRule, onSubmit: onSubmitCallback, onCancel } = options;

  // Initialize React Hook Form with Zod validation
  const form = useForm<MangleRuleInput>({
    resolver: zodResolver(MangleRuleSchema),
    defaultValues: {
      chain: 'prerouting',
      action: 'mark-connection',
      passthrough: true,
      disabled: false,
      log: false,
      ...initialRule,
    },
    mode: 'onChange', // Validate on change for instant feedback
  });

  // Watch current form state
  const rule = form.watch();

  // Extract form errors
  const errors = useMemo(() => {
    const formErrors = form.formState.errors;
    const errorMap: Record<string, string> = {};

    Object.entries(formErrors).forEach(([key, error]) => {
      const err = error as { message?: string } | undefined;
      if (err?.message) {
        errorMap[key] = err.message;
      }
    });

    return errorMap;
  }, [form.formState.errors]);

  // Get visible fields for current action
  const visibleFields = useMemo(() => {
    return getVisibleFieldsForAction(rule.action || 'mark-connection');
  }, [rule.action]);

  // Generate human-readable preview
  const preview = useMemo(() => {
    return generateMangleRulePreview(rule);
  }, [rule]);

  // Reset form to initial state
  const reset = useCallback(() => {
    form.reset({
      chain: 'prerouting',
      action: 'mark-connection',
      passthrough: true,
      disabled: false,
      log: false,
      ...initialRule,
    });
  }, [form, initialRule]);

  // Duplicate rule (copy another rule's values)
  const duplicate = useCallback(
    (sourceRule: Partial<MangleRule>) => {
      form.reset({
        ...sourceRule,
        id: undefined, // Clear ID for new rule
        position: undefined, // Clear position
      });
    },
    [form]
  );

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    await onSubmitCallback?.(data);
  });

  return {
    form,
    rule,
    isValid: form.formState.isValid,
    errors,
    preview,
    reset,
    duplicate,
    visibleFields,
    onSubmit,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate human-readable preview of mangle rule
 *
 * @example
 * "Mark connection 'voip-traffic' for TCP traffic to port 5060"
 * "Change DSCP to 46 (EF) for packets from 192.168.1.0/24"
 * "Drop invalid packets on forward chain"
 */
function generateMangleRulePreview(rule: Partial<MangleRule>): string {
  const parts: string[] = [];

  // Action description
  const actionDesc = getActionDescription(rule.action, rule);
  if (actionDesc) {
    parts.push(actionDesc);
  }

  // Traffic matchers
  const matcherDesc = getMatcherDescription(rule);
  if (matcherDesc) {
    parts.push(matcherDesc);
  }

  // Chain context
  if (rule.chain && parts.length > 0) {
    parts.push(`on ${rule.chain} chain`);
  }

  // Passthrough note
  if (
    rule.action &&
    ['mark-connection', 'mark-packet', 'mark-routing'].includes(rule.action) &&
    rule.passthrough === false
  ) {
    parts.push('(terminal)');
  }

  return parts.join(' ') || 'Incomplete rule';
}

/**
 * Get action description based on action type
 */
function getActionDescription(
  action: MangleAction | undefined,
  rule: Partial<MangleRule>
): string {
  if (!action) return '';

  switch (action) {
    case 'mark-connection':
      return rule.newConnectionMark
        ? `Mark connection '${rule.newConnectionMark}'`
        : 'Mark connection';

    case 'mark-packet':
      return rule.newPacketMark
        ? `Mark packet '${rule.newPacketMark}'`
        : 'Mark packet';

    case 'mark-routing':
      return rule.newRoutingMark
        ? `Mark routing '${rule.newRoutingMark}'`
        : 'Mark routing';

    case 'change-dscp':
      if (rule.newDscp !== undefined) {
        const dscpName = getDscpClassName(rule.newDscp);
        return `Change DSCP to ${dscpName}`;
      }
      return 'Change DSCP';

    case 'change-ttl':
      return rule.newTtl ? `Change TTL to ${rule.newTtl}` : 'Change TTL';

    case 'change-mss':
      return rule.newMss ? `Clamp MSS to ${rule.newMss}` : 'Clamp MSS';

    case 'jump':
      return rule.jumpTarget ? `Jump to ${rule.jumpTarget}` : 'Jump';

    case 'log':
      return rule.logPrefix ? `Log with prefix '${rule.logPrefix}'` : 'Log packet';

    case 'accept':
      return 'Accept packet';

    case 'drop':
      return 'Drop packet';

    case 'passthrough':
      return 'Continue processing';

    default:
      return action;
  }
}

/**
 * Get matcher description (protocol, addresses, ports, etc.)
 */
function getMatcherDescription(rule: Partial<MangleRule>): string {
  const parts: string[] = [];

  // Connection state
  if (rule.connectionState && rule.connectionState.length > 0) {
    parts.push(`${rule.connectionState.join(',')} packets`);
  }

  // Protocol
  if (rule.protocol) {
    parts.push(`${rule.protocol.toUpperCase()} traffic`);
  }

  // Source address
  if (rule.srcAddress) {
    parts.push(`from ${rule.srcAddress}`);
  } else if (rule.srcAddressList) {
    parts.push(`from address-list '${rule.srcAddressList}'`);
  }

  // Source port
  if (rule.srcPort) {
    parts.push(`sport ${rule.srcPort}`);
  }

  // Destination address
  if (rule.dstAddress) {
    parts.push(`to ${rule.dstAddress}`);
  } else if (rule.dstAddressList) {
    parts.push(`to address-list '${rule.dstAddressList}'`);
  }

  // Destination port
  if (rule.dstPort) {
    parts.push(`port ${rule.dstPort}`);
  }

  // Input interface
  if (rule.inInterface) {
    parts.push(`in ${rule.inInterface}`);
  } else if (rule.inInterfaceList) {
    parts.push(`in interface-list '${rule.inInterfaceList}'`);
  }

  // Output interface
  if (rule.outInterface) {
    parts.push(`out ${rule.outInterface}`);
  } else if (rule.outInterfaceList) {
    parts.push(`out interface-list '${rule.outInterfaceList}'`);
  }

  // Layer 7 protocol
  if (rule.layer7Protocol) {
    parts.push(`L7: ${rule.layer7Protocol}`);
  }

  return parts.length > 0 ? `for ${parts.join(' ')}` : '';
}

/**
 * Validate mark name helper
 */
export function validateMarkName(name: string): string | true {
  if (!name) return 'Mark name is required';
  if (!isValidMarkName(name)) {
    return 'Mark name must contain only letters, numbers, underscores, and hyphens';
  }
  return true;
}
