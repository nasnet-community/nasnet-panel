/**
 * DNS Lookup Tool - Main Component
 *
 * Platform-aware DNS lookup tool that delegates to Desktop or Mobile presenters
 * based on device type. Follows Headless + Platform Presenter pattern (ADR-018).
 *
 * @description Auto-detects mobile/desktop platform and renders appropriate presenter.
 * Handles DNS queries with support for multiple record types and DNS servers.
 *
 * @example
 * ```tsx
 * <DnsLookupTool deviceId="router-123" />
 * ```
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.5
 * @see ADR-018 Headless + Platform Presenters Pattern
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { DnsLookupToolDesktop } from './DnsLookupToolDesktop';
import { DnsLookupToolMobile } from './DnsLookupToolMobile';

/**
 * Props for DnsLookupTool component
 * @property deviceId - Unique identifier for the router/device
 * @property className - Optional CSS class for styling
 */
export interface DnsLookupToolProps {
  deviceId: string;
  className?: string;
}

export const DnsLookupTool = memo(function DnsLookupTool(props: DnsLookupToolProps) {
  const platform = usePlatform();

  // Use mobile presenter for mobile and tablet (touch devices)
  if (platform === 'mobile') {
    return <DnsLookupToolMobile {...props} />;
  }

  // Desktop presenter for desktop
  return <DnsLookupToolDesktop {...props} />;
});

DnsLookupTool.displayName = 'DnsLookupTool';
