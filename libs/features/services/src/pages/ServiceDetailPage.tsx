/**
 * ServiceDetailPage
 *
 * Detail page for a specific service instance.
 * Displays instance information, status, metrics, and virtual interface bridge status.
 *
 * @see Task #7: Add VirtualInterfaceBridge to ServiceDetailPage
 */

import * as React from 'react';
import { useServiceInstance, useGatewayStatus, GatewayState, useInstanceIsolation, useInstanceHealth } from '@nasnet/api-client/queries';
import { ServiceCard, VirtualInterfaceBridge, IsolationStatus, ServiceExportDialog, ServiceHealthBadge } from '@nasnet/ui/patterns';
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Button } from '@nasnet/ui/primitives';
import { Loader2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { GatewayStatusCard } from '../components/GatewayStatusCard';
import { ResourceLimitsForm } from '../components/ResourceLimitsForm';
import { ServiceLogViewer } from '../components/ServiceLogViewer';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { ServiceTrafficPanel, QuotaSettingsForm } from '../components/service-traffic';
import { ServiceConfigForm } from '../components/ServiceConfigForm';
import { useServiceConfigForm } from '../hooks/useServiceConfigForm';

/**
 * ServiceDetailPage props
 */
export interface ServiceDetailPageProps {
  /** Router ID */
  routerId: string;
  /** Service instance ID */
  instanceId: string;
}

/**
 * ServiceDetailPage component
 *
 * Features:
 * - Display service instance details
 * - Show virtual interface bridge status (if vlanId is set)
 * - Real-time status updates via subscriptions
 * - Service logs with filtering and search
 * - Diagnostic tests with history
 */
export function ServiceDetailPage({ routerId, instanceId }: ServiceDetailPageProps) {
  const { t } = useTranslation();

  // Default to Diagnostics tab when status is 'failed'
  const [activeTab, setActiveTab] = React.useState<string>('overview');
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);

  // Fetch service instance
  const { instance, loading, error } = useServiceInstance(routerId, instanceId);

  // Auto-switch to diagnostics tab when instance fails
  React.useEffect(() => {
    if (instance?.status === 'FAILED') {
      setActiveTab('diagnostics');
    }
  }, [instance?.status]);

  // Fetch gateway status (SOCKS-to-TUN gateway for proxy services)
  const { data: gatewayData } = useGatewayStatus(instanceId, {
    skip: !instanceId,
    enablePolling: true,
    pollInterval: 5000,
  });

  // Fetch isolation status (NAS-8.4)
  const { data: isolationData } = useInstanceIsolation(routerId, instanceId, {
    skip: !instanceId,
  });

  // Fetch health status (NAS-8.6)
  const { data: healthData, loading: healthLoading } = useInstanceHealth(routerId, instanceId, {
    skip: !instanceId || !instance || instance.status !== 'RUNNING',
    pollInterval: 30000, // Poll every 30s as fallback if subscription fails
  });

  // Service configuration form (NAS-8.5)
  const configFormState = useServiceConfigForm({
    serviceType: instance?.featureID || '',
    routerID: routerId,
    instanceID: instanceId,
    onSuccess: (configPath) => {
      toast.success('Configuration applied successfully!');
      if (configPath) {
        toast.info(`Config saved to: ${configPath}`);
      }
    },
    onError: (message) => {
      toast.error(`Configuration failed: ${message}`);
    },
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading service instance...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Service Instance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state
  if (!instance) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Instance Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The requested service instance could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map instance to Service type for ServiceCard
  const service = {
    id: instance.id,
    name: instance.instanceName,
    description: `${instance.featureID} service instance`,
    category: getCategoryFromFeatureId(instance.featureID) as any,
    status: instance.status as any,
    version: instance.binaryVersion,
    metrics: undefined, // TODO: Add real-time metrics
    runtime: {
      installedAt: instance.createdAt,
      lastStarted: instance.updatedAt,
    },
  };

  // Determine if export is available (instance has config)
  const canExport = instance &&
    instance.status !== 'PENDING' &&
    instance.status !== 'INSTALLING';

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold">{instance.instanceName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {instance.featureID} service instance
            </p>
          </div>
          {/* Health status badge (NAS-8.6) */}
          {instance.status === 'RUNNING' && (
            <ServiceHealthBadge
              health={healthData?.instanceHealth}
              loading={healthLoading}
              animate
            />
          )}
        </div>
        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('services.sharing.export.button')}
          </Button>
        )}
      </div>

      {instance && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Tab navigation */}
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Service instance card */}
            <ServiceCard
              service={service}
              onAction={(action) => {
                // TODO: Implement actions (start, stop, restart, delete)
                console.log('Action:', action, 'on instance:', instance.id);
              }}
            />

            {/* Virtual interface bridge info */}
            {instance.vlanID && (
              <VirtualInterfaceBridge
                instanceId={instance.id}
                routerId={routerId}
              />
            )}

            {/* Resource Limits Form */}
            <ResourceLimitsForm
              routerId={routerId}
              instanceId={instance.id}
              currentLimits={isolationData?.instanceIsolation?.resourceLimits}
              onSuccess={() => {
                // Optionally show a toast notification
                console.log('Resource limits updated successfully');
              }}
              onError={(error) => {
                // Optionally show an error toast notification
                console.error('Failed to update resource limits:', error);
              }}
            />

            {/* Isolation status (NAS-8.4) */}
            <IsolationStatus
              isolation={isolationData?.instanceIsolation}
              instanceId={instance.id}
              routerId={routerId}
              allowEdit={true}
              showResourceLimits={true}
            />

            {/* Gateway status (SOCKS-to-TUN gateway) */}
            {gatewayData?.gatewayStatus &&
              gatewayData.gatewayStatus.state !== GatewayState.NOT_NEEDED && (
                <GatewayStatusCard
                  gateway={gatewayData.gatewayStatus}
                  instanceId={instance.id}
                  serviceName={instance.instanceName}
                />
              )}
          </TabsContent>

          {/* Configuration tab (NAS-8.5) */}
          <TabsContent value="config">
            <ServiceConfigForm
              formState={configFormState}
              title={`${instance.featureID} Configuration`}
              description={`Configure your ${instance.instanceName} service settings`}
              readOnly={instance.status !== 'RUNNING' && instance.status !== 'STOPPED'}
            />
          </TabsContent>

          {/* Traffic tab */}
          <TabsContent value="traffic" className="space-y-4">
            {/* Traffic statistics panel */}
            <ServiceTrafficPanel
              routerID={routerId}
              instanceID={instance.id}
              instanceName={instance.instanceName}
              historyHours={24}
            />

            {/* Quota settings form */}
            <QuotaSettingsForm
              routerID={routerId}
              instanceID={instance.id}
              onSuccess={() => {
                console.log('Quota settings updated successfully');
              }}
              onError={(error) => {
                console.error('Failed to update quota settings:', error);
              }}
            />
          </TabsContent>

          {/* Logs tab */}
          <TabsContent value="logs">
            <ServiceLogViewer
              routerId={routerId}
              instanceId={instance.id}
              maxHistoricalLines={100}
              autoScroll={true}
              onEntryClick={(entry) => {
                console.log('Log entry clicked:', entry);
              }}
            />
          </TabsContent>

          {/* Diagnostics tab */}
          <TabsContent value="diagnostics">
            <DiagnosticsPanel
              routerId={routerId}
              instanceId={instance.id}
              serviceName={instance.featureID}
              maxHistory={10}
              onDiagnosticsComplete={(results) => {
                console.log('Diagnostics completed:', results);
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Export Dialog */}
      <ServiceExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        instanceId={instanceId}
        routerId={routerId}
      />
    </div>
  );
}

/**
 * Get category from feature ID
 * TODO: This should come from manifest metadata
 */
function getCategoryFromFeatureId(featureId: string): string {
  const categoryMap: Record<string, string> = {
    tor: 'privacy',
    'sing-box': 'proxy',
    'xray-core': 'proxy',
    mtproxy: 'proxy',
    psiphon: 'privacy',
    'adguard-home': 'dns',
  };

  return categoryMap[featureId] || 'proxy';
}
