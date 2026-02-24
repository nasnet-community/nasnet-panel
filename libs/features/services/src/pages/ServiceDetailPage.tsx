/**
 * ServiceDetailPage
 *
 * Detail page for a specific service instance.
 * Displays instance information, status, metrics, and virtual interface bridge status.
 *
 * @see Task #7: Add VirtualInterfaceBridge to ServiceDetailPage
 */

import * as React from 'react';
import { useServiceInstance, useGatewayStatus, GatewayState, useInstanceIsolation, useInstanceHealth, useFeatureVerification, useAvailableUpdates } from '@nasnet/api-client/queries';
import { ServiceCard, VirtualInterfaceBridge, IsolationStatus, ServiceExportDialog, ServiceHealthBadge, VerificationBadge, UpdateIndicator } from '@nasnet/ui/patterns';
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
import { ServiceAlertsTab } from '../components/ServiceAlertsTab';
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
export const ServiceDetailPage = React.memo(function ServiceDetailPage({ routerId, instanceId }: ServiceDetailPageProps) {
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

  // Fetch binary verification status (NAS-8.22)
  const { data: verificationData } = useFeatureVerification(routerId, instanceId, {
    skip: !instanceId,
  });

  // Fetch available updates for this instance (NAS-8.7)
  const { updates } = useAvailableUpdates(
    { routerId },
    { skip: !routerId }
  );

  // Find update for this instance
  const instanceUpdate = React.useMemo(() => {
    if (!updates) return null;
    return updates.find((u) => u.instanceId === instanceId) || null;
  }, [updates, instanceId]);

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
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label={t('common.loading')}>
        <div className="flex flex-col items-center gap-component-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t('services.detail.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-error">{t('services.detail.errorLoadingTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => window.location.reload()}
              aria-label={t('common.retry')}
            >
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state
  if (!instance) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg">
        <Card>
          <CardHeader>
            <CardTitle>{t('services.detail.notFoundTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('services.detail.notFoundMessage')}
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
    (instance.status as string) !== 'PENDING' &&
    (instance.status as string) !== 'INSTALLING';

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg space-y-component-lg">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="space-y-component-md">
          <div>
            <h1 className="text-2xl font-display text-foreground">{instance.instanceName}</h1>
            <p className="text-sm text-muted-foreground mt-component-sm font-mono">
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
          {/* Binary verification badge (NAS-8.22) */}
          <VerificationBadge
            verification={verificationData?.serviceInstance?.verification}
            instanceId={instanceId}
          />
          {/* Update indicator (NAS-8.7) */}
          {instanceUpdate && (
            <UpdateIndicator
              instanceId={instanceUpdate.instanceId}
              instanceName={instanceUpdate.instanceName}
              currentVersion={instanceUpdate.currentVersion}
              latestVersion={instanceUpdate.latestVersion}
              updateAvailable={instanceUpdate.updateAvailable}
              severity={instanceUpdate.severity}
              requiresRestart={instanceUpdate.requiresRestart}
              breakingChanges={instanceUpdate.breakingChanges}
              securityFixes={instanceUpdate.securityFixes}
              changelogUrl={instanceUpdate.changelogUrl}
              releaseDate={instanceUpdate.releaseDate}
              binarySize={instanceUpdate.binarySize}
            />
          )}
        </div>
        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            aria-label={t('services.sharing.export.button')}
            className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('services.sharing.export.button')}
          </Button>
        )}
      </div>

      {instance && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-component-md">
          {/* Tab navigation */}
          <TabsList>
            <TabsTrigger value="overview">{t('services.detail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="config">{t('services.detail.tabs.configuration')}</TabsTrigger>
            <TabsTrigger value="traffic">{t('services.detail.tabs.traffic')}</TabsTrigger>
            <TabsTrigger value="logs">{t('services.detail.tabs.logs')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('services.detail.tabs.alerts')}</TabsTrigger>
            <TabsTrigger value="diagnostics">{t('services.detail.tabs.diagnostics')}</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-component-md">
            {/* Service instance card */}
            <ServiceCard
              service={service as any}
              onClick={() => {
                // Card click - typically used for status/detail view
                // Individual action buttons (start, stop, etc.) handled separately
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
                toast.success(t('services.resourceLimits.success'));
              }}
              onError={(error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : t('services.resourceLimits.error')
                );
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
          <TabsContent value="traffic" className="space-y-component-md">
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
                toast.success(t('services.quota.success'));
              }}
              onError={(error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : t('services.quota.error')
                );
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
                // Log entry selected - could be used for copying, searching, etc.
              }}
            />
          </TabsContent>

          {/* Alerts tab (NAS-8.17) */}
          <TabsContent value="alerts">
            <ServiceAlertsTab
              routerId={routerId}
              instanceId={instanceId}
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
                // Diagnostics completed - results are displayed in the panel
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Export Dialog */}
      <ServiceExportDialog
        {...{
          open: exportDialogOpen,
          onClose: () => setExportDialogOpen(false),
          instanceId,
          routerId,
        } as any}
      />
    </div>
  );
});

ServiceDetailPage.displayName = 'ServiceDetailPage';

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
