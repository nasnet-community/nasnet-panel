/**
 * Router Hardware Types
 * Type definitions for RouterOS hardware information
 */
/**
 * Routerboard Hardware Information
 * Information about the physical MikroTik device
 *
 * @example
 * const hwInfo: RouterboardInfo = {
 *   serialNumber: 'ABC123',
 *   currentFirmware: '7.14.2',
 *   factoryFirmware: '7.0.0',
 *   model: 'RB4011iGS+5HacQ2HnD',
 *   revision: 'r1'
 * };
 */
export interface RouterboardInfo {
  /** Device serial number */
  serialNumber: string;
  /** Currently installed firmware version */
  currentFirmware: string;
  /** Factory-installed firmware version */
  factoryFirmware: string;
  /** Routerboard model identifier */
  model: string;
  /** Hardware revision */
  revision: string;
}
//# sourceMappingURL=hardware.d.ts.map
