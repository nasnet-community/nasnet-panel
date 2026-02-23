/**
 * Network Monitoring Tab
 * Card-Heavy design (Direction 2) - Information-dense, Home Assistant inspired
 * Uses NetworkDashboard for the new dashboard layout
 */

import * as React from 'react';

import { NetworkDashboard } from './NetworkDashboard';

/**
 * NetworkTab Component
 * Renders the Card-Heavy Network Dashboard
 */
export const NetworkTab = React.memo(function NetworkTab() {
  return <NetworkDashboard />;
});

NetworkTab.displayName = 'NetworkTab';
