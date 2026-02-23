/**
 * PluginCard Component
 * Displays plugin information with advanced features including status, stats, and logs
 * Follows NasNetConnect UX Design Direction patterns
 */
export type PluginStatus = 'available' | 'installed' | 'running' | 'error';
export interface PluginStats {
    connections: number;
    bytesIn: number;
    bytesOut: number;
    peersConnected: number;
}
export interface PluginLog {
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}
export interface Plugin {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    version: string;
    status: PluginStatus;
    stats?: PluginStats;
    logs?: PluginLog[];
    features: string[];
}
export interface PluginCardProps {
    plugin: Plugin;
    onInstall?: (pluginId: string) => void;
    onUninstall?: (pluginId: string) => void;
    onConfigure?: (pluginId: string) => void;
}
/**
 * Plugin Card Component
 * Displays plugin information with status, stats, logs, and action buttons
 * Follows Direction 2 "Card-Heavy Dashboard" and Direction 3 "Dashboard Pro" patterns
 */
declare function PluginCardComponent({ plugin, onInstall, onUninstall, onConfigure, }: PluginCardProps): import("react/jsx-runtime").JSX.Element;
/**
 * PluginCard - Memoized component for performance
 */
export declare const PluginCard: import("react").MemoExoticComponent<typeof PluginCardComponent>;
export {};
//# sourceMappingURL=PluginCard.d.ts.map