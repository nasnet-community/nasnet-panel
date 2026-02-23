/**
 * WAN Management Page
 *
 * Main page for WAN interface configuration and monitoring.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 8: Overview Integration)
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';

import { PageHeader } from '@nasnet/ui/patterns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { Globe, Plus, Activity, History, Settings, Smartphone } from 'lucide-react';
import { WANOverviewList } from '../components/wan-overview/WANOverviewList';
import { DhcpClientForm } from '../components/wan-configuration/DhcpClientForm';
import { PppoeWizard } from '../components/wan-configuration/PppoeWizard';
import { StaticIPForm } from '../components/wan-configuration/StaticIPForm';
import { HealthCheckForm } from '../components/wan-configuration/HealthCheckForm';
import { LteModemForm } from '../components/wan-configuration/LteModemForm';
import { ConnectionHistoryTable } from '../components/wan-history/ConnectionHistoryTable';
import { useWANSubscription } from '../hooks/useWANSubscription';
import { useConnectionHistory, generateMockConnectionHistory } from '../hooks/useConnectionHistory';
import type { WANInterfaceData } from '../types/wan.types';

// Mock data for development (replace with actual GraphQL query)
const mockWANs: WANInterfaceData[] = [
  {
    id: 'wan-1',
    interfaceName: 'pppoe-wan',
    connectionType: 'PPPOE',
    status: 'CONNECTED',
    publicIP: '203.0.113.45',
    gateway: '203.0.113.1',
    primaryDNS: '1.1.1.1',
    secondaryDNS: '1.0.0.1',
    lastConnected: new Date(Date.now() - 3600000 * 24).toISOString(),
    isDefaultRoute: true,
    healthStatus: 'HEALTHY',
    healthTarget: '1.1.1.1',
    healthLatency: 12,
    healthEnabled: true,
  },
  {
    id: 'wan-2',
    interfaceName: 'ether1',
    connectionType: 'DHCP',
    status: 'DISCONNECTED',
    isDefaultRoute: false,
    healthStatus: 'UNKNOWN',
    healthEnabled: false,
  },
];

export function WANManagementPage() {
  const params = useParams({ strict: false });
  const routerId = (params as Record<string, string>)['routerId'] ?? (params as Record<string, string>)['id'];
  const navigate = useNavigate();

  // State
  const [wans, setWANs] = useState<WANInterfaceData[]>(mockWANs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedWAN, setSelectedWAN] = useState<string | null>(null);
  const [configMode, setConfigMode] = useState<'dhcp' | 'pppoe' | 'static' | 'lte' | 'health' | null>(null);

  // Subscribe to real-time WAN updates
  useWANSubscription({
    routerId: routerId || '',
    onStatusChange: (event) => {
      console.log('WAN status changed:', event);
      // Update WAN status in list
      setWANs((prev) =>
        prev.map((wan) =>
          wan.id === event.wanInterfaceId
            ? { ...wan, status: event.status as any, publicIP: event.publicIP }
            : wan
        )
      );
    },
    onHealthChange: (event) => {
      console.log('WAN health changed:', event);
      // Update health status in list
      setWANs((prev) =>
        prev.map((wan) =>
          wan.id === event.wanInterfaceId
            ? {
                ...wan,
                healthStatus: event.healthStatus as any,
                healthLatency: event.latency,
              }
            : wan
        )
      );
    },
    skip: !routerId,
  });

  /**
   * Handle adding new WAN
   */
  const handleAddWAN = useCallback(() => {
    setShowAddDialog(true);
    setConfigMode(null);
  }, []);

  /**
   * Handle configuring existing WAN
   */
  const handleConfigureWAN = useCallback((wanId: string) => {
    setSelectedWAN(wanId);
    const wan = mockWANs.find((w) => w.id === wanId);
    if (wan) {
      // Determine config mode based on connection type
      switch (wan.connectionType) {
        case 'DHCP':
          setConfigMode('dhcp');
          break;
        case 'PPPOE':
          setConfigMode('pppoe');
          break;
        case 'STATIC_IP':
          setConfigMode('static');
          break;
        case 'LTE':
          setConfigMode('lte');
          break;
        default:
          setConfigMode('dhcp');
      }
      setShowAddDialog(true);
    }
  }, []);

  /**
   * Handle viewing WAN details
   */
  const handleViewDetails = useCallback(
    (wanId: string) => {
      navigate({ to: `/dashboard/wan/${wanId}` });
    },
    [navigate]
  );

  /**
   * Handle refreshing WAN list
   */
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Fetch from GraphQL
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // setWANs(fetchedWANs);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle configuration success
   */
  const handleConfigSuccess = useCallback(() => {
    setShowAddDialog(false);
    setConfigMode(null);
    setSelectedWAN(null);
    handleRefresh();
  }, [handleRefresh]);

  /**
   * Handle configuration cancel
   */
  const handleConfigCancel = useCallback(() => {
    setShowAddDialog(false);
    setConfigMode(null);
    setSelectedWAN(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="WAN Management"
        description="Configure and monitor WAN connections for internet connectivity"
      />

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Globe className="h-4 w-4 mr-2" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" aria-hidden="true" />
            Health Monitoring
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" aria-hidden="true" />
            Connection History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <WANOverviewList
            wans={wans}
            loading={loading}
            error={error}
            onAddWAN={handleAddWAN}
            onConfigureWAN={handleConfigureWAN}
            onViewDetails={handleViewDetails}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              Configure health checks for each WAN interface to monitor
              connectivity and detect link failures.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ConnectionHistoryTable
            events={generateMockConnectionHistory(50)}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWAN ? 'Configure WAN Interface' : 'Add WAN Connection'}
            </DialogTitle>
          </DialogHeader>

          {/* Connection Type Selection (if adding new) */}
          {!selectedWAN && !configMode && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the type of WAN connection to configure:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setConfigMode('dhcp')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left',
                    'hover:border-primary hover:bg-primary/5 transition-colors'
                  )}
                  aria-label="Configure DHCP client connection"
                >
                  <Settings className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium">DHCP Client</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatic IP configuration from DHCP server
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setConfigMode('pppoe')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left',
                    'hover:border-primary hover:bg-primary/5 transition-colors'
                  )}
                  aria-label="Configure PPPoE connection"
                >
                  <Globe className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium">PPPoE</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Point-to-Point Protocol over Ethernet (requires credentials)
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setConfigMode('static')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left',
                    'hover:border-primary hover:bg-primary/5 transition-colors'
                  )}
                  aria-label="Configure static IP connection"
                >
                  <Settings className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium">Static IP</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manual IP configuration with fixed address
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setConfigMode('lte')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left',
                    'hover:border-primary hover:bg-primary/5 transition-colors'
                  )}
                  aria-label="Configure LTE/4G modem connection"
                >
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium">LTE/4G Modem</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cellular modem configuration with APN settings
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setConfigMode('health')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left',
                    'hover:border-primary hover:bg-primary/5 transition-colors'
                  )}
                  aria-label="Configure health check monitoring"
                >
                  <Activity className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium">Health Check</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure connectivity monitoring for existing WAN
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Configuration Forms */}
          {configMode === 'dhcp' && (
            <DhcpClientForm
              routerId={routerId || ''}
              onSubmit={() => handleConfigSuccess()}
              onCancel={handleConfigCancel}
            />
          )}

          {configMode === 'pppoe' && (
            <PppoeWizard
              routerId={routerId || ''}
              onComplete={handleConfigSuccess}
              onCancel={handleConfigCancel}
            />
          )}

          {configMode === 'static' && (
            <StaticIPForm
              routerId={routerId || ''}
              onSubmit={() => handleConfigSuccess()}
              onCancel={handleConfigCancel}
            />
          )}

          {configMode === 'lte' && (
            <LteModemForm
              routerId={routerId || ''}
              onSuccess={handleConfigSuccess}
              onCancel={handleConfigCancel}
            />
          )}

          {configMode === 'health' && selectedWAN && (
            <HealthCheckForm
              routerID={routerId || ''}
              wanID={selectedWAN}
              onSuccess={handleConfigSuccess}
              onCancel={handleConfigCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
