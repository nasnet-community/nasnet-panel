/**
 * Resource Data Test Fixtures
 *
 * Mock resources for ResourceCard, DeviceCard, and related component testing.
 *
 * @module @nasnet/ui/patterns/test/__fixtures__/resource-data
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type ResourceStatus = 'online' | 'offline' | 'warning' | 'error' | 'pending';
export type DeviceType =
  | 'computer'
  | 'phone'
  | 'tablet'
  | 'iot'
  | 'server'
  | 'router'
  | 'switch'
  | 'unknown';
export type ConnectionProtocol = 'REST' | 'SSH' | 'Telnet' | 'WinBox' | 'API';

export interface Resource {
  id: string;
  name: string;
  description?: string;
  runtime: {
    status: ResourceStatus;
    uptime?: number;
    lastSeen?: Date;
    cpu?: number;
    memory?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: DeviceType;
  status: 'online' | 'offline';
  hostname?: string;
  vendor?: string;
  firstSeen?: Date;
  lastSeen?: Date;
  bandwidth?: {
    rx: number;
    tx: number;
  };
}

export interface RouterInfo {
  id: string;
  name: string;
  model: string;
  routerOS: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  protocol: ConnectionProtocol;
  ip: string;
  uptime?: number;
  cpu?: number;
  memory?: number;
  latency?: number;
}

// ============================================================================
// Resource Fixtures
// ============================================================================

export const onlineResource: Resource = {
  id: 'res-1',
  name: 'Test Resource',
  description: 'A test resource for testing',
  runtime: {
    status: 'online',
    uptime: 86400,
    lastSeen: new Date(),
    cpu: 25,
    memory: 512,
  },
};

export const offlineResource: Resource = {
  id: 'res-2',
  name: 'Offline Resource',
  description: 'This resource is offline',
  runtime: {
    status: 'offline',
    lastSeen: new Date(Date.now() - 3600000),
  },
};

export const warningResource: Resource = {
  id: 'res-3',
  name: 'Warning Resource',
  description: 'This resource has warnings',
  runtime: {
    status: 'warning',
    uptime: 43200,
    cpu: 85,
    memory: 900,
  },
};

export const errorResource: Resource = {
  id: 'res-4',
  name: 'Error Resource',
  description: 'This resource has errors',
  runtime: {
    status: 'error',
    lastSeen: new Date(Date.now() - 7200000),
  },
};

export const pendingResource: Resource = {
  id: 'res-5',
  name: 'Pending Resource',
  description: 'This resource is pending',
  runtime: {
    status: 'pending',
  },
};

export const minimalResource: Resource = {
  id: 'res-minimal',
  name: 'Minimal',
  runtime: {
    status: 'online',
  },
};

export const allResources: Resource[] = [
  onlineResource,
  offlineResource,
  warningResource,
  errorResource,
  pendingResource,
];

// ============================================================================
// Device Fixtures
// ============================================================================

export const computerDevice: Device = {
  id: 'dev-1',
  name: 'Work PC',
  ip: '192.168.1.100',
  mac: 'AA:BB:CC:DD:EE:01',
  type: 'computer',
  status: 'online',
  hostname: 'work-pc',
  vendor: 'Dell',
  firstSeen: new Date(Date.now() - 86400000 * 30),
  lastSeen: new Date(),
  bandwidth: {
    rx: 1024000,
    tx: 512000,
  },
};

export const phoneDevice: Device = {
  id: 'dev-2',
  name: 'iPhone',
  ip: '192.168.1.101',
  mac: 'AA:BB:CC:DD:EE:02',
  type: 'phone',
  status: 'online',
  hostname: 'johns-iphone',
  vendor: 'Apple',
  lastSeen: new Date(),
};

export const tabletDevice: Device = {
  id: 'dev-3',
  name: 'iPad',
  ip: '192.168.1.102',
  mac: 'AA:BB:CC:DD:EE:03',
  type: 'tablet',
  status: 'offline',
  vendor: 'Apple',
  lastSeen: new Date(Date.now() - 3600000),
};

export const iotDevice: Device = {
  id: 'dev-4',
  name: 'Smart Thermostat',
  ip: '192.168.1.200',
  mac: 'AA:BB:CC:DD:EE:04',
  type: 'iot',
  status: 'online',
  vendor: 'Nest',
};

export const serverDevice: Device = {
  id: 'dev-5',
  name: 'NAS Server',
  ip: '192.168.1.10',
  mac: 'AA:BB:CC:DD:EE:05',
  type: 'server',
  status: 'online',
  hostname: 'nas-server',
  vendor: 'Synology',
  bandwidth: {
    rx: 10240000,
    tx: 5120000,
  },
};

export const unknownDevice: Device = {
  id: 'dev-6',
  name: 'Unknown Device',
  ip: '192.168.1.150',
  mac: 'AA:BB:CC:DD:EE:06',
  type: 'unknown',
  status: 'online',
};

export const allDevices: Device[] = [
  computerDevice,
  phoneDevice,
  tabletDevice,
  iotDevice,
  serverDevice,
  unknownDevice,
];

// ============================================================================
// Router Fixtures
// ============================================================================

export const connectedRouter: RouterInfo = {
  id: 'router-1',
  name: 'Main Router',
  model: 'CCR1036-8G-2S+',
  routerOS: '7.14.1',
  status: 'connected',
  protocol: 'REST',
  ip: '192.168.1.1',
  uptime: 864000,
  cpu: 15,
  memory: 45,
  latency: 5,
};

export const disconnectedRouter: RouterInfo = {
  id: 'router-2',
  name: 'Branch Office',
  model: 'hAP ac2',
  routerOS: '7.13',
  status: 'disconnected',
  protocol: 'SSH',
  ip: '10.0.0.1',
};

export const connectingRouter: RouterInfo = {
  id: 'router-3',
  name: 'Reconnecting',
  model: 'hEX S',
  routerOS: '7.14',
  status: 'connecting',
  protocol: 'REST',
  ip: '192.168.2.1',
};

export const errorRouter: RouterInfo = {
  id: 'router-4',
  name: 'Error Router',
  model: 'RB4011',
  routerOS: '7.12',
  status: 'error',
  protocol: 'WinBox',
  ip: '192.168.3.1',
};

export const allRouters: RouterInfo[] = [
  connectedRouter,
  disconnectedRouter,
  connectingRouter,
  errorRouter,
];

// ============================================================================
// Resource Action Fixtures
// ============================================================================

export interface ResourceAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  icon?: string;
  disabled?: boolean;
}

export function createResourceActions(): ResourceAction[] {
  return [
    {
      id: 'connect',
      label: 'Connect',
      onClick: () => {},
      icon: 'Link',
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: () => {},
      icon: 'Edit',
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: () => {},
      variant: 'destructive',
      icon: 'Trash',
    },
  ];
}

export function createDeviceActions(): ResourceAction[] {
  return [
    {
      id: 'details',
      label: 'View Details',
      onClick: () => {},
      icon: 'Info',
    },
    {
      id: 'block',
      label: 'Block',
      onClick: () => {},
      variant: 'destructive',
      icon: 'Ban',
    },
    {
      id: 'wake',
      label: 'Wake on LAN',
      onClick: () => {},
      icon: 'Power',
    },
  ];
}

// ============================================================================
// Metric Display Fixtures
// ============================================================================

export const cpuMetric = {
  label: 'CPU Usage',
  value: 45,
  unit: '%',
  icon: 'Cpu',
  variant: 'default' as const,
};

export const memoryMetric = {
  label: 'Memory',
  value: 2.4,
  unit: 'GB',
  icon: 'HardDrive',
  trend: 'up' as const,
  trendValue: '+10%',
  variant: 'warning' as const,
};

export const networkMetric = {
  label: 'Network',
  value: 125,
  unit: 'Mbps',
  icon: 'Activity',
  variant: 'success' as const,
};

export const temperatureMetric = {
  label: 'Temperature',
  value: 68,
  unit: '°C',
  icon: 'Thermometer',
  variant: 'default' as const,
  description: 'Normal operating temperature',
};

export const allMetrics = [cpuMetric, memoryMetric, networkMetric, temperatureMetric];
