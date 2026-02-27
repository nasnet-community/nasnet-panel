/**
 * Application configuration types
 *
 * Defines structure and types for application-level configuration,
 * router connections, and user preferences.
 *
 * @packageDocumentation
 */
/** Allowed UI theme values */
export type ThemeMode = 'light' | 'dark' | 'system';
/**
 * Main application configuration
 *
 * Contains API endpoints, UI preferences, router defaults,
 * and feature flags.
 *
 * @example
 * ```typescript
 * const config: AppConfig = {
 *   api: {
 *     baseUrl: 'http://localhost:8080',
 *     timeout: 30000
 *   },
 *   ui: {
 *     theme: 'dark',
 *     language: 'en'
 *   },
 *   router: {
 *     defaultPort: 8728,
 *     retryAttempts: 3,
 *     retryDelay: 1000
 *   },
 *   features: {
 *     isWireGuardVPNEnabled: true,
 *     isDHCPMonitoringEnabled: true,
 *     isFirewallViewerEnabled: true,
 *     isSafetyPipelineEnabled: true
 *   }
 * };
 * ```
 */
export interface AppConfig {
  /** API server configuration */
  api: {
    /** Base URL for API endpoints */
    baseUrl: string;
    /** Request timeout in milliseconds */
    timeout: number;
  };
  /** UI/UX preferences */
  ui: {
    /** Color theme mode */
    theme: ThemeMode;
    /** Preferred language code (e.g., 'en', 'es') */
    language: string;
  };
  /** Default router connection settings */
  router: {
    /** Default RouterOS API port */
    defaultPort: number;
    /** Number of reconnection attempts */
    retryAttempts: number;
    /** Delay between retry attempts in milliseconds */
    retryDelay: number;
  };
  /** Feature enablement flags */
  features: {
    /** Enable WireGuard VPN support */
    isWireGuardVPNEnabled: boolean;
    /** Enable DHCP monitoring and management */
    isDHCPMonitoringEnabled: boolean;
    /** Enable firewall rules viewer */
    isFirewallViewerEnabled: boolean;
    /** Enable safety pipeline for config changes */
    isSafetyPipelineEnabled: boolean;
  };
}
/**
 * Router connection credentials and settings
 *
 * Contains all information needed to connect to and authenticate
 * with a MikroTik RouterOS device.
 *
 * @example
 * ```typescript
 * const connection: RouterConnectionConfig = {
 *   address: '192.168.0.1',
 *   port: 8728,
 *   username: 'admin',
 *   password: 'secret',
 *   useTLS: false,
 *   verifyCertificate: false,
 *   timeout: 10000
 * };
 * ```
 */
export interface RouterConnectionConfig {
  /** Router IP address or hostname */
  address: string;
  /** API port to connect to */
  port: number;
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
  /** Whether to use TLS/SSL encryption */
  useTLS: boolean;
  /** Whether to verify TLS certificate validity */
  verifyCertificate: boolean;
  /** Connection timeout in milliseconds */
  timeout: number;
}
/**
 * Application runtime state and user preferences
 *
 * Tracks the current router connection, saved connections,
 * and user UI preferences.
 *
 * @example
 * ```typescript
 * const state: ApplicationState = {
 *   currentRouter: { address: '192.168.0.1', port: 8728, ... },
 *   savedRouters: [],
 *   userPreferences: {
 *     theme: 'dark',
 *     language: 'en',
 *     autoRefreshInterval: 5000
 *   }
 * };
 * ```
 */
export interface ApplicationState {
  /** Currently active router connection (if connected) */
  currentRouter?: RouterConnectionConfig;
  /** List of previously saved router connections */
  readonly savedRouters: readonly RouterConnectionConfig[];
  /** User interface preferences */
  userPreferences: {
    /** Preferred color theme */
    theme: ThemeMode;
    /** Preferred UI language code */
    language: string;
    /** Auto-refresh interval in milliseconds (0 to disable) */
    autoRefreshInterval: number;
  };
}
//# sourceMappingURL=index.d.ts.map
