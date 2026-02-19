import { makeRouterOSRequest } from './api';

import type { ApiResponse } from '@shared/routeros';

/**
 * System Logs Service
 * Provides access to system logs, error logs, and log management
 */

/** Log Entry interface */
export interface LogEntry {
  readonly id: string;
  readonly time: string;
  readonly topics: string;
  readonly message: string;
  readonly level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}

/** Log Rule interface */
export interface LogRule {
  readonly id: string;
  readonly topics: string;
  readonly prefix?: string;
  readonly action: 'memory' | 'disk' | 'remote' | 'echo';
  readonly remember?: boolean;
  readonly disabled?: boolean;
}

/** Log Statistics interface */
export interface LogStats {
  readonly totalEntries: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly debugCount: number;
  readonly criticalCount: number;
  readonly recentErrors: LogEntry[];
  readonly topTopics: { topic: string; count: number }[];
}

/** Log Level Colors */
export const LOG_LEVEL_COLORS = {
  debug: '#6c757d',     // Gray
  info: '#17a2b8',      // Teal  
  warning: '#ffc107',   // Yellow
  error: '#dc3545',     // Red
  critical: '#6f42c1'   // Purple
} as const;

/** Log Level Icons */
export const LOG_LEVEL_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  critical: '🚨'
} as const;

/**
 * Get system logs
 * REST API endpoint: /rest/log
 */
export const getSystemLogs = async (routerIp: string, limit?: number): Promise<ApiResponse<LogEntry[]>> => {
  const params = limit ? { count: limit.toString() } : {};
  return makeRouterOSRequest<LogEntry[]>(routerIp, 'log', {
    method: 'GET',
    ...(limit && { params })
  } as any);
};

/**
 * Get log rules
 * REST API endpoint: /rest/system/logging
 */
export const getLogRules = async (routerIp: string): Promise<ApiResponse<LogRule[]>> => {
  return makeRouterOSRequest<LogRule[]>(routerIp, 'system/logging');
};

/**
 * Clear system logs
 * This removes all log entries from memory
 */
export const clearSystemLogs = async (routerIp: string): Promise<ApiResponse<void>> => {
  // RouterOS doesn't have a direct clear logs API, but we can simulate by getting current logs
  // and then the system will naturally rotate them
  return makeRouterOSRequest<void>(routerIp, 'log/print', {
    method: 'POST',
    body: { '.query': ['=.id=*'] }
  });
};

/**
 * Add log rule
 * REST API endpoint: /rest/system/logging
 */
export const addLogRule = async (
  routerIp: string,
  rule: Partial<LogRule>
): Promise<ApiResponse<LogRule>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSRule: any = {};
  for (const [key, value] of Object.entries(rule)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSRule[kebabKey] = value;
  }

  return makeRouterOSRequest<LogRule>(routerIp, 'system/logging', {
    method: 'POST',
    body: routerOSRule,
  });
};

/**
 * Update log rule
 * REST API endpoint: /rest/system/logging/{id}
 */
export const updateLogRule = async (
  routerIp: string,
  ruleId: string,
  updates: Partial<LogRule>
): Promise<ApiResponse<LogRule>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSUpdates[kebabKey] = value;
  }

  return makeRouterOSRequest<LogRule>(routerIp, `system/logging/${ruleId}`, {
    method: 'PATCH',
    body: routerOSUpdates,
  });
};

/**
 * Delete log rule
 * REST API endpoint: /rest/system/logging/{id}
 */
export const deleteLogRule = async (
  routerIp: string,
  ruleId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `system/logging/${ruleId}`, {
    method: 'DELETE',
  });
};

/**
 * Toggle log rule enabled/disabled state
 * REST API endpoint: /rest/system/logging/{id}
 */
export const toggleLogRule = async (
  routerIp: string,
  ruleId: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `system/logging/${ruleId}`, {
    method: 'PATCH',
    body: { disabled: !enabled },
  });
};

/**
 * Get filtered logs by topic
 */
export const getLogsByTopic = async (
  routerIp: string, 
  topic: string, 
  limit?: number
): Promise<ApiResponse<LogEntry[]>> => {
  // This would need custom filtering logic since RouterOS API might not support direct topic filtering
  const result = await getSystemLogs(routerIp, limit);
  
  if (result.success && result.data) {
    const filteredLogs = result.data.filter(log => 
      log.topics.toLowerCase().includes(topic.toLowerCase())
    );
    
    return {
      ...result,
      data: filteredLogs
    };
  }
  
  return result;
};

/**
 * Get logs by level
 */
export const getLogsByLevel = async (
  routerIp: string, 
  level: keyof typeof LOG_LEVEL_COLORS,
  limit?: number
): Promise<ApiResponse<LogEntry[]>> => {
  const result = await getSystemLogs(routerIp, limit);
  
  if (result.success && result.data) {
    const filteredLogs = result.data.filter(log => log.level === level);
    
    return {
      ...result,
      data: filteredLogs
    };
  }
  
  return result;
};

/**
 * Get comprehensive log statistics
 */
export const getLogStatistics = async (routerIp: string): Promise<ApiResponse<LogStats>> => {
  try {
    const result = await getSystemLogs(routerIp, 1000); // Get last 1000 entries for analysis
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to fetch logs for statistics',
        timestamp: Date.now(),
      };
    }

    const logs = result.data;
    
    // Count by level
    const levelCounts = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    };

    // Count by topics
    const topicCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      // Count levels
      if (log.level) {
        levelCounts[log.level]++;
      } else {
        // Try to infer level from message content
        const message = log.message.toLowerCase();
        if (message.includes('error') || message.includes('failed')) {
          levelCounts.error++;
        } else if (message.includes('warning') || message.includes('warn')) {
          levelCounts.warning++;
        } else if (message.includes('critical') || message.includes('fatal')) {
          levelCounts.critical++;
        } else if (message.includes('debug')) {
          levelCounts.debug++;
        } else {
          levelCounts.info++;
        }
      }
      
      // Count topics
      const topics = log.topics.split(',').map(t => t.trim());
      topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    // Get recent errors (last 10)
    const recentErrors = logs
      .filter(log => 
        log.level === 'error' || 
        log.level === 'critical' ||
        log.message.toLowerCase().includes('error') ||
        log.message.toLowerCase().includes('failed') ||
        log.message.toLowerCase().includes('critical')
      )
      .slice(0, 10);

    // Get top topics (top 10)
    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const stats: LogStats = {
      totalEntries: logs.length,
      errorCount: levelCounts.error,
      warningCount: levelCounts.warning,
      infoCount: levelCounts.info,
      debugCount: levelCounts.debug,
      criticalCount: levelCounts.critical,
      recentErrors,
      topTopics,
    };

    return {
      success: true,
      data: stats,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate log statistics',
      timestamp: Date.now(),
    };
  }
};

/**
 * Detect log level from message content
 */
export const detectLogLevel = (message: string): keyof typeof LOG_LEVEL_COLORS => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
    return 'critical';
  } else if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
    return 'error';
  } else if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
    return 'warning';
  } else if (lowerMessage.includes('debug')) {
    return 'debug';
  } else {
    return 'info';
  }
};

/**
 * Format log time for display
 */
export const formatLogTime = (timeString: string): string => {
  try {
    // RouterOS time format might vary, try to parse and format consistently
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      // If parsing fails, return original string
      return timeString;
    }
    
    return date.toLocaleString();
  } catch {
    return timeString;
  }
};

/**
 * Get log level color
 */
export const getLogLevelColor = (level?: string): string => {
  if (!level) {
    return LOG_LEVEL_COLORS.info;
  }
  
  return LOG_LEVEL_COLORS[level as keyof typeof LOG_LEVEL_COLORS] || LOG_LEVEL_COLORS.info;
};

/**
 * Get log level icon
 */
export const getLogLevelIcon = (level?: string): string => {
  if (!level) {
    return LOG_LEVEL_ICONS.info;
  }
  
  return LOG_LEVEL_ICONS[level as keyof typeof LOG_LEVEL_ICONS] || LOG_LEVEL_ICONS.info;
};

/**
 * Filter logs by text search
 */
export const filterLogsByText = (logs: LogEntry[], searchText: string): LogEntry[] => {
  if (!searchText.trim()) {
    return logs;
  }
  
  const lowerSearch = searchText.toLowerCase();
  return logs.filter(log =>
    log.message.toLowerCase().includes(lowerSearch) ||
    log.topics.toLowerCase().includes(lowerSearch)
  );
};

/**
 * Filter logs by time range
 */
export const filterLogsByTimeRange = (
  logs: LogEntry[], 
  startTime: Date, 
  endTime: Date
): LogEntry[] => {
  return logs.filter(log => {
    try {
      const logDate = new Date(log.time);
      return logDate >= startTime && logDate <= endTime;
    } catch {
      return true; // Include logs with unparseable dates
    }
  });
};

/**
 * Export logs to text format
 */
export const exportLogsToText = (logs: LogEntry[]): string => {
  let output = `RouterOS System Logs Export\n`;
  output += `Generated: ${new Date().toISOString()}\n`;
  output += `Total Entries: ${logs.length}\n`;
  output += `${'='.repeat(80)}\n\n`;
  
  logs.forEach(log => {
    output += `[${log.time}] ${log.topics}: ${log.message}\n`;
  });
  
  return output;
};

/**
 * Export logs to CSV format
 */
export const exportLogsToCSV = (logs: LogEntry[]): string => {
  let csv = 'Timestamp,Topics,Level,Message\n';
  
  logs.forEach(log => {
    const level = log.level || detectLogLevel(log.message);
    const message = log.message.replace(/"/g, '""'); // Escape quotes
    csv += `"${log.time}","${log.topics}","${level}","${message}"\n`;
  });
  
  return csv;
};

/**
 * Get common log topics for autocomplete
 */
export const getCommonLogTopics = (): string[] => {
  return [
    'system',
    'info',
    'error',
    'warning',
    'interface',
    'firewall',
    'dhcp',
    'routing',
    'wireless',
    'vpn',
    'ppp',
    'hotspot',
    'bridge',
    'vlan',
    'queue',
    'script',
    'scheduler',
    'backup',
    'update',
    'login',
    'web-proxy',
    'dns',
    'ntp',
    'snmp',
    'telnet',
    'ssh',
    'ftp',
    'radius'
  ];
};

/**
 * Validate log rule configuration
 */
export const validateLogRule = (rule: Partial<LogRule>): string[] => {
  const errors: string[] = [];
  
  if (!rule.topics) {
    errors.push('Topics are required');
  }
  
  if (!rule.action) {
    errors.push('Action is required');
  } else if (!['memory', 'disk', 'remote', 'echo'].includes(rule.action)) {
    errors.push('Invalid action. Must be: memory, disk, remote, or echo');
  }
  
  return errors;
};