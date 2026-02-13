/**
 * Headless useRateLimitEditor Hook
 *
 * Manages rate limit rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/rate-limit-editor
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  RateLimitRuleSchema,
  connectionRateToRouterOS,
  routerOSToConnectionRate,
  DEFAULT_RATE_LIMIT_RULE,
  type RateLimitRule,
  type RateLimitRuleInput,
  type RateLimitAction,
  type TimeWindow,
} from '@nasnet/core/types/firewall';

// ============================================================================
// Types
// ============================================================================

export interface UseRateLimitEditorOptions {
  /** Initial rule values for editing */
  initialRule?: Partial<RateLimitRule>;
  /** Callback when form is successfully submitted */
  onSubmit?: (rule: RateLimitRuleInput) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Function to check if address list exists */
  checkAddressListExists?: (listName: string) => Promise<boolean>;
}

export interface UseRateLimitEditorReturn {
  /** React Hook Form instance */
  form: UseFormReturn<RateLimitRuleInput>;
  /** Current rule state (from form.watch()) */
  rule: Partial<RateLimitRule>;
  /** Is form valid */
  isValid: boolean;
  /** Field errors */
  errors: Record<string, string>;
  /** Human-readable preview */
  preview: string;
  /** Visible fields for current action */
  visibleFields: {
    addressList: boolean;
    addressListTimeout: boolean;
  };
  /** Whether address list exists (null = checking, true/false = result) */
  addressListExists: boolean | null;
  /** Reset form to initial state */
  reset: () => void;
  /** Handle form submission */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for rate limit rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * preview generation, and address list existence checking.
 *
 * @example
 * ```tsx
 * const editor = useRateLimitEditor({
 *   initialRule: { connectionLimit: 100, timeWindow: 'per-minute' },
 *   onSubmit: async (rule) => {
 *     await createRateLimitRule({ routerId, rule });
 *   },
 *   checkAddressListExists: async (name) => {
 *     const lists = await fetchAddressLists(routerId);
 *     return lists.some(list => list.name === name);
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.handleSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="connectionLimit"
 *       render={({ field }) => <Input {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useRateLimitEditor(
  options: UseRateLimitEditorOptions = {}
): UseRateLimitEditorReturn {
  const { initialRule, onSubmit: onSubmitCallback, checkAddressListExists } = options;

  // Initialize React Hook Form with Zod validation
  const form = useForm<RateLimitRuleInput>({
    resolver: zodResolver(RateLimitRuleSchema),
    defaultValues: {
      ...DEFAULT_RATE_LIMIT_RULE,
      ...initialRule,
    },
    mode: 'onChange', // Validate on change for instant feedback
  });

  // Watch current form state
  const rule = form.watch();

  // Address list existence check state
  const [addressListExists, setAddressListExists] = useState<boolean | null>(null);

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

  // Determine visible fields based on action
  const visibleFields = useMemo(() => {
    const action = rule.action || 'drop';
    return {
      addressList: action === 'add-to-list',
      addressListTimeout: action === 'add-to-list',
    };
  }, [rule.action]);

  // Generate human-readable preview
  const preview = useMemo(() => {
    return generateRateLimitPreview(rule);
  }, [rule]);

  // Check address list existence when list name changes
  useEffect(() => {
    const addressList = rule.addressList;

    if (!visibleFields.addressList || !addressList || !checkAddressListExists) {
      setAddressListExists(null);
      return;
    }

    let cancelled = false;

    const checkList = async () => {
      setAddressListExists(null); // Set to checking state
      try {
        const exists = await checkAddressListExists(addressList);
        if (!cancelled) {
          setAddressListExists(exists);
        }
      } catch (error) {
        if (!cancelled) {
          setAddressListExists(false);
        }
      }
    };

    checkList();

    return () => {
      cancelled = true;
    };
  }, [rule.addressList, visibleFields.addressList, checkAddressListExists]);

  // Reset form to initial state
  const reset = useCallback(() => {
    form.reset({
      ...DEFAULT_RATE_LIMIT_RULE,
      ...initialRule,
    });
    setAddressListExists(null);
  }, [form, initialRule]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmitCallback?.(data);
  });

  return {
    form,
    rule,
    isValid: form.formState.isValid,
    errors,
    preview,
    visibleFields,
    addressListExists,
    reset,
    handleSubmit,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate human-readable preview of rate limit rule
 *
 * @example
 * "Drop connections from any IP exceeding 100 connections per minute"
 * "Add IPs to 'rate-limited' list (1h timeout) when exceeding 50 connections per second from 192.168.1.0/24"
 * "Tarpit connections exceeding 1000 connections per hour"
 */
function generateRateLimitPreview(rule: Partial<RateLimitRule>): string {
  const parts: string[] = [];

  // Action description
  const actionDesc = getActionDescription(rule.action, rule);
  if (actionDesc) {
    parts.push(actionDesc);
  }

  // Source matcher
  const sourceDesc = getSourceDescription(rule);
  if (sourceDesc) {
    parts.push(sourceDesc);
  }

  // Rate limit description
  const rateDesc = getRateDescription(rule);
  if (rateDesc) {
    parts.push(rateDesc);
  }

  return parts.join(' ') || 'Configure rate limit rule';
}

/**
 * Get action description based on action type
 */
function getActionDescription(
  action: RateLimitAction | undefined,
  rule: Partial<RateLimitRule>
): string {
  if (!action) return '';

  switch (action) {
    case 'drop':
      return 'Drop connections';

    case 'tarpit':
      return 'Tarpit connections';

    case 'add-to-list':
      if (rule.addressList) {
        const timeout = rule.addressListTimeout || 'permanent';
        const timeoutDesc = timeout === '' ? 'permanent' : timeout;
        return `Add source IPs to '${rule.addressList}' list (${timeoutDesc} timeout)`;
      }
      return 'Add source IPs to address list';

    default:
      return action;
  }
}

/**
 * Get source description (IP, CIDR, or "any")
 */
function getSourceDescription(rule: Partial<RateLimitRule>): string {
  if (rule.srcAddress) {
    return `from ${rule.srcAddress}`;
  }

  if (rule.srcAddressList) {
    const listName = rule.srcAddressList.startsWith('!')
      ? rule.srcAddressList.substring(1)
      : rule.srcAddressList;
    const isNegated = rule.srcAddressList.startsWith('!');

    return isNegated
      ? `from IPs not in '${listName}' list`
      : `from '${listName}' address list`;
  }

  return 'from any IP';
}

/**
 * Get rate description (limit + time window)
 */
function getRateDescription(rule: Partial<RateLimitRule>): string {
  if (!rule.connectionLimit || !rule.timeWindow) {
    return '';
  }

  const timeWindowText = {
    'per-second': 'per second',
    'per-minute': 'per minute',
    'per-hour': 'per hour',
  }[rule.timeWindow] || rule.timeWindow;

  return `when exceeding ${rule.connectionLimit} connections ${timeWindowText}`;
}

/**
 * Validate source address (IPv4, IPv6, CIDR, or empty for "any")
 */
export function validateSourceAddress(address: string | undefined): string | true {
  if (!address || address.trim() === '') {
    return true; // Empty is valid (means "any")
  }

  // IPv4 address pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv4 CIDR pattern
  const ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  // IPv6 CIDR pattern
  const ipv6CidrPattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\/\d{1,3}$/;

  if (
    ipv4Pattern.test(address) ||
    ipv4CidrPattern.test(address) ||
    ipv6Pattern.test(address) ||
    ipv6CidrPattern.test(address)
  ) {
    return true;
  }

  return 'Invalid IP address or CIDR notation';
}

/**
 * Validate address list name
 */
export function validateAddressListName(name: string | undefined): string | true {
  if (!name || name.trim() === '') {
    return 'Address list name is required for add-to-list action';
  }

  if (name.length > 63) {
    return 'Address list name must be 63 characters or less';
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return 'Address list name can only contain alphanumeric characters, underscores, and hyphens';
  }

  return true;
}
