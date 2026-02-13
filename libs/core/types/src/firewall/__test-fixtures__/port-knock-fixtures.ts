/**
 * Port Knocking Test Fixtures
 *
 * Mock data and test fixtures for port knocking tests.
 * Used across unit tests, integration tests, and Storybook stories.
 *
 * @module @nasnet/core/types/firewall
 */

import type {
  PortKnockSequence,
  PortKnockAttempt,
  KnockPort,
  KnockProtocol,
  KnockStatus,
} from '../port-knock.types';

// =============================================================================
// Valid Test Data
// =============================================================================

/**
 * Valid knock ports for testing
 */
export const VALID_KNOCK_PORTS: KnockPort[] = [
  { port: 1234, protocol: 'tcp', order: 1 },
  { port: 5678, protocol: 'tcp', order: 2 },
  { port: 9012, protocol: 'udp', order: 3 },
];

export const VALID_KNOCK_PORTS_4: KnockPort[] = [
  { port: 7001, protocol: 'tcp', order: 1 },
  { port: 7002, protocol: 'tcp', order: 2 },
  { port: 7003, protocol: 'udp', order: 3 },
  { port: 7004, protocol: 'tcp', order: 4 },
];

export const VALID_KNOCK_PORTS_8: KnockPort[] = [
  { port: 8001, protocol: 'tcp', order: 1 },
  { port: 8002, protocol: 'tcp', order: 2 },
  { port: 8003, protocol: 'tcp', order: 3 },
  { port: 8004, protocol: 'udp', order: 4 },
  { port: 8005, protocol: 'tcp', order: 5 },
  { port: 8006, protocol: 'tcp', order: 6 },
  { port: 8007, protocol: 'udp', order: 7 },
  { port: 8008, protocol: 'tcp', order: 8 },
];

/**
 * Valid minimal port knock sequence (2 ports)
 */
export const VALID_SEQUENCE_MINIMAL: Partial<PortKnockSequence> = {
  name: 'minimal_knock',
  knockPorts: [
    { port: 1111, protocol: 'tcp', order: 1 },
    { port: 2222, protocol: 'tcp', order: 2 },
  ],
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Valid SSH protection sequence (realistic scenario)
 */
export const VALID_SEQUENCE_SSH: Partial<PortKnockSequence> = {
  name: 'ssh_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '10m',
  knockTimeout: '30s',
  enabled: true,
};

/**
 * Valid HTTP protection sequence
 */
export const VALID_SEQUENCE_HTTP: Partial<PortKnockSequence> = {
  name: 'web_knock',
  knockPorts: VALID_KNOCK_PORTS_4,
  protectedPort: 80,
  protectedProtocol: 'tcp',
  accessTimeout: '1h',
  knockTimeout: '20s',
  enabled: true,
};

/**
 * Valid complex sequence (8 ports, mixed protocols)
 */
export const VALID_SEQUENCE_COMPLEX: Partial<PortKnockSequence> = {
  name: 'complex_knock_123',
  knockPorts: VALID_KNOCK_PORTS_8,
  protectedPort: 443,
  protectedProtocol: 'tcp',
  accessTimeout: '2h',
  knockTimeout: '1m',
  enabled: true,
};

/**
 * Valid disabled sequence
 */
export const VALID_SEQUENCE_DISABLED: Partial<PortKnockSequence> = {
  name: 'disabled_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 3389,
  protectedProtocol: 'tcp',
  accessTimeout: '30m',
  knockTimeout: '25s',
  enabled: false,
};

/**
 * Complete sequence with all fields (for API responses)
 */
export const COMPLETE_SEQUENCE: PortKnockSequence = {
  id: 'seq-123-abc',
  name: 'ssh_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '10m',
  knockTimeout: '30s',
  enabled: true,
  routerId: 'router-456-def',
  createdAt: '2026-02-07T10:00:00Z',
  updatedAt: '2026-02-07T10:00:00Z',
  recentAccessCount: 5,
  generatedRuleIds: ['*1', '*2', '*3', '*4'],
};

// =============================================================================
// Invalid Test Data (for validation testing)
// =============================================================================

/**
 * Invalid sequence name (contains spaces)
 */
export const INVALID_NAME_SPACES: Partial<PortKnockSequence> = {
  name: 'invalid name with spaces',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid sequence name (special characters)
 */
export const INVALID_NAME_SPECIAL_CHARS: Partial<PortKnockSequence> = {
  name: 'invalid@name!',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid sequence name (too long - 33 chars)
 */
export const INVALID_NAME_TOO_LONG: Partial<PortKnockSequence> = {
  name: 'a'.repeat(33),
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid sequence name (empty)
 */
export const INVALID_NAME_EMPTY: Partial<PortKnockSequence> = {
  name: '',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid knock ports (only 1 port - minimum is 2)
 */
export const INVALID_KNOCK_PORTS_TOO_FEW: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: [{ port: 1234, protocol: 'tcp', order: 1 }],
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid knock ports (9 ports - maximum is 8)
 */
export const INVALID_KNOCK_PORTS_TOO_MANY: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: [
    { port: 1001, protocol: 'tcp', order: 1 },
    { port: 1002, protocol: 'tcp', order: 2 },
    { port: 1003, protocol: 'tcp', order: 3 },
    { port: 1004, protocol: 'tcp', order: 4 },
    { port: 1005, protocol: 'tcp', order: 5 },
    { port: 1006, protocol: 'tcp', order: 6 },
    { port: 1007, protocol: 'tcp', order: 7 },
    { port: 1008, protocol: 'tcp', order: 8 },
    { port: 1009, protocol: 'tcp', order: 9 }, // Exceeds max
  ],
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid knock ports (duplicate ports)
 */
export const INVALID_KNOCK_PORTS_DUPLICATES: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: [
    { port: 1234, protocol: 'tcp', order: 1 },
    { port: 5678, protocol: 'tcp', order: 2 },
    { port: 1234, protocol: 'udp', order: 3 }, // Duplicate port number
  ],
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid knock port (port 0)
 */
export const INVALID_PORT_ZERO: KnockPort = {
  port: 0,
  protocol: 'tcp',
  order: 1,
};

/**
 * Invalid knock port (port 65536 - exceeds max)
 */
export const INVALID_PORT_TOO_HIGH: KnockPort = {
  port: 65536,
  protocol: 'tcp',
  order: 1,
};

/**
 * Invalid knock port (negative port)
 */
export const INVALID_PORT_NEGATIVE: KnockPort = {
  port: -1,
  protocol: 'tcp',
  order: 1,
};

/**
 * Invalid timeout format (missing unit)
 */
export const INVALID_TIMEOUT_NO_UNIT: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '300', // Missing unit (s/m/h/d)
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid timeout format (invalid unit)
 */
export const INVALID_TIMEOUT_BAD_UNIT: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15x', // Invalid unit
  enabled: true,
};

/**
 * Invalid protected port (0)
 */
export const INVALID_PROTECTED_PORT_ZERO: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 0,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Invalid protected port (65536)
 */
export const INVALID_PROTECTED_PORT_TOO_HIGH: Partial<PortKnockSequence> = {
  name: 'test_knock',
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 65536,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

// =============================================================================
// Port Knock Attempt Fixtures (for log testing)
// =============================================================================

/**
 * Successful knock attempt
 */
export const ATTEMPT_SUCCESS: PortKnockAttempt = {
  id: 'attempt-1',
  sequenceId: 'seq-123-abc',
  sequenceName: 'ssh_knock',
  sourceIP: '192.168.1.100',
  timestamp: '2026-02-07T14:30:00Z',
  status: 'success',
  portsHit: [1234, 5678, 9012],
  protectedPort: 22,
  progress: '3/3',
};

/**
 * Failed knock attempt (wrong port order)
 */
export const ATTEMPT_FAILED: PortKnockAttempt = {
  id: 'attempt-2',
  sequenceId: 'seq-123-abc',
  sequenceName: 'ssh_knock',
  sourceIP: '192.168.1.101',
  timestamp: '2026-02-07T14:31:00Z',
  status: 'failed',
  portsHit: [1234, 9012, 5678], // Wrong order
  protectedPort: 22,
  progress: '2/3',
};

/**
 * Partial knock attempt (incomplete sequence)
 */
export const ATTEMPT_PARTIAL: PortKnockAttempt = {
  id: 'attempt-3',
  sequenceId: 'seq-123-abc',
  sequenceName: 'ssh_knock',
  sourceIP: '192.168.1.102',
  timestamp: '2026-02-07T14:32:00Z',
  status: 'partial',
  portsHit: [1234, 5678],
  protectedPort: 22,
  progress: '2/3',
};

/**
 * Timeout knock attempt (exceeded knock timeout)
 */
export const ATTEMPT_TIMEOUT: PortKnockAttempt = {
  id: 'attempt-4',
  sequenceId: 'seq-123-abc',
  sequenceName: 'ssh_knock',
  sourceIP: '192.168.1.103',
  timestamp: '2026-02-07T14:33:00Z',
  status: 'timeout',
  portsHit: [1234],
  protectedPort: 22,
  progress: '1/3',
};

/**
 * Multiple attempts from same IP
 */
export const ATTEMPTS_SUSPICIOUS: PortKnockAttempt[] = [
  {
    id: 'attempt-5',
    sequenceId: 'seq-123-abc',
    sequenceName: 'ssh_knock',
    sourceIP: '10.0.0.50',
    timestamp: '2026-02-07T14:00:00Z',
    status: 'failed',
    portsHit: [1234, 5678, 1111],
    protectedPort: 22,
    progress: '2/3',
  },
  {
    id: 'attempt-6',
    sequenceId: 'seq-123-abc',
    sequenceName: 'ssh_knock',
    sourceIP: '10.0.0.50',
    timestamp: '2026-02-07T14:01:00Z',
    status: 'failed',
    portsHit: [1234, 2222, 9012],
    protectedPort: 22,
    progress: '1/3',
  },
  {
    id: 'attempt-7',
    sequenceId: 'seq-123-abc',
    sequenceName: 'ssh_knock',
    sourceIP: '10.0.0.50',
    timestamp: '2026-02-07T14:02:00Z',
    status: 'failed',
    portsHit: [5555, 6666, 7777],
    protectedPort: 22,
    progress: '0/3',
  },
];

// =============================================================================
// Boundary Test Cases
// =============================================================================

/**
 * Valid sequence name (32 chars - max allowed)
 */
export const BOUNDARY_NAME_MAX_LENGTH: Partial<PortKnockSequence> = {
  name: 'a'.repeat(32),
  knockPorts: VALID_KNOCK_PORTS,
  protectedPort: 22,
  protectedProtocol: 'tcp',
  accessTimeout: '5m',
  knockTimeout: '15s',
  enabled: true,
};

/**
 * Valid timeout formats
 */
export const VALID_TIMEOUT_FORMATS = {
  seconds: '15s',
  minutes: '5m',
  hours: '2h',
  days: '1d',
  large: '999d',
};

/**
 * Edge case: Port 1 (minimum valid port)
 */
export const BOUNDARY_PORT_MIN: KnockPort = {
  port: 1,
  protocol: 'tcp',
  order: 1,
};

/**
 * Edge case: Port 65535 (maximum valid port)
 */
export const BOUNDARY_PORT_MAX: KnockPort = {
  port: 65535,
  protocol: 'tcp',
  order: 1,
};

// =============================================================================
// Common Service Ports (for suggestions)
// =============================================================================

export const COMMON_PROTECTED_PORTS = {
  ssh: { port: 22, protocol: 'tcp' as const, name: 'SSH' },
  http: { port: 80, protocol: 'tcp' as const, name: 'HTTP' },
  https: { port: 443, protocol: 'tcp' as const, name: 'HTTPS' },
  rdp: { port: 3389, protocol: 'tcp' as const, name: 'RDP' },
  ftp: { port: 21, protocol: 'tcp' as const, name: 'FTP' },
  smtp: { port: 25, protocol: 'tcp' as const, name: 'SMTP' },
  mysql: { port: 3306, protocol: 'tcp' as const, name: 'MySQL' },
  postgres: { port: 5432, protocol: 'tcp' as const, name: 'PostgreSQL' },
};

// =============================================================================
// Collections for Storybook and E2E Tests
// =============================================================================

/**
 * Multiple sequences for table display
 */
export const MOCK_SEQUENCES: PortKnockSequence[] = [
  {
    ...COMPLETE_SEQUENCE,
    id: 'seq-1',
    name: 'ssh_knock',
    protectedPort: 22,
    enabled: true,
    recentAccessCount: 5,
  },
  {
    ...COMPLETE_SEQUENCE,
    id: 'seq-2',
    name: 'web_knock',
    knockPorts: VALID_KNOCK_PORTS_4,
    protectedPort: 80,
    enabled: true,
    recentAccessCount: 12,
  },
  {
    ...COMPLETE_SEQUENCE,
    id: 'seq-3',
    name: 'rdp_knock',
    protectedPort: 3389,
    enabled: false,
    recentAccessCount: 0,
  },
  {
    ...COMPLETE_SEQUENCE,
    id: 'seq-4',
    name: 'secure_knock_123',
    knockPorts: VALID_KNOCK_PORTS_8,
    protectedPort: 443,
    enabled: true,
    recentAccessCount: 23,
  },
];

/**
 * Multiple attempts for log viewer
 */
export const MOCK_ATTEMPTS: PortKnockAttempt[] = [
  ATTEMPT_SUCCESS,
  ATTEMPT_FAILED,
  ATTEMPT_PARTIAL,
  ATTEMPT_TIMEOUT,
  ...ATTEMPTS_SUSPICIOUS,
];
