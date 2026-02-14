import { usePlatform } from '@nasnet/ui/patterns';
import { ServiceConfigFormMobile } from './ServiceConfigFormMobile';
import { ServiceConfigFormDesktop } from './ServiceConfigFormDesktop';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

export interface ServiceConfigFormProps {
  /** Hook return value from useServiceConfigForm */
  formState: UseServiceConfigFormReturn;

  /** Title for the form */
  title?: string;

  /** Description for the form (desktop only) */
  description?: string;

  /** Whether the form is in read-only mode */
  readOnly?: boolean;

  /** Callback when cancel is clicked (desktop only) */
  onCancel?: () => void;
}

/**
 * Service configuration form with platform presenters
 *
 * Automatically renders the appropriate presenter based on screen size:
 * - Mobile (<640px): Accordion layout, full-width fields, sticky bottom buttons
 * - Desktop (>=640px): Tabbed layout, 2-column grid, inline buttons
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
 */
export function ServiceConfigForm(props: ServiceConfigFormProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <ServiceConfigFormMobile {...props} />;
  }

  return <ServiceConfigFormDesktop {...props} />;
}
