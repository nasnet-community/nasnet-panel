import { makeRouterOSRequest } from './api';

import type { SystemResource, ApiResponse, RouterInfo } from '@shared/routeros';

/**
 * System Information Service
 * Provides access to router system information, resources, and routerboard details
 */

/** Enhanced system information combining multiple sources */
export interface SystemInfo {
  // System Resources
  readonly uptime: string;
  readonly version: string;
  readonly buildTime: string;
  readonly freeMemory: number;
  readonly totalMemory: number;
  readonly cpuLoad: number;
  readonly freeHddSpace: number;
  readonly totalHddSpace: number;
  readonly architecture: string;
  readonly boardName: string;
  readonly platform: string;
  
  // Computed values
  readonly memoryUsagePercent: number;
  readonly diskUsagePercent: number;
  readonly uptimeFormatted: string;
}

/** Routerboard hardware information */
export interface RouterboardInfo {
  readonly model?: string;
  readonly serialNumber?: string;
  readonly firmwareVersion?: string;
  readonly factoryFirmware?: string;
  readonly currentFirmware?: string;
  readonly upgradeStatus?: string;
}

/**
 * Get system resource information
 * REST API endpoint: /rest/system/resource
 */
export const getSystemResource = async (routerIp: string): Promise<ApiResponse<SystemResource>> => {
  return makeRouterOSRequest<SystemResource>(routerIp, 'system/resource');
};

/**
 * Get routerboard information
 * REST API endpoint: /rest/system/routerboard
 */
export const getRouterboardInfo = async (routerIp: string): Promise<ApiResponse<RouterboardInfo>> => {
  return makeRouterOSRequest<RouterboardInfo>(routerIp, 'system/routerboard');
};

/**
 * Get system identity
 * REST API endpoint: /rest/system/identity
 */
export const getSystemIdentity = async (routerIp: string): Promise<ApiResponse<{ name: string }>> => {
  return makeRouterOSRequest<{ name: string }>(routerIp, 'system/identity');
};

/**
 * Get comprehensive system information
 * Combines system resource, routerboard, and identity information
 */
export const getSystemInfo = async (routerIp: string): Promise<ApiResponse<SystemInfo>> => {
  try {
    const systemResult = await getSystemResource(routerIp);
    
    if (!systemResult.success || !systemResult.data) {
      return {
        success: false,
        error: systemResult.error || 'Failed to get system information',
        timestamp: Date.now(),
      };
    }

    const resource = systemResult.data;
    
    // Calculate computed values
    const memoryUsagePercent = Math.round(
      ((resource.totalMemory - resource.freeMemory) / resource.totalMemory) * 100
    );
    
    const diskUsagePercent = Math.round(
      ((resource.totalHddSpace - resource.freeHddSpace) / resource.totalHddSpace) * 100
    );
    
    const uptimeFormatted = formatUptime(resource.uptime);

    const systemInfo: SystemInfo = {
      ...resource,
      memoryUsagePercent,
      diskUsagePercent,
      uptimeFormatted,
    };

    return {
      success: true,
      data: systemInfo,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get system information',
      timestamp: Date.now(),
    };
  }
};

/**
 * Get router health status
 * Returns a summary of system health indicators
 */
export const getRouterHealth = async (routerIp: string): Promise<ApiResponse<{
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  indicators: {
    cpu: 'normal' | 'high' | 'critical';
    memory: 'normal' | 'high' | 'critical';
    disk: 'normal' | 'high' | 'critical';
  };
  details: {
    cpuLoad: number;
    memoryUsage: number;
    diskUsage: number;
  };
}>> => {
  try {
    const systemResult = await getSystemInfo(routerIp);
    
    if (!systemResult.success || !systemResult.data) {
      return {
        success: false,
        error: systemResult.error || 'Failed to get system health',
        timestamp: Date.now(),
      };
    }

    const { cpuLoad, memoryUsagePercent, diskUsagePercent } = systemResult.data;

    // Determine health indicators
    const getCpuHealth = (load: number) => {
      if (load > 90) return 'critical';
      if (load > 70) return 'high';
      return 'normal';
    };

    const getMemoryHealth = (usage: number) => {
      if (usage > 95) return 'critical';
      if (usage > 85) return 'high';
      return 'normal';
    };

    const getDiskHealth = (usage: number) => {
      if (usage > 95) return 'critical';
      if (usage > 90) return 'high';
      return 'normal';
    };

    const indicators = {
      cpu: getCpuHealth(cpuLoad),
      memory: getMemoryHealth(memoryUsagePercent),
      disk: getDiskHealth(diskUsagePercent),
    };

    // Determine overall health
    const hasCritical = Object.values(indicators).includes('critical');
    const hasHigh = Object.values(indicators).includes('high');
    
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    if (hasCritical) {
      overallHealth = 'critical';
    } else if (hasHigh) {
      overallHealth = 'warning';
    } else if (cpuLoad < 30 && memoryUsagePercent < 60 && diskUsagePercent < 70) {
      overallHealth = 'excellent';
    } else {
      overallHealth = 'good';
    }

    return {
      success: true,
      data: {
        overallHealth,
        indicators: indicators as { cpu: "normal" | "high" | "critical"; memory: "normal" | "high" | "critical"; disk: "normal" | "high" | "critical"; },
        details: {
          cpuLoad,
          memoryUsage: memoryUsagePercent,
          diskUsage: diskUsagePercent,
        },
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get router health',
      timestamp: Date.now(),
    };
  }
};

/**
 * Format uptime string to human-readable format
 */
const formatUptime = (uptime: string): string => {
  // Parse RouterOS uptime format (e.g., "1w2d3h4m5s")
  const units = [
    { suffix: 'w', name: 'week', multiplier: 1 },
    { suffix: 'd', name: 'day', multiplier: 1 },
    { suffix: 'h', name: 'hour', multiplier: 1 },
    { suffix: 'm', name: 'minute', multiplier: 1 },
    { suffix: 's', name: 'second', multiplier: 1 },
  ];

  const parts: string[] = [];
  
  for (const unit of units) {
    const match = uptime.match(new RegExp(`(\\d+)${unit.suffix}`));
    if (match) {
      const value = parseInt(match[1]);
      if (value > 0) {
        const name = value === 1 ? unit.name : `${unit.name}s`;
        parts.push(`${value} ${name}`);
      }
    }
  }

  if (parts.length === 0) {
    return '0 seconds';
  }

  // Return the most significant parts (up to 3)
  return parts.slice(0, 3).join(', ');
};

/**
 * Format bytes to human-readable format
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

/**
 * Format percentage with appropriate styling classes
 */
export const getPercentageClass = (percentage: number): string => {
  if (percentage >= 95) return 'critical';
  if (percentage >= 85) return 'warning';
  if (percentage >= 70) return 'caution';
  return 'normal';
};