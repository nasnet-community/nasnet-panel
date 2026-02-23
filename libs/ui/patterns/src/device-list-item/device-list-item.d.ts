/**
 * DeviceListItem Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */
import * as React from 'react';
import type { DeviceListItemProps } from './device-list-item.types';
/**
 * DeviceListItem Component
 *
 * Displays connected devices from DHCP leases with enriched information.
 * Auto-detects platform (mobile/tablet/desktop) and renders the appropriate presenter.
 * Uses CSS media queries for SSR compatibility.
 *
 * Features:
 * - Device type detection with icons
 * - "New" device badge with pulse animation (30 seconds)
 * - Connection duration display
 * - Platform-responsive presenters
 * - Privacy mode for hostname masking
 * - Expandable details (mobile/tablet)
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DeviceListItem device={connectedDevice} />
 *
 * // With click handler
 * <DeviceListItem
 *   device={device}
 *   onClick={(d) => showDeviceDetails(d)}
 * />
 *
 * // Privacy mode
 * <DeviceListItem
 *   device={device}
 *   showHostname={false}
 * />
 * ```
 */
/**
 * Internal component function
 */
declare function DeviceListItemComponent({ device, showHostname, onClick, className, id, }: DeviceListItemProps): import("react/jsx-runtime").JSX.Element;
/**
 * Memoized DeviceListItem component
 */
export declare const DeviceListItem: React.MemoExoticComponent<typeof DeviceListItemComponent>;
export {};
//# sourceMappingURL=device-list-item.d.ts.map