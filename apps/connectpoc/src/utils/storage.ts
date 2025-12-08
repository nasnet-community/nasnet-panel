import type { StorageKey, RouterInfo, RouterCredentials, ScanConfig, AppSettings } from '@shared/routeros';
import type { ManualRouterEntry } from '@/services/manual-router';

/**
 * Type-safe localStorage wrapper with JSON serialization
 */

/** Storage type map for type safety */
interface StorageTypeMap {
  'routers': RouterInfo[];
  'credentials': Record<string, RouterCredentials>;
  'scan-config': ScanConfig;
  'last-scan': number;
  'app-settings': AppSettings;
  'manual-routers': ManualRouterEntry[];
}

/** Gets item from localStorage with type safety */
export const getStorageItem = <K extends StorageKey>(
  key: K
): StorageTypeMap[K] | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return null;
  }
};

/** Sets item in localStorage with type safety */
export const setStorageItem = <K extends StorageKey>(
  key: K,
  value: StorageTypeMap[K]
): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error);
    return false;
  }
};

/** Removes item from localStorage */
export const removeStorageItem = (key: StorageKey): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
  }
};

/** Clears all application data from localStorage */
export const clearAllStorage = (): void => {
  const keys: StorageKey[] = ['routers', 'credentials', 'scan-config', 'last-scan', 'app-settings', 'manual-routers'];
  keys.forEach(removeStorageItem);
};

/** Gets routers from storage */
export const getStoredRouters = (): RouterInfo[] => {
  return getStorageItem('routers') ?? [];
};

/** Saves routers to storage */
export const saveRouters = (routers: RouterInfo[]): boolean => {
  return setStorageItem('routers', routers);
};

/** Gets stored credentials for a router */
export const getStoredCredentials = (routerId: string): RouterCredentials | null => {
  const allCredentials = getStorageItem('credentials') ?? {};
  return allCredentials[routerId] ?? null;
};

/** Saves credentials for a router */
export const saveCredentials = (routerId: string, credentials: RouterCredentials): boolean => {
  const allCredentials = getStorageItem('credentials') ?? {};
  allCredentials[routerId] = credentials;
  return setStorageItem('credentials', allCredentials);
};

/** Removes stored credentials for a router */
export const removeCredentials = (routerId: string): void => {
  const allCredentials = getStorageItem('credentials') ?? {};
  delete allCredentials[routerId];
  setStorageItem('credentials', allCredentials);
};

/** Gets scan configuration */
export const getScanConfig = (): ScanConfig => {
  return getStorageItem('scan-config') ?? {
    subnet: '192.168.1.0/24',
    timeout: 3000,
    ports: [22, 23, 80, 443, 8728, 8729] as const
  };
};

/** Saves scan configuration */
export const saveScanConfig = (config: ScanConfig): boolean => {
  return setStorageItem('scan-config', config);
};

/** Gets application settings */
export const getAppSettings = (): AppSettings => {
  return getStorageItem('app-settings') ?? {
    theme: 'auto' as const,
    autoScan: false,
    scanInterval: 300000, // 5 minutes
    defaultTimeout: 5000,
    maxRetries: 3
  };
};

/** Saves application settings */
export const saveAppSettings = (settings: AppSettings): boolean => {
  return setStorageItem('app-settings', settings);
};

/** Gets last scan timestamp */
export const getLastScanTime = (): number => {
  return getStorageItem('last-scan') ?? 0;
};

/** Saves last scan timestamp */
export const saveLastScanTime = (timestamp: number = Date.now()): boolean => {
  return setStorageItem('last-scan', timestamp);
};

/** Checks if localStorage is available */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/** Estimates storage usage in bytes */
export const getStorageUsage = (): number => {
  let totalSize = 0;
  
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
  } catch {
    return 0;
  }
  
  return totalSize;
};

/** Gets manual routers from storage */
export const getStoredManualRouters = (): ManualRouterEntry[] => {
  return getStorageItem('manual-routers') ?? [];
};

/** Saves manual routers to storage */
export const saveManualRouters = (manualRouters: ManualRouterEntry[]): boolean => {
  return setStorageItem('manual-routers', manualRouters);
};

/** Adds a manual router to storage */
export const addManualRouterToStorage = (manualRouter: ManualRouterEntry): boolean => {
  const existing = getStoredManualRouters();
  
  // Remove any existing entry for the same IP
  const filtered = existing.filter(router => router.ip !== manualRouter.ip);
  
  // Add the new/updated entry
  filtered.push(manualRouter);
  
  return saveManualRouters(filtered);
};

/** Removes a manual router from storage by IP */
export const removeManualRouterFromStorage = (ip: string): boolean => {
  const existing = getStoredManualRouters();
  const filtered = existing.filter(router => router.ip !== ip);
  
  return saveManualRouters(filtered);
};

/** Gets a specific manual router by IP */
export const getManualRouterFromStorage = (ip: string): ManualRouterEntry | null => {
  const manualRouters = getStoredManualRouters();
  return manualRouters.find(router => router.ip === ip) ?? null;
};

/** Checks if a router IP exists in manual routers storage */
export const isManualRouterStored = (ip: string): boolean => {
  return getManualRouterFromStorage(ip) !== null;
};

/** Updates manual router credentials in storage */
export const updateManualRouterCredentials = (ip: string, credentials: RouterCredentials): boolean => {
  const manualRouter = getManualRouterFromStorage(ip);
  
  if (manualRouter) {
    const updated: ManualRouterEntry = {
      ...manualRouter,
      credentials
    };
    
    return addManualRouterToStorage(updated);
  }
  
  return false;
};

/** Gets storage statistics */
export const getStorageStats = (): {
  totalRouters: number;
  manualRouters: number;
  autoRouters: number;
  storageUsage: number;
  isStorageAvailable: boolean;
} => {
  const routers = getStoredRouters();
  const manualRouters = getStoredManualRouters();
  
  return {
    totalRouters: routers.length,
    manualRouters: manualRouters.length,
    autoRouters: Math.max(0, routers.length - manualRouters.length),
    storageUsage: getStorageUsage(),
    isStorageAvailable: isStorageAvailable()
  };
};

/** Generic save function for convenience */
export const saveToStorage = <K extends StorageKey>(
  key: K,
  value: StorageTypeMap[K]
): boolean => {
  return setStorageItem(key, value);
};

/** Generic load function for convenience */
export const loadFromStorage = <K extends StorageKey>(
  key: K
): StorageTypeMap[K] | null => {
  return getStorageItem(key);
};