/**
 * AddressListManager Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * CRITICAL: Layer 2 pattern - receives data via props, does NOT fetch data.
 *
 * @example
 * ```tsx
 * // Layer 3 (Domain) - Fetches data
 * function AddressListView() {
 *   const { data, isLoading } = useAddressLists(routerId);
 *
 *   return (
 *     <AddressListManager
 *       lists={data ?? []}
 *       isLoading={isLoading}
 *       onDeleteList={handleDelete}
 *     />
 *   );
 * }
 * ```
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { AddressListManagerDesktop } from './AddressListManager.desktop';
import { AddressListManagerMobile } from './AddressListManager.mobile';
import { useAddressListManagerState } from './useAddressListManagerState';

import type { AddressListManagerProps } from './types';

/**
 * AddressListManager - Address list display with expandable entries
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with Sheet panels and large touch targets
 * - Tablet/Desktop (>=640px): Dense table with expandable rows and virtualization
 *
 * Features:
 * - View address lists with entry counts
 * - Expand lists to view entries inline (desktop) or in Sheet (mobile)
 * - Show referencing firewall rules
 * - Sortable columns (desktop only)
 * - Virtualization for 10,000+ entry lists
 * - Firewall category accent color (Orange)
 */
function AddressListManagerComponent(props: AddressListManagerProps) {
  const platform = usePlatform();
  const state = useAddressListManagerState();

  // Combine props and state
  const combinedProps = {
    ...props,
    ...state,
  };

  switch (platform) {
    case 'mobile':
      return <AddressListManagerMobile {...combinedProps} />;
    case 'tablet':
    case 'desktop':
    default:
      return <AddressListManagerDesktop {...combinedProps} />;
  }
}

// Wrap with memo for performance optimization
export const AddressListManager = memo(AddressListManagerComponent);

// Set display name for React DevTools
(AddressListManager as unknown as { displayName: string }).displayName = 'AddressListManager';
