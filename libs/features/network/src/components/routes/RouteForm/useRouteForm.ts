/**
 * useRouteForm Hook
 * NAS-6.5: Static Route Management
 *
 * Headless logic for route form.
 * Handles gateway reachability checking, form validation, and submission.
 */

import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCheckGatewayReachability } from '@nasnet/api-client/queries';

import {
  routeFormSchema,
  routeFormDefaults,
  type RouteFormData,
} from './route-form.schema';
import type { RouteFormProps, ReachabilityInfo } from './types';

export function useRouteForm(props: RouteFormProps) {
  const {
    mode,
    initialValues,
    routerId,
    availableTables,
    loading,
    onSubmit,
    onCancel,
  } = props;

  // Initialize form with React Hook Form + Zod
  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeFormSchema) as never,
    defaultValues: (initialValues || routeFormDefaults) as RouteFormData,
    mode: 'onChange', // Validate on change for real-time feedback
  });

  // Watch gateway field for reachability checking
  const gatewayValue = form.watch('gateway');

  // Debounce timer ref for gateway reachability check
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Gateway reachability check hook (lazy query)
  const {
    check: checkReachability,
    result: reachabilityData,
    loading: reachabilityLoading,
  } = useCheckGatewayReachability(routerId);

  // Debounced gateway reachability check
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only check if gateway is valid and not empty
    if (gatewayValue && gatewayValue.trim() !== '' && !form.formState.errors.gateway) {
      // Debounce by 500ms
      debounceTimerRef.current = setTimeout(() => {
        checkReachability(gatewayValue);
      }, 500);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [gatewayValue, form.formState.errors.gateway, checkReachability]);

  // Transform reachability result to ReachabilityInfo
  const reachabilityInfo = useMemo<ReachabilityInfo>(() => {
    if (!gatewayValue || gatewayValue.trim() === '') {
      return {
        checking: false,
        reachable: null,
      };
    }

    if (reachabilityLoading) {
      return {
        checking: true,
        reachable: null,
        message: 'Checking gateway reachability...',
      };
    }

    if (reachabilityData) {
      return {
        checking: false,
        reachable: reachabilityData.reachable,
        latency: reachabilityData.latency,
        interface: reachabilityData.interface,
        message: reachabilityData.message,
      };
    }

    return {
      checking: false,
      reachable: null,
    };
  }, [gatewayValue, reachabilityData, reachabilityLoading]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data: any) => {
    // Gateway reachability warning is non-blocking, so we allow submission
    // even if gateway is unreachable (user has been warned)
    await onSubmit(data);
  });

  // Handle cancel
  const handleCancel = useCallback(() => {
    form.reset();
    onCancel?.();
  }, [form, onCancel]);

  // Computed list of available tables
  const tableOptions = useMemo(() => {
    const defaultTables = ['main'];
    if (!availableTables || availableTables.length === 0) {
      return defaultTables;
    }

    // Merge and deduplicate
    const merged = [...new Set([...defaultTables, ...availableTables])];
    return merged.sort();
  }, [availableTables]);

  return {
    form,
    reachabilityInfo,
    tableOptions,
    loading: loading || form.formState.isSubmitting,
    handleSubmit,
    handleCancel,
  };
}
