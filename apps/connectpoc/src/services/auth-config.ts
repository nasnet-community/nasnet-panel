import type { RouterCredentials } from '@shared/routeros';

/**
 * Global authentication configuration for MikroTik routers
 * Ensures all requests (scanning, API calls) use the correct credentials
 */

interface AuthConfig {
  defaultCredentials: RouterCredentials;
  routerSpecificCredentials: Map<string, RouterCredentials>;
}

// Global authentication configuration
const authConfig: AuthConfig = {
  defaultCredentials: {
    username: 'admin',
    password: 'Slate6161', // Default credentials for your network
  },
  routerSpecificCredentials: new Map(),
};

/**
 * Set default credentials for all router operations
 * This ensures scanning and API requests use the correct authentication
 */
export const setDefaultCredentials = (credentials: RouterCredentials): void => {
  authConfig.defaultCredentials = { ...credentials };
};

/**
 * Set specific credentials for a particular router
 * Useful when different routers have different credentials
 */
export const setRouterCredentials = (routerIp: string, credentials: RouterCredentials): void => {
  authConfig.routerSpecificCredentials.set(routerIp, { ...credentials });
};

/**
 * Get credentials for a specific router
 * Returns router-specific credentials if available, otherwise default credentials
 */
export const getRouterCredentials = (routerIp: string): RouterCredentials => {
  return authConfig.routerSpecificCredentials.get(routerIp) || authConfig.defaultCredentials;
};

/**
 * Get default credentials for scanning operations
 * Used by scanners to authenticate with discovered routers
 */
export const getDefaultCredentials = (): RouterCredentials => {
  return { ...authConfig.defaultCredentials };
};

/**
 * Clear all router-specific credentials
 * Useful for security or when changing network setups
 */
export const clearRouterCredentials = (): void => {
  authConfig.routerSpecificCredentials.clear();
};

/**
 * Check if credentials are properly configured
 */
export const validateAuthConfig = (): boolean => {
  return (
    authConfig.defaultCredentials.username.length > 0 &&
    typeof authConfig.defaultCredentials.password === 'string'
  );
};

/**
 * Initialize authentication with your network's credentials
 */
export const initializeAuth = (credentials?: RouterCredentials): void => {
  if (credentials) {
    setDefaultCredentials(credentials);
  }
  
  if (!validateAuthConfig()) {
    console.warn('Authentication configuration is incomplete. Default credentials may not work.');
  }
  
  console.log(`Auth initialized with username: ${authConfig.defaultCredentials.username}`);
};

/**
 * Get auth configuration summary for debugging
 */
export const getAuthConfigSummary = () => {
  return {
    defaultUsername: authConfig.defaultCredentials.username,
    hasPassword: Boolean(authConfig.defaultCredentials.password),
    routerSpecificCount: authConfig.routerSpecificCredentials.size,
    isValid: validateAuthConfig(),
  };
};

// Initialize with your credentials on module load
initializeAuth();

export default {
  setDefaultCredentials,
  setRouterCredentials,
  getRouterCredentials,
  getDefaultCredentials,
  clearRouterCredentials,
  validateAuthConfig,
  initializeAuth,
  getAuthConfigSummary,
};