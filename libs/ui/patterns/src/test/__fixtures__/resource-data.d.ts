/**
 * Resource Data Test Fixtures
 *
 * Mock resources for ResourceCard, DeviceCard, and related component testing.
 *
 * @module @nasnet/ui/patterns/test/__fixtures__/resource-data
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */
export type ResourceStatus = 'online' | 'offline' | 'warning' | 'error' | 'pending';
export type DeviceType = 'computer' | 'phone' | 'tablet' | 'iot' | 'server' | 'router' | 'switch' | 'unknown';
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
export declare const onlineResource: Resource;
export declare const offlineResource: Resource;
export declare const warningResource: Resource;
export declare const errorResource: Resource;
export declare const pendingResource: Resource;
export declare const minimalResource: Resource;
export declare const allResources: Resource[];
export declare const computerDevice: Device;
export declare const phoneDevice: Device;
export declare const tabletDevice: Device;
export declare const iotDevice: Device;
export declare const serverDevice: Device;
export declare const unknownDevice: Device;
export declare const allDevices: Device[];
export declare const connectedRouter: RouterInfo;
export declare const disconnectedRouter: RouterInfo;
export declare const connectingRouter: RouterInfo;
export declare const errorRouter: RouterInfo;
export declare const allRouters: RouterInfo[];
export interface ResourceAction {
    id: string;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    icon?: string;
    disabled?: boolean;
}
export declare function createResourceActions(): ResourceAction[];
export declare function createDeviceActions(): ResourceAction[];
export declare const cpuMetric: {
    label: string;
    value: number;
    unit: string;
    icon: string;
    variant: "default";
};
export declare const memoryMetric: {
    label: string;
    value: number;
    unit: string;
    icon: string;
    trend: "up";
    trendValue: string;
    variant: "warning";
};
export declare const networkMetric: {
    label: string;
    value: number;
    unit: string;
    icon: string;
    variant: "success";
};
export declare const temperatureMetric: {
    label: string;
    value: number;
    unit: string;
    icon: string;
    variant: "default";
    description: string;
};
export declare const allMetrics: ({
    label: string;
    value: number;
    unit: string;
    icon: string;
    variant: "default";
} | {
    label: string;
    value: number;
    unit: string;
    icon: string;
    trend: "up";
    trendValue: string;
    variant: "warning";
} | {
    label: string;
    value: number;
    unit: string;
    icon: string;
    variant: "success";
})[];
//# sourceMappingURL=resource-data.d.ts.map