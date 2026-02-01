export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Bandwidth string with unit (e.g., "10M", "1G", "100k") */
  Bandwidth: { input: string; output: string; }
  /** CIDR notation for network address (e.g., "192.168.1.0/24") */
  CIDR: { input: string; output: string; }
  /** ISO 8601 datetime string (e.g., "2024-01-15T10:30:00Z") */
  DateTime: { input: string; output: string; }
  /** Duration string in RouterOS format (e.g., "1d2h3m4s", "30s", "5m") */
  Duration: { input: string; output: string; }
  /**
   * IPv4 address string (e.g., "192.168.1.1")
   * Validated format: XXX.XXX.XXX.XXX where XXX is 0-255
   */
  IPv4: { input: string; output: string; }
  /** IPv6 address string (e.g., "2001:0db8:85a3:0000:0000:8a2e:0370:7334") */
  IPv6: { input: string; output: string; }
  /** Arbitrary JSON data for flexible configuration */
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
  /** MAC address string (e.g., "00:1A:2B:3C:4D:5E" or "00-1A-2B-3C-4D-5E") */
  MAC: { input: string; output: string; }
  /** TCP/UDP port number (1-65535) */
  Port: { input: number; output: number; }
  /** Port range string (e.g., "80", "80-443", "80,443,8080") */
  PortRange: { input: string; output: string; }
  /** Size in bytes with optional unit (e.g., "1024", "1k", "1M", "1G") */
  Size: { input: string; output: string; }
  /**
   * ULID (Universally Unique Lexicographically Sortable Identifier)
   * A 26-character string that is time-sortable and globally unique.
   * Example: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
   */
  ULID: { input: any; output: any; }
};

/**
 * Input for manually adding a new router with full credentials and protocol preference.
 * This is the primary input type for the addRouter mutation.
 */
export type AddRouterInput = {
  /**
   * Router hostname or IP address.
   * Can be an IPv4 address (e.g., '192.168.88.1'), IPv6 address, or hostname (e.g., 'router.local').
   * Hostnames will trigger DNS resolution with caching.
   */
  readonly host: Scalars['String']['input'];
  /**
   * User-friendly display name for the router.
   * If not provided, a name will be generated from the host.
   */
  readonly name?: InputMaybe<Scalars['String']['input']>;
  /**
   * Password for authentication.
   * This value is encrypted before storage and never logged.
   */
  readonly password: Scalars['String']['input'];
  /**
   * Connection port. If not specified, defaults to protocol-specific port:
   * - REST: 443 (or 80 for HTTP)
   * - API: 8728
   * - API_SSL: 8729
   * - SSH: 22
   * - Telnet: 23
   */
  readonly port?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Protocol preference for connection.
   * Defaults to AUTO which tries protocols in recommended order.
   */
  readonly protocolPreference?: InputMaybe<ProtocolPreference>;
  /**
   * Username for authentication.
   * For MikroTik routers, this is typically 'admin' or a custom user.
   */
  readonly username: Scalars['String']['input'];
};

/**
 * Payload returned from the addRouter mutation.
 * Contains either the created router or validation/connection errors.
 */
export type AddRouterPayload = {
  /** Connection test result from initial connection attempt */
  readonly connectionResult?: Maybe<ConnectionTestResult>;
  /** General errors that occurred during creation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The newly created router (null if errors occurred) */
  readonly router?: Maybe<Router>;
  /** Field-level validation errors for retry */
  readonly validationErrors?: Maybe<ReadonlyArray<ValidationError>>;
};

/** Authentication error codes */
export const AuthErrorCode = {
  /** Insufficient permissions */
  InsufficientRole: 'INSUFFICIENT_ROLE',
  /** Invalid username or password */
  InvalidCredentials: 'INVALID_CREDENTIALS',
  /** Password does not meet requirements */
  PasswordPolicyViolation: 'PASSWORD_POLICY_VIOLATION',
  /** Too many login attempts */
  RateLimited: 'RATE_LIMITED',
  /** Session has expired */
  SessionExpired: 'SESSION_EXPIRED',
  /** Token has expired */
  TokenExpired: 'TOKEN_EXPIRED',
  /** Token is invalid or malformed */
  TokenInvalid: 'TOKEN_INVALID'
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];
/** Authentication payload returned on successful login */
export type AuthPayload = {
  /** Token expiration timestamp */
  readonly expiresAt: Scalars['DateTime']['output'];
  /** JWT access token */
  readonly token: Scalars['String']['output'];
  /** Authenticated user */
  readonly user: User;
};

/** Authentication test status */
export type AuthStatus = {
  /** Error message (if authentication failed) */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Error code mapped to ErrorCodes (A5xx) */
  readonly errorCode?: Maybe<Scalars['String']['output']>;
  /** Whether authentication succeeded */
  readonly success: Scalars['Boolean']['output'];
  /** Whether authentication was tested */
  readonly tested: Scalars['Boolean']['output'];
};

export const CacheScope = {
  Private: 'PRIVATE',
  Public: 'PUBLIC'
} as const;

export type CacheScope = typeof CacheScope[keyof typeof CacheScope];
export type CancelScanPayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The cancelled scan task */
  readonly task?: Maybe<ScanTask>;
};

/**
 * Feature capability categories detected on routers.
 * Used to determine what features are available on a specific router.
 */
export const Capability = {
  /** Container/Docker support */
  Container: 'CONTAINER',
  /** Dude monitoring support */
  Dude: 'DUDE',
  /** Firewall features */
  Firewall: 'FIREWALL',
  /** Hotspot features */
  Hotspot: 'HOTSPOT',
  /** IPv6 support */
  Ipv6: 'IPV6',
  /** MPLS support */
  Mpls: 'MPLS',
  /** Advanced routing features */
  Routing: 'ROUTING',
  /** User Manager features */
  UserManager: 'USER_MANAGER',
  /** Virtual Interface Factory support */
  Vif: 'VIF',
  /** WireGuard VPN support */
  Wireguard: 'WIREGUARD',
  /** Wireless/WiFi support */
  Wireless: 'WIRELESS',
  /** ZeroTier support */
  Zerotier: 'ZEROTIER'
} as const;

export type Capability = typeof Capability[keyof typeof Capability];
/** Single capability with its support level and guidance */
export type CapabilityEntry = {
  /** Capability category */
  readonly capability: Capability;
  /** Human-readable description of support */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Actionable message if feature unavailable */
  readonly guidance?: Maybe<Scalars['String']['output']>;
  /** Support level */
  readonly level: CapabilityLevel;
};

/**
 * Capability support level for a feature.
 * Determines how the feature appears in the UI.
 */
export const CapabilityLevel = {
  /** Full RouterOS native support */
  Advanced: 'ADVANCED',
  /** Limited support (show with warnings) */
  Basic: 'BASIC',
  /** Complete support including container-based features */
  Full: 'FULL',
  /** Feature not supported (hide in UI) */
  None: 'NONE'
} as const;

export type CapabilityLevel = typeof CapabilityLevel[keyof typeof CapabilityLevel];
/** Type of change for resource events */
export const ChangeType = {
  Create: 'CREATE',
  Delete: 'DELETE',
  Update: 'UPDATE'
} as const;

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];
/** Event emitted when circuit breaker state changes */
export type CircuitBreakerEvent = {
  /** Consecutive failures that triggered the change */
  readonly consecutiveFailures: Scalars['Int']['output'];
  /** New state */
  readonly newState: CircuitBreakerState;
  /** Previous state */
  readonly previousState: CircuitBreakerState;
  /** Router ID */
  readonly routerId: Scalars['ID']['output'];
  /** When the state changed */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Circuit breaker state */
export const CircuitBreakerState = {
  /** Circuit is closed (normal operation) */
  Closed: 'CLOSED',
  /** Circuit is half-open (testing recovery) */
  HalfOpen: 'HALF_OPEN',
  /** Circuit is open (blocking requests) */
  Open: 'OPEN'
} as const;

export type CircuitBreakerState = typeof CircuitBreakerState[keyof typeof CircuitBreakerState];
/** Circuit breaker status for a router */
export type CircuitBreakerStatus = {
  /** Seconds until auto-retry (when circuit is open) */
  readonly cooldownRemainingSeconds?: Maybe<Scalars['Int']['output']>;
  /** Number of consecutive failures */
  readonly failureCount: Scalars['Int']['output'];
  /** Failure threshold before circuit opens */
  readonly failureThreshold: Scalars['Int']['output'];
  /** When the last failure occurred */
  readonly lastFailureAt?: Maybe<Scalars['DateTime']['output']>;
  /** When the last success occurred */
  readonly lastSuccessAt?: Maybe<Scalars['DateTime']['output']>;
  /** Router ID */
  readonly routerId: Scalars['ID']['output'];
  /** Current circuit breaker state */
  readonly state: CircuitBreakerState;
};

/** Status of a configuration apply operation */
export const ConfigApplyStatus = {
  Applying: 'APPLYING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Pending: 'PENDING',
  RolledBack: 'ROLLED_BACK',
  Validating: 'VALIDATING',
  Verifying: 'VERIFYING'
} as const;

export type ConfigApplyStatus = typeof ConfigApplyStatus[keyof typeof ConfigApplyStatus];
/** Progress information for configuration apply operations */
export type ConfigProgress = {
  /** Current step number */
  readonly currentStep?: Maybe<Scalars['Int']['output']>;
  /** Human-readable progress message */
  readonly message: Scalars['String']['output'];
  /** Unique operation identifier */
  readonly operationId: Scalars['ID']['output'];
  /** Completion percentage (0-100) */
  readonly percentage: Scalars['Int']['output'];
  /** Current status of the operation */
  readonly status: ConfigApplyStatus;
  /** Timestamp of this progress update */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Total number of steps */
  readonly totalSteps?: Maybe<Scalars['Int']['output']>;
};

export type ConnectRouterPayload = {
  /** Errors that occurred during connection */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The router that was connected */
  readonly router?: Maybe<Router>;
};

/** Connection interface for paginated results (Relay pagination) */
export type Connection = {
  /** Pagination information */
  readonly pageInfo: PageInfo;
  /** Total count of items (if available) */
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Record of a single protocol connection attempt */
export type ConnectionAttempt = {
  /** When the attempt ended */
  readonly endedAt: Scalars['DateTime']['output'];
  /** Error category for classification */
  readonly errorCategory?: Maybe<ErrorCategory>;
  /** Error code if failed */
  readonly errorCode?: Maybe<Scalars['String']['output']>;
  /** Error message if failed */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Protocol that was attempted */
  readonly protocol: Protocol;
  /** When the attempt started */
  readonly startedAt: Scalars['DateTime']['output'];
  /** Whether the attempt succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Detailed connection status for a router */
export type ConnectionDetails = {
  /** Current circuit breaker state */
  readonly circuitBreakerState: CircuitBreakerState;
  /** When the connection was established */
  readonly connectedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Reason for disconnection */
  readonly disconnectReason?: Maybe<DisconnectReason>;
  /** When the last disconnection occurred */
  readonly disconnectedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Consecutive failed health checks */
  readonly healthChecksFailed: Scalars['Int']['output'];
  /** Consecutive passed health checks */
  readonly healthChecksPassed: Scalars['Int']['output'];
  /** Whether the current protocol is considered legacy/insecure */
  readonly isLegacyProtocol: Scalars['Boolean']['output'];
  /** Most recent error message */
  readonly lastError?: Maybe<Scalars['String']['output']>;
  /** When the last error occurred */
  readonly lastErrorTime?: Maybe<Scalars['DateTime']['output']>;
  /** When the last health check was performed */
  readonly lastHealthCheck?: Maybe<Scalars['DateTime']['output']>;
  /** When the next reconnection attempt will be made */
  readonly nextReconnectAt?: Maybe<Scalars['DateTime']['output']>;
  /** User's preferred protocol (if set) */
  readonly preferredProtocol?: Maybe<Protocol>;
  /** Protocol currently in use */
  readonly protocol?: Maybe<Protocol>;
  /** Number of reconnection attempts made */
  readonly reconnectAttempts: Scalars['Int']['output'];
  /** Security warning if using insecure protocol (e.g., Telnet) */
  readonly securityWarning?: Maybe<Scalars['String']['output']>;
  /** Current connection state */
  readonly state: ConnectionStatus;
  /** Recommendation for upgrading to a more secure protocol */
  readonly upgradeRecommendation?: Maybe<Scalars['String']['output']>;
  /** Connection uptime duration */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
  /** Router version (if connected) */
  readonly version?: Maybe<Scalars['String']['output']>;
};

/**
 * Detailed error information for connection failures.
 * Used to provide actionable feedback to the user.
 */
export type ConnectionError = {
  /** Error code for programmatic handling */
  readonly code: ConnectionErrorCode;
  /** Human-readable error message */
  readonly message: Scalars['String']['output'];
  /** Protocol that failed (if specific to a protocol) */
  readonly protocol?: Maybe<Protocol>;
  /** Whether the error is likely transient and retryable */
  readonly retryable: Scalars['Boolean']['output'];
  /** Suggested user action to resolve the error */
  readonly suggestedAction?: Maybe<Scalars['String']['output']>;
  /** Timeout in milliseconds (if timeout error) */
  readonly timeoutMs?: Maybe<Scalars['Int']['output']>;
};

/**
 * Error codes for connection failures.
 * Each code has specific meaning and recovery suggestions.
 */
export const ConnectionErrorCode = {
  /** Authentication failed - invalid username or password */
  AuthFailed: 'AUTH_FAILED',
  /** Connection refused - port is closed or blocked */
  ConnectionRefused: 'CONNECTION_REFUSED',
  /** DNS resolution failed for hostname */
  DnsFailed: 'DNS_FAILED',
  /** Router with same host/port already exists */
  DuplicateRouter: 'DUPLICATE_ROUTER',
  /** Network unreachable - cannot reach the host */
  NetworkUnreachable: 'NETWORK_UNREACHABLE',
  /** Router responded but is not a MikroTik device */
  NotMikrotik: 'NOT_MIKROTIK',
  /** No compatible protocol found after trying all options */
  ProtocolMismatch: 'PROTOCOL_MISMATCH',
  /** Connection or response timed out */
  Timeout: 'TIMEOUT',
  /** TLS/SSL handshake failed */
  TlsError: 'TLS_ERROR',
  /** Unknown or unexpected error */
  Unknown: 'UNKNOWN'
} as const;

export type ConnectionErrorCode = typeof ConnectionErrorCode[keyof typeof ConnectionErrorCode];
/** Connection manager statistics */
export type ConnectionStats = {
  /** Number of connected routers */
  readonly connected: Scalars['Int']['output'];
  /** Number of connecting routers */
  readonly connecting: Scalars['Int']['output'];
  /** Number of disconnected routers */
  readonly disconnected: Scalars['Int']['output'];
  /** Number of routers in error state */
  readonly error: Scalars['Int']['output'];
  /** Number of reconnecting routers */
  readonly reconnecting: Scalars['Int']['output'];
  /** Total number of connections */
  readonly totalConnections: Scalars['Int']['output'];
};

/** Router connection status */
export const ConnectionStatus = {
  /** Actively connected and responsive */
  Connected: 'CONNECTED',
  /** Connection attempt in progress */
  Connecting: 'CONNECTING',
  /** Not connected */
  Disconnected: 'DISCONNECTED',
  /** Connection failed with error */
  Error: 'ERROR'
} as const;

export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];
/** Result of a connection test attempt, including protocol detection results. */
export type ConnectionTestResult = {
  /** Architecture of the router (arm, arm64, x86, etc.) */
  readonly architecture?: Maybe<Scalars['String']['output']>;
  /** Router board name (if connection succeeded) */
  readonly boardName?: Maybe<Scalars['String']['output']>;
  /** Error details if connection failed */
  readonly error?: Maybe<ConnectionError>;
  /** Protocol that was successfully used */
  readonly protocolUsed?: Maybe<Protocol>;
  /** List of protocols that were attempted */
  readonly protocolsAttempted: ReadonlyArray<Protocol>;
  /** Response time in milliseconds */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Router model detected (if connection succeeded) */
  readonly routerModel?: Maybe<Scalars['String']['output']>;
  /** RouterOS version detected (if connection succeeded) */
  readonly routerVersion?: Maybe<Scalars['String']['output']>;
  /** Whether the connection was successful */
  readonly success: Scalars['Boolean']['output'];
  /** Whether the router supports containers */
  readonly supportsContainers?: Maybe<Scalars['Boolean']['output']>;
  /** Uptime of the router (if connection succeeded) */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
};

/** Container-specific capability information */
export type ContainerInfo = {
  /** Whether container feature is enabled in system settings */
  readonly enabled: Scalars['Boolean']['output'];
  /** Maximum number of containers supported */
  readonly maxContainers?: Maybe<Scalars['Int']['output']>;
  /** Whether container package is installed */
  readonly packageInstalled: Scalars['Boolean']['output'];
  /** Whether a container registry is configured */
  readonly registryConfigured: Scalars['Boolean']['output'];
  /** Available storage for container images in bytes */
  readonly storageAvailable: Scalars['Size']['output'];
  /** Whether network namespace is supported */
  readonly supportsNetworkNamespace: Scalars['Boolean']['output'];
};

/** Input for creating a new router connection */
export type CreateRouterInput = {
  /** Router hostname or IP address */
  readonly host: Scalars['String']['input'];
  /** User-friendly display name */
  readonly name: Scalars['String']['input'];
  /** Password for authentication */
  readonly password: Scalars['String']['input'];
  /** Router platform type */
  readonly platform?: InputMaybe<RouterPlatform>;
  /** Connection port (default: 8728 for MikroTik API) */
  readonly port?: InputMaybe<Scalars['Int']['input']>;
  /** Username for authentication */
  readonly username: Scalars['String']['input'];
};

export type CreateRouterPayload = {
  /** Errors that occurred during creation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The created router */
  readonly router?: Maybe<Router>;
};

/** Error codes specific to credential operations. */
export const CredentialErrorCode = {
  /** Authentication failed with new credentials */
  AuthFailed: 'AUTH_FAILED',
  /** Connection was refused */
  ConnectionRefused: 'CONNECTION_REFUSED',
  /** Credentials not found for router */
  CredentialsNotFound: 'CREDENTIALS_NOT_FOUND',
  /** Decryption failed (key may have rotated) */
  DecryptionFailed: 'DECRYPTION_FAILED',
  /** Encryption failed */
  EncryptionFailed: 'ENCRYPTION_FAILED',
  /** Invalid input provided */
  InvalidInput: 'INVALID_INPUT',
  /** Router not found */
  RouterNotFound: 'ROUTER_NOT_FOUND',
  /** Connection timed out when testing credentials */
  Timeout: 'TIMEOUT'
} as const;

export type CredentialErrorCode = typeof CredentialErrorCode[keyof typeof CredentialErrorCode];
/** Result of testing a single router's credentials. */
export type CredentialTestResult = {
  /** Error message if test failed */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Response time in milliseconds (if successful) */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Router ID that was tested */
  readonly routerId: Scalars['ID']['output'];
  /** Router name for display */
  readonly routerName: Scalars['String']['output'];
  /** Connection status */
  readonly status: CredentialTestStatus;
  /** Whether the test was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Status of a credential test. */
export const CredentialTestStatus = {
  /** Authentication failed */
  AuthFailed: 'AUTH_FAILED',
  /** Connection was refused */
  ConnectionRefused: 'CONNECTION_REFUSED',
  /** Unknown error occurred */
  Error: 'ERROR',
  /** Network unreachable */
  NetworkError: 'NETWORK_ERROR',
  /** No credentials stored for this router */
  NoCredentials: 'NO_CREDENTIALS',
  /** Credentials are valid and connection succeeded */
  Success: 'SUCCESS',
  /** Connection timed out */
  Timeout: 'TIMEOUT'
} as const;

export type CredentialTestStatus = typeof CredentialTestStatus[keyof typeof CredentialTestStatus];
/** Result of updating router credentials. */
export type CredentialUpdatePayload = {
  /** Updated credential info (without password) */
  readonly credentials?: Maybe<RouterCredentials>;
  /** Error code if update failed */
  readonly errorCode?: Maybe<CredentialErrorCode>;
  /** Errors that occurred during update */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Human-readable message about the operation */
  readonly message: Scalars['String']['output'];
  /** Whether the update was successful */
  readonly success: Scalars['Boolean']['output'];
};

/**
 * Input for updating router credentials.
 * Both username and password must be provided.
 */
export type CredentialsInput = {
  /** Password for router authentication */
  readonly password: Scalars['String']['input'];
  /** Username for router authentication */
  readonly username: Scalars['String']['input'];
};

export type DeleteRouterPayload = {
  /** ID of the deleted router */
  readonly deletedRouterId?: Maybe<Scalars['ID']['output']>;
  /** Errors that occurred during deletion */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether deletion was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Comprehensive diagnostic report for a router */
export type DiagnosticReport = {
  /** Authentication test status */
  readonly authStatus: AuthStatus;
  /** Whether the router is reachable on the network */
  readonly networkReachable: Scalars['Boolean']['output'];
  /** Status of each checked port */
  readonly portStatus: ReadonlyArray<PortStatus>;
  /** Raw text report for clipboard/export */
  readonly rawReport: Scalars['String']['output'];
  /** Router ID being diagnosed */
  readonly routerId: Scalars['ID']['output'];
  /** Actionable suggestions based on diagnostic results */
  readonly suggestions: ReadonlyArray<DiagnosticSuggestion>;
  /** When the diagnostic was run */
  readonly timestamp: Scalars['DateTime']['output'];
  /** TLS certificate status (if TLS ports were checked) */
  readonly tlsStatus?: Maybe<TlsStatus>;
};

/** Actionable diagnostic suggestion */
export type DiagnosticSuggestion = {
  /** Recommended action to resolve the issue */
  readonly action: Scalars['String']['output'];
  /** Detailed description of the issue */
  readonly description: Scalars['String']['output'];
  /** Link to relevant documentation */
  readonly docsUrl?: Maybe<Scalars['String']['output']>;
  /** Severity level of the issue */
  readonly severity: SuggestionSeverity;
  /** Short title describing the issue */
  readonly title: Scalars['String']['output'];
};

/** Reason for router disconnection */
export const DisconnectReason = {
  /** Authentication failed */
  AuthFailure: 'AUTH_FAILURE',
  /** Circuit breaker is open */
  CircuitOpen: 'CIRCUIT_OPEN',
  /** User manually disconnected */
  Manual: 'MANUAL',
  /** Network failure */
  NetworkFailure: 'NETWORK_FAILURE',
  /** Application shutting down */
  Shutdown: 'SHUTDOWN',
  /** Connection timed out */
  Timeout: 'TIMEOUT',
  /** Unknown reason */
  Unknown: 'UNKNOWN'
} as const;

export type DisconnectReason = typeof DisconnectReason[keyof typeof DisconnectReason];
export type DisconnectRouterPayload = {
  /** Errors that occurred during disconnection */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The router that was disconnected */
  readonly router?: Maybe<Router>;
};

/**
 * A device discovered during a network scan.
 * Only confirmed MikroTik devices are returned (confidence >= 40).
 */
export type DiscoveredDevice = {
  /** Confidence score for RouterOS detection (40-100) */
  readonly confidence: Scalars['Int']['output'];
  /** Device type classification */
  readonly deviceType: Scalars['String']['output'];
  /** Hostname (if reverse DNS resolves) */
  readonly hostname?: Maybe<Scalars['String']['output']>;
  /** IP address of the discovered device */
  readonly ip: Scalars['String']['output'];
  /** Open ports found on the device */
  readonly ports: ReadonlyArray<Scalars['Int']['output']>;
  /** RouterOS-specific information (version, board, architecture) */
  readonly routerOSInfo?: Maybe<RouterOsInfo>;
  /** Detected services (mikrotik-api, mikrotik-winbox, mikrotik-rest, etc.) */
  readonly services: ReadonlyArray<Scalars['String']['output']>;
  /** Device vendor (always 'MikroTik' for returned results) */
  readonly vendor?: Maybe<Scalars['String']['output']>;
};

/** Edge interface for connection edges */
export type Edge = {
  /** Cursor for pagination */
  readonly cursor: Scalars['String']['output'];
};

/** Category of connection error for classification */
export const ErrorCategory = {
  /** Authentication failed */
  AuthFailed: 'AUTH_FAILED',
  /** Network unreachable or DNS failure */
  NetworkError: 'NETWORK_ERROR',
  /** Protocol-level error */
  ProtocolError: 'PROTOCOL_ERROR',
  /** Connection actively refused */
  Refused: 'REFUSED',
  /** Connection or response timeout */
  Timeout: 'TIMEOUT',
  /** TLS/SSL certificate or handshake error */
  TlsError: 'TLS_ERROR'
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];
/**
 * Rich error extensions for detailed error diagnostics.
 * Included in GraphQL error responses under the 'extensions' key.
 */
export type ErrorExtensions = {
  /** Error category (validation, protocol, network, auth, resource, internal) */
  readonly category: Scalars['String']['output'];
  /** Error code for programmatic handling (e.g., 'V400', 'R200') */
  readonly code: Scalars['String']['output'];
  /** Link to relevant documentation */
  readonly docsUrl?: Maybe<Scalars['String']['output']>;
  /** Field path that caused the error (e.g., 'input.listenPort') */
  readonly field?: Maybe<Scalars['String']['output']>;
  /** Whether the error is recoverable (can be retried) */
  readonly recoverable: Scalars['Boolean']['output'];
  /** Request correlation ID for support and debugging */
  readonly requestId: Scalars['String']['output'];
  /** User-friendly suggestion for fixing the error */
  readonly suggestedFix?: Maybe<Scalars['String']['output']>;
  /** Additional troubleshooting steps for complex errors */
  readonly troubleshootingSteps?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** The invalid value (redacted in production for sensitive fields) */
  readonly value?: Maybe<Scalars['JSON']['output']>;
};

/** Options for exporting router configuration. */
export type ExportConfigInput = {
  /** User-provided encryption key for credential export (required if includeCredentials is true) */
  readonly encryptionKey?: InputMaybe<Scalars['String']['input']>;
  /** Whether to include credentials (requires encryptionKey if true) */
  readonly includeCredentials?: InputMaybe<Scalars['Boolean']['input']>;
  /** Router ID to export configuration from */
  readonly routerId: Scalars['ID']['input'];
};

/** Result of exporting router configuration. */
export type ExportConfigPayload = {
  /** Exported configuration data (JSON format) */
  readonly config?: Maybe<Scalars['JSON']['output']>;
  /** Errors that occurred during export */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Security warning message about credential handling */
  readonly securityWarning?: Maybe<Scalars['String']['output']>;
  /** Whether the export was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Information about a feature in the compatibility matrix */
export type FeatureCompatibilityInfo = {
  /** Feature dependencies */
  readonly dependsOn: ReadonlyArray<Scalars['String']['output']>;
  /** Feature identifier */
  readonly featureId: Scalars['String']['output'];
  /** Maximum RouterOS version supported (if any) */
  readonly maxVersion?: Maybe<Scalars['String']['output']>;
  /** Minimum RouterOS version required */
  readonly minVersion: Scalars['String']['output'];
  /** Minimum version for CHR (if different) */
  readonly minVersionCHR?: Maybe<Scalars['String']['output']>;
  /** Human-readable feature name */
  readonly name: Scalars['String']['output'];
  /** Required packages */
  readonly requiredPackages: ReadonlyArray<Scalars['String']['output']>;
  /** URL to MikroTik documentation */
  readonly upgradeUrl?: Maybe<Scalars['String']['output']>;
};

/** Input for checking feature compatibility */
export type FeatureCompatibilityInput = {
  /** Feature identifier to check */
  readonly featureId: Scalars['String']['input'];
  /** Whether to check for CHR-specific requirements */
  readonly isCHR?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Feature support information based on RouterOS version */
export type FeatureSupport = {
  /** Feature identifier (e.g., 'rest_api', 'container', 'wireguard') */
  readonly featureId: Scalars['String']['output'];
  /** Capability level (none, basic, advanced, full) */
  readonly level: CapabilityLevel;
  /** Missing packages (if any) */
  readonly missingPackages?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Human-readable feature name */
  readonly name: Scalars['String']['output'];
  /** Reason why the feature is not supported (if applicable) */
  readonly reason?: Maybe<Scalars['String']['output']>;
  /** Required packages that need to be installed */
  readonly requiredPackages?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Minimum RouterOS version required for this feature */
  readonly requiredVersion?: Maybe<Scalars['String']['output']>;
  /** Whether the feature is supported on this router */
  readonly supported: Scalars['Boolean']['output'];
  /** URL to MikroTik documentation for upgrade guidance */
  readonly upgradeUrl?: Maybe<Scalars['String']['output']>;
};

/** Hardware information detected from router */
export type HardwareInfo = {
  /** CPU architecture (arm, arm64, x86_64, etc.) */
  readonly architecture: Scalars['String']['output'];
  /** Available storage in bytes */
  readonly availableStorage: Scalars['Size']['output'];
  /** Board name */
  readonly boardName?: Maybe<Scalars['String']['output']>;
  /** Number of CPU cores */
  readonly cpuCount: Scalars['Int']['output'];
  /** Whether LTE/cellular hardware is present */
  readonly hasLTEModule: Scalars['Boolean']['output'];
  /** Whether wireless hardware is present */
  readonly hasWirelessChip: Scalars['Boolean']['output'];
  /** Router model name */
  readonly model?: Maybe<Scalars['String']['output']>;
  /** Total RAM in bytes */
  readonly totalMemory: Scalars['Size']['output'];
};

/** Health check result for a router */
export type HealthCheckResult = {
  /** When the check was performed */
  readonly checkedAt: Scalars['DateTime']['output'];
  /** Error message if unhealthy */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Whether the router is healthy */
  readonly healthy: Scalars['Boolean']['output'];
  /** Response time in milliseconds */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Router ID */
  readonly routerId: Scalars['ID']['output'];
};

/** Overall system health status */
export type HealthStatus = {
  /** Last health check timestamp */
  readonly checkedAt: Scalars['DateTime']['output'];
  /** Connected router count */
  readonly connectedRouters: Scalars['Int']['output'];
  /** Service status */
  readonly status: ServiceStatus;
  /** Server uptime */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
  /** Service version */
  readonly version: Scalars['String']['output'];
};

/** A network interface on a router */
export type Interface = Node & {
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether the interface is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Unique interface identifier */
  readonly id: Scalars['ID']['output'];
  /** MAC address */
  readonly macAddress?: Maybe<Scalars['MAC']['output']>;
  /** MTU setting */
  readonly mtu?: Maybe<Scalars['Int']['output']>;
  /** Interface name (e.g., ether1, wlan1) */
  readonly name: Scalars['String']['output'];
  /** Whether the interface is running (link up) */
  readonly running: Scalars['Boolean']['output'];
  /** RX bytes */
  readonly rxBytes?: Maybe<Scalars['Size']['output']>;
  /** TX bytes */
  readonly txBytes?: Maybe<Scalars['Size']['output']>;
  /** Interface type */
  readonly type: InterfaceType;
};

export type InterfaceConnection = Connection & {
  readonly edges: ReadonlyArray<InterfaceEdge>;
  readonly pageInfo: PageInfo;
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

export type InterfaceEdge = Edge & {
  readonly cursor: Scalars['String']['output'];
  readonly node: Interface;
};

export type InterfaceTrafficEvent = {
  /** Interface ID */
  readonly interfaceId: Scalars['ID']['output'];
  /** Interface name */
  readonly interfaceName: Scalars['String']['output'];
  /** RX rate in bytes per second */
  readonly rxRate: Scalars['Size']['output'];
  /** Total RX bytes */
  readonly rxTotal: Scalars['Size']['output'];
  /** Timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
  /** TX rate in bytes per second */
  readonly txRate: Scalars['Size']['output'];
  /** Total TX bytes */
  readonly txTotal: Scalars['Size']['output'];
};

/** Types of network interfaces */
export const InterfaceType = {
  Bonding: 'BONDING',
  Bridge: 'BRIDGE',
  Ethernet: 'ETHERNET',
  Loopback: 'LOOPBACK',
  Other: 'OTHER',
  Ppp: 'PPP',
  Tunnel: 'TUNNEL',
  Virtual: 'VIRTUAL',
  Vlan: 'VLAN',
  Wireless: 'WIRELESS'
} as const;

export type InterfaceType = typeof InterfaceType[keyof typeof InterfaceType];
export type Mutation = {
  /**
   * Add a new router by entering its IP address and credentials.
   *
   * This mutation will:
   * 1. Validate input fields (host format, port range, etc.)
   * 2. Check for duplicate routers (same host/port)
   * 3. Resolve hostname to IP if necessary (with DNS caching)
   * 4. Test connection using protocol preference (or auto-detect)
   * 5. Store router with encrypted credentials on success
   * 6. Emit RouterAddedEvent for real-time updates
   *
   * Returns validation errors if input is invalid, or connection errors
   * if the router cannot be reached or authenticated.
   */
  readonly addRouter: AddRouterPayload;
  /**
   * Start an automatic gateway scan.
   * Scans common gateway IPs (192.168.0-255.1) to find MikroTik routers.
   * This is useful when the user doesn't know which subnet to scan.
   *
   * Only returns verified MikroTik RouterOS devices (confidence >= 40).
   */
  readonly autoScanGateways: ScanNetworkPayload;
  /**
   * Cancel a running scan.
   * The scan will stop within 1 second and partial results are preserved.
   */
  readonly cancelScan: CancelScanPayload;
  /** Change the current user's password */
  readonly changePassword: Scalars['Boolean']['output'];
  /** Perform immediate health check on a router */
  readonly checkRouterHealth: HealthCheckResult;
  /** Connect to a router */
  readonly connectRouter: ConnectRouterPayload;
  /** Add a new router to manage */
  readonly createRouter: CreateRouterPayload;
  /** Remove a router */
  readonly deleteRouter: DeleteRouterPayload;
  /** Disconnect from a router */
  readonly disconnectRouter: DisconnectRouterPayload;
  /**
   * Export router configuration with optional credential handling.
   * Credentials are excluded by default for security.
   * If includeCredentials is true, an encryptionKey must be provided.
   */
  readonly exportRouterConfig: ExportConfigPayload;
  /** Authenticate and receive a JWT token */
  readonly login: AuthPayload;
  /** Invalidate current session and clear tokens */
  readonly logout: Scalars['Boolean']['output'];
  /** Manually trigger reconnection to a router */
  readonly reconnectRouter: ReconnectRouterPayload;
  /** Force refresh router capabilities (invalidates cache) */
  readonly refreshCapabilities: RefreshCapabilitiesPayload;
  /**
   * Manually reset the circuit breaker for a router.
   * This allows immediate reconnection attempts even if the circuit is open.
   * Use with caution as it bypasses the backoff protection.
   */
  readonly resetCircuitBreaker: CircuitBreakerStatus;
  /** Revoke all sessions for a user (admin only) */
  readonly revokeAllSessions: Scalars['Boolean']['output'];
  /** Revoke a specific session */
  readonly revokeSession: Scalars['Boolean']['output'];
  /**
   * Run comprehensive diagnostics on a router connection.
   * Performs network reachability check, port scanning, TLS validation,
   * and authentication testing. Rate limited to 1 request per 10 seconds per router.
   */
  readonly runDiagnostics: DiagnosticReport;
  /**
   * Start a network scan for MikroTik routers.
   * Returns a task ID that can be used to track progress via subscription or polling.
   *
   * Supported subnet formats:
   * - CIDR: "192.168.88.0/24" (scans 254 usable IPs)
   * - Range: "192.168.1.1-192.168.1.100" (scans specified range)
   * - Single IP: "192.168.88.1" (scans one IP)
   *
   * Performance: /24 scan completes in 1-2 seconds with 20 concurrent workers.
   */
  readonly scanNetwork: ScanNetworkPayload;
  /** Set preferred protocol for a router */
  readonly setPreferredProtocol: SetPreferredProtocolPayload;
  /**
   * Test all router credentials in parallel.
   * Returns aggregate results with per-router status.
   */
  readonly testAllCredentials: TestAllCredentialsPayload;
  /** Test connection to a router */
  readonly testRouterConnection: TestConnectionPayload;
  /**
   * Test connection to a router without adding it.
   * Useful for validating credentials before committing.
   */
  readonly testRouterCredentials: ConnectionTestResult;
  /** Update router settings */
  readonly updateRouter: UpdateRouterPayload;
  /**
   * Update router credentials.
   * Tests the new credentials before saving.
   * Old credentials are preserved if the test fails.
   */
  readonly updateRouterCredentials: CredentialUpdatePayload;
};


export type MutationAddRouterArgs = {
  input: AddRouterInput;
};


export type MutationCancelScanArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationCheckRouterHealthArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationConnectRouterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateRouterArgs = {
  input: CreateRouterInput;
};


export type MutationDeleteRouterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDisconnectRouterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExportRouterConfigArgs = {
  input: ExportConfigInput;
};


export type MutationLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationReconnectRouterArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationRefreshCapabilitiesArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationResetCircuitBreakerArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationRevokeAllSessionsArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationRunDiagnosticsArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationScanNetworkArgs = {
  input: ScanNetworkInput;
};


export type MutationSetPreferredProtocolArgs = {
  protocol: Protocol;
  routerId: Scalars['ID']['input'];
};


export type MutationTestRouterConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTestRouterCredentialsArgs = {
  input: AddRouterInput;
};


export type MutationUpdateRouterArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRouterInput;
};


export type MutationUpdateRouterCredentialsArgs = {
  input: CredentialsInput;
  routerId: Scalars['ID']['input'];
};

/** Standard error type for mutations */
export type MutationError = {
  /** Error code for programmatic handling */
  readonly code: Scalars['String']['output'];
  /** Field that caused the error (if applicable) */
  readonly field?: Maybe<Scalars['String']['output']>;
  /** Human-readable error message */
  readonly message: Scalars['String']['output'];
};

/** Relay Node interface for global object identification */
export type Node = {
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
};

/** Information about pagination in a connection */
export type PageInfo = {
  /** Cursor for the last edge */
  readonly endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  readonly hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  readonly hasPreviousPage: Scalars['Boolean']['output'];
  /** Cursor for the first edge */
  readonly startCursor?: Maybe<Scalars['String']['output']>;
};

/** Standard pagination input arguments */
export type PaginationInput = {
  /** Cursor to fetch items after */
  readonly after?: InputMaybe<Scalars['String']['input']>;
  /** Cursor to fetch items before */
  readonly before?: InputMaybe<Scalars['String']['input']>;
  /** Number of items to fetch */
  readonly first?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to fetch from the end */
  readonly last?: InputMaybe<Scalars['Int']['input']>;
};

/** Status of a single port check */
export type PortStatus = {
  /** Error message (if port is closed) */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Whether the port is open and accepting connections */
  readonly open: Scalars['Boolean']['output'];
  /** Port number checked */
  readonly port: Scalars['Int']['output'];
  /** Response time in milliseconds (if port is open) */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Service name (API, API-SSL, SSH, Telnet, HTTP, HTTPS) */
  readonly service: Scalars['String']['output'];
};

/** Protocol used for router communication */
export const Protocol = {
  /** Binary API protocol (port 8728) */
  Api: 'API',
  /** TLS-encrypted binary API (port 8729) */
  ApiSsl: 'API_SSL',
  /** REST API protocol (RouterOS 7.1+) */
  Rest: 'REST',
  /** SSH protocol (port 22) */
  Ssh: 'SSH',
  /** Telnet protocol (port 23) */
  Telnet: 'TELNET'
} as const;

export type Protocol = typeof Protocol[keyof typeof Protocol];
/**
 * User preference for which protocol to use when connecting to a router.
 * AUTO will try protocols in the recommended fallback order.
 */
export const ProtocolPreference = {
  /** Force Binary API protocol (port 8728) */
  Api: 'API',
  /** Force TLS-encrypted binary API (port 8729) */
  ApiSsl: 'API_SSL',
  /** Automatically detect best protocol (REST -> API -> API_SSL -> SSH -> Telnet) */
  Auto: 'AUTO',
  /** Force REST API protocol (RouterOS 7.1+) */
  Rest: 'REST',
  /** Force SSH protocol (port 22) */
  Ssh: 'SSH',
  /** Force Telnet protocol (port 23, insecure - use only as last resort) */
  Telnet: 'TELNET'
} as const;

export type ProtocolPreference = typeof ProtocolPreference[keyof typeof ProtocolPreference];
export type Query = {
  /**
   * Get circuit breaker status for a router.
   * Shows current state, failure counts, and cooldown timing.
   */
  readonly circuitBreakerStatus: CircuitBreakerStatus;
  /** Get the compatibility matrix for all known features */
  readonly compatibilityMatrix: ReadonlyArray<FeatureCompatibilityInfo>;
  /**
   * Get recent connection attempts for a router.
   * Returns the most recent attempts, ordered newest first.
   */
  readonly connectionAttempts: ReadonlyArray<ConnectionAttempt>;
  /** Get detailed connection status for a router */
  readonly connectionDetails?: Maybe<ConnectionDetails>;
  /** Get connection manager statistics */
  readonly connectionStats: ConnectionStats;
  /** Get system health status */
  readonly health: HealthStatus;
  /** Get a network interface by ID */
  readonly interface?: Maybe<Interface>;
  /** List interfaces on a router */
  readonly interfaces: InterfaceConnection;
  /** Check if a feature is supported on a specific router */
  readonly isFeatureSupported: FeatureSupport;
  /** Get current authenticated user */
  readonly me?: Maybe<User>;
  /** Get all active sessions for the current user */
  readonly mySessions: ReadonlyArray<Session>;
  /** Fetch any node by its global ID */
  readonly node?: Maybe<Node>;
  /** Get a router by ID */
  readonly router?: Maybe<Router>;
  /** Get router capabilities by router ID */
  readonly routerCapabilities?: Maybe<RouterCapabilities>;
  /** Get credential information for a router (password is never returned) */
  readonly routerCredentials?: Maybe<RouterCredentials>;
  /** Get health check result for a router */
  readonly routerHealth?: Maybe<HealthCheckResult>;
  /** List all managed routers */
  readonly routers: RouterConnection;
  /** Get scan history (recent scans) */
  readonly scanHistory: ReadonlyArray<ScanTask>;
  /** Get the status of a scan task by ID */
  readonly scanStatus?: Maybe<ScanTask>;
  /** Get all features supported by a router */
  readonly supportedFeatures: ReadonlyArray<FeatureSupport>;
  /** Get features not supported by a router with upgrade guidance */
  readonly unsupportedFeatures: ReadonlyArray<FeatureSupport>;
  /** Get upgrade recommendation for a specific feature on a router */
  readonly upgradeRecommendation?: Maybe<UpgradeRecommendation>;
  /** Get all upgrade recommendations for a router */
  readonly upgradeRecommendations: ReadonlyArray<UpgradeRecommendation>;
  /** Get current API version */
  readonly version: Scalars['String']['output'];
};


export type QueryCircuitBreakerStatusArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryConnectionAttemptsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  routerId: Scalars['ID']['input'];
};


export type QueryConnectionDetailsArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryInterfaceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryInterfacesArgs = {
  pagination?: InputMaybe<PaginationInput>;
  routerId: Scalars['ID']['input'];
  type?: InputMaybe<InterfaceType>;
};


export type QueryIsFeatureSupportedArgs = {
  featureId: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRouterArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRouterCapabilitiesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryRouterCredentialsArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryRouterHealthArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryRoutersArgs = {
  pagination?: InputMaybe<PaginationInput>;
  status?: InputMaybe<ConnectionStatus>;
};


export type QueryScanHistoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryScanStatusArgs = {
  taskId: Scalars['ID']['input'];
};


export type QuerySupportedFeaturesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryUnsupportedFeaturesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryUpgradeRecommendationArgs = {
  featureId: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryUpgradeRecommendationsArgs = {
  routerId: Scalars['ID']['input'];
};

export type ReconnectRouterPayload = {
  /** Updated connection details */
  readonly connectionDetails?: Maybe<ConnectionDetails>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether reconnection was initiated */
  readonly initiated: Scalars['Boolean']['output'];
  /** The router being reconnected */
  readonly router?: Maybe<Router>;
  /** Rate limit wait time if rate limited */
  readonly waitTimeMs?: Maybe<Scalars['Int']['output']>;
};

/** Payload for refreshCapabilities mutation */
export type RefreshCapabilitiesPayload = {
  /** Updated capabilities after refresh */
  readonly capabilities?: Maybe<RouterCapabilities>;
  /** Errors during refresh */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/** Event emitted when a router resource is updated */
export type ResourceUpdatedEvent = {
  /** Type of change (create, update, delete) */
  readonly changeType: ChangeType;
  /** Fields that were changed */
  readonly changedFields: ReadonlyArray<Scalars['String']['output']>;
  /** Unique resource identifier */
  readonly resourceId: Scalars['ID']['output'];
  /** Type of resource (interface, firewall-rule, dhcp-lease, etc.) */
  readonly resourceType: Scalars['String']['output'];
  /** Router this resource belongs to */
  readonly routerId: Scalars['ID']['output'];
  /** Timestamp of the update */
  readonly timestamp: Scalars['DateTime']['output'];
  /** New version number after update */
  readonly version: Scalars['Int']['output'];
};

/** A managed router device */
export type Router = Node & {
  /** Detected router capabilities (requires connection) */
  readonly capabilities?: Maybe<RouterCapabilities>;
  /** When the router was added to NasNet */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Router hostname or IP address */
  readonly host: Scalars['String']['output'];
  /** Unique router identifier */
  readonly id: Scalars['ID']['output'];
  /** Last successful connection time */
  readonly lastConnected?: Maybe<Scalars['DateTime']['output']>;
  /** Router model */
  readonly model?: Maybe<Scalars['String']['output']>;
  /** User-friendly display name */
  readonly name: Scalars['String']['output'];
  /** Router platform type */
  readonly platform: RouterPlatform;
  /** Connection port */
  readonly port: Scalars['Int']['output'];
  /** Current connection status */
  readonly status: ConnectionStatus;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** System uptime */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
  /** RouterOS version (if connected) */
  readonly version?: Maybe<Scalars['String']['output']>;
};

/** Event emitted when a new router is added. */
export type RouterAddedEvent = {
  /** User who added the router (if authenticated) */
  readonly addedBy?: Maybe<Scalars['String']['output']>;
  /** Protocol used for initial connection */
  readonly protocolUsed: Protocol;
  /** The newly added router */
  readonly router: Router;
  /** Timestamp of addition */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Complete router capabilities detected from system inspection */
export type RouterCapabilities = {
  /** Capability entries with support levels */
  readonly capabilities: ReadonlyArray<CapabilityEntry>;
  /** Container-specific capabilities */
  readonly container: ContainerInfo;
  /** When capabilities were detected */
  readonly detectedAt: Scalars['DateTime']['output'];
  /** When cache expires (24h TTL) */
  readonly expiresAt: Scalars['DateTime']['output'];
  /** Hardware information */
  readonly hardware: HardwareInfo;
  /** Whether cache is stale and refresh is in progress */
  readonly isRefreshing: Scalars['Boolean']['output'];
  /** Parsed RouterOS version with comparison helpers */
  readonly routerOSVersion: RouterOsVersion;
  /** Software information */
  readonly software: SoftwareInfo;
  /** Features supported by this router's version and configuration */
  readonly supportedFeatures: ReadonlyArray<FeatureSupport>;
  /** Features not supported by this router (with upgrade guidance) */
  readonly unsupportedFeatures: ReadonlyArray<FeatureSupport>;
  /** VIF requirements check */
  readonly vifRequirements: VifRequirements;
};

export type RouterConnection = Connection & {
  readonly edges: ReadonlyArray<RouterEdge>;
  readonly pageInfo: PageInfo;
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

/**
 * Router credential information (non-sensitive).
 * Password is never included - only metadata about credentials.
 */
export type RouterCredentials = {
  /** When credentials were first created */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Encryption algorithm used (always 'AES-256-GCM') */
  readonly encryptionStatus: Scalars['String']['output'];
  /** Whether a password is stored */
  readonly hasPassword: Scalars['Boolean']['output'];
  /** Encryption key version (for rotation tracking) */
  readonly keyVersion: Scalars['Int']['output'];
  /** When credentials were last updated */
  readonly lastUpdated: Scalars['DateTime']['output'];
  /** Router ID these credentials belong to */
  readonly routerId: Scalars['ID']['output'];
  /** Username for router authentication */
  readonly username: Scalars['String']['output'];
};

export type RouterEdge = Edge & {
  readonly cursor: Scalars['String']['output'];
  readonly node: Router;
};

/** Information about a discovered RouterOS device */
export type RouterOsInfo = {
  /** CPU architecture (e.g., 'arm', 'x86', 'mips') */
  readonly architecture?: Maybe<Scalars['String']['output']>;
  /** Router board name (e.g., 'hAP ac³', 'CCR2004-1G-12S+2XS') */
  readonly boardName?: Maybe<Scalars['String']['output']>;
  /** Platform identifier */
  readonly platform?: Maybe<Scalars['String']['output']>;
  /** RouterOS version string (e.g., '7.12', '6.49.8') */
  readonly version?: Maybe<Scalars['String']['output']>;
};

/** Parsed RouterOS version with semantic versioning */
export type RouterOsVersion = {
  /** Version channel (stable, beta, rc, long-term) */
  readonly channel?: Maybe<Scalars['String']['output']>;
  /** Check if version is at least the given version (e.g., '7.1') */
  readonly isAtLeast: Scalars['Boolean']['output'];
  /** Whether this is a Cloud Hosted Router (CHR) */
  readonly isCHR: Scalars['Boolean']['output'];
  /** Major version number */
  readonly major: Scalars['Int']['output'];
  /** Minor version number */
  readonly minor: Scalars['Int']['output'];
  /** Patch version number */
  readonly patch: Scalars['Int']['output'];
  /** Full version string (e.g., '7.13.2') */
  readonly raw: Scalars['String']['output'];
  /** Check if this version supports a specific feature */
  readonly supportsFeature: Scalars['Boolean']['output'];
};


/** Parsed RouterOS version with semantic versioning */
export type RouterOsVersionIsAtLeastArgs = {
  version: Scalars['String']['input'];
};


/** Parsed RouterOS version with semantic versioning */
export type RouterOsVersionSupportsFeatureArgs = {
  featureId: Scalars['String']['input'];
};

/** Supported router platforms */
export const RouterPlatform = {
  /** Generic/Unknown */
  Generic: 'GENERIC',
  /** MikroTik RouterOS */
  Mikrotik: 'MIKROTIK',
  /** OpenWrt */
  Openwrt: 'OPENWRT',
  /** VyOS */
  Vyos: 'VYOS'
} as const;

export type RouterPlatform = typeof RouterPlatform[keyof typeof RouterPlatform];
export type RouterStatusEvent = {
  /** New status */
  readonly newStatus: ConnectionStatus;
  /** Previous status */
  readonly previousStatus: ConnectionStatus;
  /** The router whose status changed */
  readonly router: Router;
  /** Timestamp of the change */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Input for starting a network scan */
export type ScanNetworkInput = {
  /** Target subnet in CIDR notation (e.g., '192.168.88.0/24') or IP range (e.g., '192.168.1.1-192.168.1.100') */
  readonly subnet: Scalars['String']['input'];
};

export type ScanNetworkPayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The created scan task */
  readonly task?: Maybe<ScanTask>;
};

/** Real-time progress event for scan subscriptions */
export type ScanProgressEvent = {
  /** IP address currently being scanned */
  readonly currentIP?: Maybe<Scalars['String']['output']>;
  /** Number of MikroTik devices found so far */
  readonly devicesFound: Scalars['Int']['output'];
  /** Current progress percentage (0-100) */
  readonly progress: Scalars['Int']['output'];
  /** Current scan status */
  readonly status: ScanStatus;
  /** Task ID this event belongs to */
  readonly taskId: Scalars['ID']['output'];
  /** Timestamp of this progress update */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Status of a network scan operation */
export const ScanStatus = {
  /** Scan was cancelled by user */
  Cancelled: 'CANCELLED',
  /** Scan completed successfully */
  Completed: 'COMPLETED',
  /** Scan failed with an error */
  Failed: 'FAILED',
  /** Scan is queued and waiting to start */
  Pending: 'PENDING',
  /** Scan is actively running */
  Running: 'RUNNING'
} as const;

export type ScanStatus = typeof ScanStatus[keyof typeof ScanStatus];
/**
 * A network scan task that tracks scan progress and results.
 * Scans are asynchronous - start with mutation, poll/subscribe for progress.
 */
export type ScanTask = {
  /** When the scan completed (null if still running) */
  readonly endTime?: Maybe<Scalars['DateTime']['output']>;
  /** Error message if scan failed */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Unique task identifier */
  readonly id: Scalars['ID']['output'];
  /** Scan progress percentage (0-100) */
  readonly progress: Scalars['Int']['output'];
  /** Discovered devices (populated as scan progresses) */
  readonly results: ReadonlyArray<DiscoveredDevice>;
  /** Number of IPs scanned so far */
  readonly scannedIPs?: Maybe<Scalars['Int']['output']>;
  /** When the scan was started */
  readonly startTime: Scalars['DateTime']['output'];
  /** Current scan status */
  readonly status: ScanStatus;
  /** Target subnet (CIDR notation, IP range, or gateway scan indicator) */
  readonly subnet: Scalars['String']['output'];
  /** Total IPs to scan (for progress calculation) */
  readonly totalIPs?: Maybe<Scalars['Int']['output']>;
};

/** Service operational status */
export const ServiceStatus = {
  /** Service is operational with degraded performance */
  Degraded: 'DEGRADED',
  /** Service is fully operational */
  Healthy: 'HEALTHY',
  /** Service is not operational */
  Unhealthy: 'UNHEALTHY'
} as const;

export type ServiceStatus = typeof ServiceStatus[keyof typeof ServiceStatus];
/** Active user session */
export type Session = {
  /** Session creation time */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Session ULID */
  readonly id: Scalars['ID']['output'];
  /** Client IP address */
  readonly ipAddress?: Maybe<Scalars['String']['output']>;
  /** Whether this is the current session */
  readonly isCurrent: Scalars['Boolean']['output'];
  /** Last activity time */
  readonly lastActivity: Scalars['DateTime']['output'];
  /** Client user agent */
  readonly userAgent?: Maybe<Scalars['String']['output']>;
};

export type SetPreferredProtocolPayload = {
  /** Updated connection details */
  readonly connectionDetails?: Maybe<ConnectionDetails>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The updated router */
  readonly router?: Maybe<Router>;
};

/** Software information detected from router */
export type SoftwareInfo = {
  /** List of installed packages */
  readonly installedPackages: ReadonlyArray<Scalars['String']['output']>;
  /** License level (0-6) */
  readonly licenseLevel: Scalars['Int']['output'];
  /** Update channel (stable, testing, development) */
  readonly updateChannel?: Maybe<Scalars['String']['output']>;
  /** RouterOS version string */
  readonly version: Scalars['String']['output'];
  /** Parsed major version number */
  readonly versionMajor: Scalars['Int']['output'];
  /** Parsed minor version number */
  readonly versionMinor: Scalars['Int']['output'];
  /** Parsed patch version number */
  readonly versionPatch?: Maybe<Scalars['Int']['output']>;
};

export type Subscription = {
  /** Subscribe to circuit breaker state changes */
  readonly circuitBreakerChanged: CircuitBreakerEvent;
  /**
   * Subscribe to circuit breaker state changes for a router.
   * Emits an event whenever the circuit breaker transitions between states.
   */
  readonly circuitBreakerStateChanged: CircuitBreakerStatus;
  /** Subscribe to configuration apply progress */
  readonly configApplyProgress: ConfigProgress;
  /** Subscribe to connection health updates */
  readonly connectionHealth: HealthCheckResult;
  /** Subscribe to interface traffic updates */
  readonly interfaceTraffic: InterfaceTrafficEvent;
  /** Subscribe to resource updates (create, update, delete) */
  readonly resourceUpdated: ResourceUpdatedEvent;
  /**
   * Subscribe to router addition events.
   * Emits when a new router is successfully added to the system.
   */
  readonly routerAdded: RouterAddedEvent;
  /** Subscribe to router status changes */
  readonly routerStatusChanged: RouterStatusEvent;
  /**
   * Subscribe to real-time scan progress updates.
   * Emits events every 5% progress or every 2 seconds, whichever is sooner.
   */
  readonly scanProgress: ScanProgressEvent;
};


export type SubscriptionCircuitBreakerChangedArgs = {
  routerId: Scalars['ID']['input'];
};


export type SubscriptionCircuitBreakerStateChangedArgs = {
  routerId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionConfigApplyProgressArgs = {
  operationId: Scalars['ID']['input'];
};


export type SubscriptionConnectionHealthArgs = {
  routerId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionInterfaceTrafficArgs = {
  interfaceId?: InputMaybe<Scalars['ID']['input']>;
  routerId: Scalars['ID']['input'];
};


export type SubscriptionResourceUpdatedArgs = {
  resourceId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionRouterStatusChangedArgs = {
  routerId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionScanProgressArgs = {
  taskId: Scalars['ID']['input'];
};

/** Severity level for diagnostic suggestions */
export const SuggestionSeverity = {
  /** Critical issue blocking connectivity */
  Critical: 'CRITICAL',
  /** Error that needs to be addressed */
  Error: 'ERROR',
  /** Informational message, no action required */
  Info: 'INFO',
  /** Warning that may affect functionality */
  Warning: 'WARNING'
} as const;

export type SuggestionSeverity = typeof SuggestionSeverity[keyof typeof SuggestionSeverity];
/** TLS certificate status for secure connections */
export type TlsStatus = {
  /** Error message (if certificate is invalid) */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Certificate expiration date */
  readonly expiresAt?: Maybe<Scalars['DateTime']['output']>;
  /** Certificate issuer */
  readonly issuer?: Maybe<Scalars['String']['output']>;
  /** Certificate subject */
  readonly subject?: Maybe<Scalars['String']['output']>;
  /** Whether the certificate is valid */
  readonly valid: Scalars['Boolean']['output'];
};

/** Result of testing all router credentials. */
export type TestAllCredentialsPayload = {
  /** Number of failed credential tests */
  readonly failureCount: Scalars['Int']['output'];
  /** Per-router test results */
  readonly results: ReadonlyArray<CredentialTestResult>;
  /** Number of successful credential tests */
  readonly successCount: Scalars['Int']['output'];
  /** Total number of routers tested */
  readonly totalRouters: Scalars['Int']['output'];
};

export type TestConnectionPayload = {
  /** Error message if connection failed */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Response time in milliseconds */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Whether the connection test succeeded */
  readonly success: Scalars['Boolean']['output'];
  /** Router version if connection succeeded */
  readonly version?: Maybe<Scalars['String']['output']>;
};

/** Input for updating router settings */
export type UpdateRouterInput = {
  /** Updated hostname or IP address */
  readonly host?: InputMaybe<Scalars['String']['input']>;
  /** Updated display name */
  readonly name?: InputMaybe<Scalars['String']['input']>;
  /** Updated password */
  readonly password?: InputMaybe<Scalars['String']['input']>;
  /** Updated connection port */
  readonly port?: InputMaybe<Scalars['Int']['input']>;
  /** Updated username */
  readonly username?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRouterPayload = {
  /** Errors that occurred during update */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The updated router */
  readonly router?: Maybe<Router>;
};

/** Impact assessment for an upgrade */
export type UpgradeImpact = {
  /** Whether configuration backup is recommended before upgrade */
  readonly backupRecommended: Scalars['Boolean']['output'];
  /** Potential breaking changes to be aware of */
  readonly breakingChanges: ReadonlyArray<Scalars['String']['output']>;
  /** Estimated downtime description */
  readonly estimatedDowntime?: Maybe<Scalars['String']['output']>;
  /** Whether reboot is required */
  readonly requiresReboot: Scalars['Boolean']['output'];
};

/** Priority level for upgrade recommendations */
export const UpgradePriority = {
  /** Security-related, should upgrade immediately */
  Critical: 'CRITICAL',
  /** Highly recommended for stability/features */
  High: 'HIGH',
  /** Nice to have, optional */
  Low: 'LOW',
  /** Recommended but not urgent */
  Medium: 'MEDIUM'
} as const;

export type UpgradePriority = typeof UpgradePriority[keyof typeof UpgradePriority];
/** Upgrade recommendation for enabling a feature */
export type UpgradeRecommendation = {
  /** Current RouterOS version */
  readonly currentVersion: Scalars['String']['output'];
  /** URL to MikroTik upgrade documentation */
  readonly documentationUrl?: Maybe<Scalars['String']['output']>;
  /** Feature that requires upgrade */
  readonly featureId: Scalars['String']['output'];
  /** Human-readable feature name */
  readonly featureName: Scalars['String']['output'];
  /** Estimated impact on router operation */
  readonly impact: UpgradeImpact;
  /** Whether this is a major version upgrade (e.g., 6.x to 7.x) */
  readonly isMajorUpgrade: Scalars['Boolean']['output'];
  /** Priority level (critical, high, medium, low) */
  readonly priority: UpgradePriority;
  /** Minimum required version for this feature */
  readonly requiredVersion: Scalars['String']['output'];
  /** Steps to complete the upgrade */
  readonly steps: ReadonlyArray<UpgradeStep>;
  /** Warnings or important notes about this upgrade */
  readonly warnings: ReadonlyArray<Scalars['String']['output']>;
};

/** Single step in an upgrade process */
export type UpgradeStep = {
  /** RouterOS command to execute (if applicable) */
  readonly command?: Maybe<Scalars['String']['output']>;
  /** Detailed instructions */
  readonly description: Scalars['String']['output'];
  /** Whether this step is optional */
  readonly optional: Scalars['Boolean']['output'];
  /** Step number (1-based) */
  readonly step: Scalars['Int']['output'];
  /** Step title */
  readonly title: Scalars['String']['output'];
};

/** User account in NasNetConnect */
export type User = Node & {
  /** Account creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Display name */
  readonly displayName?: Maybe<Scalars['String']['output']>;
  /** Email address (if provided) */
  readonly email?: Maybe<Scalars['String']['output']>;
  /** User ULID */
  readonly id: Scalars['ID']['output'];
  /** Last successful login */
  readonly lastLoginAt?: Maybe<Scalars['DateTime']['output']>;
  /** User role for authorization */
  readonly role: UserRole;
  /** Unique username */
  readonly username: Scalars['String']['output'];
};

/** User roles for authorization */
export const UserRole = {
  /** Full administrative access */
  Admin: 'ADMIN',
  /** Can view and modify but not delete or manage users */
  Operator: 'OPERATOR',
  /** Read-only access */
  Viewer: 'VIEWER'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
/** Single step in VIF enablement guidance */
export type VifGuidanceStep = {
  /** Whether this requirement is already met */
  readonly completed: Scalars['Boolean']['output'];
  /** Detailed instruction */
  readonly description: Scalars['String']['output'];
  /** RouterOS command to execute (if applicable) */
  readonly routerCommand?: Maybe<Scalars['String']['output']>;
  /** Step number (1-based) */
  readonly step: Scalars['Int']['output'];
  /** Short title for the step */
  readonly title: Scalars['String']['output'];
};

/** VIF (Virtual Interface Factory) requirements check result */
export type VifRequirements = {
  /** Whether container feature is enabled */
  readonly containerEnabled: Scalars['Boolean']['output'];
  /** Whether container package is installed */
  readonly containerPackage: Scalars['Boolean']['output'];
  /** Step-by-step guidance for enabling VIF */
  readonly guidanceSteps: ReadonlyArray<VifGuidanceStep>;
  /** Whether all VIF requirements are satisfied */
  readonly met: Scalars['Boolean']['output'];
  /** Human-readable reasons why VIF is not available */
  readonly missingReasons: ReadonlyArray<Scalars['String']['output']>;
  /** Whether network namespace is supported */
  readonly networkNamespace: Scalars['Boolean']['output'];
  /** Whether RouterOS version is sufficient (7.13+) */
  readonly routerOSVersion: Scalars['Boolean']['output'];
  /** Whether there's sufficient storage (>100MB) */
  readonly sufficientStorage: Scalars['Boolean']['output'];
};

/** Predefined validation formats for common data types */
export const ValidateFormat = {
  Cidr: 'CIDR',
  Email: 'EMAIL',
  Fqdn: 'FQDN',
  Hostname: 'HOSTNAME',
  Ipv4: 'IPV4',
  Ipv6: 'IPV6',
  Mac: 'MAC',
  Url: 'URL',
  Uuid: 'UUID'
} as const;

export type ValidateFormat = typeof ValidateFormat[keyof typeof ValidateFormat];
/** Field-level validation error with suggestions for fixing. */
export type ValidationError = {
  /** Error code for the validation failure */
  readonly code: Scalars['String']['output'];
  /** Field path that failed validation (e.g., 'input.host', 'input.port') */
  readonly field: Scalars['String']['output'];
  /** Human-readable error message */
  readonly message: Scalars['String']['output'];
  /** The invalid value (redacted for sensitive fields) */
  readonly providedValue?: Maybe<Scalars['String']['output']>;
  /** Suggestion for fixing the validation error */
  readonly suggestion?: Maybe<Scalars['String']['output']>;
};
