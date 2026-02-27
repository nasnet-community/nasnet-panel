import { memo } from 'react';
import { InterfaceList } from '../components/interface-list';

/**
 * Interface List Page
 * Main page for viewing and managing network interfaces
 *
 * @description Displays all network interfaces with capabilities to view status,
 * configure settings, and manage interface properties.
 */
export interface InterfaceListPageProps {
  /** Router ID for interface operations */
  routerId?: string;
}

/**
 * InterfaceListPage Component
 *
 * Features:
 * - Display all network interfaces with status indicators
 * - View detailed interface statistics
 * - Configure interface properties
 * - Platform-aware UI (mobile/desktop)
 */
export const InterfaceListPage = memo(function InterfaceListPage({
  routerId = 'default-router',
}: InterfaceListPageProps) {
  return (
    <div className="p-component-lg container mx-auto">
      <div className="mb-component-lg">
        <h1 className="font-display text-2xl font-bold">Network Interfaces</h1>
        <p className="text-muted-foreground mt-component-sm">
          View and manage router network interfaces
        </p>
      </div>

      <InterfaceList routerId={routerId} />
    </div>
  );
});
