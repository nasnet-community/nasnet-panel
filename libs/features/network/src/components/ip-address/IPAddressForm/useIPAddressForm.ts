/**
 * useIPAddressForm Hook
 * NAS-6.2: IP Address Management
 *
 * Headless logic for IP address form.
 * Handles subnet calculations, conflict detection, and form submission.
 */

import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSubnetInfo } from '@nasnet/core/forms';
import { useCheckIPConflict } from '@nasnet/api-client/queries';

import {
  ipAddressFormSchema,
  ipAddressFormDefaults,
  type IpAddressFormData,
} from '../validation';
import type { IPAddressFormProps, SubnetCalculations, ConflictInfo } from './types';

export function useIPAddressForm(props: IPAddressFormProps) {
  const { mode, initialValues, routerId, excludeId, loading, onSubmit, onCancel } = props;

  // Initialize form with React Hook Form + Zod
  const form = useForm<IpAddressFormData>({
    resolver: zodResolver(ipAddressFormSchema),
    defaultValues: initialValues || ipAddressFormDefaults,
    mode: 'onChange', // Validate on change for real-time feedback
  });

  // Watch address field for real-time subnet calculations
  const addressValue = form.watch('address');
  const interfaceId = form.watch('interfaceId');

  // Parse CIDR and calculate subnet info
  const subnetCalculations = useMemo<SubnetCalculations | null>(() => {
    if (!addressValue) return null;

    try {
      // Parse CIDR notation
      const [ip, prefixStr] = addressValue.split('/');
      if (!ip || !prefixStr) return null;

      const prefix = parseInt(prefixStr, 10);
      if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

      // Validate IP format
      const parts = ip.split('.');
      if (parts.length !== 4) return null;

      const validIp = parts.every((part) => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
      });

      if (!validIp) return null;

      // Calculate subnet info
      const info = getSubnetInfo(ip, prefix);

      return {
        networkAddress: info.networkAddress,
        broadcastAddress: info.broadcastAddress,
        subnetMask: info.subnetMask,
        firstUsableHost: info.firstUsableHost,
        lastUsableHost: info.lastUsableHost,
        usableHostCount: info.usableHostCount,
      };
    } catch (error) {
      return null;
    }
  }, [addressValue]);

  // Check for conflicts (only when address and interface are valid)
  const shouldCheckConflict = Boolean(
    addressValue &&
      interfaceId &&
      !form.formState.errors.address &&
      !form.formState.errors.interfaceId
  );

  const {
    conflictResult,
    hasConflict,
    loading: conflictLoading,
  } = useCheckIPConflict(
    routerId,
    addressValue || '',
    interfaceId || undefined,
    excludeId,
    shouldCheckConflict
  );

  // Transform conflict result to ConflictInfo
  const conflictInfo = useMemo<ConflictInfo | null>(() => {
    if (!conflictResult) return null;

    return {
      hasConflict: conflictResult.hasConflict,
      conflictType: conflictResult.conflictType as 'exact_match' | 'subnet_overlap',
      conflictingAddress: conflictResult.conflictingAddress
        ? {
            id: conflictResult.conflictingAddress.id,
            address: conflictResult.conflictingAddress.address,
            interfaceName: conflictResult.conflictingAddress.interface.name,
          }
        : undefined,
      message: conflictResult.message,
    };
  }, [conflictResult]);

  // Set form error if conflict detected
  useEffect(() => {
    if (hasConflict && conflictInfo?.message) {
      form.setError('address', {
        type: 'conflict',
        message: conflictInfo.message,
      });
    } else if (!hasConflict && form.formState.errors.address?.type === 'conflict') {
      form.clearErrors('address');
    }
  }, [hasConflict, conflictInfo, form]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    // Don't submit if there's a conflict
    if (hasConflict) {
      form.setError('address', {
        type: 'conflict',
        message: conflictInfo?.message || 'IP address conflict detected',
      });
      return;
    }

    await onSubmit(data);
  });

  return {
    form,
    subnetCalculations,
    conflictInfo,
    conflictLoading,
    hasConflict,
    loading: loading || form.formState.isSubmitting,
    handleSubmit,
    onCancel,
  };
}
