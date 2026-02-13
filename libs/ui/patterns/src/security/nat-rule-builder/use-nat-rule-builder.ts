/**
 * Headless useNATRuleBuilder Hook
 *
 * Manages NAT rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

import { useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  NATRuleInputSchema,
  getVisibleFieldsForNATAction,
  generateNATRulePreview,
  type NATRuleInput,
  type NatAction,
  type NatChain,
} from '@nasnet/core/types/firewall';

// ============================================================================
// Types
// ============================================================================

export interface UseNATRuleBuilderOptions {
  /** Initial rule values for editing */
  initialRule?: Partial<NATRuleInput>;
  /** Callback when form is successfully submitted */
  onSubmit?: (rule: NATRuleInput) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

export interface UseNATRuleBuilderReturn {
  /** React Hook Form instance */
  form: UseFormReturn<NATRuleInput>;
  /** Current rule state (from form.watch()) */
  rule: Partial<NATRuleInput>;
  /** Is form valid */
  isValid: boolean;
  /** Field errors */
  errors: Record<string, string>;
  /** CLI-style preview */
  preview: string;
  /** Human-readable description */
  description: string;
  /** Reset form to initial state */
  reset: () => void;
  /** Duplicate rule (copy another rule's values) */
  duplicate: (sourceRule: Partial<NATRuleInput>) => void;
  /** Visible fields for current action */
  visibleFields: string[];
  /** Handle form submission */
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for NAT rule builder form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation for NAT rules.
 *
 * @example
 * ```tsx
 * const builder = useNATRuleBuilder({
 *   initialRule: { chain: 'srcnat', action: 'masquerade' },
 *   onSubmit: async (rule) => {
 *     await createNATRule({ routerId, rule });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={builder.onSubmit}>
 *     <Controller
 *       control={builder.form.control}
 *       name="action"
 *       render={({ field }) => <Select {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useNATRuleBuilder(
  options: UseNATRuleBuilderOptions = {}
): UseNATRuleBuilderReturn {
  const { initialRule, onSubmit: onSubmitCallback, onCancel } = options;

  // Initialize React Hook Form with Zod validation
  const form = useForm<NATRuleInput>({
    resolver: zodResolver(NATRuleInputSchema),
    defaultValues: {
      chain: 'srcnat',
      action: 'masquerade',
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
      if (error?.message) {
        errorMap[key] = error.message;
      }
    });

    return errorMap;
  }, [form.formState.errors]);

  // Get visible fields for current action
  const visibleFields = useMemo(() => {
    return getVisibleFieldsForNATAction(rule.action || 'masquerade');
  }, [rule.action]);

  // Generate CLI-style preview
  const preview = useMemo(() => {
    return generateNATRulePreview(rule);
  }, [rule]);

  // Generate human-readable description
  const description = useMemo(() => {
    return generateNATRuleDescription(rule);
  }, [rule]);

  // Reset form to initial state
  const reset = useCallback(() => {
    form.reset({
      chain: 'srcnat',
      action: 'masquerade',
      disabled: false,
      log: false,
      ...initialRule,
    });
  }, [form, initialRule]);

  // Duplicate rule (copy another rule's values)
  const duplicate = useCallback(
    (sourceRule: Partial<NATRuleInput>) => {
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
    description,
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
 * Generate human-readable description of NAT rule
 *
 * @example
 * "Masquerade outgoing traffic on ether1"
 * "Forward TCP port 80 to 192.168.1.100:8080"
 * "Translate source to 10.0.0.1 for traffic to 8.8.8.8"
 */
function generateNATRuleDescription(rule: Partial<NATRuleInput>): string {
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

  // Interface context
  const interfaceDesc = getInterfaceDescription(rule);
  if (interfaceDesc) {
    parts.push(interfaceDesc);
  }

  return parts.join(' ') || 'Incomplete rule';
}

/**
 * Get action description based on action type
 */
function getActionDescription(
  action: NatAction | undefined,
  rule: Partial<NATRuleInput>
): string {
  if (!action) return '';

  switch (action) {
    case 'masquerade':
      return 'Masquerade outgoing traffic';

    case 'dst-nat':
      if (rule.toAddresses && rule.toPorts) {
        return `Forward to ${rule.toAddresses}:${rule.toPorts}`;
      } else if (rule.toAddresses) {
        return `Forward to ${rule.toAddresses}`;
      }
      return 'Forward traffic';

    case 'src-nat':
      return rule.toAddresses
        ? `Translate source to ${rule.toAddresses}`
        : 'Translate source address';

    case 'redirect':
      return rule.toPorts ? `Redirect to port ${rule.toPorts}` : 'Redirect to router';

    case 'netmap':
      return rule.toAddresses ? `1:1 NAT to ${rule.toAddresses}` : '1:1 NAT';

    case 'same':
      return 'Use same source address';

    case 'accept':
      return 'Accept without translation';

    case 'drop':
      return 'Drop packet';

    case 'jump':
      return 'Jump to chain';

    case 'return':
      return 'Return to calling chain';

    case 'log':
      return rule.logPrefix ? `Log with prefix '${rule.logPrefix}'` : 'Log packet';

    case 'passthrough':
      return 'Continue processing';

    default:
      return action;
  }
}

/**
 * Get matcher description (protocol, addresses, ports, etc.)
 */
function getMatcherDescription(rule: Partial<NATRuleInput>): string {
  const parts: string[] = [];

  // Protocol
  if (rule.protocol && rule.protocol !== 'all') {
    parts.push(`${rule.protocol.toUpperCase()} traffic`);
  }

  // Source address
  if (rule.srcAddress) {
    parts.push(`from ${rule.srcAddress}`);
  }

  // Source port
  if (rule.srcPort) {
    parts.push(`sport ${rule.srcPort}`);
  }

  // Destination address
  if (rule.dstAddress) {
    parts.push(`to ${rule.dstAddress}`);
  }

  // Destination port
  if (rule.dstPort) {
    parts.push(`port ${rule.dstPort}`);
  }

  return parts.length > 0 ? `for ${parts.join(' ')}` : '';
}

/**
 * Get interface description
 */
function getInterfaceDescription(rule: Partial<NATRuleInput>): string {
  const parts: string[] = [];

  // Input interface
  if (rule.inInterface) {
    parts.push(`in ${rule.inInterface}`);
  } else if (rule.inInterfaceList) {
    parts.push(`in list '${rule.inInterfaceList}'`);
  }

  // Output interface
  if (rule.outInterface) {
    parts.push(`out ${rule.outInterface}`);
  } else if (rule.outInterfaceList) {
    parts.push(`out list '${rule.outInterfaceList}'`);
  }

  return parts.join(', ');
}
