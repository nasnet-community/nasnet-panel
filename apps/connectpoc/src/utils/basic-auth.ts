import type { RouterCredentials } from '@shared/routeros';

/**
 * Basic Authentication utilities for MikroTik RouterOS REST API
 * 
 * RouterOS REST API uses HTTP Basic Authentication:
 * - No separate authentication endpoint
 * - Credentials are sent with every request
 * - Uses same credentials as console login
 * - Default: username "admin" with empty password
 */

/** Encrypted credential storage key prefix */
const CREDENTIAL_PREFIX = 'mikrotik_creds_';

/** Simple XOR encryption key - in production, use proper encryption */
const ENCRYPTION_KEY = 'MikroTikRouterOSRESTAPI2024';

/**
 * Creates a Basic Authentication header value
 * @param username - RouterOS username (default: "admin")
 * @param password - RouterOS password (default: empty string)
 * @returns Base64 encoded Basic Auth header value
 */
export const createBasicAuthHeader = (username: string, password: string): string => {
  // Handle default RouterOS credentials
  const user = username || 'admin';
  const pass = password || '';
  
  // Create Basic Auth string: "username:password"
  const credentials = `${user}:${pass}`;
  
  // Encode as Base64
  const encoded = btoa(credentials);
  
  return `Basic ${encoded}`;
};

/**
 * Validates RouterOS credentials format
 * @param credentials - The credentials to validate
 * @returns True if credentials are valid format
 */
export const validateCredentials = (credentials: RouterCredentials): boolean => {
  // Username is required (RouterOS default is "admin")
  if (!credentials.username || typeof credentials.username !== 'string') {
    return false;
  }
  
  // Password can be empty (RouterOS default)
  if (credentials.password !== undefined && typeof credentials.password !== 'string') {
    return false;
  }
  
  // Username should not be empty or just whitespace
  if (credentials.username.trim().length === 0) {
    return false;
  }
  
  return true;
};

/**
 * Get default RouterOS credentials
 * @returns Default credentials for MikroTik routers
 */
export const getDefaultCredentials = (): RouterCredentials => {
  return {
    username: 'admin',
    password: '',
  };
};

/**
 * Simple XOR encryption for credential storage
 * Note: In production, use proper encryption like AES
 * @param text - Text to encrypt/decrypt
 * @param key - Encryption key
 * @returns Encrypted/decrypted text
 */
const xorEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};

/**
 * Encrypts credentials for secure storage
 * @param credentials - Credentials to encrypt
 * @returns Encrypted credentials string
 */
export const encryptCredentials = (credentials: RouterCredentials): string => {
  try {
    const json = JSON.stringify(credentials);
    const encrypted = xorEncrypt(json, ENCRYPTION_KEY);
    return btoa(encrypted); // Base64 encode for storage
  } catch (error) {
    console.error('Failed to encrypt credentials:', error);
    throw new Error('Credential encryption failed');
  }
};

/**
 * Decrypts stored credentials
 * @param encryptedData - Encrypted credentials string
 * @returns Decrypted credentials or null if invalid
 */
export const decryptCredentials = (encryptedData: string): RouterCredentials | null => {
  try {
    const decoded = atob(encryptedData);
    const decrypted = xorEncrypt(decoded, ENCRYPTION_KEY);
    const credentials = JSON.parse(decrypted) as RouterCredentials;
    
    // Validate decrypted credentials
    if (validateCredentials(credentials)) {
      return credentials;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to decrypt credentials:', error);
    return null;
  }
};

/**
 * Stores credentials securely in localStorage
 * @param routerIp - Router IP address as identifier
 * @param credentials - Credentials to store
 */
export const storeCredentials = (routerIp: string, credentials: RouterCredentials): void => {
  try {
    if (!validateCredentials(credentials)) {
      throw new Error('Invalid credentials format');
    }
    
    const encrypted = encryptCredentials(credentials);
    const key = `${CREDENTIAL_PREFIX}${routerIp}`;
    
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to store credentials:', error);
    throw new Error('Failed to save credentials');
  }
};

/**
 * Retrieves stored credentials for a router
 * @param routerIp - Router IP address
 * @returns Stored credentials or null if not found
 */
export const getStoredCredentials = (routerIp: string): RouterCredentials | null => {
  try {
    const key = `${CREDENTIAL_PREFIX}${routerIp}`;
    const encryptedData = localStorage.getItem(key);
    
    if (!encryptedData) {
      return null;
    }
    
    return decryptCredentials(encryptedData);
  } catch (error) {
    console.error('Failed to retrieve credentials:', error);
    return null;
  }
};

/**
 * Removes stored credentials for a router
 * @param routerIp - Router IP address
 */
export const removeStoredCredentials = (routerIp: string): void => {
  try {
    const key = `${CREDENTIAL_PREFIX}${routerIp}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove credentials:', error);
  }
};

/**
 * Lists all router IPs with stored credentials
 * @returns Array of router IP addresses
 */
export const getStoredRouterIps = (): string[] => {
  try {
    const ips: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CREDENTIAL_PREFIX)) {
        const ip = key.substring(CREDENTIAL_PREFIX.length);
        ips.push(ip);
      }
    }
    
    return ips;
  } catch (error) {
    console.error('Failed to get stored router IPs:', error);
    return [];
  }
};

/**
 * Clears all stored credentials
 */
export const clearAllStoredCredentials = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CREDENTIAL_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear stored credentials:', error);
  }
};

/**
 * Tests if credentials format is compatible with RouterOS
 * @param credentials - Credentials to test
 * @returns Validation result with details
 */
export const testCredentialsFormat = (credentials: RouterCredentials): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (!credentials.username) {
    issues.push('Username is required');
  } else if (credentials.username.trim() !== credentials.username) {
    issues.push('Username should not have leading/trailing spaces');
  } else if (credentials.username.includes(':')) {
    issues.push('Username cannot contain colon (:) character');
  }
  
  if (credentials.password !== undefined) {
    if (typeof credentials.password !== 'string') {
      issues.push('Password must be a string');
    } else if (credentials.password.includes('\n') || credentials.password.includes('\r')) {
      issues.push('Password cannot contain newline characters');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
};

/**
 * Creates test credentials for RouterOS testing
 * @returns Various test credential combinations
 */
export const getTestCredentials = (): { name: string; credentials: RouterCredentials }[] => {
  return [
    {
      name: 'Default (admin, empty password)',
      credentials: { username: 'admin', password: '' },
    },
    {
      name: 'Admin with password',
      credentials: { username: 'admin', password: 'admin' },
    },
    {
      name: 'Custom user',
      credentials: { username: 'mikrotik', password: 'mikrotik' },
    },
  ];
};