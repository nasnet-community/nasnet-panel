/**
 * IPAddressForm Pattern Component
 * NAS-6.2: IP Address Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern.
 *
 * @example
 * ```tsx
 * <IPAddressForm
 *   mode="create"
 *   routerId={routerId}
 *   interfaces={interfaces}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { IPAddressFormDesktop } from './IPAddressFormDesktop';
import { IPAddressFormMobile } from './IPAddressFormMobile';

import type { IPAddressFormProps } from './types';

/**
 * IPAddressForm - Create or edit IP addresses
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet-based form with 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog-based form with compact layout
 */
function IPAddressFormComponent(props: IPAddressFormProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <IPAddressFormMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <IPAddressFormDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const IPAddressForm = memo(IPAddressFormComponent);

// Set display name for React DevTools
(IPAddressForm as { displayName?: string }).displayName = 'IPAddressForm';
