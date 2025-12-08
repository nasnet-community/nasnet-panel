import { motion } from 'framer-motion';
import { SystemInfoCard, ResourceGauge, HardwareCard, LastUpdated } from '@nasnet/ui/patterns';
import { Card, CardHeader, CardTitle, CardContent } from '@nasnet/ui/primitives';
import { useRouterInfo, useRouterResource, useRouterboard } from '@nasnet/api-client/queries';
import { calculateStatus, formatBytes } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';

/**
 * Home Page / Dashboard
 * Displays router system information and status overview
 */
export function HomePage() {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch router information (identity, model, version, architecture)
  const {
    data: systemInfo,
    isLoading: infoLoading,
    error: infoError,
    refetch: refetchInfo
  } = useRouterInfo(routerIp);

  // Fetch resource data (CPU, memory, disk) with 5-second polling
  const {
    data: resourceData,
    isLoading: resourceLoading,
    error: resourceError,
    dataUpdatedAt,
  } = useRouterResource(routerIp);

  // Fetch hardware details (routerboard info)
  const {
    data: hardwareData,
    isLoading: hardwareLoading,
    error: hardwareError,
  } = useRouterboard(routerIp);

  // Calculate resource metrics
  const cpuPercentage = resourceData?.cpuLoad ?? 0;
  const cpuStatus = calculateStatus(cpuPercentage);

  const usedMemory = resourceData ? resourceData.totalMemory - resourceData.freeMemory : 0;
  const memoryPercentage = resourceData ? (usedMemory / resourceData.totalMemory) * 100 : 0;
  const memoryStatus = calculateStatus(memoryPercentage);

  const usedDisk = resourceData ? resourceData.totalHddSpace - resourceData.freeHddSpace : 0;
  const diskPercentage = resourceData ? (usedDisk / resourceData.totalHddSpace) * 100 : 0;
  const diskStatus = calculateStatus(diskPercentage);

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your router's status and performance
            </p>
          </div>

          {/* System Information Card */}
          <SystemInfoCard
            data={systemInfo}
            isLoading={infoLoading}
            error={infoError}
            onRetry={() => refetchInfo()}
          />

          {/* System Resources Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Resources</CardTitle>
                <LastUpdated timestamp={dataUpdatedAt} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CPU Gauge */}
                <ResourceGauge
                  label="CPU"
                  value={cpuPercentage}
                  status={cpuStatus}
                  isLoading={resourceLoading}
                />

                {/* Memory Gauge */}
                <ResourceGauge
                  label="Memory"
                  value={memoryPercentage}
                  status={memoryStatus}
                  subtitle={
                    resourceData
                      ? `${formatBytes(usedMemory)} / ${formatBytes(resourceData.totalMemory)}`
                      : undefined
                  }
                  isLoading={resourceLoading}
                />

                {/* Disk Gauge */}
                <ResourceGauge
                  label="Disk"
                  value={diskPercentage}
                  status={diskStatus}
                  subtitle={
                    resourceData
                      ? `${formatBytes(usedDisk)} / ${formatBytes(resourceData.totalHddSpace)}`
                      : undefined
                  }
                  isLoading={resourceLoading}
                />
              </div>

              {/* Error state for resources */}
              {resourceError && (
                <div className="mt-4 text-sm text-destructive">
                  Failed to load resource data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hardware Details Card */}
          <HardwareCard
            data={hardwareData}
            isLoading={hardwareLoading}
            error={hardwareError}
          />
        </div>
      </motion.div>
    </div>
  );
}
