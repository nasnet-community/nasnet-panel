/**
 * RouteForm Pattern Component
 * NAS-6.5: Static Route Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <RouteForm
 *   mode="create"
 *   routerId={routerId}
 *   interfaces={interfaces}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */

import { memo, useCallback } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { useRouteForm } from './useRouteForm';
import { RouteFormDesktop } from './RouteFormDesktop';
import { RouteFormMobile } from './RouteFormMobile';

import type { RouteFormProps } from './types';

/**
 * RouteForm - Create or edit static routes
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Vertical layout with 44px touch targets
 * - Tablet/Desktop (>=640px): Card-based layout with side-by-side fields
 *
 * Features:
 * - Gateway reachability checking (debounced, non-blocking)
 * - Validation with Zod + React Hook Form
 * - Real-time form validation
 * - Warning display for unreachable gateways
 *
 * @description Headless + Platform Presenters pattern with mobile/desktop adaptive layouts
 */
function RouteFormComponent(props: RouteFormProps) {
  const platform = usePlatform();

  // Use headless hook for business logic
  const { form, reachabilityInfo, tableOptions, loading, handleSubmit, handleCancel } =
    useRouteForm(props);

  // Memoize callbacks for stable references
  const memoizedHandleSubmit = useCallback(handleSubmit, [handleSubmit]);
  const memoizedHandleCancel = useCallback(handleCancel, [handleCancel]);

  // Props to pass to presenters
  const presenterProps = {
    form,
    reachabilityInfo,
    tableOptions,
    interfaces: props.interfaces,
    loading,
    handleSubmit: memoizedHandleSubmit,
    handleCancel: memoizedHandleCancel,
    mode: props.mode,
  };

  switch (platform) {
    case 'mobile':
      return <RouteFormMobile {...presenterProps} />;
    case 'tablet':
    case 'desktop':
    default:
      return <RouteFormDesktop {...presenterProps} />;
  }
}

RouteFormComponent.displayName = 'RouteFormComponent';

// Wrap with memo for performance optimization
export const RouteForm = memo(RouteFormComponent);

// Set display name for React DevTools
RouteForm.displayName = 'RouteForm';
