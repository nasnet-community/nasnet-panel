/**
 * IP Address Utilities
 * Provides functions for IPv4 validation and conversion
 */
/**
 * Validates if a string is a valid IPv4 address
 * @param ip - The IP address string to validate
 * @returns true if valid IPv4, false otherwise
 *
 * @example
 * isValidIPv4('192.168.1.1') // => true
 * isValidIPv4('256.0.0.1') // => false
 * isValidIPv4('not an ip') // => false
 */
export declare const isValidIPv4: (ip: string) => boolean;
/**
 * Validates if a string is a valid CIDR subnet notation
 * @param cidr - The CIDR notation to validate (e.g., "192.168.1.0/24")
 * @returns true if valid CIDR, false otherwise
 *
 * @example
 * isValidSubnet('192.168.1.0/24') // => true
 * isValidSubnet('192.168.1.0/33') // => false
 * isValidSubnet('192.168.1.0') // => false
 */
export declare const isValidSubnet: (cidr: string) => boolean;
/**
 * Converts an IPv4 address to a 32-bit number
 * @param ip - The IPv4 address string
 * @returns The numerical representation, or 0 if invalid
 *
 * @example
 * ipToNumber('192.168.1.1') // => 3232235777
 * ipToNumber('0.0.0.0') // => 0
 * ipToNumber('255.255.255.255') // => 4294967295
 */
export declare const ipToNumber: (ip: string) => number;
/**
 * Converts a 32-bit number back to IPv4 address format
 * @param num - The numerical representation
 * @returns The IPv4 address string
 *
 * @example
 * numberToIP(3232235777) // => '192.168.1.1'
 * numberToIP(0) // => '0.0.0.0'
 * numberToIP(4294967295) // => '255.255.255.255'
 */
export declare const numberToIP: (num: number) => string;
/**
 * Parses CIDR notation and returns network, netmask, and broadcast addresses
 * @param cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns Object with network, netmask, and broadcast addresses, or null if invalid
 *
 * @example
 * parseCIDR('192.168.1.0/24') // => { network: '192.168.1.0', netmask: '255.255.255.0', broadcast: '192.168.1.255', prefix: 24 }
 * parseCIDR('10.0.0.0/8') // => { network: '10.0.0.0', netmask: '255.0.0.0', broadcast: '10.255.255.255', prefix: 8 }
 */
export declare const parseCIDR: (cidr: string) => {
    network: string;
    netmask: string;
    broadcast: string;
    prefix: number;
} | null;
/**
 * Compares two IPv4 addresses numerically
 * @param ip1 - First IP address
 * @param ip2 - Second IP address
 * @returns Negative if ip1 < ip2, positive if ip1 > ip2, 0 if equal
 *
 * @example
 * compareIPv4('192.168.1.1', '192.168.1.2') // => negative number
 * compareIPv4('10.0.0.1', '10.0.0.1') // => 0
 * compareIPv4('192.168.2.1', '192.168.1.1') // => positive number
 */
export declare const compareIPv4: (ip1: string, ip2: string) => number;
/**
 * Validates if a string is a valid MAC address
 * @param mac - The MAC address string to validate
 * @returns true if valid MAC address, false otherwise
 *
 * @example
 * isValidMACAddress('00:1A:2B:3C:4D:5E') // => true
 * isValidMACAddress('00-1A-2B-3C-4D-5E') // => true
 * isValidMACAddress('001A2B3C4D5E') // => true
 * isValidMACAddress('invalid') // => false
 */
export declare const isValidMACAddress: (mac: string) => boolean;
/**
 * Checks if an IP address is within a given subnet
 * @param ip - The IP address to check
 * @param cidr - The CIDR subnet notation
 * @returns true if IP is within the subnet, false otherwise
 *
 * @example
 * isIPInSubnet('192.168.1.100', '192.168.1.0/24') // => true
 * isIPInSubnet('192.168.2.100', '192.168.1.0/24') // => false
 */
export declare const isIPInSubnet: (ip: string, cidr: string) => boolean;
/**
 * Gets the host count in a subnet
 * @param cidr - The CIDR subnet notation
 * @returns Number of usable hosts, or 0 if invalid
 *
 * @example
 * getHostCount('192.168.1.0/24') // => 254 (256 - 2)
 * getHostCount('192.168.1.0/25') // => 126 (128 - 2)
 */
export declare const getHostCount: (cidr: string) => number;
/**
 * Gets the first usable host IP in a subnet
 * @param cidr - The CIDR subnet notation
 * @returns First usable IP address, or empty string if invalid
 *
 * @example
 * getFirstHost('192.168.1.0/24') // => '192.168.1.1'
 * getFirstHost('10.0.0.0/8') // => '10.0.0.1'
 */
export declare const getFirstHost: (cidr: string) => string;
/**
 * Gets the last usable host IP in a subnet
 * @param cidr - The CIDR subnet notation
 * @returns Last usable IP address, or empty string if invalid
 *
 * @example
 * getLastHost('192.168.1.0/24') // => '192.168.1.254'
 * getLastHost('10.0.0.0/8') // => '10.255.255.254'
 */
export declare const getLastHost: (cidr: string) => string;
/**
 * Converts a prefix length to a netmask (e.g., 24 => 255.255.255.0)
 * @param prefix - Prefix length (0-32)
 * @returns Netmask in dotted decimal notation
 *
 * @example
 * getPrefixMask(24) // => '255.255.255.0'
 * getPrefixMask(16) // => '255.255.0.0'
 * getPrefixMask(8) // => '255.0.0.0'
 */
export declare const getPrefixMask: (prefix: number) => string;
/**
 * Converts a netmask to a prefix length (e.g., 255.255.255.0 => 24)
 * @param mask - Netmask in dotted decimal notation
 * @returns Prefix length (0-32), or -1 if invalid
 *
 * @example
 * getMaskPrefix('255.255.255.0') // => 24
 * getMaskPrefix('255.255.0.0') // => 16
 * getMaskPrefix('255.0.0.0') // => 8
 */
export declare const getMaskPrefix: (mask: string) => number;
/**
 * Validates if a string is a valid netmask
 * @param mask - Netmask in dotted decimal notation
 * @returns true if valid netmask, false otherwise
 *
 * @example
 * isValidMask('255.255.255.0') // => true
 * isValidMask('255.255.254.0') // => true
 * isValidMask('255.255.255.1') // => false (not contiguous 1s)
 */
export declare const isValidMask: (mask: string) => boolean;
/**
 * Formats a MAC address to uppercase with colon separators
 * @param mac - MAC address in any supported format (with colons, dashes, or no separators)
 * @returns Formatted MAC address as XX:XX:XX:XX:XX:XX, or original string if invalid
 *
 * @example
 * formatMACAddress('AABBCCDDEEFF') // => 'AA:BB:CC:DD:EE:FF'
 * formatMACAddress('aa:bb:cc:dd:ee:ff') // => 'AA:BB:CC:DD:EE:FF'
 * formatMACAddress('AA-BB-CC-DD-EE-FF') // => 'AA:BB:CC:DD:EE:FF'
 */
export declare const formatMACAddress: (mac: string) => string;
/**
 * Gets detailed subnet information
 * @param cidr - CIDR subnet notation
 * @returns Object with network, broadcast, first/last host, prefix, and host count
 *
 * @example
 * getSubnetInfo('192.168.1.0/24')
 * // => {
 * //   network: '192.168.1.0',
 * //   broadcast: '192.168.1.255',
 * //   firstHost: '192.168.1.1',
 * //   lastHost: '192.168.1.254',
 * //   prefix: 24,
 * //   netmask: '255.255.255.0',
 * //   hostCount: 254,
 * //   totalAddresses: 256
 * // }
 */
export declare const getSubnetInfo: (cidr: string) => {
    network: string;
    broadcast: string;
    firstHost: string;
    lastHost: string;
    prefix: number;
    netmask: string;
    hostCount: number;
    totalAddresses: number;
} | null;
//# sourceMappingURL=ip.d.ts.map