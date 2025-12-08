/**
 * Application configuration types
 */

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  router: {
    defaultPort: number;
    retryAttempts: number;
    retryDelay: number; // milliseconds
  };
  features: {
    enableWireGuardVPN: boolean;
    enableDHCPMonitoring: boolean;
    enableFirewallViewer: boolean;
    enableSafetyPipeline: boolean;
  };
}

export interface RouterConnectionConfig {
  address: string;
  port: number;
  username: string;
  password: string;
  useTLS: boolean;
  verifyCertificate: boolean;
  timeout: number; // milliseconds
}

export interface ApplicationState {
  currentRouter?: RouterConnectionConfig;
  savedRouters: RouterConnectionConfig[];
  userPreferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoRefreshInterval: number; // milliseconds
  };
}
