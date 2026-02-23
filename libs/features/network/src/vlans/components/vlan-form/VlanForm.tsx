/**
 * VLAN Form Component
 *
 * Form for creating/editing VLAN (802.1Q) interfaces.
 *
 * Story: NAS-6.7 - Implement VLAN Management
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlatform } from '@nasnet/ui/layouts';
import { vlanSchema, getVlanWarnings, type VlanFormValues } from '../../schemas';
import { useCheckVlanIdAvailable } from '@nasnet/api-client/queries';
import { VlanFormDesktop } from './VlanFormDesktop';
import { VlanFormMobile } from './VlanFormMobile';

/**
 * VLAN Form Props
 * @interface VlanFormProps
 */
export interface VlanFormProps {
  /** Router ID */
  routerId: string;
  /** Initial values (for edit mode) */
  initialValues?: Partial<VlanFormValues>;
  /** Current VLAN ID (when editing, to exclude from duplicate check) */
  currentVlanId?: string;
  /** Callback when form is submitted */
  onSubmit: (values: VlanFormValues) => void | Promise<void>;
  /** Callback to cancel */
  onCancel: () => void;
  /** Whether submit operation is in progress */
  isLoading?: boolean;
  /** Form mode */
  mode?: 'create' | 'edit';
}

/**
 * VLAN Form - Main wrapper with headless logic
 *
 * Manages VLAN configuration form with validation and duplicate detection.
 *
 * Features:
 * - VLAN ID validation (1-4094)
 * - Duplicate VLAN ID detection (debounced, per parent interface)
 * - Parent interface selection (InterfaceSelector)
 * - MTU configuration (optional, inherits from parent)
 * - Warning messages for VLAN 1 and 4095
 * - Platform-responsive (mobile/desktop presenters)
 *
 * @example
 * ```tsx
 * <VlanForm
 *   routerId={routerId}
 *   mode="create"
 *   onSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function VlanForm({
  routerId,
  initialValues = {},
  currentVlanId,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: VlanFormProps) {
  const platform = usePlatform();
  const [checkDuplicateEnabled, setCheckDuplicateEnabled] = useState(false);

  const form = useForm<VlanFormValues>({
    resolver: zodResolver(vlanSchema),
    defaultValues: {
      name: initialValues.name || '',
      vlanId: initialValues.vlanId || undefined,
      interface: initialValues.interface || '',
      mtu: initialValues.mtu || null,
      comment: initialValues.comment || '',
      disabled: initialValues.disabled || false,
    },
  });

  // Watch VLAN ID and interface for duplicate checking
  const watchedVlanId = form.watch('vlanId');
  const watchedInterface = form.watch('interface');

  // Debounced duplicate VLAN ID check (300ms)
  useEffect(() => {
    if (!watchedVlanId || !watchedInterface) {
      setCheckDuplicateEnabled(false);
      return;
    }

    const timeout = setTimeout(() => {
      setCheckDuplicateEnabled(true);
    }, DUPLICATE_CHECK_DELAY_MS);

    return () => {
      clearTimeout(timeout);
      setCheckDuplicateEnabled(false);
    };
  }, [watchedVlanId, watchedInterface]);

  // Check for duplicate VLAN ID
  const { isAvailable, loading: checkingDuplicate } = useCheckVlanIdAvailable(
    routerId,
    watchedVlanId || 0,
    watchedInterface || '',
    currentVlanId,
    checkDuplicateEnabled
  );

  // Set custom error for duplicate VLAN ID
  useEffect(() => {
    if (checkDuplicateEnabled && !checkingDuplicate && !isAvailable) {
      form.setError('vlanId', {
        type: 'manual',
        message: `VLAN ID ${watchedVlanId} is already in use on interface ${watchedInterface}`,
      });
    } else if (checkDuplicateEnabled && !checkingDuplicate && isAvailable) {
      // Clear the error if VLAN ID becomes available
      const currentError = form.formState.errors.vlanId;
      if (currentError?.type === 'manual') {
        form.clearErrors('vlanId');
      }
    }
  }, [checkDuplicateEnabled, checkingDuplicate, isAvailable, watchedVlanId, watchedInterface, form]);

  // Get validation warnings (non-blocking)
  const warnings = useMemo(
    () => (form.watch() ? getVlanWarnings(form.getValues()) : []),
    [form]
  );

  // Memoized submit handler
  const handleSubmit = useCallback(
    form.handleSubmit(onSubmit),
    [form, onSubmit]
  );

  // Shared props for both presenters
  const sharedProps = useMemo(
    () => ({
      form,
      routerId,
      onSubmit: handleSubmit,
      onCancel,
      isLoading,
      mode,
      warnings,
      checkingDuplicate,
      isDuplicateVlanId: !isAvailable && checkDuplicateEnabled,
    }),
    [form, routerId, handleSubmit, onCancel, isLoading, mode, warnings, checkingDuplicate, isAvailable, checkDuplicateEnabled]
  );

  return platform === 'mobile' ? (
    <VlanFormMobile {...sharedProps} />
  ) : (
    <VlanFormDesktop {...sharedProps} />
  );
}

/** Debounce delay for duplicate VLAN ID checking (ms) */
const DUPLICATE_CHECK_DELAY_MS = 300;
