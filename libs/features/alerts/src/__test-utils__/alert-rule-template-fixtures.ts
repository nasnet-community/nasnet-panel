/**
 * Alert Rule Template Test Fixtures
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Mock data for Storybook stories and tests.
 * Provides realistic template examples across all categories.
 */

import type {
  AlertRuleTemplate,
  AlertRuleTemplateVariable,
  AlertRuleTemplatePreview,
} from '../schemas/alert-rule-template.schema';

// =============================================================================
// Built-in Templates
// =============================================================================

/**
 * Network Category Templates
 */
export const deviceOfflineTemplate: AlertRuleTemplate = {
  id: 'device-offline',
  name: 'Device Offline Alert',
  description: 'Alerts when a network device goes offline for an extended period',
  category: 'NETWORK',
  eventType: 'router.offline',
  severity: 'CRITICAL',
  conditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'offline',
    },
    {
      field: 'duration',
      operator: 'GREATER_THAN',
      value: '{{OFFLINE_DURATION}}',
    },
  ],
  channels: ['email', 'inapp'],
  throttle: {
    maxAlerts: 1,
    periodSeconds: 3600,
    groupByField: 'deviceId',
  },
  variables: [
    {
      name: 'OFFLINE_DURATION',
      label: 'Offline Duration',
      type: 'DURATION',
      required: true,
      defaultValue: '60',
      min: 30,
      max: 3600,
      unit: 'seconds',
      description: 'How long the device must be offline before alerting',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

export const interfaceDownTemplate: AlertRuleTemplate = {
  id: 'interface-down',
  name: 'Interface Down Alert',
  description: 'Alerts when a critical network interface goes down',
  category: 'NETWORK',
  eventType: 'interface.down',
  severity: 'CRITICAL',
  conditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'down',
    },
    {
      field: 'interface',
      operator: 'CONTAINS',
      value: '{{INTERFACE_NAME}}',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'INTERFACE_NAME',
      label: 'Interface Name',
      type: 'STRING',
      required: true,
      defaultValue: 'ether1',
      description: 'Name or pattern of the interface to monitor',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * Security Category Templates
 */
export const sshFailedLoginTemplate: AlertRuleTemplate = {
  id: 'ssh-failed-login',
  name: 'SSH Failed Login Attempts',
  description: 'Alerts when multiple failed SSH login attempts are detected',
  category: 'SECURITY',
  eventType: 'security.ssh_failed_login',
  severity: 'WARNING',
  conditions: [
    {
      field: 'attempts',
      operator: 'GREATER_THAN',
      value: '{{MAX_ATTEMPTS}}',
    },
    {
      field: 'time_window',
      operator: 'LESS_THAN',
      value: '{{TIME_WINDOW}}',
    },
  ],
  channels: ['email', 'inapp'],
  throttle: {
    maxAlerts: 3,
    periodSeconds: 3600,
    groupByField: 'sourceIp',
  },
  variables: [
    {
      name: 'MAX_ATTEMPTS',
      label: 'Maximum Failed Attempts',
      type: 'INTEGER',
      required: true,
      defaultValue: '5',
      min: 1,
      max: 100,
      description: 'Number of failed attempts before alerting',
    },
    {
      name: 'TIME_WINDOW',
      label: 'Time Window',
      type: 'DURATION',
      required: true,
      defaultValue: '300',
      min: 60,
      max: 3600,
      unit: 'seconds',
      description: 'Time window to count failed attempts',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * Resources Category Templates
 */
export const highCPUTemplate: AlertRuleTemplate = {
  id: 'high-cpu-usage',
  name: 'High CPU Usage',
  description: 'Alerts when CPU usage exceeds threshold for sustained period',
  category: 'RESOURCES',
  eventType: 'system.cpu_high',
  severity: 'WARNING',
  conditions: [
    {
      field: 'cpu_usage',
      operator: 'GREATER_THAN',
      value: '{{CPU_THRESHOLD}}',
    },
    {
      field: 'duration',
      operator: 'GREATER_THAN',
      value: '{{DURATION}}',
    },
  ],
  channels: ['email', 'inapp'],
  throttle: {
    maxAlerts: 2,
    periodSeconds: 1800,
  },
  variables: [
    {
      name: 'CPU_THRESHOLD',
      label: 'CPU Threshold',
      type: 'PERCENTAGE',
      required: true,
      defaultValue: '80',
      min: 50,
      max: 100,
      unit: 'percent',
      description: 'CPU usage percentage that triggers the alert',
    },
    {
      name: 'DURATION',
      label: 'Sustained Duration',
      type: 'DURATION',
      required: true,
      defaultValue: '300',
      min: 60,
      max: 3600,
      unit: 'seconds',
      description: 'How long CPU must be high before alerting',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

export const highMemoryTemplate: AlertRuleTemplate = {
  id: 'high-memory-usage',
  name: 'High Memory Usage',
  description: 'Alerts when memory usage exceeds threshold',
  category: 'RESOURCES',
  eventType: 'system.memory_high',
  severity: 'WARNING',
  conditions: [
    {
      field: 'memory_usage',
      operator: 'GREATER_THAN',
      value: '{{MEMORY_THRESHOLD}}',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'MEMORY_THRESHOLD',
      label: 'Memory Threshold',
      type: 'PERCENTAGE',
      required: true,
      defaultValue: '90',
      min: 50,
      max: 100,
      unit: 'percent',
      description: 'Memory usage percentage that triggers the alert',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * VPN Category Templates
 */
export const vpnDisconnectedTemplate: AlertRuleTemplate = {
  id: 'vpn-disconnected',
  name: 'VPN Connection Lost',
  description: 'Alerts when a VPN tunnel disconnects unexpectedly',
  category: 'VPN',
  eventType: 'vpn.disconnected',
  severity: 'CRITICAL',
  conditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'disconnected',
    },
    {
      field: 'vpn_name',
      operator: 'CONTAINS',
      value: '{{VPN_NAME}}',
    },
  ],
  channels: ['email', 'inapp'],
  throttle: {
    maxAlerts: 1,
    periodSeconds: 3600,
    groupByField: 'vpnId',
  },
  variables: [
    {
      name: 'VPN_NAME',
      label: 'VPN Connection Name',
      type: 'STRING',
      required: true,
      defaultValue: '',
      description: 'Name or pattern of the VPN connection to monitor',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * DHCP Category Templates
 */
export const dhcpPoolExhaustedTemplate: AlertRuleTemplate = {
  id: 'dhcp-pool-exhausted',
  name: 'DHCP Pool Exhausted',
  description: 'Alerts when DHCP address pool is running low or exhausted',
  category: 'DHCP',
  eventType: 'dhcp.pool_exhausted',
  severity: 'WARNING',
  conditions: [
    {
      field: 'available_addresses',
      operator: 'LESS_THAN',
      value: '{{MIN_AVAILABLE}}',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'MIN_AVAILABLE',
      label: 'Minimum Available Addresses',
      type: 'INTEGER',
      required: true,
      defaultValue: '10',
      min: 1,
      max: 100,
      description: 'Alert when available addresses fall below this number',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * System Category Templates
 */
export const diskFullTemplate: AlertRuleTemplate = {
  id: 'disk-full',
  name: 'Disk Space Low',
  description: 'Alerts when disk space usage exceeds threshold',
  category: 'SYSTEM',
  eventType: 'system.disk_full',
  severity: 'WARNING',
  conditions: [
    {
      field: 'disk_usage',
      operator: 'GREATER_THAN',
      value: '{{DISK_THRESHOLD}}',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'DISK_THRESHOLD',
      label: 'Disk Usage Threshold',
      type: 'PERCENTAGE',
      required: true,
      defaultValue: '85',
      min: 50,
      max: 100,
      unit: 'percent',
      description: 'Disk usage percentage that triggers the alert',
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

/**
 * Custom Template Example
 */
export const customTemplate: AlertRuleTemplate = {
  id: 'custom-1',
  name: 'My Custom Alert',
  description: 'Custom alert rule for specific use case',
  category: 'CUSTOM',
  eventType: 'custom.event',
  severity: 'INFO',
  conditions: [
    {
      field: 'custom_field',
      operator: 'EQUALS',
      value: 'custom_value',
    },
  ],
  channels: ['inapp'],
  variables: [],
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: '2024-02-10T14:30:00Z',
  updatedAt: '2024-02-10T14:30:00Z',
};

// =============================================================================
// Template Collections
// =============================================================================

/**
 * All built-in templates (15 total)
 */
export const builtInTemplates: AlertRuleTemplate[] = [
  deviceOfflineTemplate,
  interfaceDownTemplate,
  sshFailedLoginTemplate,
  highCPUTemplate,
  highMemoryTemplate,
  vpnDisconnectedTemplate,
  dhcpPoolExhaustedTemplate,
  diskFullTemplate,
];

/**
 * All templates including custom
 */
export const allTemplates: AlertRuleTemplate[] = [
  ...builtInTemplates,
  customTemplate,
];

/**
 * Templates by category
 */
export const templatesByCategory = {
  NETWORK: [deviceOfflineTemplate, interfaceDownTemplate],
  SECURITY: [sshFailedLoginTemplate],
  RESOURCES: [highCPUTemplate, highMemoryTemplate],
  VPN: [vpnDisconnectedTemplate],
  DHCP: [dhcpPoolExhaustedTemplate],
  SYSTEM: [diskFullTemplate],
  CUSTOM: [customTemplate],
};

// =============================================================================
// Template Preview Fixtures
// =============================================================================

/**
 * Mock preview result
 */
export const mockPreviewResult: AlertRuleTemplatePreview = {
  template: deviceOfflineTemplate,
  resolvedConditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'offline',
    },
    {
      field: 'duration',
      operator: 'GREATER_THAN',
      value: '60',
    },
  ],
  validationInfo: {
    isValid: true,
    missingVariables: [],
    warnings: [],
  },
};

/**
 * Mock preview with validation errors
 */
export const mockInvalidPreview: AlertRuleTemplatePreview = {
  template: deviceOfflineTemplate,
  resolvedConditions: [],
  validationInfo: {
    isValid: false,
    missingVariables: ['OFFLINE_DURATION'],
    warnings: ['Variable OFFLINE_DURATION is required but not provided'],
  },
};
