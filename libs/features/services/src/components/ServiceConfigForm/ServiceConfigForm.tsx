import React, { useMemo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { ServiceConfigFormMobile } from './ServiceConfigFormMobile';
import { ServiceConfigFormDesktop } from './ServiceConfigFormDesktop';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

/**
 * Props for ServiceConfigForm component
 * @interface ServiceConfigFormProps
 */
export interface ServiceConfigFormProps {
  /** Hook return value from useServiceConfigForm with form state and handlers */
  formState: UseServiceConfigFormReturn;

  /** Title displayed in form header */
  title?: string;

  /** Description displayed below title (desktop only) */
  description?: string;

  /** Whether the form is in read-only mode */
  readOnly?: boolean;

  /** Callback when cancel is clicked (desktop only) */
  onCancel?: () => void;

  /** Manual platform override ('mobile' | 'tablet' | 'desktop') */
  presenter?: 'mobile' | 'tablet' | 'desktop';

  /** Optional CSS class name */
  className?: string;
}

/**
 * Service configuration form with platform presenters
 *
 * Automatically detects platform and renders appropriate presenter:
 * - Mobile (<640px): Accordion layout, full-width fields, sticky bottom buttons
 * - Desktop (>=640px): Tabbed layout, 2-column grid, inline buttons
 *
 * Features:
 * - React.memo() for performance optimization
 * - Headless hook pattern: all state in useServiceConfigForm
 * - Memoized presenter selection
 * - Support for read-only mode
 * - Keyboard accessibility (Enter to submit)
 * - Screen reader support for loading/error states
 *
 * @example
 * ```tsx
 * function ServiceConfigPage({ serviceType, routerID, instanceID }) {
 *   const formState = useServiceConfigForm({
 *     serviceType,
 *     routerID,
 *     instanceID,
 *     onSuccess: () => toast.success('Configuration saved!'),
 *     onError: (msg) => toast.error(msg),
 *   });
 *
 *   return (
 *     <ServiceConfigForm
 *       formState={formState}
 *       title="Tor Configuration"
 *       description="Configure your Tor service settings"
 *     />
 *   );
 * }
 * ```
 *
 * @param props - ServiceConfigForm component props
 * @returns Rendered service configuration form
 */
export const ServiceConfigForm = React.memo(function ServiceConfigForm({
  formState,
  title,
  description,
  readOnly,
  onCancel,
  presenter,
  className,
}: ServiceConfigFormProps) {
  const detectedPlatform = usePlatform();
  const platform = presenter || detectedPlatform;

  // Memoize props to pass to presenter
  const presenterProps = useMemo(
    () => ({
      formState,
      title,
      description,
      readOnly,
      onCancel,
    }),
    [formState, title, description, readOnly, onCancel]
  );

  if (platform === 'mobile') {
    return (
      <div className={className}>
        <ServiceConfigFormMobile {...presenterProps} />
      </div>
    );
  }

  return (
    <div className={className}>
      <ServiceConfigFormDesktop {...presenterProps} />
    </div>
  );
});

ServiceConfigForm.displayName = 'ServiceConfigForm';
