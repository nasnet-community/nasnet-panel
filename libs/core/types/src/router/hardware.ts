/**
 * Router Hardware Types
 * Type definitions for RouterOS hardware information
 */

/**
 * Routerboard Hardware Information
 * Information about the physical MikroTik device
 */
export interface RouterboardInfo {
  /**
   * Device serial number
   */
  serialNumber: string;

  /**
   * Currently installed firmware version
   */
  currentFirmware: string;

  /**
   * Factory-installed firmware version
   */
  factoryFirmware: string;

  /**
   * Routerboard model identifier
   */
  model: string;

  /**
   * Hardware revision
   */
  revision: string;
}
