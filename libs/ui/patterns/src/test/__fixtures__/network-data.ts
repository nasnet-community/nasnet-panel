/**
 * Network Data Test Fixtures
 *
 * Test data for IP, MAC, subnet, and port validation testing.
 * Includes valid and invalid examples for comprehensive test coverage.
 *
 * @module @nasnet/ui/patterns/test/__fixtures__/network-data
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */

// ============================================================================
// IPv4 Test Data
// ============================================================================

export const validIPv4Addresses = [
  { value: '192.168.1.1', type: 'private', description: 'Common home network' },
  { value: '10.0.0.1', type: 'private', description: 'Class A private' },
  { value: '172.16.0.1', type: 'private', description: 'Class B private' },
  { value: '8.8.8.8', type: 'public', description: 'Google DNS' },
  { value: '1.1.1.1', type: 'public', description: 'Cloudflare DNS' },
  { value: '127.0.0.1', type: 'loopback', description: 'Localhost' },
  { value: '0.0.0.0', type: 'unspecified', description: 'Any address' },
  { value: '255.255.255.255', type: 'broadcast', description: 'Broadcast' },
  { value: '169.254.1.1', type: 'link-local', description: 'APIPA' },
  { value: '224.0.0.1', type: 'multicast', description: 'All hosts multicast' },
];

export const invalidIPv4Addresses = [
  { value: '', error: 'Empty string' },
  { value: '256.1.1.1', error: 'Octet > 255' },
  { value: '192.168.1', error: 'Incomplete (3 octets)' },
  { value: '192.168.1.1.1', error: 'Too many octets' },
  { value: 'abc.def.ghi.jkl', error: 'Non-numeric' },
  { value: '192.168.01.1', error: 'Leading zeros' },
  { value: '-1.0.0.0', error: 'Negative number' },
  { value: '192.168.1.', error: 'Trailing dot' },
  { value: '.192.168.1.1', error: 'Leading dot' },
];

export const ipv4Segments = {
  valid: ['0', '1', '127', '192', '255'],
  invalid: ['256', '-1', 'abc', '01', '001'],
};

// ============================================================================
// CIDR Test Data
// ============================================================================

export const validCIDRNotations = [
  { value: '192.168.1.0/24', mask: '255.255.255.0', hosts: 254 },
  { value: '10.0.0.0/8', mask: '255.0.0.0', hosts: 16777214 },
  { value: '172.16.0.0/12', mask: '255.240.0.0', hosts: 1048574 },
  { value: '192.168.1.0/30', mask: '255.255.255.252', hosts: 2 },
  { value: '192.168.1.0/32', mask: '255.255.255.255', hosts: 1 },
  { value: '0.0.0.0/0', mask: '0.0.0.0', hosts: 4294967294 },
];

export const invalidCIDRNotations = [
  { value: '192.168.1.0/33', error: 'Prefix > 32' },
  { value: '192.168.1.0/-1', error: 'Negative prefix' },
  { value: '192.168.1.0/', error: 'Missing prefix' },
  { value: '192.168.1.0/abc', error: 'Non-numeric prefix' },
];

// ============================================================================
// MAC Address Test Data
// ============================================================================

export const validMACAddresses = [
  { value: 'AA:BB:CC:DD:EE:FF', format: 'colon' },
  { value: 'AA-BB-CC-DD-EE-FF', format: 'dash' },
  { value: 'AABB.CCDD.EEFF', format: 'cisco' },
  { value: 'aa:bb:cc:dd:ee:ff', format: 'colon-lowercase' },
  { value: '00:00:00:00:00:00', format: 'zero' },
  { value: 'FF:FF:FF:FF:FF:FF', format: 'broadcast' },
];

export const invalidMACAddresses = [
  { value: '', error: 'Empty string' },
  { value: 'AA:BB:CC:DD:EE', error: 'Incomplete (5 groups)' },
  { value: 'AA:BB:CC:DD:EE:FF:GG', error: 'Too many groups' },
  { value: 'GG:HH:II:JJ:KK:LL', error: 'Invalid hex characters' },
  { value: 'AA:BB:CC:DD:EE:FFF', error: 'Invalid octet length' },
];

// ============================================================================
// Port Test Data
// ============================================================================

export const validPorts = [
  { value: 1, name: 'tcpmux', description: 'TCP port multiplexer' },
  { value: 22, name: 'ssh', description: 'Secure Shell' },
  { value: 80, name: 'http', description: 'HTTP' },
  { value: 443, name: 'https', description: 'HTTPS' },
  { value: 3389, name: 'rdp', description: 'Remote Desktop' },
  { value: 8080, name: 'http-alt', description: 'HTTP alternate' },
  { value: 65535, name: null, description: 'Maximum port' },
];

export const invalidPorts = [
  { value: 0, error: 'Port 0 is reserved' },
  { value: -1, error: 'Negative port' },
  { value: 65536, error: 'Port > 65535' },
  { value: 'abc', error: 'Non-numeric' },
];

export const portRanges = {
  valid: [
    { start: 80, end: 443, description: 'HTTP to HTTPS' },
    { start: 1024, end: 49151, description: 'Registered ports' },
    { start: 49152, end: 65535, description: 'Dynamic ports' },
  ],
  invalid: [
    { start: 443, end: 80, error: 'Start > End' },
    { start: -1, end: 100, error: 'Negative start' },
    { start: 100, end: 65536, error: 'End > 65535' },
  ],
};

// ============================================================================
// Well-Known Service Ports
// ============================================================================

export const wellKnownPorts: Record<number, string> = {
  20: 'FTP Data',
  21: 'FTP Control',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  67: 'DHCP Server',
  68: 'DHCP Client',
  69: 'TFTP',
  80: 'HTTP',
  110: 'POP3',
  123: 'NTP',
  137: 'NetBIOS Name',
  138: 'NetBIOS Datagram',
  139: 'NetBIOS Session',
  143: 'IMAP',
  161: 'SNMP',
  162: 'SNMP Trap',
  389: 'LDAP',
  443: 'HTTPS',
  445: 'SMB',
  514: 'Syslog',
  636: 'LDAPS',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1521: 'Oracle',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP Alt',
  8443: 'HTTPS Alt',
  27017: 'MongoDB',
};

// ============================================================================
// Interface Test Data
// ============================================================================

export const interfaceTypes = ['ethernet', 'bridge', 'vlan', 'wireless', 'loopback', 'tunnel'] as const;
export type InterfaceType = typeof interfaceTypes[number];

export const mockInterfaces = [
  {
    name: 'ether1',
    type: 'ethernet' as InterfaceType,
    status: 'up',
    mac: 'AA:BB:CC:DD:EE:01',
    ip: '192.168.1.1',
  },
  {
    name: 'ether2',
    type: 'ethernet' as InterfaceType,
    status: 'up',
    mac: 'AA:BB:CC:DD:EE:02',
    ip: '192.168.2.1',
  },
  {
    name: 'bridge1',
    type: 'bridge' as InterfaceType,
    status: 'up',
    mac: 'AA:BB:CC:DD:EE:10',
    ip: '192.168.10.1',
  },
  {
    name: 'vlan100',
    type: 'vlan' as InterfaceType,
    status: 'up',
    mac: 'AA:BB:CC:DD:EE:64',
    ip: '192.168.100.1',
    vlanId: 100,
  },
  {
    name: 'wlan1',
    type: 'wireless' as InterfaceType,
    status: 'down',
    mac: 'AA:BB:CC:DD:EE:20',
  },
  {
    name: 'lo',
    type: 'loopback' as InterfaceType,
    status: 'up',
    ip: '127.0.0.1',
  },
];
