/**
 * Connections Page Component
 * NAS-7.4: Connection Tracking - Integration Layer
 *
 * Displays active firewall connections and connection tracking settings.
 * Integrates ConnectionList and ConnectionTrackingSettings pattern components.
 *
 * Features:
 * - Auto-refresh every 5 seconds (AC1)
 * - Filter by IP, port, protocol, state with wildcards (AC2)
 * - Kill connection with Standard confirmation (AC3)
 * - Update settings with Dangerous confirmation (AC4)
 * - Virtualized rendering for 10,000+ connections (AC5)
 * - WCAG AAA accessibility (AC6)
 */

import { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { Activity, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent, useToast } from '@nasnet/ui/primitives';
import {
  ConnectionList,
  ConnectionTrackingSettings,
  useConnectionList,
  useConnectionTrackingSettings,
  type ConnectionEntry,
} from '@nasnet/ui/patterns';
import {
  useConnections,
  useConnectionTrackingSettings as useConnectionTrackingSettingsQuery,
  useKillConnection,
  useUpdateConnectionTracking,
} from '@nasnet/api-client/queries';

export function ConnectionsPage() {
  const { id: routerId } = useParams({ strict: false });
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');

  // ============================================================================
  // Connections List Tab (AC1, AC2, AC3, AC5, AC6)
  // ============================================================================

  // Fetch connections with auto-refresh (AC1: 5-second polling)
  const {
    data: connections = [],
    isLoading: isLoadingConnections,
    refetch: refetchConnections,
  } = useConnections({
    routerIp: routerId || '',
    enablePolling: true,
    pollingInterval: 5000, // AC1: Auto-refresh every 5 seconds
    enabled: !!routerId,
  });

  // Connection list hook (AC2: filtering with wildcards, AC5: virtualization)
  const connectionListHook = useConnectionList({
    connections,
    onRefresh: refetchConnections,
  });

  // Kill connection mutation (AC3: Standard confirmation)
  const { mutate: killConnection, isPending: isKillingConnection } = useKillConnection({
    routerIp: routerId || '',
    onSuccess: () => {
      toast({
        title: 'Connection terminated',
        description: 'The connection has been successfully terminated.',
        variant: 'default',
      });
      refetchConnections();
    },
    onError: (error) => {
      toast({
        title: 'Failed to terminate connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Kill connection handler
  const handleKillConnection = useCallback(
    (connection: ConnectionEntry) => {
      // Standard confirmation is handled by the KillConnectionButton component
      killConnection({ connectionId: connection.id });
    },
    [killConnection]
  );

  // ============================================================================
  // Connection Tracking Settings Tab (AC4)
  // ============================================================================

  // Fetch current settings
  const {
    data: currentSettings,
    isLoading: isLoadingSettings,
  } = useConnectionTrackingSettingsQuery({
    routerIp: routerId || '',
    enabled: !!routerId,
  });

  // Update settings mutation (AC4: Dangerous confirmation)
  const { mutate: updateSettings } = useUpdateConnectionTracking({
    routerIp: routerId || '',
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Connection tracking settings have been successfully updated.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Settings form hook
  const settingsHook = useConnectionTrackingSettings({
    initialSettings: currentSettings,
    onSubmit: async (settings) => {
      // Dangerous confirmation is handled by the ConnectionTrackingSettings component
      updateSettings({ settings });
    },
  });

  // ============================================================================
  // Render
  // ============================================================================

  // Early return if no router selected
  if (!routerId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Router Selected</h2>
          <p className="text-muted-foreground">
            Please select a router to view connection tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connection Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor active connections and configure connection tracking settings.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger
            value="list"
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>Connections</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Connections List Tab */}
        <TabsContent value="list" className="space-y-4 mt-6">
          <ConnectionList
            connectionList={connectionListHook}
            onKillConnection={handleKillConnection}
            isKillingConnection={isKillingConnection}
            loading={isLoadingConnections}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-6">
          <ConnectionTrackingSettings
            settingsHook={settingsHook}
            loading={isLoadingSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
