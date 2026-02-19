import { memo } from 'react';
import { InterfaceList } from '../components/interface-list';

/**
 * Interface List Page
 * Main page for viewing and managing network interfaces
 */
export interface InterfaceListPageProps {
  routerId?: string;
}

export const InterfaceListPage = memo(function InterfaceListPage({ routerId = 'default-router' }: InterfaceListPageProps) {
  // TODO: Get routerId from router context or auth state
  // For now, using a default or prop value

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Network Interfaces</h1>
        <p className="text-muted-foreground mt-1">
          View and manage router network interfaces
        </p>
      </div>

      <InterfaceList routerId={routerId} />
    </div>
  );
});
