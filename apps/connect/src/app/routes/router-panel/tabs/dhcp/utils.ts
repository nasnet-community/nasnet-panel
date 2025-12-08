/**
 * DHCP Utility Functions
 * Shared utilities for DHCP calculations and formatting
 */

/**
 * Calculate total IP addresses in pool ranges
 * Supports formats like:
 * - "192.168.1.10-192.168.1.100" (range)
 * - "192.168.1.50" (single IP)
 * 
 * @param ranges Array of IP range strings
 * @returns Total number of IP addresses
 */
export function calculatePoolSize(ranges: string[]): number {
  let total = 0;
  
  for (const range of ranges) {
    const [start, end] = range.split('-').map(ip => ip.trim());
    if (!end) {
      // Single IP address
      total += 1;
      continue;
    }
    
    // Parse IP addresses to octets
    const startOctets = start.split('.').map(Number);
    const endOctets = end.split('.').map(Number);
    
    // Convert to 32-bit unsigned integer for calculation
    const startNum = (startOctets[0] << 24) + (startOctets[1] << 16) + (startOctets[2] << 8) + startOctets[3];
    const endNum = (endOctets[0] << 24) + (endOctets[1] << 16) + (endOctets[2] << 8) + endOctets[3];
    
    // Add range size (inclusive of both ends)
    total += (endNum - startNum) + 1;
  }
  
  return total;
}

/**
 * Get utilization color based on percentage
 * @param percent Utilization percentage (0-100)
 * @returns Tailwind text color class
 */
export function getUtilizationTextColor(percent: number): string {
  if (percent >= 90) return 'text-red-500';
  if (percent >= 70) return 'text-amber-500';
  return 'text-emerald-500';
}

/**
 * Get utilization background color based on percentage
 * @param percent Utilization percentage (0-100)
 * @returns Tailwind background color class
 */
export function getUtilizationBgColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}




