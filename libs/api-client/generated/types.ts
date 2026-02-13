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

export type AddBridgePortInput = {
  readonly frameTypes?: InputMaybe<FrameTypes>;
  readonly ingressFiltering?: InputMaybe<Scalars['Boolean']['input']>;
  readonly interfaceId: Scalars['ID']['input'];
  readonly pvid?: InputMaybe<Scalars['Int']['input']>;
};

export type AddChangeSetItemPayload = {
  /** The updated change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The added item ID */
  readonly itemId?: Maybe<Scalars['ID']['output']>;
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

/**
 * Aggregated view of an address list with entry statistics.
 * Address lists group IP addresses for use in firewall rules.
 */
export type AddressList = {
  /** Number of dynamic entries (added by firewall actions) */
  readonly dynamicCount: Scalars['Int']['output'];
  /** Paginated entries in this list */
  readonly entries: AddressListEntryConnection;
  /** Total number of entries in this list */
  readonly entryCount: Scalars['Int']['output'];
  /** List name (unique identifier) */
  readonly name: Scalars['String']['output'];
  /** Firewall rules that reference this list */
  readonly referencingRules: ReadonlyArray<FirewallRule>;
  /** Number of firewall rules referencing this list */
  readonly referencingRulesCount: Scalars['Int']['output'];
};


/**
 * Aggregated view of an address list with entry statistics.
 * Address lists group IP addresses for use in firewall rules.
 */
export type AddressListEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Single entry in an address list.
 * Represents an IP address, CIDR subnet, or IP range that belongs to a named list.
 */
export type AddressListEntry = Node & {
  /** IP address, CIDR subnet, or IP range */
  readonly address: Scalars['String']['output'];
  /** Optional description */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** When this entry was created */
  readonly creationTime?: Maybe<Scalars['DateTime']['output']>;
  /** Whether this entry is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Whether this entry was added dynamically by a firewall action */
  readonly dynamic: Scalars['Boolean']['output'];
  /** MikroTik internal ID */
  readonly id: Scalars['ID']['output'];
  /** Name of the address list this entry belongs to */
  readonly list: Scalars['String']['output'];
  /** Optional timeout after which entry is removed */
  readonly timeout?: Maybe<Scalars['String']['output']>;
};

/**
 * Connection type for paginated address list entries.
 * Follows Relay pagination specification.
 */
export type AddressListEntryConnection = Connection & {
  readonly edges: ReadonlyArray<AddressListEntryEdge>;
  readonly pageInfo: PageInfo;
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Edge type for address list entry connections. */
export type AddressListEntryEdge = Edge & {
  readonly cursor: Scalars['String']['output'];
  readonly node: AddressListEntry;
};

/** Resource affected by a configuration change */
export type AffectedResource = {
  /** Resource ID */
  readonly id: Scalars['ID']['output'];
  /** How the resource will be affected (modified, disabled, removed) */
  readonly impact: ResourceImpact;
  /** Resource name or description */
  readonly name: Scalars['String']['output'];
  /** Resource type (ip-address, dhcp-server, firewall-rule, etc.) */
  readonly type: Scalars['String']['output'];
};

/** Individual alert instance triggered when rule conditions are met */
export type Alert = Node & {
  /** When alert was acknowledged */
  readonly acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User who acknowledged the alert */
  readonly acknowledgedBy?: Maybe<Scalars['String']['output']>;
  /** Event data and context information */
  readonly data?: Maybe<Scalars['JSON']['output']>;
  /** Delivery status per channel */
  readonly deliveryStatus?: Maybe<Scalars['JSON']['output']>;
  /** Device ID that triggered this alert */
  readonly deviceId?: Maybe<Scalars['ID']['output']>;
  /** Escalation tracking for this alert (NAS-18.9) */
  readonly escalation?: Maybe<AlertEscalation>;
  /** Event type that triggered this alert */
  readonly eventType: Scalars['String']['output'];
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Detailed alert message */
  readonly message: Scalars['String']['output'];
  /** Alert rule that triggered this alert */
  readonly rule: AlertRule;
  /** Alert severity level */
  readonly severity: AlertSeverity;
  /** Reason for suppression (e.g., "throttled", "storm_detected") */
  readonly suppressReason?: Maybe<Scalars['String']['output']>;
  /** Number of alerts suppressed by throttling (if this alert is part of a throttle group) */
  readonly suppressedCount?: Maybe<Scalars['Int']['output']>;
  /** Alert title/summary */
  readonly title: Scalars['String']['output'];
  /** When alert was triggered */
  readonly triggeredAt: Scalars['DateTime']['output'];
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
};

/** Alert action types for subscriptions */
export const AlertAction = {
  /** Alert was acknowledged */
  Acknowledged: 'ACKNOWLEDGED',
  /** Alert was created/triggered */
  Created: 'CREATED',
  /** Alert was resolved */
  Resolved: 'RESOLVED'
} as const;

export type AlertAction = typeof AlertAction[keyof typeof AlertAction];
/** Template variable input */
export type AlertAlertTemplateVariableInput = {
  /** Default value */
  readonly defaultValue?: InputMaybe<Scalars['String']['input']>;
  /** Description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Display label */
  readonly label: Scalars['String']['input'];
  /** Variable name */
  readonly name: Scalars['String']['input'];
  /** Options for enum types */
  readonly options?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  /** Whether required */
  readonly required: Scalars['Boolean']['input'];
  /** Variable type */
  readonly type: AlertTemplateVariableType;
};

/** Condition for event matching in alert rules */
export type AlertCondition = {
  /** Field name to evaluate */
  readonly field: Scalars['String']['output'];
  /** Comparison operator */
  readonly operator: ConditionOperator;
  /** Value to compare against */
  readonly value: Scalars['String']['output'];
};

/** Alert condition input */
export type AlertConditionInput = {
  /** Field name to evaluate */
  readonly field: Scalars['String']['input'];
  /** Comparison operator */
  readonly operator: ConditionOperator;
  /** Value to compare against */
  readonly value: Scalars['String']['input'];
};

/** Paginated alert connection */
export type AlertConnection = Connection & {
  /** Alert edges */
  readonly edges: ReadonlyArray<AlertEdge>;
  /** Pagination information */
  readonly pageInfo: PageInfo;
  /** Total count of alerts */
  readonly totalCount: Scalars['Int']['output'];
};

/** Alert edge for pagination */
export type AlertEdge = Edge & {
  /** Pagination cursor */
  readonly cursor: Scalars['String']['output'];
  /** Alert node */
  readonly node: Alert;
};

/** Alert escalation tracking record (NAS-18.9) */
export type AlertEscalation = Node & {
  /** Alert being tracked for escalation */
  readonly alertId: Scalars['ID']['output'];
  /** Record creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Current escalation level (0 = initial) */
  readonly currentLevel: Scalars['Int']['output'];
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Maximum escalation level */
  readonly maxLevel: Scalars['Int']['output'];
  /** When next escalation level should trigger */
  readonly nextEscalationAt?: Maybe<Scalars['DateTime']['output']>;
  /** When escalation was resolved */
  readonly resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Reason for resolution */
  readonly resolvedBy?: Maybe<Scalars['String']['output']>;
  /** Alert rule with escalation configuration */
  readonly ruleId: Scalars['ID']['output'];
  /** Escalation status */
  readonly status: EscalationStatus;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
};

/** Alert event for real-time subscriptions */
export type AlertEvent = {
  /** Type of action that occurred */
  readonly action: AlertAction;
  /** The alert that changed */
  readonly alert: Alert;
};

/** Alert mutation payload */
export type AlertPayload = {
  /** Modified alert */
  readonly alert?: Maybe<Alert>;
  /** Errors encountered during mutation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/** Alert rule defines conditions that trigger notifications when met */
export type AlertRule = Node & {
  /** Alerts triggered by this rule */
  readonly alerts: ReadonlyArray<Alert>;
  /** Notification channels to use */
  readonly channels: ReadonlyArray<Scalars['String']['output']>;
  /** Array of conditions for event matching */
  readonly conditions: ReadonlyArray<AlertCondition>;
  /** Record creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Optional description of what this rule monitors */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Optional device ID filter - rule only applies to this device */
  readonly deviceId?: Maybe<Scalars['ID']['output']>;
  /** Whether this alert rule is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Escalation configuration for unacknowledged alerts (NAS-18.9) */
  readonly escalation?: Maybe<EscalationConfig>;
  /** Event type to match (e.g., 'router.offline', 'interface.down', 'cpu.high') */
  readonly eventType: Scalars['String']['output'];
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Human-readable alert rule name */
  readonly name: Scalars['String']['output'];
  /** Quiet hours configuration for non-critical alerts */
  readonly quietHours?: Maybe<QuietHoursConfig>;
  /** Alert severity level */
  readonly severity: AlertSeverity;
  /** Throttle configuration to prevent alert spam */
  readonly throttle?: Maybe<ThrottleConfig>;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
};


/** Alert rule defines conditions that trigger notifications when met */
export type AlertRuleAlertsArgs = {
  acknowledged?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

/** Variable input for alert rule templates */
export type AlertRuleAlertTemplateVariableInput = {
  /** Default value */
  readonly defaultValue?: InputMaybe<Scalars['String']['input']>;
  /** Description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Display label */
  readonly label: Scalars['String']['input'];
  /** Maximum value */
  readonly max?: InputMaybe<Scalars['Int']['input']>;
  /** Minimum value */
  readonly min?: InputMaybe<Scalars['Int']['input']>;
  /** Variable name */
  readonly name: Scalars['String']['input'];
  /** Whether required */
  readonly required: Scalars['Boolean']['input'];
  /** Variable type */
  readonly type: AlertRuleTemplateVariableType;
  /** Unit label */
  readonly unit?: InputMaybe<Scalars['String']['input']>;
};

/** Alert rule mutation payload */
export type AlertRulePayload = {
  /** Created/updated alert rule */
  readonly alertRule?: Maybe<AlertRule>;
  /** Errors encountered during mutation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/**
 * Alert rule template for quick rule creation
 * Pre-configured templates with variables for common alert scenarios
 */
export type AlertRuleTemplate = Node & {
  /** Template category */
  readonly category: AlertRuleTemplateCategory;
  /** Default notification channels */
  readonly channels: ReadonlyArray<Scalars['String']['output']>;
  /** Pre-configured conditions */
  readonly conditions: ReadonlyArray<AlertCondition>;
  /** Record creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Template description */
  readonly description: Scalars['String']['output'];
  /** Event type this template monitors */
  readonly eventType: Scalars['String']['output'];
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Whether this is a built-in template */
  readonly isBuiltIn: Scalars['Boolean']['output'];
  /** Template name */
  readonly name: Scalars['String']['output'];
  /** Alert severity level */
  readonly severity: AlertSeverity;
  /** Throttle configuration */
  readonly throttle?: Maybe<ThrottleConfig>;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** Template variables for customization */
  readonly variables: ReadonlyArray<AlertRuleTemplateVariable>;
  /** Template version */
  readonly version: Scalars['String']['output'];
};

/** Alert rule template categories */
export const AlertRuleTemplateCategory = {
  /** Custom user-defined templates */
  Custom: 'CUSTOM',
  /** DHCP and IP address management */
  Dhcp: 'DHCP',
  /** Network connectivity and interface monitoring */
  Network: 'NETWORK',
  /** Resource usage (CPU, memory, disk) */
  Resources: 'RESOURCES',
  /** Security and firewall events */
  Security: 'SECURITY',
  /** System events and maintenance */
  System: 'SYSTEM',
  /** VPN and tunnel monitoring */
  Vpn: 'VPN'
} as const;

export type AlertRuleTemplateCategory = typeof AlertRuleTemplateCategory[keyof typeof AlertRuleTemplateCategory];
/** Alert rule template mutation payload */
export type AlertRuleTemplatePayload = {
  /** Errors encountered during mutation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Created/updated template */
  readonly template?: Maybe<AlertRuleTemplate>;
};

/** Preview result for alert rule template */
export type AlertRuleTemplatePreview = {
  /** Resolved conditions with variable substitution */
  readonly resolvedConditions: ReadonlyArray<AlertCondition>;
  /** The template being previewed */
  readonly template: AlertRuleTemplate;
  /** Validation information */
  readonly validationInfo: TemplateValidationInfo;
};

/** Variable definition for alert rule templates */
export type AlertRuleTemplateVariable = {
  /** Default value */
  readonly defaultValue?: Maybe<Scalars['String']['output']>;
  /** Variable description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Display label */
  readonly label: Scalars['String']['output'];
  /** Maximum value (for INTEGER, DURATION, PERCENTAGE) */
  readonly max?: Maybe<Scalars['Int']['output']>;
  /** Minimum value (for INTEGER, DURATION, PERCENTAGE) */
  readonly min?: Maybe<Scalars['Int']['output']>;
  /** Variable name (used for substitution) */
  readonly name: Scalars['String']['output'];
  /** Whether this variable is required */
  readonly required: Scalars['Boolean']['output'];
  /** Variable type */
  readonly type: AlertRuleTemplateVariableType;
  /** Unit label (e.g., "seconds", "percent", "MB") */
  readonly unit?: Maybe<Scalars['String']['output']>;
};

/** Variable types for alert rule templates */
export const AlertRuleTemplateVariableType = {
  /** Duration in seconds */
  Duration: 'DURATION',
  /** Integer value */
  Integer: 'INTEGER',
  /** Percentage (0-100) */
  Percentage: 'PERCENTAGE',
  /** String value */
  String: 'STRING'
} as const;

export type AlertRuleTemplateVariableType = typeof AlertRuleTemplateVariableType[keyof typeof AlertRuleTemplateVariableType];
/** Alert severity levels */
export const AlertSeverity = {
  /** Critical - requires immediate attention */
  Critical: 'CRITICAL',
  /** Info - informational only */
  Info: 'INFO',
  /** Warning - attention needed soon */
  Warning: 'WARNING'
} as const;

export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];
/**
 * Alert notification template
 * Templates define message format for different event types and channels
 */
export type AlertTemplate = Node & {
  /** Body template with Go template syntax */
  readonly bodyTemplate: Scalars['String']['output'];
  /** Notification channel */
  readonly channel: NotificationChannel;
  /** Record creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Template description */
  readonly description: Scalars['String']['output'];
  /** Event type this template applies to */
  readonly eventType: Scalars['String']['output'];
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Whether this is a built-in template */
  readonly isBuiltIn: Scalars['Boolean']['output'];
  /** Whether this is a system default template */
  readonly isDefault: Scalars['Boolean']['output'];
  /** Channel-specific metadata */
  readonly metadata?: Maybe<Scalars['JSON']['output']>;
  /** Template name */
  readonly name: Scalars['String']['output'];
  /** Subject/title template */
  readonly subjectTemplate?: Maybe<Scalars['String']['output']>;
  /** Tags for categorization */
  readonly tags: ReadonlyArray<Scalars['String']['output']>;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** Template variables */
  readonly variables: ReadonlyArray<AlertTemplateVariable>;
};

/** Alert template mutation payload */
export type AlertTemplatePayload = {
  /** Errors encountered during mutation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Created/updated template */
  readonly template?: Maybe<AlertTemplate>;
};

/** Template variable definition */
export type AlertTemplateVariable = {
  /** Default value */
  readonly defaultValue?: Maybe<Scalars['String']['output']>;
  /** Variable description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Display label */
  readonly label: Scalars['String']['output'];
  /** Variable name (used in template as {{.Name}}) */
  readonly name: Scalars['String']['output'];
  /** Options for enum-type variables */
  readonly options?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Whether this variable is required */
  readonly required: Scalars['Boolean']['output'];
  /** Variable type */
  readonly type: AlertTemplateVariableType;
};

/** Template variable types for notification templates */
export const AlertTemplateVariableType = {
  /** Boolean value */
  Boolean: 'BOOLEAN',
  /** Interface name */
  Interface: 'INTERFACE',
  /** IP address */
  Ipaddress: 'IPADDRESS',
  /** Numeric value */
  Number: 'NUMBER',
  /** String value */
  String: 'STRING',
  /** Timestamp value */
  Timestamp: 'TIMESTAMP'
} as const;

export type AlertTemplateVariableType = typeof AlertTemplateVariableType[keyof typeof AlertTemplateVariableType];
/** Input for applying an alert template */
export type ApplyAlertTemplateInput = {
  /** Alert rule configuration */
  readonly ruleConfig: CreateAlertRuleInput;
  /** Template ID to apply */
  readonly templateId: Scalars['ID']['input'];
  /** Variables for template substitution */
  readonly variables: Scalars['JSON']['input'];
};

export type ApplyChangeSetPayload = {
  /** Change set ID */
  readonly changeSetId: Scalars['ID']['output'];
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Current status */
  readonly status: ChangeSetStatus;
};

/** Result of applying a fix */
export type ApplyFixPayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** User-friendly message */
  readonly message: Scalars['String']['output'];
  /** Fix application status */
  readonly status: FixApplicationStatus;
  /** Whether fix was applied successfully */
  readonly success: Scalars['Boolean']['output'];
};

export type ApplyResourcePayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Operation ID for progress tracking */
  readonly operationId: Scalars['ID']['output'];
  /** The applied resource */
  readonly resource?: Maybe<Resource>;
};

export type ArchiveResourcePayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether archive was successful */
  readonly success: Scalars['Boolean']['output'];
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

/**
 * Available service that can be installed from the Feature Marketplace.
 * Represents a downloadable network service with metadata from the manifest.
 */
export type AvailableService = {
  /** Supported architectures */
  readonly architectures: ReadonlyArray<Scalars['String']['output']>;
  /** Service author */
  readonly author: Scalars['String']['output'];
  /** Service category (VPN, Privacy, DNS, Messaging) */
  readonly category: Scalars['String']['output'];
  /** Configuration schema (JSON Schema) */
  readonly configSchema?: Maybe<Scalars['JSON']['output']>;
  /** Default configuration (JSON) */
  readonly defaultConfig?: Maybe<Scalars['JSON']['output']>;
  /** Service description */
  readonly description: Scalars['String']['output'];
  /** Docker image name */
  readonly dockerImage: Scalars['String']['output'];
  /** Docker image tag */
  readonly dockerTag: Scalars['String']['output'];
  /** Homepage URL */
  readonly homepage?: Maybe<Scalars['String']['output']>;
  /** Icon filename or URL */
  readonly icon?: Maybe<Scalars['String']['output']>;
  /** Unique service identifier (e.g., 'tor', 'sing-box', 'xray') */
  readonly id: Scalars['ID']['output'];
  /** License */
  readonly license: Scalars['String']['output'];
  /** Minimum RouterOS version required */
  readonly minRouterOSVersion?: Maybe<Scalars['String']['output']>;
  /** Display name */
  readonly name: Scalars['String']['output'];
  /** Required disk space in MB */
  readonly requiredDiskMB: Scalars['Int']['output'];
  /** Required memory in MB */
  readonly requiredMemoryMB: Scalars['Int']['output'];
  /** Required packages */
  readonly requiredPackages: ReadonlyArray<Scalars['String']['output']>;
  /** Required ports */
  readonly requiredPorts: ReadonlyArray<Scalars['Int']['output']>;
  /** Tags for filtering and search */
  readonly tags: ReadonlyArray<Scalars['String']['output']>;
  /** Service version */
  readonly version: Scalars['String']['output'];
};

/** A bandwidth data point */
export type BandwidthDataPoint = {
  /** Bytes in during this period */
  readonly bytesIn: Scalars['Size']['output'];
  /** Bytes out during this period */
  readonly bytesOut: Scalars['Size']['output'];
  /** Period duration in seconds */
  readonly periodSeconds: Scalars['Int']['output'];
  /** Timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Actions available for batch interface operations */
export const BatchInterfaceAction = {
  Disable: 'DISABLE',
  Enable: 'ENABLE',
  Update: 'UPDATE'
} as const;

export type BatchInterfaceAction = typeof BatchInterfaceAction[keyof typeof BatchInterfaceAction];
/** Input for batch interface operations */
export type BatchInterfaceInput = {
  /** Action to perform */
  readonly action: BatchInterfaceAction;
  /** Optional input for UPDATE action */
  readonly input?: InputMaybe<UpdateInterfaceInput>;
  /** Interface IDs to operate on */
  readonly interfaceIds: ReadonlyArray<Scalars['ID']['input']>;
};

/** Payload returned by batchInterfaceOperation mutation */
export type BatchInterfacePayload = {
  /** General errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Interfaces that failed with reasons */
  readonly failed: ReadonlyArray<InterfaceOperationError>;
  /** Interfaces that were successfully updated */
  readonly succeeded: ReadonlyArray<Interface>;
};

export type Bridge = Node & {
  readonly comment?: Maybe<Scalars['String']['output']>;
  readonly dependentDhcpServers: ReadonlyArray<DhcpServer>;
  readonly dependentRoutes: ReadonlyArray<Route>;
  readonly disabled: Scalars['Boolean']['output'];
  readonly id: Scalars['ID']['output'];
  readonly ipAddresses: ReadonlyArray<IpAddress>;
  readonly macAddress?: Maybe<Scalars['MAC']['output']>;
  readonly mtu?: Maybe<Scalars['Int']['output']>;
  readonly name: Scalars['String']['output'];
  readonly ports: ReadonlyArray<BridgePort>;
  readonly priority?: Maybe<Scalars['Int']['output']>;
  readonly protocol: StpProtocol;
  readonly pvid?: Maybe<Scalars['Int']['output']>;
  readonly running: Scalars['Boolean']['output'];
  readonly stpStatus?: Maybe<BridgeStpStatus>;
  readonly vlanFiltering: Scalars['Boolean']['output'];
  readonly vlans: ReadonlyArray<BridgeVlan>;
};

export type BridgeMutationResult = {
  readonly bridge?: Maybe<Bridge>;
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Unique operation ID for undo within 10-second window */
  readonly operationId?: Maybe<Scalars['ID']['output']>;
  /** Previous state for undo functionality */
  readonly previousState?: Maybe<Scalars['JSON']['output']>;
  readonly success: Scalars['Boolean']['output'];
};

export type BridgePort = Node & {
  readonly bridge: Bridge;
  readonly edge: Scalars['Boolean']['output'];
  readonly frameTypes: FrameTypes;
  readonly id: Scalars['ID']['output'];
  readonly ingressFiltering: Scalars['Boolean']['output'];
  readonly interface: Interface;
  readonly pathCost: Scalars['Int']['output'];
  readonly pvid: Scalars['Int']['output'];
  readonly role: StpPortRole;
  readonly state: StpPortState;
  readonly taggedVlans: ReadonlyArray<Scalars['Int']['output']>;
  readonly untaggedVlans: ReadonlyArray<Scalars['Int']['output']>;
};

/** Frame types that can be admitted on a bridge port */
export const BridgePortFrameTypes = {
  /** Accept all frames (tagged and untagged) */
  AdmitAll: 'ADMIT_ALL',
  /** Accept only untagged and priority-tagged frames */
  AdmitOnlyUntaggedAndPriorityTagged: 'ADMIT_ONLY_UNTAGGED_AND_PRIORITY_TAGGED',
  /** Accept only VLAN-tagged frames */
  AdmitOnlyVlanTagged: 'ADMIT_ONLY_VLAN_TAGGED'
} as const;

export type BridgePortFrameTypes = typeof BridgePortFrameTypes[keyof typeof BridgePortFrameTypes];
export type BridgePortMutationResult = {
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  readonly operationId?: Maybe<Scalars['ID']['output']>;
  readonly port?: Maybe<BridgePort>;
  readonly previousState?: Maybe<Scalars['JSON']['output']>;
  readonly success: Scalars['Boolean']['output'];
};

/** VLAN configuration for a bridge port (trunk/access port setup) */
export type BridgePortVlanConfig = {
  /** Frame types allowed on this port */
  readonly frameTypes: BridgePortFrameTypes;
  /** Port mode (trunk or access) */
  readonly mode: PortMode;
  /** Bridge port ID */
  readonly portId: Scalars['ID']['output'];
  /** Port VLAN ID (PVID) for untagged traffic */
  readonly pvid: Scalars['Int']['output'];
  /** Tagged VLANs allowed on this port (trunk mode) */
  readonly taggedVlans: ReadonlyArray<Scalars['Int']['output']>;
  /** Untagged VLANs on this port (typically just PVID) */
  readonly untaggedVlans: ReadonlyArray<Scalars['Int']['output']>;
};

/** Input for configuring bridge port VLAN settings */
export type BridgePortVlanInput = {
  /** Frame types allowed on this port */
  readonly frameTypes: BridgePortFrameTypes;
  /** Port mode (trunk or access) */
  readonly mode: PortMode;
  /** Port VLAN ID (PVID) for untagged traffic */
  readonly pvid: Scalars['Int']['input'];
  /** Tagged VLANs (for trunk ports) */
  readonly taggedVlans?: InputMaybe<ReadonlyArray<Scalars['Int']['input']>>;
};

/** Bridge resource (part of LANNetwork) */
export type BridgeResource = Node & Resource & {
  readonly category: ResourceCategory;
  readonly configuration: Scalars['JSON']['output'];
  readonly deployment?: Maybe<DeploymentState>;
  readonly id: Scalars['ID']['output'];
  readonly metadata: ResourceMetadata;
  /** Bridge name */
  readonly name: Scalars['String']['output'];
  readonly platform?: Maybe<PlatformInfo>;
  /** Ports in this bridge */
  readonly ports: ReadonlyArray<Scalars['String']['output']>;
  /** Protocol mode (rstp, stp, none) */
  readonly protocolMode?: Maybe<Scalars['String']['output']>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
};

export type BridgeStpStatus = {
  readonly lastTopologyChange?: Maybe<Scalars['DateTime']['output']>;
  readonly rootBridge: Scalars['Boolean']['output'];
  readonly rootBridgeId?: Maybe<Scalars['String']['output']>;
  readonly rootPathCost: Scalars['Int']['output'];
  readonly rootPort?: Maybe<Scalars['String']['output']>;
  readonly topologyChangeCount: Scalars['Int']['output'];
};

export type BridgeVlan = {
  readonly bridge: Bridge;
  readonly taggedPorts: ReadonlyArray<BridgePort>;
  readonly untaggedPorts: ReadonlyArray<BridgePort>;
  readonly uuid: Scalars['ID']['output'];
  readonly vlanId: Scalars['Int']['output'];
};

export type BridgeVlanMutationResult = {
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  readonly success: Scalars['Boolean']['output'];
  readonly vlan?: Maybe<BridgeVlan>;
};

/**
 * Input for bulk address import.
 * Used with bulkCreateAddressListEntries mutation.
 */
export type BulkAddressInput = {
  /** IP address, CIDR notation, or IP range */
  readonly address: Scalars['String']['input'];
  /** Optional description */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Optional timeout */
  readonly timeout?: InputMaybe<Scalars['String']['input']>;
};

/** Bulk alert mutation payload */
export type BulkAlertPayload = {
  /** Number of alerts acknowledged */
  readonly acknowledgedCount: Scalars['Int']['output'];
  /** Errors encountered during mutation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/** Details of a single failed entry in bulk import. */
export type BulkCreateError = {
  /** The address that failed */
  readonly address: Scalars['String']['output'];
  /** Index in the input array */
  readonly index: Scalars['Int']['output'];
  /** Error message */
  readonly message: Scalars['String']['output'];
};

/**
 * Result of bulk address list entry creation.
 * Includes success count, failure count, and error details.
 */
export type BulkCreateResult = {
  /** Details of failed entries */
  readonly errors: ReadonlyArray<BulkCreateError>;
  /** Number of entries that failed */
  readonly failedCount: Scalars['Int']['output'];
  /** Number of entries successfully created */
  readonly successCount: Scalars['Int']['output'];
};

/** CPU utilization metrics */
export type CpuMetrics = {
  /** Number of CPU cores */
  readonly cores: Scalars['Int']['output'];
  /** CPU frequency in MHz (optional) */
  readonly frequency?: Maybe<Scalars['Float']['output']>;
  /** Per-core usage percentages (one per core) */
  readonly perCore: ReadonlyArray<Scalars['Float']['output']>;
  /** Overall CPU usage percentage (0-100) */
  readonly usage: Scalars['Float']['output'];
};

export const CacheScope = {
  Private: 'PRIVATE',
  Public: 'PUBLIC'
} as const;

export type CacheScope = typeof CacheScope[keyof typeof CacheScope];
export type CancelChangeSetPayload = {
  /** The cancelled change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether cancel was successful */
  readonly success: Scalars['Boolean']['output'];
};

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
/** An entry in the change log */
export type ChangeLogEntry = {
  /** Type of change */
  readonly changeType: ChangeType;
  /** Changed fields */
  readonly changedFields: ReadonlyArray<Scalars['String']['output']>;
  /** Brief description of the change */
  readonly summary?: Maybe<Scalars['String']['output']>;
  /** Change timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
  /** User who made the change */
  readonly user: Scalars['String']['output'];
};

/** Type of operation to perform on a resource */
export const ChangeOperation = {
  /** Create a new resource */
  Create: 'CREATE',
  /** Delete an existing resource */
  Delete: 'DELETE',
  /** Update an existing resource */
  Update: 'UPDATE'
} as const;

export type ChangeOperation = typeof ChangeOperation[keyof typeof ChangeOperation];
/** A change set representing an atomic multi-resource operation */
export type ChangeSet = {
  /** Apply started timestamp */
  readonly applyStartedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Completed timestamp */
  readonly completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Created timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** User who created the change set */
  readonly createdBy?: Maybe<Scalars['String']['output']>;
  /** Optional description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Error information (if failed) */
  readonly error?: Maybe<ChangeSetError>;
  /** Unique identifier (ULID) */
  readonly id: Scalars['ID']['output'];
  /** Items in this change set */
  readonly items: ReadonlyArray<ChangeSetItem>;
  /** Human-readable name */
  readonly name: Scalars['String']['output'];
  /** Rollback plan */
  readonly rollbackPlan: ReadonlyArray<RollbackStep>;
  /** Router ID this change set applies to */
  readonly routerId: Scalars['ID']['output'];
  /** Source wizard/feature */
  readonly source?: Maybe<Scalars['String']['output']>;
  /** Current status */
  readonly status: ChangeSetStatus;
  /** Validation result */
  readonly validation?: Maybe<ChangeSetValidationResult>;
  /** Version for optimistic concurrency */
  readonly version: Scalars['Int']['output'];
};

/** Conflict between change set items */
export type ChangeSetConflict = {
  /** Description of the conflict */
  readonly description: Scalars['String']['output'];
  /** Whether conflict is with existing resource */
  readonly isExternalConflict: Scalars['Boolean']['output'];
  /** First conflicting item ID */
  readonly itemId1: Scalars['ID']['output'];
  /** Second conflicting item ID or resource UUID */
  readonly itemId2OrResourceUuid: Scalars['ID']['output'];
  /** Suggested resolution */
  readonly resolution?: Maybe<Scalars['String']['output']>;
};

/** Detailed error for failed change sets */
export type ChangeSetError = {
  /** Error code */
  readonly code?: Maybe<Scalars['String']['output']>;
  /** Item ID that caused the failure */
  readonly failedItemId: Scalars['ID']['output'];
  /** Items that failed rollback */
  readonly failedRollbackItemIds: ReadonlyArray<Scalars['ID']['output']>;
  /** Error message */
  readonly message: Scalars['String']['output'];
  /** Items applied before failure */
  readonly partiallyAppliedItemIds: ReadonlyArray<Scalars['ID']['output']>;
  /** Whether manual intervention is required */
  readonly requiresManualIntervention: Scalars['Boolean']['output'];
};

/** Individual item within a change set */
export type ChangeSetItem = {
  /** Apply completed timestamp */
  readonly applyCompletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Order in which this item will be applied */
  readonly applyOrder: Scalars['Int']['output'];
  /** Apply started timestamp */
  readonly applyStartedAt?: Maybe<Scalars['DateTime']['output']>;
  /** New/updated configuration */
  readonly configuration: Scalars['JSON']['output'];
  /** Item IDs this depends on */
  readonly dependencies: ReadonlyArray<Scalars['ID']['output']>;
  /** Optional description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Error message if failed */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this item */
  readonly id: Scalars['ID']['output'];
  /** User-friendly name */
  readonly name: Scalars['String']['output'];
  /** Operation to perform */
  readonly operation: ChangeOperation;
  /** Previous state (for rollback) */
  readonly previousState?: Maybe<Scalars['JSON']['output']>;
  /** Resource category */
  readonly resourceCategory: ResourceCategory;
  /** Resource type identifier */
  readonly resourceType: Scalars['String']['output'];
  /** Existing resource UUID (null for create operations) */
  readonly resourceUuid?: Maybe<Scalars['ID']['output']>;
  /** Current status */
  readonly status: ChangeSetItemStatus;
};

/** Input for adding an item to a change set */
export type ChangeSetItemInput = {
  /** Configuration */
  readonly configuration: Scalars['JSON']['input'];
  /** Item IDs this depends on */
  readonly dependencies?: InputMaybe<ReadonlyArray<Scalars['ID']['input']>>;
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** User-friendly name */
  readonly name: Scalars['String']['input'];
  /** Operation to perform */
  readonly operation: ChangeOperation;
  /** Previous state (for rollback on update/delete) */
  readonly previousState?: InputMaybe<Scalars['JSON']['input']>;
  /** Resource category */
  readonly resourceCategory: ResourceCategory;
  /** Resource type identifier */
  readonly resourceType: Scalars['String']['input'];
  /** Existing resource UUID (for update/delete) */
  readonly resourceUuid?: InputMaybe<Scalars['ID']['input']>;
};

/** Status of individual items within a change set */
export const ChangeSetItemStatus = {
  /** Successfully applied */
  Applied: 'APPLIED',
  /** Currently being applied */
  Applying: 'APPLYING',
  /** Application failed */
  Failed: 'FAILED',
  /** Waiting to be applied */
  Pending: 'PENDING',
  /** Rollback failed - manual intervention needed */
  RollbackFailed: 'ROLLBACK_FAILED',
  /** Successfully rolled back */
  RolledBack: 'ROLLED_BACK',
  /** Skipped due to dependency failure */
  Skipped: 'SKIPPED'
} as const;

export type ChangeSetItemStatus = typeof ChangeSetItemStatus[keyof typeof ChangeSetItemStatus];
/** Progress event for real-time updates during apply */
export type ChangeSetProgressEvent = {
  /** Number of items applied */
  readonly appliedCount: Scalars['Int']['output'];
  /** Change set ID */
  readonly changeSetId: Scalars['ID']['output'];
  /** Currently processing item */
  readonly currentItem?: Maybe<CurrentItemInfo>;
  /** Error if failed */
  readonly error?: Maybe<ChangeSetError>;
  /** Estimated time remaining in milliseconds */
  readonly estimatedRemainingMs?: Maybe<Scalars['Int']['output']>;
  /** Progress percentage (0-100) */
  readonly progressPercent: Scalars['Float']['output'];
  /** Current status */
  readonly status: ChangeSetStatus;
  /** Timestamp of this event */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Total number of items */
  readonly totalCount: Scalars['Int']['output'];
};

/** Change set lifecycle status */
export const ChangeSetStatus = {
  /** Applying resources in dependency order */
  Applying: 'APPLYING',
  /** User cancelled the operation */
  Cancelled: 'CANCELLED',
  /** All resources applied successfully */
  Completed: 'COMPLETED',
  /** Initial state - adding items, not yet validated */
  Draft: 'DRAFT',
  /** Apply failed, may have partial application */
  Failed: 'FAILED',
  /** Rollback partially failed - manual intervention needed */
  PartialFailure: 'PARTIAL_FAILURE',
  /** All items validated, ready to apply */
  Ready: 'READY',
  /** Rollback completed successfully */
  RolledBack: 'ROLLED_BACK',
  /** Rolling back applied changes */
  RollingBack: 'ROLLING_BACK',
  /** Running validation on all items */
  Validating: 'VALIDATING'
} as const;

export type ChangeSetStatus = typeof ChangeSetStatus[keyof typeof ChangeSetStatus];
/** Change set status change event */
export type ChangeSetStatusEvent = {
  /** Change set ID */
  readonly changeSetId: Scalars['ID']['output'];
  /** Error if failed */
  readonly error?: Maybe<ChangeSetError>;
  /** New status */
  readonly newStatus: ChangeSetStatus;
  /** Previous status */
  readonly previousStatus: ChangeSetStatus;
  /** Timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Summary of a change set for list displays */
export type ChangeSetSummary = {
  /** Created timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Has validation errors */
  readonly hasErrors: Scalars['Boolean']['output'];
  /** Has validation warnings */
  readonly hasWarnings: Scalars['Boolean']['output'];
  /** Change set ID */
  readonly id: Scalars['ID']['output'];
  /** Name */
  readonly name: Scalars['String']['output'];
  /** Operation counts */
  readonly operationCounts: OperationCounts;
  /** Current status */
  readonly status: ChangeSetStatus;
  /** Total items */
  readonly totalItems: Scalars['Int']['output'];
};

/** Validation error for a change set item */
export type ChangeSetValidationError = {
  /** Error code */
  readonly code?: Maybe<Scalars['String']['output']>;
  /** Field path within the item configuration */
  readonly field: Scalars['String']['output'];
  /** Item ID with validation error */
  readonly itemId: Scalars['ID']['output'];
  /** Error message */
  readonly message: Scalars['String']['output'];
  /** Severity level */
  readonly severity: ValidationSeverity;
};

/** Validation result for a change set */
export type ChangeSetValidationResult = {
  /** Whether the change set can be applied */
  readonly canApply: Scalars['Boolean']['output'];
  /** Circular dependencies (if any) */
  readonly circularDependencies?: Maybe<ReadonlyArray<ReadonlyArray<Scalars['ID']['output']>>>;
  /** Detected conflicts */
  readonly conflicts: ReadonlyArray<ChangeSetConflict>;
  /** Validation errors (blocking) */
  readonly errors: ReadonlyArray<ChangeSetValidationError>;
  /** Missing dependencies */
  readonly missingDependencies: ReadonlyArray<MissingDependency>;
  /** Validation warnings (non-blocking) */
  readonly warnings: ReadonlyArray<ChangeSetValidationError>;
};

/** Type of change for resource events */
export const ChangeType = {
  Create: 'CREATE',
  Delete: 'DELETE',
  Update: 'UPDATE'
} as const;

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];
/** Payload for channel configuration mutations */
export type ChannelConfigPayload = {
  /** The created/updated configuration */
  readonly config?: Maybe<NotificationChannelConfig>;
  /** Validation or mutation errors */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/** Type of notification channel */
export const ChannelType = {
  Email: 'EMAIL',
  Pushover: 'PUSHOVER',
  Slack: 'SLACK',
  Telegram: 'TELEGRAM',
  Webhook: 'WEBHOOK'
} as const;

export type ChannelType = typeof ChannelType[keyof typeof ChannelType];
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

/** A composite resource with all related sub-resources */
export type CompositeResource = {
  /** All child/related resources */
  readonly children: ReadonlyArray<Resource>;
  /** Flattened relationship graph */
  readonly relationships: ReadonlyArray<ResourceRelationshipEdge>;
  /** The root resource */
  readonly root: Resource;
};

/** Condition comparison operators */
export const ConditionOperator = {
  /** String contains */
  Contains: 'CONTAINS',
  /** Exact match */
  Equals: 'EQUALS',
  /** Numeric greater than */
  GreaterThan: 'GREATER_THAN',
  /** Numeric less than */
  LessThan: 'LESS_THAN',
  /** Not equal */
  NotEquals: 'NOT_EQUALS',
  /** Regular expression match */
  Regex: 'REGEX'
} as const;

export type ConditionOperator = typeof ConditionOperator[keyof typeof ConditionOperator];
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
/** Preview of RouterOS configuration commands */
export type ConfigPreview = {
  /** Resources that will be affected */
  readonly affectedResources?: Maybe<ReadonlyArray<AffectedResource>>;
  /** RouterOS commands to be executed */
  readonly commands: ReadonlyArray<Scalars['String']['output']>;
  /** Warnings about the configuration changes */
  readonly warnings?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
};

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

/** Severity level for confirmation dialogs */
export const ConfirmationSeverity = {
  /** Critical operation requiring explicit confirmation */
  Critical: 'CRITICAL',
  /** Standard operation with brief confirmation */
  Standard: 'STANDARD'
} as const;

export type ConfirmationSeverity = typeof ConfirmationSeverity[keyof typeof ConfirmationSeverity];
/** Types of resource conflicts */
export const ConflictType = {
  /** Configuration incompatibility */
  Configuration: 'CONFIGURATION',
  /** Interface conflict */
  Interface: 'INTERFACE',
  /** IP address conflict */
  IpAddress: 'IP_ADDRESS',
  /** Name collision */
  Name: 'NAME',
  /** Port number conflict */
  Port: 'PORT',
  /** Route overlap */
  Route: 'ROUTE'
} as const;

export type ConflictType = typeof ConflictType[keyof typeof ConflictType];
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

/**
 * Input for creating a new address list entry.
 * List will be created if it doesn't exist.
 */
export type CreateAddressListEntryInput = {
  /** IP address, CIDR notation (e.g., 192.168.1.0/24), or IP range (e.g., 192.168.1.1-192.168.1.100) */
  readonly address: Scalars['String']['input'];
  /** Optional description */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Target list name (will create if doesn't exist) */
  readonly list: Scalars['String']['input'];
  /** Optional timeout (e.g., "1d", "12h", "30m") */
  readonly timeout?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating an alert rule */
export type CreateAlertRuleInput = {
  /** Notification channels */
  readonly channels: ReadonlyArray<Scalars['String']['input']>;
  /** Array of conditions */
  readonly conditions?: InputMaybe<ReadonlyArray<AlertConditionInput>>;
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Optional device ID filter */
  readonly deviceId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether rule is enabled (default: true) */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Escalation configuration (NAS-18.9) */
  readonly escalation?: InputMaybe<EscalationConfigInput>;
  /** Event type to match */
  readonly eventType: Scalars['String']['input'];
  /** Human-readable alert rule name */
  readonly name: Scalars['String']['input'];
  /** Quiet hours configuration */
  readonly quietHours?: InputMaybe<QuietHoursConfigInput>;
  /** Alert severity level */
  readonly severity: AlertSeverity;
  /** Throttle configuration */
  readonly throttle?: InputMaybe<ThrottleConfigInput>;
};

export type CreateBridgeInput = {
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  readonly mtu?: InputMaybe<Scalars['Int']['input']>;
  readonly name: Scalars['String']['input'];
  readonly priority?: InputMaybe<Scalars['Int']['input']>;
  readonly protocol?: InputMaybe<StpProtocol>;
  readonly pvid?: InputMaybe<Scalars['Int']['input']>;
  readonly vlanFiltering?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateBridgeVlanInput = {
  readonly taggedPortIds?: InputMaybe<ReadonlyArray<Scalars['ID']['input']>>;
  readonly untaggedPortIds?: InputMaybe<ReadonlyArray<Scalars['ID']['input']>>;
  readonly vlanId: Scalars['Int']['input'];
};

/** Input for creating a new change set */
export type CreateChangeSetInput = {
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable name */
  readonly name: Scalars['String']['input'];
  /** Router to apply changes to */
  readonly routerId: Scalars['ID']['input'];
  /** Source wizard/feature */
  readonly source?: InputMaybe<Scalars['String']['input']>;
};

export type CreateChangeSetPayload = {
  /** The created change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/** Input for creating a NAT rule. */
export type CreateNatRuleInput = {
  /** NAT action */
  readonly action: NatAction;
  /** NAT chain (srcnat or dstnat) */
  readonly chain: NatChain;
  /** Optional comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Whether rule is disabled */
  readonly disabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Destination address or CIDR */
  readonly dstAddress?: InputMaybe<Scalars['String']['input']>;
  /** Destination port (1-65535) */
  readonly dstPort?: InputMaybe<Scalars['String']['input']>;
  /** Incoming interface */
  readonly inInterface?: InputMaybe<Scalars['String']['input']>;
  /** Outgoing interface */
  readonly outInterface?: InputMaybe<Scalars['String']['input']>;
  /** Protocol (TCP, UDP) */
  readonly protocol?: InputMaybe<TransportProtocol>;
  /** Source address or CIDR */
  readonly srcAddress?: InputMaybe<Scalars['String']['input']>;
  /** Source port or port range */
  readonly srcPort?: InputMaybe<Scalars['String']['input']>;
  /** Target address for NAT */
  readonly toAddresses?: InputMaybe<Scalars['String']['input']>;
  /** Target port(s) for NAT */
  readonly toPorts?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new notification channel configuration */
export type CreateNotificationChannelConfigInput = {
  /** Type of notification channel */
  readonly channelType: ChannelType;
  /**
   * Full configuration including sensitive fields
   * For Pushover: {"userKey": "...", "apiToken": "...", "device": "...", "baseURL": "..."}
   * For Email: {"host": "...", "port": 587, "from": "...", "username": "...", "password": "...", "tlsMode": "..."}
   */
  readonly config: Scalars['JSON']['input'];
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Whether this should be the default configuration */
  readonly isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** Human-readable name */
  readonly name: Scalars['String']['input'];
};

/** Input for creating a new port mirror configuration */
export type CreatePortMirrorInput = {
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Destination interface ID for mirrored traffic */
  readonly destinationInterfaceId: Scalars['ID']['input'];
  /** Direction of traffic to mirror (default: BOTH) */
  readonly direction?: InputMaybe<MirrorDirection>;
  /** Descriptive name for the mirror configuration */
  readonly name: Scalars['String']['input'];
  /** Source interface IDs to mirror (must be bridge members) */
  readonly sourceInterfaceIds: ReadonlyArray<Scalars['ID']['input']>;
};

/** Input for creating a new resource */
export type CreateResourceInput = {
  /** Resource category */
  readonly category: ResourceCategory;
  /** Initial configuration */
  readonly configuration: Scalars['JSON']['input'];
  /** Resource description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** User-defined relationships */
  readonly relationships?: InputMaybe<ResourceRelationshipsInput>;
  /** Router to create resource on */
  readonly routerId: Scalars['ID']['input'];
  /** Initial tags */
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  /** Resource type (e.g., 'vpn.wireguard.client') */
  readonly type: Scalars['String']['input'];
};

export type CreateResourcePayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The created resource */
  readonly resource?: Maybe<Resource>;
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

/** Input for creating a webhook */
export type CreateWebhookInput = {
  /** Authentication type (default: NONE) */
  readonly authType?: InputMaybe<WebhookAuthType>;
  /** Bearer token for Bearer auth */
  readonly bearerToken?: InputMaybe<Scalars['String']['input']>;
  /** Custom template body (required if template is CUSTOM) */
  readonly customTemplate?: InputMaybe<Scalars['String']['input']>;
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Whether webhook is enabled (default: true) */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Custom HTTP headers (as JSON object) */
  readonly headers?: InputMaybe<Scalars['JSON']['input']>;
  /** Maximum retry attempts (default: 3) */
  readonly maxRetries?: InputMaybe<Scalars['Int']['input']>;
  /** HTTP method (default: POST) */
  readonly method?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable webhook name */
  readonly name: Scalars['String']['input'];
  /** Password for Basic auth */
  readonly password?: InputMaybe<Scalars['String']['input']>;
  /** Whether to retry failed deliveries (default: true) */
  readonly retryEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Signing secret for HMAC signature (optional) */
  readonly signingSecret?: InputMaybe<Scalars['String']['input']>;
  /** Template type for webhook payload (default: GENERIC) */
  readonly template?: InputMaybe<WebhookTemplate>;
  /** Timeout in seconds (default: 10) */
  readonly timeoutSeconds?: InputMaybe<Scalars['Int']['input']>;
  /** Webhook URL endpoint */
  readonly url: Scalars['String']['input'];
  /** Username for Basic auth */
  readonly username?: InputMaybe<Scalars['String']['input']>;
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

/** Current item information in progress event */
export type CurrentItemInfo = {
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly operation: ChangeOperation;
  readonly status: ChangeSetItemStatus;
};

/** DHCP Server resource */
export type DhcpServerResource = Node & Resource & {
  /** Number of active leases */
  readonly activeLeases?: Maybe<Scalars['Int']['output']>;
  /** Address pool name */
  readonly addressPool: Scalars['String']['output'];
  readonly category: ResourceCategory;
  readonly configuration: Scalars['JSON']['output'];
  readonly deployment?: Maybe<DeploymentState>;
  readonly id: Scalars['ID']['output'];
  /** Interface serving DHCP */
  readonly interface: Scalars['String']['output'];
  /** Lease time */
  readonly leaseTime: Scalars['Duration']['output'];
  readonly metadata: ResourceMetadata;
  /** Server name */
  readonly name: Scalars['String']['output'];
  readonly platform?: Maybe<PlatformInfo>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
};

/** Daily statistics */
export type DailyStats = {
  /** Date (UTC) */
  readonly date: Scalars['DateTime']['output'];
  /** Error count */
  readonly errorCount: Scalars['Int']['output'];
  /** Peak throughput in (bytes/sec) */
  readonly peakThroughputIn: Scalars['Size']['output'];
  /** Peak throughput out (bytes/sec) */
  readonly peakThroughputOut: Scalars['Size']['output'];
  /** Total bytes in */
  readonly totalBytesIn: Scalars['Size']['output'];
  /** Total bytes out */
  readonly totalBytesOut: Scalars['Size']['output'];
  /** Uptime percentage (0-100) */
  readonly uptimePercent: Scalars['Float']['output'];
};

export type DeleteChangeSetPayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether deletion was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Input for deleting a service instance. */
export type DeleteInstanceInput = {
  /** Instance ID to delete */
  readonly instanceID: Scalars['ID']['input'];
  /** Router ID */
  readonly routerID: Scalars['ID']['input'];
};

/** Delete operation payload */
export type DeletePayload = {
  /** ID of deleted item */
  readonly deletedId?: Maybe<Scalars['ID']['output']>;
  /** Errors encountered during deletion */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether deletion was successful */
  readonly success: Scalars['Boolean']['output'];
};

export type DeleteResourcePayload = {
  /** ID of deleted resource */
  readonly deletedId?: Maybe<Scalars['ID']['output']>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether deletion was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Result of a delete operation */
export type DeleteResult = {
  /** Errors that occurred during deletion */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Success or error message */
  readonly message?: Maybe<Scalars['String']['output']>;
  /** Whether the deletion succeeded */
  readonly success: Scalars['Boolean']['output'];
};

export type DeleteRouterPayload = {
  /** ID of the deleted router */
  readonly deletedRouterId?: Maybe<Scalars['ID']['output']>;
  /** Errors that occurred during deletion */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Whether deletion was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Status of a required dependency */
export type DependencyStatus = {
  /** Whether the dependency is active */
  readonly isActive: Scalars['Boolean']['output'];
  /** Why this dependency is required */
  readonly reason: Scalars['String']['output'];
  /** Dependency resource type */
  readonly resourceType: Scalars['String']['output'];
  /** Dependency resource UUID */
  readonly resourceUuid: Scalars['ID']['output'];
  /** Current state of the dependency */
  readonly state: ResourceLifecycleState;
};

/**
 * Layer 3: What's actually on router after Apply-Confirm.
 * Includes router-generated fields like IDs and computed values.
 */
export type DeploymentState = {
  /** When the resource was applied */
  readonly appliedAt: Scalars['DateTime']['output'];
  /** User who applied the resource */
  readonly appliedBy?: Maybe<Scalars['String']['output']>;
  /** Apply operation ID for audit trail */
  readonly applyOperationId?: Maybe<Scalars['ID']['output']>;
  /** Detected drift from configuration */
  readonly drift?: Maybe<DriftInfo>;
  /** Router-generated fields (public key, computed values, etc.) */
  readonly generatedFields?: Maybe<Scalars['JSON']['output']>;
  /** Whether deployment matches configuration (no drift) */
  readonly isInSync: Scalars['Boolean']['output'];
  /** Router-generated resource ID (e.g., '*1A' in MikroTik) */
  readonly routerResourceId?: Maybe<Scalars['String']['output']>;
  /** Version number on router */
  readonly routerVersion?: Maybe<Scalars['Int']['output']>;
};

export type DeprecateResourcePayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The deprecated resource */
  readonly resource?: Maybe<Resource>;
};

/** Device (router) for querying resource metrics */
export type Device = {
  /** Device identifier */
  readonly id: Scalars['ID']['output'];
  /** Current resource utilization metrics */
  readonly resourceMetrics: ResourceMetrics;
};

/** DHCP client configuration for dynamic WAN IP */
export type DhcpClient = Node & {
  /** Add default route from DHCP */
  readonly addDefaultRoute: Scalars['Boolean']['output'];
  /** Assigned IP address */
  readonly address?: Maybe<Scalars['IPv4']['output']>;
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** DHCP server address */
  readonly dhcpServer?: Maybe<Scalars['IPv4']['output']>;
  /** Whether DHCP client is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Lease expiry time */
  readonly expiresAfter?: Maybe<Scalars['Duration']['output']>;
  /** Gateway from DHCP */
  readonly gateway?: Maybe<Scalars['IPv4']['output']>;
  /** Unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Interface name */
  readonly interface: Scalars['String']['output'];
  /** Current DHCP status */
  readonly status: Scalars['String']['output'];
  /** Use DNS servers from DHCP */
  readonly usePeerDNS: Scalars['Boolean']['output'];
  /** Use NTP servers from DHCP */
  readonly usePeerNTP: Scalars['Boolean']['output'];
};

/** Input for creating/updating DHCP client */
export type DhcpClientInput = {
  /** Add default route (default: true) */
  readonly addDefaultRoute?: InputMaybe<Scalars['Boolean']['input']>;
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Interface to enable DHCP client on */
  readonly interface: Scalars['String']['input'];
  /** Use peer DNS (default: true) */
  readonly usePeerDNS?: InputMaybe<Scalars['Boolean']['input']>;
  /** Use peer NTP (default: true) */
  readonly usePeerNTP?: InputMaybe<Scalars['Boolean']['input']>;
};

/** DHCP server (minimal type for dependencies) */
export type DhcpServer = {
  /** Whether the DHCP server is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** DHCP server ID */
  readonly id: Scalars['ID']['output'];
  /** Interface the DHCP server is bound to */
  readonly interface: Interface;
  /** DHCP server name */
  readonly name: Scalars['String']['output'];
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

/** Email digest configuration (NAS-18.11) */
export type DigestConfig = {
  /** Whether critical alerts bypass digest mode and send immediately */
  readonly bypassCritical: Scalars['Boolean']['output'];
  /** Whether digest mode is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Digest interval in minutes (e.g., 60 for hourly, 1440 for daily) */
  readonly intervalMinutes: Scalars['Int']['output'];
  /** Whether to send digest even when no alerts occurred during the period */
  readonly sendEmptyDigest: Scalars['Boolean']['output'];
  /** Time of day for daily delivery in HH:MM format (optional, for daily digests) */
  readonly time?: Maybe<Scalars['String']['output']>;
};

/** Email digest configuration input (NAS-18.11) */
export type DigestConfigInput = {
  /** Whether critical alerts bypass digest mode and send immediately (default: true) */
  readonly bypassCritical?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether digest mode is enabled */
  readonly enabled: Scalars['Boolean']['input'];
  /** Digest interval in minutes (e.g., 60 for hourly, 1440 for daily) */
  readonly intervalMinutes: Scalars['Int']['input'];
  /** Whether to send digest even when no alerts occurred during the period (default: false) */
  readonly sendEmptyDigest?: InputMaybe<Scalars['Boolean']['input']>;
  /** Time of day for daily delivery in HH:MM format (optional, for daily digests) */
  readonly time?: InputMaybe<Scalars['String']['input']>;
};

/** Digest summary (NAS-18.11) */
export type DigestSummary = {
  /** Number of alerts included in the digest */
  readonly alertCount: Scalars['Int']['output'];
  /** Channel ID this digest was sent to */
  readonly channelId: Scalars['String']['output'];
  /** When the digest was delivered */
  readonly deliveredAt: Scalars['DateTime']['output'];
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Time period covered by the digest (e.g., "Last hour", "Last 24 hours") */
  readonly period: Scalars['String']['output'];
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

/** Complete benchmark result comparing all configured DNS servers */
export type DnsBenchmarkResult = {
  /** Fastest server */
  readonly fastestServer?: Maybe<DnsBenchmarkServerResult>;
  /** Results for each tested server, sorted by response time */
  readonly serverResults: ReadonlyArray<DnsBenchmarkServerResult>;
  /** Test hostname used for benchmarking */
  readonly testHostname: Scalars['String']['output'];
  /** When the benchmark was executed */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Total benchmark execution time in milliseconds */
  readonly totalTimeMs: Scalars['Int']['output'];
};

/** Benchmark result for a single DNS server */
export type DnsBenchmarkServerResult = {
  /** Error message (if server failed) */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Response time in milliseconds (-1 if unreachable) */
  readonly responseTimeMs: Scalars['Int']['output'];
  /** DNS server IP address */
  readonly server: Scalars['String']['output'];
  /** Server status (Fastest, Good, Slow, Unreachable) */
  readonly status: DnsServerStatus;
  /** Whether the server responded successfully */
  readonly success: Scalars['Boolean']['output'];
};

/** DNS cache statistics for monitoring cache usage */
export type DnsCacheStats = {
  /** Maximum cache size in bytes */
  readonly cacheMaxBytes: Scalars['Size']['output'];
  /** Cache usage percentage (0-100) */
  readonly cacheUsagePercent: Scalars['Float']['output'];
  /** Cache size used in bytes */
  readonly cacheUsedBytes: Scalars['Size']['output'];
  /** Cache hit rate percentage (0-100) */
  readonly hitRatePercent?: Maybe<Scalars['Float']['output']>;
  /** When the statistics were collected */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Most queried domains (top 10) */
  readonly topDomains: ReadonlyArray<DnsTopDomain>;
  /** Total number of entries in the DNS cache */
  readonly totalEntries: Scalars['Int']['output'];
};

/** Input for DNS lookup operation */
export type DnsLookupInput = {
  /** Device/router ID to run lookup from */
  readonly deviceId: Scalars['String']['input'];
  /** Hostname or IP address to look up */
  readonly hostname: Scalars['String']['input'];
  /** DNS record type to query */
  readonly recordType: DnsRecordType;
  /** DNS server to use (defaults to router's configured DNS) */
  readonly server?: InputMaybe<Scalars['String']['input']>;
  /** Query timeout in seconds (default: 5) */
  readonly timeout?: InputMaybe<Scalars['Int']['input']>;
};

/** Result of a DNS lookup operation */
export type DnsLookupResult = {
  /** Whether response was authoritative */
  readonly authoritative: Scalars['Boolean']['output'];
  /** Error message (if query failed) */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Hostname that was queried */
  readonly hostname: Scalars['String']['output'];
  /** Query time in milliseconds */
  readonly queryTime: Scalars['Int']['output'];
  /** Record type that was queried */
  readonly recordType: DnsRecordType;
  /** Resolved records */
  readonly records: ReadonlyArray<DnsRecord>;
  /** DNS server used */
  readonly server: Scalars['String']['output'];
  /** Query status */
  readonly status: DnsLookupStatus;
  /** When the query was executed */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** DNS lookup status codes */
export const DnsLookupStatus = {
  /** Network error occurred */
  NetworkError: 'NETWORK_ERROR',
  /** Domain does not exist (NXDOMAIN) */
  Nxdomain: 'NXDOMAIN',
  /** Query refused by server */
  Refused: 'REFUSED',
  /** DNS server failure (SERVFAIL) */
  Servfail: 'SERVFAIL',
  /** Query completed successfully */
  Success: 'SUCCESS',
  /** Query timed out */
  Timeout: 'TIMEOUT'
} as const;

export type DnsLookupStatus = typeof DnsLookupStatus[keyof typeof DnsLookupStatus];
/** Single DNS record */
export type DnsRecord = {
  /** Record data (IP, hostname, text, etc.) */
  readonly data: Scalars['String']['output'];
  /** Record name (query hostname) */
  readonly name: Scalars['String']['output'];
  /** Port (for SRV records) */
  readonly port?: Maybe<Scalars['Int']['output']>;
  /** Priority (for MX/SRV records) */
  readonly priority?: Maybe<Scalars['Int']['output']>;
  /** Time to live in seconds */
  readonly ttl: Scalars['Int']['output'];
  /** Record type */
  readonly type: DnsRecordType;
  /** Weight (for SRV records) */
  readonly weight?: Maybe<Scalars['Int']['output']>;
};

/** DNS record types supported */
export const DnsRecordType = {
  /** IPv4 address record */
  A: 'A',
  /** IPv6 address record */
  Aaaa: 'AAAA',
  /** Canonical name record */
  Cname: 'CNAME',
  /** Mail exchange record */
  Mx: 'MX',
  /** Name server record */
  Ns: 'NS',
  /** Pointer record (reverse DNS) */
  Ptr: 'PTR',
  /** Start of authority record */
  Soa: 'SOA',
  /** Service record */
  Srv: 'SRV',
  /** Text record */
  Txt: 'TXT'
} as const;

export type DnsRecordType = typeof DnsRecordType[keyof typeof DnsRecordType];
/** DNS server configuration */
export type DnsServer = {
  /** Server IP address */
  readonly address: Scalars['String']['output'];
  /** Whether this is the primary DNS server */
  readonly isPrimary: Scalars['Boolean']['output'];
  /** Whether this is the secondary DNS server */
  readonly isSecondary: Scalars['Boolean']['output'];
};

/** Status classification for DNS servers in benchmark */
export const DnsServerStatus = {
  /** Fastest responding server */
  Fastest: 'FASTEST',
  /** Server responded in acceptable time (<100ms) */
  Good: 'GOOD',
  /** Server responded slowly (>100ms) */
  Slow: 'SLOW',
  /** Server did not respond */
  Unreachable: 'UNREACHABLE'
} as const;

export type DnsServerStatus = typeof DnsServerStatus[keyof typeof DnsServerStatus];
/** Collection of DNS servers */
export type DnsServers = {
  /** Primary DNS server address */
  readonly primary: Scalars['String']['output'];
  /** Secondary DNS server address (if configured) */
  readonly secondary?: Maybe<Scalars['String']['output']>;
  /** All configured DNS servers */
  readonly servers: ReadonlyArray<DnsServer>;
};

/** A frequently queried domain in the DNS cache */
export type DnsTopDomain = {
  /** Domain name */
  readonly domain: Scalars['String']['output'];
  /** Last query time */
  readonly lastQueried?: Maybe<Scalars['DateTime']['output']>;
  /** Number of queries for this domain */
  readonly queryCount: Scalars['Int']['output'];
};

/** Actions to resolve drift */
export const DriftAction = {
  /** Update configuration to match router */
  Accept: 'ACCEPT',
  /** Re-apply configuration to router */
  Reapply: 'REAPPLY',
  /** Manual review required */
  Review: 'REVIEW'
} as const;

export type DriftAction = typeof DriftAction[keyof typeof DriftAction];
/** A field that has drifted from configuration */
export type DriftField = {
  /** Actual value (from router) */
  readonly actual?: Maybe<Scalars['JSON']['output']>;
  /** Expected value (from configuration) */
  readonly expected?: Maybe<Scalars['JSON']['output']>;
  /** Field path */
  readonly path: Scalars['String']['output'];
};

/** Information about configuration drift */
export type DriftInfo = {
  /** When drift was detected */
  readonly detectedAt: Scalars['DateTime']['output'];
  /** Fields that have drifted */
  readonly driftedFields: ReadonlyArray<DriftField>;
  /** Suggested action to resolve drift */
  readonly suggestedAction: DriftAction;
};

/** Edge interface for connection edges */
export type Edge = {
  /** Cursor for pagination */
  readonly cursor: Scalars['String']['output'];
};

/** Email notification configuration */
export type EmailConfig = {
  /** Whether email notifications are enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Email sender address */
  readonly fromAddress?: Maybe<Scalars['String']['output']>;
  /** Email sender display name */
  readonly fromName?: Maybe<Scalars['String']['output']>;
  /** SMTP server hostname */
  readonly host?: Maybe<Scalars['String']['output']>;
  /** SMTP server port */
  readonly port?: Maybe<Scalars['Int']['output']>;
  /** Skip TLS certificate verification (use with caution) */
  readonly skipVerify?: Maybe<Scalars['Boolean']['output']>;
  /** Array of recipient email addresses */
  readonly toAddresses: ReadonlyArray<Scalars['String']['output']>;
  /** Whether to use TLS/SSL */
  readonly useTLS?: Maybe<Scalars['Boolean']['output']>;
  /** SMTP username for authentication */
  readonly username?: Maybe<Scalars['String']['output']>;
};

/** Email notification configuration input */
export type EmailConfigInput = {
  /** Whether email notifications are enabled */
  readonly enabled: Scalars['Boolean']['input'];
  /** Email sender address */
  readonly fromAddress?: InputMaybe<Scalars['String']['input']>;
  /** Email sender display name */
  readonly fromName?: InputMaybe<Scalars['String']['input']>;
  /** SMTP server hostname */
  readonly host?: InputMaybe<Scalars['String']['input']>;
  /** SMTP password for authentication */
  readonly password?: InputMaybe<Scalars['String']['input']>;
  /** SMTP server port */
  readonly port?: InputMaybe<Scalars['Int']['input']>;
  /** Skip TLS certificate verification (use with caution) */
  readonly skipVerify?: InputMaybe<Scalars['Boolean']['input']>;
  /** Array of recipient email addresses */
  readonly toAddresses: ReadonlyArray<Scalars['String']['input']>;
  /** Whether to use TLS/SSL */
  readonly useTLS?: InputMaybe<Scalars['Boolean']['input']>;
  /** SMTP username for authentication */
  readonly username?: InputMaybe<Scalars['String']['input']>;
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

/** Escalation configuration for unacknowledged alerts (NAS-18.9) */
export type EscalationConfig = {
  /** Additional notification channels to add during escalation */
  readonly additionalChannels: ReadonlyArray<Scalars['String']['output']>;
  /** Whether escalation is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Delay in seconds before first escalation */
  readonly escalationDelay: Scalars['Int']['output'];
  /** Maximum number of escalation levels */
  readonly maxEscalations: Scalars['Int']['output'];
  /** Per-level delay intervals in seconds */
  readonly repeatIntervals: ReadonlyArray<Scalars['Int']['output']>;
  /** Whether alert must be acknowledged to stop escalation */
  readonly requireAck: Scalars['Boolean']['output'];
};

/** Escalation configuration input (NAS-18.9) */
export type EscalationConfigInput = {
  /** Additional notification channels to add during escalation */
  readonly additionalChannels?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  /** Whether escalation is enabled (default: false) */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Delay in seconds before first escalation (default: 900 = 15min) */
  readonly escalationDelay?: InputMaybe<Scalars['Int']['input']>;
  /** Maximum number of escalation levels (default: 3) */
  readonly maxEscalations?: InputMaybe<Scalars['Int']['input']>;
  /** Per-level delay intervals in seconds (default: [900, 1800, 3600]) */
  readonly repeatIntervals?: InputMaybe<ReadonlyArray<Scalars['Int']['input']>>;
  /** Whether alert must be acknowledged to stop escalation (default: true) */
  readonly requireAck?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Escalation status (NAS-18.9) */
export const EscalationStatus = {
  /** Maximum escalation level reached */
  MaxReached: 'MAX_REACHED',
  /** Escalation is pending/in progress */
  Pending: 'PENDING',
  /** Escalation was resolved (alert acknowledged) */
  Resolved: 'RESOLVED'
} as const;

export type EscalationStatus = typeof EscalationStatus[keyof typeof EscalationStatus];
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

/** Feature deployment state */
export type FeatureDeployment = {
  readonly appliedAt: Scalars['DateTime']['output'];
  readonly appliedBy?: Maybe<Scalars['String']['output']>;
  /** Assigned IP address */
  readonly assignedIP?: Maybe<Scalars['IPv4']['output']>;
  /** Assigned ports */
  readonly assignedPorts?: Maybe<ReadonlyArray<Scalars['Port']['output']>>;
  /** Container ID (if containerized) */
  readonly containerId?: Maybe<Scalars['String']['output']>;
  /** Container image used */
  readonly containerImage?: Maybe<Scalars['String']['output']>;
  readonly drift?: Maybe<DriftInfo>;
  readonly isInSync: Scalars['Boolean']['output'];
  readonly routerResourceId?: Maybe<Scalars['String']['output']>;
  readonly routerVersion?: Maybe<Scalars['Int']['output']>;
};

/** Marketplace Feature resource (Tor, AdGuard, sing-box, etc.) */
export type FeatureResource = Node & Resource & {
  readonly category: ResourceCategory;
  readonly configuration?: Maybe<Scalars['JSON']['output']>;
  readonly deployment?: Maybe<DeploymentState>;
  readonly featureDeployment?: Maybe<FeatureDeployment>;
  /** Feature identifier */
  readonly featureId: Scalars['String']['output'];
  readonly featureRuntime?: Maybe<FeatureRuntime>;
  readonly id: Scalars['ID']['output'];
  readonly metadata: ResourceMetadata;
  /** Feature name */
  readonly name: Scalars['String']['output'];
  readonly platform?: Maybe<PlatformInfo>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
  /** Feature version */
  readonly version: Scalars['String']['output'];
  /** Virtual interface assigned */
  readonly virtualInterface?: Maybe<Scalars['String']['output']>;
};

/** Feature runtime state */
export type FeatureRuntime = {
  /** Container status */
  readonly containerStatus?: Maybe<Scalars['String']['output']>;
  /** CPU usage percentage */
  readonly cpuUsagePercent?: Maybe<Scalars['Float']['output']>;
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  readonly health: RuntimeHealth;
  readonly isRunning: Scalars['Boolean']['output'];
  readonly lastUpdated: Scalars['DateTime']['output'];
  /** Memory usage */
  readonly memoryUsage?: Maybe<Scalars['Size']['output']>;
  /** Devices routed through this feature */
  readonly routedDevices?: Maybe<Scalars['Int']['output']>;
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

/**
 * Firewall rule placeholder type.
 * TODO: Expand with full filter/NAT/mangle rule types in future stories.
 */
export type FirewallRule = Node & {
  /** Rule action (accept, drop, reject, etc.) */
  readonly action: Scalars['String']['output'];
  /** Rule chain (input, forward, output, prerouting, postrouting, etc.) */
  readonly chain: Scalars['String']['output'];
  /** Optional comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether rule is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Destination address list reference */
  readonly dstAddressList?: Maybe<Scalars['String']['output']>;
  /** Rule ID */
  readonly id: Scalars['ID']['output'];
  /** Source address list reference */
  readonly srcAddressList?: Maybe<Scalars['String']['output']>;
  /** Rule type (filter, nat, mangle) */
  readonly type: Scalars['String']['output'];
};

/**
 * Firewall rule reference type (lightweight for dependency tracking).
 * For full firewall rule management, see FirewallRule type in firewall.graphql.
 */
export type FirewallRuleReference = {
  /** Rule action */
  readonly action: Scalars['String']['output'];
  /** Rule chain */
  readonly chain: Scalars['String']['output'];
  /** Whether the rule is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Firewall rule ID */
  readonly id: Scalars['ID']['output'];
  /** Input interface filter */
  readonly inInterface?: Maybe<Scalars['String']['output']>;
  /** Output interface filter */
  readonly outInterface?: Maybe<Scalars['String']['output']>;
};

/** Firewall Rule resource */
export type FirewallRuleResource = Node & Resource & {
  /** Rule action (accept, drop, reject) */
  readonly action: Scalars['String']['output'];
  readonly category: ResourceCategory;
  /** Rule chain (input, forward, output) */
  readonly chain: Scalars['String']['output'];
  /** Rule comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  readonly configuration: Scalars['JSON']['output'];
  readonly deployment?: Maybe<DeploymentState>;
  /** Destination address/network */
  readonly dstAddress?: Maybe<Scalars['String']['output']>;
  /** Destination port(s) */
  readonly dstPort?: Maybe<Scalars['String']['output']>;
  /** Whether rule is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Hit counter */
  readonly hitCount?: Maybe<Scalars['Int']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly metadata: ResourceMetadata;
  readonly platform?: Maybe<PlatformInfo>;
  /** Protocol (tcp, udp, icmp, etc.) */
  readonly protocol?: Maybe<Scalars['String']['output']>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  /** Source address/network */
  readonly srcAddress?: Maybe<Scalars['String']['output']>;
  /** Source port(s) */
  readonly srcPort?: Maybe<Scalars['String']['output']>;
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
};

/** Firewall table types. */
export const FirewallTable = {
  /** Packet filtering */
  Filter: 'FILTER',
  /** Packet marking and modification */
  Mangle: 'MANGLE',
  /** Network address translation */
  Nat: 'NAT',
  /** Raw packet processing */
  Raw: 'RAW'
} as const;

export type FirewallTable = typeof FirewallTable[keyof typeof FirewallTable];
/**
 * Firewall template with pre-configured rule sets.
 * Templates allow quick application of common firewall configurations.
 */
export type FirewallTemplate = {
  /** Category for organization */
  readonly category: TemplateCategory;
  /** Complexity level indicator */
  readonly complexity: TemplateComplexity;
  /** When this template was created (null for built-in) */
  readonly createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Detailed description of what this template does */
  readonly description: Scalars['String']['output'];
  /** Unique template identifier */
  readonly id: Scalars['ID']['output'];
  /** Whether this is a built-in template */
  readonly isBuiltIn: Scalars['Boolean']['output'];
  /** Human-readable template name */
  readonly name: Scalars['String']['output'];
  /** Total number of rules in this template */
  readonly ruleCount: Scalars['Int']['output'];
  /** Rules that will be created */
  readonly rules: ReadonlyArray<TemplateRule>;
  /** When this template was last modified (null for built-in) */
  readonly updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Variables that can be customized before applying */
  readonly variables: ReadonlyArray<FirewallTemplateVariable>;
  /** Template version for compatibility tracking */
  readonly version: Scalars['String']['output'];
};

/** Result of template application. */
export type FirewallTemplateResult = {
  /** Number of rules successfully applied */
  readonly appliedRulesCount: Scalars['Int']['output'];
  /** Errors encountered during application */
  readonly errors?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Rollback ID for undo (valid for 5 minutes) */
  readonly rollbackId: Scalars['ID']['output'];
  /** Whether application succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/**
 * Variable definition for template customization.
 * Variables allow parameterization of templates for different network configurations.
 */
export type FirewallTemplateVariable = {
  /** Default value if not specified */
  readonly defaultValue?: Maybe<Scalars['String']['output']>;
  /** Description to help users understand the variable */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Human-readable label for UI */
  readonly label: Scalars['String']['output'];
  /** Variable name (used in rule properties) */
  readonly name: Scalars['String']['output'];
  /** Available options (populated from router for INTERFACE type) */
  readonly options?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Whether this variable is required */
  readonly required: Scalars['Boolean']['output'];
  /** Variable type for validation */
  readonly type: VariableType;
};

/** Input for defining a template variable. */
export type FirewallTemplateVariableInput = {
  /** Default value */
  readonly defaultValue?: InputMaybe<Scalars['String']['input']>;
  /** Description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Label for UI */
  readonly label: Scalars['String']['input'];
  /** Variable name */
  readonly name: Scalars['String']['input'];
  /** Whether required */
  readonly required: Scalars['Boolean']['input'];
  /** Variable type */
  readonly type: VariableType;
};

/** Status of a fix application */
export const FixApplicationStatus = {
  /** Fix was applied successfully */
  Applied: 'APPLIED',
  /** Fix is being applied */
  Applying: 'APPLYING',
  /** Fix is available but not yet applied */
  Available: 'AVAILABLE',
  /** Fix application failed */
  Failed: 'FAILED',
  /** Fix was applied but issue persists */
  IssuePersists: 'ISSUE_PERSISTS'
} as const;

export type FixApplicationStatus = typeof FixApplicationStatus[keyof typeof FixApplicationStatus];
/** Confidence level for a fix suggestion */
export const FixConfidence = {
  /** High confidence this fix will resolve the issue */
  High: 'HIGH',
  /** Low confidence, worth trying as last resort */
  Low: 'LOW',
  /** Medium confidence, may resolve the issue */
  Medium: 'MEDIUM'
} as const;

export type FixConfidence = typeof FixConfidence[keyof typeof FixConfidence];
/** Result of flushing the DNS cache */
export type FlushDnsCacheResult = {
  /** Cache statistics after flushing */
  readonly afterStats: DnsCacheStats;
  /** Cache statistics before flushing */
  readonly beforeStats: DnsCacheStats;
  /** Number of entries removed from the cache */
  readonly entriesRemoved: Scalars['Int']['output'];
  /** User-friendly message */
  readonly message: Scalars['String']['output'];
  /** Whether the cache was flushed successfully */
  readonly success: Scalars['Boolean']['output'];
  /** When the flush was executed */
  readonly timestamp: Scalars['DateTime']['output'];
};

export const FrameTypes = {
  AdmitAll: 'ADMIT_ALL',
  AdmitOnlyUntaggedAndPriority: 'ADMIT_ONLY_UNTAGGED_AND_PRIORITY',
  AdmitOnlyVlanTagged: 'ADMIT_ONLY_VLAN_TAGGED'
} as const;

export type FrameTypes = typeof FrameTypes[keyof typeof FrameTypes];
/** Result of checking gateway reachability */
export type GatewayReachabilityResult = {
  /** Interface through which gateway is reachable (null if unreachable) */
  readonly interface?: Maybe<Scalars['String']['output']>;
  /** Ping latency in milliseconds (null if unreachable) */
  readonly latency?: Maybe<Scalars['Int']['output']>;
  /** Human-readable message about reachability */
  readonly message: Scalars['String']['output'];
  /** Whether the gateway is reachable */
  readonly reachable: Scalars['Boolean']['output'];
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

/** Health check status */
export const HealthCheckStatus = {
  /** Health check is disabled */
  Disabled: 'DISABLED',
  /** Target is reachable (healthy) */
  Healthy: 'HEALTHY',
  /** Target is unreachable (unhealthy) */
  Unhealthy: 'UNHEALTHY',
  /** Health check is starting */
  Unknown: 'UNKNOWN'
} as const;

export type HealthCheckStatus = typeof HealthCheckStatus[keyof typeof HealthCheckStatus];
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

/** A single probe result within a hop */
export type HopProbe = {
  /** ICMP error code if probe failed */
  readonly icmpCode?: Maybe<Scalars['String']['output']>;
  /** Latency in milliseconds (null for timeout) */
  readonly latencyMs?: Maybe<Scalars['Float']['output']>;
  /** Probe number (1-3 typically) */
  readonly probeNumber: Scalars['Int']['output'];
  /** Whether the probe succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Status of a single hop in a traceroute */
export const HopStatus = {
  /** Access prohibited (firewall/ACL) */
  Prohibited: 'PROHIBITED',
  /** Hop responded successfully */
  Success: 'SUCCESS',
  /** Hop did not respond (timeout) */
  Timeout: 'TIMEOUT',
  /** Destination unreachable at this hop */
  Unreachable: 'UNREACHABLE'
} as const;

export type HopStatus = typeof HopStatus[keyof typeof HopStatus];
/** Hourly statistics */
export type HourlyStats = {
  /** Error count */
  readonly errorCount: Scalars['Int']['output'];
  /** Hour start timestamp */
  readonly hour: Scalars['DateTime']['output'];
  /** Total bytes in */
  readonly totalBytesIn: Scalars['Size']['output'];
  /** Total bytes out */
  readonly totalBytesOut: Scalars['Size']['output'];
  /** Uptime percentage (0-100) */
  readonly uptimePercent: Scalars['Float']['output'];
};

/** ISP contact information */
export type IspInfo = {
  /** ISP name */
  readonly name: Scalars['String']['output'];
  /** ISP support phone number */
  readonly phone?: Maybe<Scalars['String']['output']>;
  /** ISP support website URL */
  readonly url?: Maybe<Scalars['String']['output']>;
};

/**
 * Analysis of template application impact.
 * Provides estimates and warnings before applying.
 */
export type ImpactAnalysis = {
  /** Chains that will be affected */
  readonly affectedChains: ReadonlyArray<Scalars['String']['output']>;
  /** Estimated time to apply (seconds) */
  readonly estimatedApplyTime: Scalars['Int']['output'];
  /** Number of new rules that will be created */
  readonly newRulesCount: Scalars['Int']['output'];
  /** Warnings about potential issues */
  readonly warnings: ReadonlyArray<Scalars['String']['output']>;
};

/** Installation progress event. */
export type InstallProgress = {
  /** Bytes downloaded */
  readonly bytesDownloaded: Scalars['Int']['output'];
  /** Error message if failed */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Feature ID */
  readonly featureID: Scalars['String']['output'];
  /** Instance ID */
  readonly instanceID: Scalars['ID']['output'];
  /** Download progress percentage (0-100) */
  readonly percent: Scalars['Float']['output'];
  /** Current status (downloading, verifying, completed, failed) */
  readonly status: Scalars['String']['output'];
  /** Total bytes to download */
  readonly totalBytes: Scalars['Int']['output'];
};

/** Input for installing a new service instance. */
export type InstallServiceInput = {
  /** IP address to bind the service to (optional) */
  readonly bindIP?: InputMaybe<Scalars['String']['input']>;
  /** Service-specific configuration (JSON) */
  readonly config?: InputMaybe<Scalars['JSON']['input']>;
  /** Feature ID to install (e.g., 'tor', 'sing-box') */
  readonly featureID: Scalars['String']['input'];
  /** Human-readable instance name */
  readonly instanceName: Scalars['String']['input'];
  /** Router ID to install the service on */
  readonly routerID: Scalars['ID']['input'];
  /** VLAN ID for network isolation (optional) */
  readonly vlanID?: InputMaybe<Scalars['Int']['input']>;
};

/** Instance status change event. */
export type InstanceStatusChanged = {
  /** Instance ID */
  readonly instanceID: Scalars['ID']['output'];
  /** New status */
  readonly newStatus: ServiceStatus;
  /** Previous status */
  readonly previousStatus: ServiceStatus;
  /** Timestamp of the change */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Integer range for filtering */
export type IntRange = {
  /** Maximum value (inclusive) */
  readonly max?: InputMaybe<Scalars['Int']['input']>;
  /** Minimum value (inclusive) */
  readonly min?: InputMaybe<Scalars['Int']['input']>;
};

/** A network interface on a router */
export type Interface = Node & {
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether the interface is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Unique interface identifier */
  readonly id: Scalars['ID']['output'];
  /** IP address assigned to this interface */
  readonly ip?: Maybe<Scalars['IPv4']['output']>;
  /** Last time this interface was seen/queried */
  readonly lastSeen?: Maybe<Scalars['DateTime']['output']>;
  /** Connected device information from LLDP */
  readonly linkPartner?: Maybe<Scalars['String']['output']>;
  /** Link speed (e.g., 1Gbps, 100Mbps) */
  readonly linkSpeed?: Maybe<Scalars['String']['output']>;
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
  /** Current receive rate in bytes per second */
  readonly rxRate?: Maybe<Scalars['Size']['output']>;
  /** Operational status of the interface */
  readonly status: InterfaceStatus;
  /** TX bytes */
  readonly txBytes?: Maybe<Scalars['Size']['output']>;
  /** Current transmit rate in bytes per second */
  readonly txRate?: Maybe<Scalars['Size']['output']>;
  /** Interface type */
  readonly type: InterfaceType;
  /** Services using this interface (bridge, VPN, etc.) */
  readonly usedBy?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
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

/** Error information for a single interface operation in a batch */
export type InterfaceOperationError = {
  /** Error message describing why the operation failed */
  readonly error: Scalars['String']['output'];
  /** Interface ID that failed */
  readonly interfaceId: Scalars['ID']['output'];
  /** Interface name */
  readonly interfaceName: Scalars['String']['output'];
};

/** Interface traffic statistics */
export type InterfaceStats = {
  /** Total bytes received */
  readonly rxBytes: Scalars['Size']['output'];
  /** Receive drops */
  readonly rxDrops: Scalars['Int']['output'];
  /** Receive errors */
  readonly rxErrors: Scalars['Int']['output'];
  /** Total packets received */
  readonly rxPackets: Scalars['Size']['output'];
  /** Total bytes transmitted */
  readonly txBytes: Scalars['Size']['output'];
  /** Transmission drops */
  readonly txDrops: Scalars['Int']['output'];
  /** Transmission errors */
  readonly txErrors: Scalars['Int']['output'];
  /** Total packets transmitted */
  readonly txPackets: Scalars['Size']['output'];
};

/** Historical interface statistics with time-series data */
export type InterfaceStatsHistory = {
  /** Time-series data points */
  readonly dataPoints: ReadonlyArray<StatsDataPoint>;
  /** End of the time range */
  readonly endTime: Scalars['DateTime']['output'];
  /** Interface ID */
  readonly interfaceId: Scalars['ID']['output'];
  /** Aggregation interval (e.g., 5m, 1h) */
  readonly interval: Scalars['Duration']['output'];
  /** Start of the time range */
  readonly startTime: Scalars['DateTime']['output'];
};

/** Operational status of a network interface */
export const InterfaceStatus = {
  /** Interface is disabled */
  Disabled: 'DISABLED',
  /** Interface is down */
  Down: 'DOWN',
  /** Status unknown or error */
  Unknown: 'UNKNOWN',
  /** Interface is up and running */
  Up: 'UP'
} as const;

export type InterfaceStatus = typeof InterfaceStatus[keyof typeof InterfaceStatus];
/** Event emitted when an interface status changes */
export type InterfaceStatusEvent = {
  /** Interface ID */
  readonly interfaceId: Scalars['ID']['output'];
  /** Interface name */
  readonly interfaceName: Scalars['String']['output'];
  /** Previous status */
  readonly previousStatus: InterfaceStatus;
  /** New status */
  readonly status: InterfaceStatus;
  /** Event timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
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
/** An IP address assigned to an interface */
export type IpAddress = Node & {
  /** IP address with CIDR notation (e.g., 192.168.10.1/24) */
  readonly address: Scalars['String']['output'];
  /** Broadcast address (calculated from address and netmask) */
  readonly broadcast?: Maybe<Scalars['String']['output']>;
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether this IP is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Whether this IP was dynamically assigned (via DHCP client) */
  readonly dynamic: Scalars['Boolean']['output'];
  /** Unique IP address identifier */
  readonly id: Scalars['ID']['output'];
  /** Interface this IP is assigned to */
  readonly interface: Interface;
  /** Whether this IP is invalid (conflicting or error state) */
  readonly invalid: Scalars['Boolean']['output'];
  /** Network address (calculated from address and netmask) */
  readonly network?: Maybe<Scalars['String']['output']>;
};

/** Event emitted when an IP address changes */
export type IpAddressChangeEvent = {
  /** Type of change (CREATED, UPDATED, DELETED) */
  readonly changeType: ChangeType;
  /** The IP address that changed */
  readonly ipAddress?: Maybe<IpAddress>;
  /** IP address ID (for deletions) */
  readonly ipAddressId: Scalars['ID']['output'];
  /** Timestamp of the change */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Result of an IP address deletion with dependency checking */
export type IpAddressDeleteResult = {
  /** Errors that occurred during deletion */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Impact analysis for this IP address deletion */
  readonly impactAnalysis?: Maybe<IpAddressImpactAnalysis>;
  /** Success or error message */
  readonly message?: Maybe<Scalars['String']['output']>;
  /** Whether the deletion succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Dependencies for an IP address */
export type IpAddressDependencies = {
  /** DHCP servers using this IP as gateway */
  readonly dhcpServers: ReadonlyArray<DhcpServer>;
  /** Firewall rules referencing this IP */
  readonly firewallRules: ReadonlyArray<FirewallRuleReference>;
  /** Whether the IP has any dependencies */
  readonly hasDependencies: Scalars['Boolean']['output'];
  /** IP address ID */
  readonly ipAddressId: Scalars['ID']['output'];
  /** NAT rules referencing this IP */
  readonly natRules: ReadonlyArray<NatRuleReference>;
  /** Static routes using this IP */
  readonly routes: ReadonlyArray<Route>;
};

/** Analysis of the impact of deleting an IP address */
export type IpAddressImpactAnalysis = {
  /** Number of active connections using this IP */
  readonly activeConnections: Scalars['Int']['output'];
  /** Whether the IP can be safely deleted */
  readonly canDelete: Scalars['Boolean']['output'];
  /** List of consequences of deleting this IP */
  readonly consequences: ReadonlyArray<Scalars['String']['output']>;
  /** Human-readable impact message */
  readonly message: Scalars['String']['output'];
  /** Severity of the deletion */
  readonly severity: ConfirmationSeverity;
  /** Whether this IP is used as a gateway by DHCP servers */
  readonly usedByDhcpServers: ReadonlyArray<DhcpServer>;
  /** Whether this IP is referenced in firewall rules */
  readonly usedInFirewallRules: ReadonlyArray<FirewallRuleReference>;
  /** Whether this IP is used in NAT rules */
  readonly usedInNatRules: ReadonlyArray<NatRuleReference>;
};

/** Input for creating or updating an IP address */
export type IpAddressInput = {
  /** IP address with CIDR notation (e.g., 192.168.10.1/24) */
  readonly address: Scalars['String']['input'];
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Whether this IP is disabled */
  readonly disabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Interface ID to assign this IP to */
  readonly interfaceId: Scalars['ID']['input'];
};

/** Result of an IP address mutation (create, update) */
export type IpAddressMutationResult = {
  /** Errors that occurred during the operation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The created or updated IP address (if successful) */
  readonly ipAddress?: Maybe<IpAddress>;
  /** Configuration preview (RouterOS commands) */
  readonly preview?: Maybe<ConfigPreview>;
  /** Whether the operation succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Details about an IP address conflict */
export type IpConflict = {
  /** Conflicting IP address */
  readonly address: Scalars['String']['output'];
  /** Type of conflict */
  readonly conflictType: IpConflictType;
  /** Explanation of the conflict */
  readonly explanation: Scalars['String']['output'];
  /** Conflicting IP address ID */
  readonly id: Scalars['ID']['output'];
  /** Interface where conflict exists */
  readonly interface: Interface;
};

/** Result of checking IP address conflicts */
export type IpConflictResult = {
  /** List of conflicting IP addresses */
  readonly conflicts: ReadonlyArray<IpConflict>;
  /** Whether the IP conflicts with existing assignments */
  readonly hasConflict: Scalars['Boolean']['output'];
  /** Human-readable message */
  readonly message: Scalars['String']['output'];
};

/** Type of IP address conflict */
export const IpConflictType = {
  /** IP is the broadcast address of another subnet */
  Broadcast: 'BROADCAST',
  /** Exact IP address match on different interface */
  Exact: 'EXACT',
  /** IP is the network address of another subnet */
  Network: 'NETWORK',
  /** IP addresses are in overlapping subnets */
  SubnetOverlap: 'SUBNET_OVERLAP'
} as const;

export type IpConflictType = typeof IpConflictType[keyof typeof IpConflictType];
/** IPsec profile for GRE tunnel encryption */
export type IpsecProfile = {
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** IPsec profile ID */
  readonly id: Scalars['ID']['output'];
  /** Profile name */
  readonly name: Scalars['String']['output'];
};

/** Job status for async traceroute execution */
export const JobStatus = {
  /** Job was cancelled by user */
  Cancelled: 'CANCELLED',
  /** Job completed successfully */
  Complete: 'COMPLETE',
  /** Job encountered an error */
  Error: 'ERROR',
  /** Job is currently running */
  Running: 'RUNNING',
  /** Job has been created */
  Started: 'STARTED'
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];
/** Single knock port in sequence. */
export type KnockPort = {
  /** Position in sequence (1-based) */
  readonly order: Scalars['Int']['output'];
  /** Port number (1-65535) */
  readonly port: Scalars['Int']['output'];
  /** Protocol for this knock port */
  readonly protocol: KnockProtocol;
};

/** Input for knock port. */
export type KnockPortInput = {
  /** Order in sequence */
  readonly order: Scalars['Int']['input'];
  /** Port number */
  readonly port: Scalars['Int']['input'];
  /** Protocol */
  readonly protocol: KnockProtocol;
};

/** Protocol for knock port. */
export const KnockProtocol = {
  /** Both TCP and UDP */
  Both: 'BOTH',
  /** TCP only */
  Tcp: 'TCP',
  /** UDP only */
  Udp: 'UDP'
} as const;

export type KnockProtocol = typeof KnockProtocol[keyof typeof KnockProtocol];
/** Status of knock attempt. */
export const KnockStatus = {
  /** Wrong port order */
  Failed: 'FAILED',
  /** Some ports hit, sequence incomplete */
  Partial: 'PARTIAL',
  /** All ports hit correctly, access granted */
  Success: 'SUCCESS',
  /** Time between knocks exceeded */
  Timeout: 'TIMEOUT'
} as const;

export type KnockStatus = typeof KnockStatus[keyof typeof KnockStatus];
/** LAN Network composite resource - groups bridge, DHCP, firewall, routing */
export type LanNetwork = Node & Resource & {
  /** Bridge interface */
  readonly bridge?: Maybe<BridgeResource>;
  readonly category: ResourceCategory;
  readonly config: LanNetworkConfig;
  readonly configuration?: Maybe<Scalars['JSON']['output']>;
  readonly deployment?: Maybe<DeploymentState>;
  /** DHCP server configuration */
  readonly dhcpServer?: Maybe<DhcpServerResource>;
  /** Firewall rules for this LAN */
  readonly firewallRules: ReadonlyArray<FirewallRuleResource>;
  readonly id: Scalars['ID']['output'];
  readonly lanDeployment?: Maybe<LanNetworkDeployment>;
  readonly lanRuntime?: Maybe<LanNetworkRuntime>;
  readonly metadata: ResourceMetadata;
  readonly platform?: Maybe<PlatformInfo>;
  readonly relationships?: Maybe<ResourceRelationships>;
  /** Static routes */
  readonly routes: ReadonlyArray<RouteResource>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
};

/** LAN Network configuration */
export type LanNetworkConfig = {
  /** Enable DHCP server */
  readonly dhcpEnabled: Scalars['Boolean']['output'];
  /** DHCP lease time */
  readonly dhcpLeaseTime?: Maybe<Scalars['Duration']['output']>;
  /** DHCP pool end */
  readonly dhcpPoolEnd?: Maybe<Scalars['IPv4']['output']>;
  /** DHCP pool start */
  readonly dhcpPoolStart?: Maybe<Scalars['IPv4']['output']>;
  /** DNS servers for DHCP */
  readonly dnsServers?: Maybe<ReadonlyArray<Scalars['IPv4']['output']>>;
  /** Enable NAT masquerading */
  readonly enableNat: Scalars['Boolean']['output'];
  /** Interfaces to include in bridge */
  readonly interfaces: ReadonlyArray<Scalars['String']['output']>;
  /** IP address for the LAN */
  readonly ipAddress: Scalars['IPv4']['output'];
  /** Network name */
  readonly name: Scalars['String']['output'];
  /** Subnet mask in CIDR notation */
  readonly subnetMask: Scalars['Int']['output'];
  /** VLAN ID (optional) */
  readonly vlanId?: Maybe<Scalars['Int']['output']>;
};

/** LAN Network deployment state */
export type LanNetworkDeployment = {
  readonly appliedAt: Scalars['DateTime']['output'];
  readonly appliedBy?: Maybe<Scalars['String']['output']>;
  /** Bridge interface ID on router */
  readonly bridgeId?: Maybe<Scalars['String']['output']>;
  /** DHCP server ID on router */
  readonly dhcpServerId?: Maybe<Scalars['String']['output']>;
  readonly drift?: Maybe<DriftInfo>;
  /** IP address ID on router */
  readonly ipAddressId?: Maybe<Scalars['String']['output']>;
  readonly isInSync: Scalars['Boolean']['output'];
  readonly routerResourceId?: Maybe<Scalars['String']['output']>;
  readonly routerVersion?: Maybe<Scalars['Int']['output']>;
};

/** LAN Network runtime state */
export type LanNetworkRuntime = {
  /** Number of active clients */
  readonly activeClients: Scalars['Int']['output'];
  /** Active DHCP leases */
  readonly dhcpLeases: Scalars['Int']['output'];
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  readonly health: RuntimeHealth;
  readonly isRunning: Scalars['Boolean']['output'];
  readonly lastUpdated: Scalars['DateTime']['output'];
  /** Total traffic in */
  readonly totalBytesIn: Scalars['Size']['output'];
  /** Total traffic out */
  readonly totalBytesOut: Scalars['Size']['output'];
};

/** LTE/cellular modem configuration */
export type LteModem = Node & {
  /** APN (Access Point Name) */
  readonly apn: Scalars['String']['output'];
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Unique identifier */
  readonly id: Scalars['ID']['output'];
  /** LTE interface name */
  readonly name: Scalars['String']['output'];
  /** Network type (LTE, 3G, etc.) */
  readonly networkType?: Maybe<Scalars['String']['output']>;
  /** Operator name */
  readonly operator?: Maybe<Scalars['String']['output']>;
  /** PIN code configured */
  readonly pinConfigured: Scalars['Boolean']['output'];
  /** Connection status */
  readonly running: Scalars['Boolean']['output'];
  /** Signal strength (RSSI in dBm) */
  readonly signalStrength?: Maybe<Scalars['Int']['output']>;
};

/** Input for configuring LTE modem */
export type LteModemInput = {
  /** APN (Access Point Name) */
  readonly apn: Scalars['String']['input'];
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** LTE interface name */
  readonly name: Scalars['String']['input'];
  /** PIN code (optional, for SIM card) */
  readonly pin?: InputMaybe<Scalars['String']['input']>;
};

/** Memory utilization metrics */
export type MemoryMetrics = {
  /** Memory usage percentage (0-100) */
  readonly percentage: Scalars['Float']['output'];
  /** Total memory in bytes */
  readonly total: Scalars['Float']['output'];
  /** Used memory in bytes */
  readonly used: Scalars['Float']['output'];
};

/** Direction of traffic to mirror */
export const MirrorDirection = {
  /** Mirror both ingress and egress traffic */
  Both: 'BOTH',
  /** Mirror only egress (outgoing) traffic */
  Egress: 'EGRESS',
  /** Mirror only ingress (incoming) traffic */
  Ingress: 'INGRESS'
} as const;

export type MirrorDirection = typeof MirrorDirection[keyof typeof MirrorDirection];
/** Missing dependency information */
export type MissingDependency = {
  /** Item ID with missing dependency */
  readonly itemId: Scalars['ID']['output'];
  /** Missing resource ID */
  readonly missingResourceId: Scalars['ID']['output'];
  /** Missing resource type */
  readonly missingResourceType: Scalars['String']['output'];
};

/** MTU guidance for tunnel configuration */
export type MtuGuidance = {
  /** Human-readable explanation of the overhead */
  readonly explanation: Scalars['String']['output'];
  /** Protocol overhead in bytes */
  readonly overhead: Scalars['Int']['output'];
  /** Recommended MTU based on base MTU (typically 1500) */
  readonly recommendedMtu: Scalars['Int']['output'];
  /** Tunnel type this guidance applies to */
  readonly tunnelType: TunnelType;
};

export type Mutation = {
  /** Acknowledge a single alert */
  readonly acknowledgeAlert: AlertPayload;
  /** Acknowledge multiple alerts */
  readonly acknowledgeAlerts: BulkAlertPayload;
  /** Add a port to a bridge */
  readonly addBridgePort: BridgePortMutationResult;
  /** Add an item to a change set */
  readonly addChangeSetItem: AddChangeSetItemPayload;
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
  /** Apply an alert rule template to create a rule */
  readonly applyAlertRuleTemplate: AlertRulePayload;
  /** Apply an alert template to create an alert rule */
  readonly applyAlertTemplate: AlertRulePayload;
  /** Apply a change set atomically to the router */
  readonly applyChangeSet: ApplyChangeSetPayload;
  /**
   * Apply a firewall template to the router.
   * Creates all rules defined in the template with variable substitution.
   * Returns a rollback ID for undo within 5 minutes.
   */
  readonly applyFirewallTemplate: FirewallTemplateResult;
  /**
   * Apply resource to router (transitions VALID → APPLYING → ACTIVE/ERROR)
   * Follows Apply-Confirm-Merge pattern.
   */
  readonly applyResource: ApplyResourcePayload;
  /** Apply a suggested fix for a failed diagnostic step */
  readonly applyTroubleshootFix: ApplyFixPayload;
  /** Archive a resource (transitions DEPRECATED → ARCHIVED) */
  readonly archiveResource: ArchiveResourcePayload;
  /**
   * Start an automatic gateway scan.
   * Scans common gateway IPs (192.168.0-255.1) to find MikroTik routers.
   * This is useful when the user doesn't know which subnet to scan.
   *
   * Only returns verified MikroTik RouterOS devices (confidence >= 40).
   */
  readonly autoScanGateways: ScanNetworkPayload;
  /** Batch operation on multiple interfaces */
  readonly batchInterfaceOperation: BatchInterfacePayload;
  /**
   * Bulk create address list entries.
   * Processes entries in batches and returns success/failure counts.
   * Continues on error - does not stop at first failure.
   */
  readonly bulkCreateAddressListEntries: BulkCreateResult;
  /** Cancel an in-progress change set application */
  readonly cancelChangeSet: CancelChangeSetPayload;
  /**
   * Cancel a running scan.
   * The scan will stop within 1 second and partial results are preserved.
   */
  readonly cancelScan: CancelScanPayload;
  /** Cancel a running traceroute job. */
  readonly cancelTraceroute: Scalars['Boolean']['output'];
  /** Cancel a troubleshooting session */
  readonly cancelTroubleshoot: TroubleshootSession;
  /** Change the current user's password */
  readonly changePassword: Scalars['Boolean']['output'];
  /** Perform immediate health check on a router */
  readonly checkRouterHealth: HealthCheckResult;
  /** Configure VLAN settings on a bridge port (trunk/access) */
  readonly configureBridgePortVlan: VlanMutationResult;
  /** Configure DHCP client on a WAN interface */
  readonly configureDhcpWAN: WanMutationResult;
  /** Configure LTE modem */
  readonly configureLteWAN: WanMutationResult;
  /** Configure PPPoE client on a WAN interface */
  readonly configurePppoeWAN: WanMutationResult;
  /** Configure static IP on a WAN interface */
  readonly configureStaticWAN: WanMutationResult;
  /** Configure health check for WAN interface */
  readonly configureWANHealthCheck: WanMutationResult;
  /** Connect to a router */
  readonly connectRouter: ConnectRouterPayload;
  /**
   * Create a new address list entry.
   * If the list doesn't exist, it will be created automatically.
   */
  readonly createAddressListEntry: AddressListEntry;
  /** Create a new alert rule */
  readonly createAlertRule: AlertRulePayload;
  /** Create a new bridge */
  readonly createBridge: BridgeMutationResult;
  /** Create a bridge VLAN entry */
  readonly createBridgeVlan: BridgeVlanMutationResult;
  /** Create a new change set */
  readonly createChangeSet: CreateChangeSetPayload;
  /** Assign a new IP address to an interface */
  readonly createIpAddress: IpAddressMutationResult;
  /**
   * Create a masquerade rule for internet sharing.
   * Convenience mutation for common srcnat masquerade setup.
   */
  readonly createMasqueradeRule: NatRule;
  /** Create a NAT rule. */
  readonly createNatRule: NatRule;
  /** Create a new notification channel configuration (validates before saving) */
  readonly createNotificationChannelConfig: ChannelConfigPayload;
  /**
   * Create a port forward (creates both NAT and filter rules).
   * Simplified wizard for common use case of exposing internal service.
   */
  readonly createPortForward: PortForward;
  /**
   * Create a new port knock sequence.
   * Generates firewall rules on the router.
   */
  readonly createPortKnockSequence: PortKnockSequence;
  /** Create a new port mirror configuration */
  readonly createPortMirror: PortMirrorMutationResult;
  /** Create a new resource (starts in DRAFT state) */
  readonly createResource: CreateResourcePayload;
  /** Create a new static route */
  readonly createRoute: RouteMutationResult;
  /** Add a new router to manage */
  readonly createRouter: CreateRouterPayload;
  /** Create a new tunnel interface */
  readonly createTunnel: TunnelMutationResult;
  /** Create a new VLAN interface */
  readonly createVlan: VlanMutationResult;
  /** Create a new webhook */
  readonly createWebhook: WebhookPayload;
  /**
   * Delete an address list entry by ID.
   * Returns true if successful, false otherwise.
   */
  readonly deleteAddressListEntry: Scalars['Boolean']['output'];
  /** Delete an alert rule */
  readonly deleteAlertRule: DeletePayload;
  /** Delete a custom alert template */
  readonly deleteAlertTemplate: DeletePayload;
  /** Delete a bridge */
  readonly deleteBridge: DeleteResult;
  /** Delete a bridge VLAN entry */
  readonly deleteBridgeVlan: DeleteResult;
  /** Delete a change set (only if not applying) */
  readonly deleteChangeSet: DeleteChangeSetPayload;
  /** Delete a custom alert rule template (built-ins cannot be deleted) */
  readonly deleteCustomAlertRuleTemplate: DeletePayload;
  /**
   * Delete a custom firewall template.
   * Only custom templates can be deleted (not built-in).
   */
  readonly deleteFirewallTemplate: Scalars['Boolean']['output'];
  /** Delete a service instance and clean up resources. */
  readonly deleteInstance: ServiceInstancePayload;
  /** Remove an IP address from an interface */
  readonly deleteIpAddress: IpAddressDeleteResult;
  /** Delete a NAT rule. */
  readonly deleteNatRule: Scalars['Boolean']['output'];
  /** Delete a notification channel configuration (soft delete) */
  readonly deleteNotificationChannelConfig: DeletePayload;
  /** Delete a port forward (removes both NAT and filter rules). */
  readonly deletePortForward: Scalars['Boolean']['output'];
  /**
   * Delete port knock sequence.
   * Removes all associated firewall rules.
   */
  readonly deletePortKnockSequence: Scalars['Boolean']['output'];
  /** Delete a port mirror configuration */
  readonly deletePortMirror: DeleteResult;
  /** Delete a resource permanently */
  readonly deleteResource: DeleteResourcePayload;
  /** Delete a route with impact analysis */
  readonly deleteRoute: RouteDeleteResult;
  /** Remove a router */
  readonly deleteRouter: DeleteRouterPayload;
  /** Delete a tunnel interface */
  readonly deleteTunnel: TunnelMutationResult;
  /** Delete a VLAN interface */
  readonly deleteVlan: DeleteResult;
  /** Delete WAN configuration (revert to unconfigured) */
  readonly deleteWANConfiguration: DeleteResult;
  /** Delete a webhook */
  readonly deleteWebhook: DeletePayload;
  /** Deprecate a resource (transitions → DEPRECATED) */
  readonly deprecateResource: DeprecateResourcePayload;
  /** Disable an interface */
  readonly disableInterface: UpdateInterfacePayload;
  /** Disable a port mirror configuration */
  readonly disablePortMirror: PortMirrorMutationResult;
  /** Disconnect from a router */
  readonly disconnectRouter: DisconnectRouterPayload;
  /** Enable an interface */
  readonly enableInterface: UpdateInterfacePayload;
  /** Enable a port mirror configuration */
  readonly enablePortMirror: PortMirrorMutationResult;
  /** Export an alert rule template as JSON */
  readonly exportAlertRuleTemplate: Scalars['String']['output'];
  /**
   * Export router configuration with optional credential handling.
   * Credentials are excluded by default for security.
   * If includeCredentials is true, an encryptionKey must be provided.
   */
  readonly exportRouterConfig: ExportConfigPayload;
  /**
   * Flush the DNS cache on the router.
   * Clears all cached DNS entries and returns before/after statistics.
   */
  readonly flushDnsCache: FlushDnsCacheResult;
  /** Import an alert rule template from JSON */
  readonly importAlertRuleTemplate: AlertRuleTemplatePayload;
  /**
   * Install a new service instance on a router.
   * Downloads the binary, verifies checksum, and creates the instance.
   */
  readonly installService: ServiceInstancePayload;
  /** Authenticate and receive a JWT token */
  readonly login: AuthPayload;
  /** Invalidate current session and clear tokens */
  readonly logout: Scalars['Boolean']['output'];
  /**
   * Preview how a notification template will render with sample data
   * Used for template customization - renders subject and body with validation
   * Requires authentication
   */
  readonly previewNotificationTemplate: NotificationTemplatePreview;
  /** Manually trigger reconnection to a router */
  readonly reconnectRouter: ReconnectRouterPayload;
  /** Force refresh router capabilities (invalidates cache) */
  readonly refreshCapabilities: RefreshCapabilitiesPayload;
  /** Remove a port from a bridge */
  readonly removeBridgePort: DeleteResult;
  /** Remove an item from a change set */
  readonly removeChangeSetItem: RemoveChangeSetItemPayload;
  /**
   * Reset alert notification template to system default (deletes custom template)
   * Used for notification template customization per channel
   * Requires authentication
   */
  readonly resetAlertTemplate: DeletePayload;
  /**
   * Manually reset the circuit breaker for a router.
   * This allows immediate reconnection attempts even if the circuit is open.
   * Use with caution as it bypasses the backoff protection.
   */
  readonly resetCircuitBreaker: CircuitBreakerStatus;
  /** Restart a service instance. */
  readonly restartInstance: ServiceInstancePayload;
  /** Revoke all sessions for a user (admin only) */
  readonly revokeAllSessions: Scalars['Boolean']['output'];
  /** Revoke a specific session */
  readonly revokeSession: Scalars['Boolean']['output'];
  /** Force rollback of a failed change set */
  readonly rollbackChangeSet: RollbackChangeSetPayload;
  /**
   * Rollback a previously applied template.
   * Removes all template rules and restores previous state.
   * Only works within 5 minutes of application.
   */
  readonly rollbackFirewallTemplate: Scalars['Boolean']['output'];
  /**
   * Run comprehensive diagnostics on a router connection.
   * Performs network reachability check, port scanning, TLS validation,
   * and authentication testing. Rate limited to 1 request per 10 seconds per router.
   */
  readonly runDiagnostics: DiagnosticReport;
  /**
   * Perform DNS lookup (synchronous request-response).
   * Queries the specified DNS server for the hostname and record type.
   * Uses RouterOS native DNS lookup for A/AAAA records when possible,
   * falls back to Go resolver for other record types.
   */
  readonly runDnsLookup: DnsLookupResult;
  /**
   * Start a traceroute from the router to the target.
   * Returns a job ID for subscription tracking.
   */
  readonly runTraceroute: TracerouteJob;
  /** Run a specific diagnostic step in a session */
  readonly runTroubleshootStep: RunTroubleshootStepPayload;
  /** Save a custom alert template */
  readonly saveAlertTemplate: AlertTemplatePayload;
  /** Save a custom alert rule template */
  readonly saveCustomAlertRuleTemplate: AlertRuleTemplatePayload;
  /**
   * Save a custom firewall template.
   * Template is stored locally in IndexedDB (frontend operation).
   */
  readonly saveFirewallTemplate: FirewallTemplate;
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
  /** Start a service instance. */
  readonly startInstance: ServiceInstancePayload;
  /**
   * Start a new troubleshooting session for a router.
   * Automatically detects network configuration and begins diagnostics.
   */
  readonly startTroubleshoot: StartTroubleshootPayload;
  /** Stop a service instance. */
  readonly stopInstance: ServiceInstancePayload;
  /**
   * Test all router credentials in parallel.
   * Returns aggregate results with per-router status.
   */
  readonly testAllCredentials: TestAllCredentialsPayload;
  /** Test a notification channel */
  readonly testNotificationChannel: TestNotificationPayload;
  /**
   * Test port knock sequence.
   * Creates temporary rules with short timeout for verification.
   */
  readonly testPortKnockSequence: TestPortKnockResult;
  /** Test connection to a router */
  readonly testRouterConnection: TestConnectionPayload;
  /**
   * Test connection to a router without adding it.
   * Useful for validating credentials before committing.
   */
  readonly testRouterCredentials: ConnectionTestResult;
  /** Test tunnel connectivity and path MTU */
  readonly testTunnel: TunnelTestResult;
  /** Test a webhook by sending a sample payload */
  readonly testWebhook: WebhookTestPayload;
  /** Toggle alert rule enabled/disabled status */
  readonly toggleAlertRule: AlertRulePayload;
  /**
   * Toggle port knock sequence enabled/disabled.
   * Enables or disables firewall rules.
   */
  readonly togglePortKnockSequence: PortKnockSequence;
  /** Trigger digest delivery immediately for a channel (NAS-18.11) */
  readonly triggerDigestNow: DigestSummary;
  /** Undo a bridge operation (within 10-second window) */
  readonly undoBridgeOperation: BridgeMutationResult;
  /** Update an existing alert rule */
  readonly updateAlertRule: AlertRulePayload;
  /** Update an existing bridge */
  readonly updateBridge: BridgeMutationResult;
  /** Update bridge port settings */
  readonly updateBridgePort: BridgePortMutationResult;
  /** Update an item in a change set */
  readonly updateChangeSetItem: UpdateChangeSetItemPayload;
  /** Update interface settings (MTU, comment, ARP mode) */
  readonly updateInterface: UpdateInterfacePayload;
  /** Update an existing IP address */
  readonly updateIpAddress: IpAddressMutationResult;
  /** Update an existing NAT rule. */
  readonly updateNatRule: NatRule;
  /** Update an existing notification channel configuration */
  readonly updateNotificationChannelConfig: ChannelConfigPayload;
  /**
   * Update existing port knock sequence.
   * Regenerates firewall rules.
   */
  readonly updatePortKnockSequence: PortKnockSequence;
  /** Update an existing port mirror configuration */
  readonly updatePortMirror: PortMirrorMutationResult;
  /** Update resource configuration (transitions to DRAFT → VALIDATING) */
  readonly updateResource: UpdateResourcePayload;
  /** Update an existing route */
  readonly updateRoute: RouteMutationResult;
  /** Update router settings */
  readonly updateRouter: UpdateRouterPayload;
  /**
   * Update router credentials.
   * Tests the new credentials before saving.
   * Old credentials are preserved if the test fails.
   */
  readonly updateRouterCredentials: CredentialUpdatePayload;
  /** Update an existing tunnel interface */
  readonly updateTunnel: TunnelMutationResult;
  /** Update an existing VLAN interface */
  readonly updateVlan: VlanMutationResult;
  /** Update an existing webhook */
  readonly updateWebhook: WebhookPayload;
  /** Validate a change set (all items) */
  readonly validateChangeSet: ValidateChangeSetPayload;
  /** Validate resource configuration (transitions DRAFT → VALIDATING → VALID/ERROR) */
  readonly validateResource: ValidateResourcePayload;
  /** Verify a fix by re-running the diagnostic step */
  readonly verifyTroubleshootFix: RunTroubleshootStepPayload;
};


export type MutationAcknowledgeAlertArgs = {
  alertId: Scalars['ID']['input'];
};


export type MutationAcknowledgeAlertsArgs = {
  alertIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationAddBridgePortArgs = {
  bridgeId: Scalars['ID']['input'];
  input: AddBridgePortInput;
};


export type MutationAddChangeSetItemArgs = {
  changeSetId: Scalars['ID']['input'];
  input: ChangeSetItemInput;
};


export type MutationAddRouterArgs = {
  input: AddRouterInput;
};


export type MutationApplyAlertRuleTemplateArgs = {
  customizations?: InputMaybe<CreateAlertRuleInput>;
  templateId: Scalars['ID']['input'];
  variables: Scalars['JSON']['input'];
};


export type MutationApplyAlertTemplateArgs = {
  input: ApplyAlertTemplateInput;
};


export type MutationApplyChangeSetArgs = {
  changeSetId: Scalars['ID']['input'];
};


export type MutationApplyFirewallTemplateArgs = {
  routerId: Scalars['ID']['input'];
  templateId: Scalars['ID']['input'];
  variables: Scalars['JSON']['input'];
};


export type MutationApplyResourceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationApplyTroubleshootFixArgs = {
  issueCode: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationArchiveResourceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationBatchInterfaceOperationArgs = {
  input: BatchInterfaceInput;
  routerId: Scalars['ID']['input'];
};


export type MutationBulkCreateAddressListEntriesArgs = {
  entries: ReadonlyArray<BulkAddressInput>;
  listName: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationCancelChangeSetArgs = {
  changeSetId: Scalars['ID']['input'];
};


export type MutationCancelScanArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationCancelTracerouteArgs = {
  jobId: Scalars['ID']['input'];
};


export type MutationCancelTroubleshootArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationCheckRouterHealthArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationConfigureBridgePortVlanArgs = {
  input: BridgePortVlanInput;
  portId: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationConfigureDhcpWanArgs = {
  input: DhcpClientInput;
  routerId: Scalars['ID']['input'];
};


export type MutationConfigureLteWanArgs = {
  input: LteModemInput;
  routerId: Scalars['ID']['input'];
};


export type MutationConfigurePppoeWanArgs = {
  input: PppoeClientInput;
  routerId: Scalars['ID']['input'];
};


export type MutationConfigureStaticWanArgs = {
  input: StaticIpInput;
  routerId: Scalars['ID']['input'];
};


export type MutationConfigureWanHealthCheckArgs = {
  input: WanHealthCheckInput;
  routerId: Scalars['ID']['input'];
  wanInterfaceId: Scalars['ID']['input'];
};


export type MutationConnectRouterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateAddressListEntryArgs = {
  input: CreateAddressListEntryInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateAlertRuleArgs = {
  input: CreateAlertRuleInput;
};


export type MutationCreateBridgeArgs = {
  input: CreateBridgeInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateBridgeVlanArgs = {
  bridgeId: Scalars['ID']['input'];
  input: CreateBridgeVlanInput;
};


export type MutationCreateChangeSetArgs = {
  input: CreateChangeSetInput;
};


export type MutationCreateIpAddressArgs = {
  input: IpAddressInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateMasqueradeRuleArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  outInterface: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
  srcAddress?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateNatRuleArgs = {
  input: CreateNatRuleInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateNotificationChannelConfigArgs = {
  input: CreateNotificationChannelConfigInput;
};


export type MutationCreatePortForwardArgs = {
  input: PortForwardInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreatePortKnockSequenceArgs = {
  input: PortKnockSequenceInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreatePortMirrorArgs = {
  input: CreatePortMirrorInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateResourceArgs = {
  input: CreateResourceInput;
};


export type MutationCreateRouteArgs = {
  input: RouteInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateRouterArgs = {
  input: CreateRouterInput;
};


export type MutationCreateTunnelArgs = {
  input: TunnelInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateVlanArgs = {
  input: VlanInput;
  routerId: Scalars['ID']['input'];
};


export type MutationCreateWebhookArgs = {
  input: CreateWebhookInput;
};


export type MutationDeleteAddressListEntryArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteAlertRuleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAlertTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteBridgeArgs = {
  uuid: Scalars['ID']['input'];
};


export type MutationDeleteBridgeVlanArgs = {
  uuid: Scalars['ID']['input'];
};


export type MutationDeleteChangeSetArgs = {
  changeSetId: Scalars['ID']['input'];
};


export type MutationDeleteCustomAlertRuleTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFirewallTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInstanceArgs = {
  input: DeleteInstanceInput;
};


export type MutationDeleteIpAddressArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteNatRuleArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteNotificationChannelConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePortForwardArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeletePortKnockSequenceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeletePortMirrorArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteResourceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteRouteArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteRouterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTunnelArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDeleteVlanArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWanConfigurationArgs = {
  routerId: Scalars['ID']['input'];
  wanInterfaceId: Scalars['ID']['input'];
};


export type MutationDeleteWebhookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeprecateResourceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDisableInterfaceArgs = {
  interfaceId: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDisablePortMirrorArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationDisconnectRouterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEnableInterfaceArgs = {
  interfaceId: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationEnablePortMirrorArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationExportAlertRuleTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExportRouterConfigArgs = {
  input: ExportConfigInput;
};


export type MutationFlushDnsCacheArgs = {
  deviceId: Scalars['String']['input'];
};


export type MutationImportAlertRuleTemplateArgs = {
  json: Scalars['String']['input'];
};


export type MutationInstallServiceArgs = {
  input: InstallServiceInput;
};


export type MutationLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationPreviewNotificationTemplateArgs = {
  input: PreviewNotificationTemplateInput;
};


export type MutationReconnectRouterArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationRefreshCapabilitiesArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationRemoveBridgePortArgs = {
  portId: Scalars['ID']['input'];
};


export type MutationRemoveChangeSetItemArgs = {
  changeSetId: Scalars['ID']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationResetAlertTemplateArgs = {
  channel: NotificationChannel;
  eventType: Scalars['String']['input'];
};


export type MutationResetCircuitBreakerArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationRestartInstanceArgs = {
  input: RestartInstanceInput;
};


export type MutationRevokeAllSessionsArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationRollbackChangeSetArgs = {
  changeSetId: Scalars['ID']['input'];
};


export type MutationRollbackFirewallTemplateArgs = {
  rollbackId: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationRunDiagnosticsArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationRunDnsLookupArgs = {
  input: DnsLookupInput;
};


export type MutationRunTracerouteArgs = {
  deviceId: Scalars['ID']['input'];
  input: TracerouteInput;
};


export type MutationRunTroubleshootStepArgs = {
  sessionId: Scalars['ID']['input'];
  stepType: TroubleshootStepType;
};


export type MutationSaveAlertTemplateArgs = {
  input: SaveAlertTemplateInput;
};


export type MutationSaveCustomAlertRuleTemplateArgs = {
  input: SaveAlertRuleTemplateInput;
};


export type MutationSaveFirewallTemplateArgs = {
  input: SaveTemplateInput;
};


export type MutationScanNetworkArgs = {
  input: ScanNetworkInput;
};


export type MutationSetPreferredProtocolArgs = {
  protocol: Protocol;
  routerId: Scalars['ID']['input'];
};


export type MutationStartInstanceArgs = {
  input: StartInstanceInput;
};


export type MutationStartTroubleshootArgs = {
  routerId: Scalars['ID']['input'];
};


export type MutationStopInstanceArgs = {
  input: StopInstanceInput;
};


export type MutationTestNotificationChannelArgs = {
  channel: Scalars['String']['input'];
  config: Scalars['JSON']['input'];
};


export type MutationTestPortKnockSequenceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationTestRouterConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTestRouterCredentialsArgs = {
  input: AddRouterInput;
};


export type MutationTestTunnelArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationTestWebhookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationToggleAlertRuleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTogglePortKnockSequenceArgs = {
  enabled: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationTriggerDigestNowArgs = {
  channelId: Scalars['ID']['input'];
};


export type MutationUndoBridgeOperationArgs = {
  operationId: Scalars['ID']['input'];
};


export type MutationUpdateAlertRuleArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAlertRuleInput;
};


export type MutationUpdateBridgeArgs = {
  input: UpdateBridgeInput;
  uuid: Scalars['ID']['input'];
};


export type MutationUpdateBridgePortArgs = {
  input: UpdateBridgePortInput;
  portId: Scalars['ID']['input'];
};


export type MutationUpdateChangeSetItemArgs = {
  changeSetId: Scalars['ID']['input'];
  input: UpdateChangeSetItemInput;
  itemId: Scalars['ID']['input'];
};


export type MutationUpdateInterfaceArgs = {
  input: UpdateInterfaceInput;
  interfaceId: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateIpAddressArgs = {
  id: Scalars['ID']['input'];
  input: IpAddressInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateNatRuleArgs = {
  id: Scalars['ID']['input'];
  input: CreateNatRuleInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateNotificationChannelConfigArgs = {
  id: Scalars['ID']['input'];
  input: UpdateNotificationChannelConfigInput;
};


export type MutationUpdatePortKnockSequenceArgs = {
  id: Scalars['ID']['input'];
  input: PortKnockSequenceInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdatePortMirrorArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePortMirrorInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateResourceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateResourceInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateRouteArgs = {
  id: Scalars['ID']['input'];
  input: RouteInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateRouterArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRouterInput;
};


export type MutationUpdateRouterCredentialsArgs = {
  input: CredentialsInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateTunnelArgs = {
  id: Scalars['ID']['input'];
  input: TunnelInput;
  routerId: Scalars['ID']['input'];
};


export type MutationUpdateVlanArgs = {
  id: Scalars['ID']['input'];
  input: VlanInput;
};


export type MutationUpdateWebhookArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWebhookInput;
};


export type MutationValidateChangeSetArgs = {
  changeSetId: Scalars['ID']['input'];
};


export type MutationValidateResourceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type MutationVerifyTroubleshootFixArgs = {
  sessionId: Scalars['ID']['input'];
  stepType: TroubleshootStepType;
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

/** NAT action types for firewall NAT rules. */
export const NatAction = {
  /** Accept packet */
  Accept: 'ACCEPT',
  /** Drop packet */
  Drop: 'DROP',
  /** Destination NAT (port forwarding) */
  DstNat: 'DST_NAT',
  /** Jump to different chain */
  Jump: 'JUMP',
  /** Log packet */
  Log: 'LOG',
  /** Masquerade (dynamic source NAT) */
  Masquerade: 'MASQUERADE',
  /** Network mapping */
  Netmap: 'NETMAP',
  /** Pass through without action */
  Passthrough: 'PASSTHROUGH',
  /** Redirect to different port */
  Redirect: 'REDIRECT',
  /** Return to parent chain */
  Return: 'RETURN',
  /** Use same IP */
  Same: 'SAME',
  /** Source NAT (static mapping) */
  SrcNat: 'SRC_NAT'
} as const;

export type NatAction = typeof NatAction[keyof typeof NatAction];
/** NAT chain types (srcnat for source NAT, dstnat for destination NAT). */
export const NatChain = {
  /** Destination NAT (incoming traffic) */
  Dstnat: 'DSTNAT',
  /** Source NAT (outgoing traffic) */
  Srcnat: 'SRCNAT'
} as const;

export type NatChain = typeof NatChain[keyof typeof NatChain];
/**
 * NAT rule configuration for network address translation.
 * Handles both source NAT (masquerade) and destination NAT (port forwarding).
 */
export type NatRule = Node & {
  /** NAT action */
  readonly action: NatAction;
  /** Bytes processed by this rule */
  readonly bytes: Scalars['Int']['output'];
  /** NAT chain (srcnat or dstnat) */
  readonly chain: NatChain;
  /** Optional comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether rule is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Destination address or CIDR */
  readonly dstAddress?: Maybe<Scalars['String']['output']>;
  /** Destination port or port range */
  readonly dstPort?: Maybe<Scalars['String']['output']>;
  /** MikroTik internal ID */
  readonly id: Scalars['ID']['output'];
  /** Incoming interface */
  readonly inInterface?: Maybe<Scalars['String']['output']>;
  /** Outgoing interface */
  readonly outInterface?: Maybe<Scalars['String']['output']>;
  /** Packets processed by this rule */
  readonly packets: Scalars['Int']['output'];
  /** Rule position in chain */
  readonly position: Scalars['Int']['output'];
  /** Protocol (TCP, UDP) */
  readonly protocol?: Maybe<TransportProtocol>;
  /** Source address or CIDR */
  readonly srcAddress?: Maybe<Scalars['String']['output']>;
  /** Source port or port range */
  readonly srcPort?: Maybe<Scalars['String']['output']>;
  /** Target address for NAT */
  readonly toAddresses?: Maybe<Scalars['String']['output']>;
  /** Target port(s) for NAT */
  readonly toPorts?: Maybe<Scalars['String']['output']>;
};

/**
 * NAT rule reference type (lightweight for dependency tracking).
 * For full NAT rule management, see NatRule type in firewall.graphql.
 */
export type NatRuleReference = {
  /** Action (masquerade, dst-nat, src-nat) */
  readonly action: Scalars['String']['output'];
  /** Rule chain (srcnat, dstnat) */
  readonly chain: Scalars['String']['output'];
  /** Whether the rule is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Destination address */
  readonly dstAddress?: Maybe<Scalars['String']['output']>;
  /** NAT rule ID */
  readonly id: Scalars['ID']['output'];
  /** Source address */
  readonly srcAddress?: Maybe<Scalars['String']['output']>;
  /** To address (for dst-nat) */
  readonly toAddress?: Maybe<Scalars['String']['output']>;
};

/** Network configuration detection result */
export type NetworkConfigDetection = {
  /** Detected default gateway IP */
  readonly gateway?: Maybe<Scalars['String']['output']>;
  /** Detected ISP information */
  readonly ispInfo?: Maybe<IspInfo>;
  /** Detected WAN interface name */
  readonly wanInterface: Scalars['String']['output'];
};

/** Relay Node interface for global object identification */
export type Node = {
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
};

/** Notification channel types */
export const NotificationChannel = {
  /** Email notifications */
  Email: 'EMAIL',
  /** In-app notifications */
  Inapp: 'INAPP',
  /** Pushover notifications */
  Pushover: 'PUSHOVER',
  /** Telegram notifications */
  Telegram: 'TELEGRAM',
  /** Webhook notifications */
  Webhook: 'WEBHOOK'
} as const;

export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];
/** Notification channel configuration with encrypted credentials */
export type NotificationChannelConfig = {
  /** Type of notification channel */
  readonly channelType: ChannelType;
  /**
   * Masked configuration (sensitive fields redacted)
   * For Pushover: {"device": "iphone", "baseURL": "...", "userKey": "******", "apiToken": "******"}
   * For Email: {"host": "smtp.gmail.com", "port": 587, "from": "...", "password": "******"}
   */
  readonly configMasked: Scalars['JSON']['output'];
  /** When this configuration was created */
  readonly createdAt: Scalars['DateTime']['output'];
  /** User ID who created this configuration */
  readonly createdBy?: Maybe<Scalars['String']['output']>;
  /** Optional description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Whether this configuration is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Unique configuration ID */
  readonly id: Scalars['ID']['output'];
  /** Whether this is the default configuration for this channel type */
  readonly isDefault: Scalars['Boolean']['output'];
  /** Human-readable name for this configuration */
  readonly name: Scalars['String']['output'];
  /** When this configuration was last updated */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** User ID who last updated this configuration */
  readonly updatedBy?: Maybe<Scalars['String']['output']>;
};

/** Notification delivery log entry */
export type NotificationLog = Node & {
  /** Alert that triggered this notification */
  readonly alertId: Scalars['ID']['output'];
  /** When delivery was attempted */
  readonly attemptedAt: Scalars['DateTime']['output'];
  /** Notification channel type (email, telegram, pushover, webhook) */
  readonly channel: Scalars['String']['output'];
  /** When delivery was completed (success or final failure) */
  readonly completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Error message if delivery failed */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Request payload sent */
  readonly requestPayload?: Maybe<Scalars['JSON']['output']>;
  /** Response body received */
  readonly responseBody?: Maybe<Scalars['String']['output']>;
  /** Response time in milliseconds */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Number of retry attempts */
  readonly retryCount: Scalars['Int']['output'];
  /** Delivery status */
  readonly status: NotificationStatus;
  /** HTTP status code (for webhooks) */
  readonly statusCode?: Maybe<Scalars['Int']['output']>;
  /** Webhook ID (if channel is webhook) */
  readonly webhookId?: Maybe<Scalars['ID']['output']>;
};

/** Notification delivery status */
export const NotificationStatus = {
  /** Delivery failed */
  Failed: 'FAILED',
  /** Delivery pending */
  Pending: 'PENDING',
  /** Retrying after failure */
  Retrying: 'RETRYING',
  /** Successfully delivered */
  Success: 'SUCCESS'
} as const;

export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];
/**
 * Notification template preview result
 * Simplified preview output for template customization
 */
export type NotificationTemplatePreview = {
  /** Rendered body content */
  readonly body: Scalars['String']['output'];
  /** Validation errors (empty array if valid) */
  readonly errors: ReadonlyArray<Scalars['String']['output']>;
  /** Rendered subject line (empty if channel doesn't use subjects) */
  readonly subject?: Maybe<Scalars['String']['output']>;
};

/** Operation counts by type */
export type OperationCounts = {
  readonly create: Scalars['Int']['output'];
  readonly delete: Scalars['Int']['output'];
  readonly update: Scalars['Int']['output'];
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

/** Platform capabilities for a resource type */
export type PlatformCapabilities = {
  /** Capability-specific details */
  readonly details?: Maybe<Scalars['JSON']['output']>;
  /** Whether this resource type is supported */
  readonly isSupported: Scalars['Boolean']['output'];
  /** Capability level */
  readonly level: CapabilityLevel;
  /** Minimum platform version required */
  readonly minVersion?: Maybe<Scalars['String']['output']>;
  /** Required packages */
  readonly requiredPackages?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
};

/** A platform-specific feature */
export type PlatformFeature = {
  /** Feature description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Whether feature is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Feature identifier */
  readonly id: Scalars['String']['output'];
  /** Feature name */
  readonly name: Scalars['String']['output'];
};

/**
 * Layer 8: Platform-specific capabilities and field mappings.
 * From platform adapter (MikroTik, OpenWrt, VyOS).
 */
export type PlatformInfo = {
  /** Platform-specific capabilities for this resource type */
  readonly capabilities: PlatformCapabilities;
  /** Current platform */
  readonly current: RouterPlatform;
  /** Platform-specific features available */
  readonly features?: Maybe<ReadonlyArray<PlatformFeature>>;
  /** Field mappings between GraphQL and platform-native names */
  readonly fieldMappings?: Maybe<Scalars['JSON']['output']>;
  /** Platform-specific limitations or constraints */
  readonly limitations?: Maybe<ReadonlyArray<PlatformLimitation>>;
};

/** A platform-specific limitation */
export type PlatformLimitation = {
  /** Affected fields */
  readonly affectedFields?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Limitation identifier */
  readonly code: Scalars['String']['output'];
  /** Human-readable description */
  readonly description: Scalars['String']['output'];
  /** Workaround if available */
  readonly workaround?: Maybe<Scalars['String']['output']>;
};

/**
 * Port forward configuration (high-level view).
 * Represents both the NAT rule and corresponding filter rule.
 */
export type PortForward = Node & {
  /** External port */
  readonly externalPort: Scalars['Int']['output'];
  /** ID of the associated filter rule (if created) */
  readonly filterRuleId?: Maybe<Scalars['ID']['output']>;
  /** Unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Internal target IP */
  readonly internalIP: Scalars['String']['output'];
  /** Internal target port */
  readonly internalPort: Scalars['Int']['output'];
  /** Optional name/description */
  readonly name?: Maybe<Scalars['String']['output']>;
  /** ID of the associated NAT rule */
  readonly natRuleId: Scalars['ID']['output'];
  /** Protocol (TCP, UDP) */
  readonly protocol: TransportProtocol;
  /** Current status */
  readonly status: PortForwardStatus;
};

/**
 * Input for creating a port forward (simplified wizard).
 * Creates both NAT and filter rules automatically.
 */
export type PortForwardInput = {
  /** External port (1-65535) */
  readonly externalPort: Scalars['Int']['input'];
  /** Internal target IP address */
  readonly internalIP: Scalars['String']['input'];
  /** Internal target port (defaults to external port if not specified) */
  readonly internalPort?: InputMaybe<Scalars['Int']['input']>;
  /** Optional name/description for this port forward */
  readonly name?: InputMaybe<Scalars['String']['input']>;
  /** Protocol (TCP, UDP) */
  readonly protocol: TransportProtocol;
  /** WAN interface name (optional, auto-detected if not specified) */
  readonly wanInterface?: InputMaybe<Scalars['String']['input']>;
};

/** Status of a port forward configuration. */
export const PortForwardStatus = {
  /** Port forward is active and working */
  Active: 'ACTIVE',
  /** Port forward is disabled */
  Disabled: 'DISABLED',
  /** Port forward has errors or misconfiguration */
  Error: 'ERROR',
  /** Port forward is partially configured (missing rules) */
  Incomplete: 'INCOMPLETE'
} as const;

export type PortForwardStatus = typeof PortForwardStatus[keyof typeof PortForwardStatus];
/** Port knock attempt log entry. */
export type PortKnockAttempt = Node & {
  /** Attempt ID */
  readonly id: Scalars['ID']['output'];
  /** Ports hit in order */
  readonly portsHit: ReadonlyArray<Scalars['Int']['output']>;
  /** Progress indicator (e.g., "2/4") */
  readonly progress: Scalars['String']['output'];
  /** Protected service port */
  readonly protectedPort: Scalars['Int']['output'];
  /** Sequence ID */
  readonly sequenceId: Scalars['ID']['output'];
  /** Sequence name */
  readonly sequenceName: Scalars['String']['output'];
  /** Source IP address */
  readonly sourceIP: Scalars['String']['output'];
  /** Attempt status */
  readonly status: KnockStatus;
  /** Attempt timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Connection type for paginated knock attempts. */
export type PortKnockAttemptConnection = Connection & {
  readonly edges: ReadonlyArray<PortKnockAttemptEdge>;
  readonly pageInfo: PageInfo;
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Edge type for knock attempt connections. */
export type PortKnockAttemptEdge = Edge & {
  readonly cursor: Scalars['String']['output'];
  readonly node: PortKnockAttempt;
};

/** Filters for knock attempt log. */
export type PortKnockLogFilters = {
  /** End date */
  readonly endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by sequence ID */
  readonly sequenceId?: InputMaybe<Scalars['ID']['input']>;
  /** Filter by source IP */
  readonly sourceIP?: InputMaybe<Scalars['String']['input']>;
  /** Start date */
  readonly startDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by status */
  readonly status?: InputMaybe<KnockStatus>;
};

/**
 * Port knocking sequence configuration.
 * Implements stage-based address list progression for hiding services.
 */
export type PortKnockSequence = Node & {
  /** Access timeout after successful knock */
  readonly accessTimeout: Scalars['String']['output'];
  /** When sequence was created */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Whether sequence is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Generated firewall rule IDs */
  readonly generatedRuleIds: ReadonlyArray<Scalars['ID']['output']>;
  /** Unique sequence identifier */
  readonly id: Scalars['ID']['output'];
  /** Ordered list of knock ports (2-8 ports) */
  readonly knockPorts: ReadonlyArray<KnockPort>;
  /** Max time between knocks */
  readonly knockTimeout: Scalars['String']['output'];
  /** Sequence name (alphanumeric, underscores, hyphens) */
  readonly name: Scalars['String']['output'];
  /** Protected service port */
  readonly protectedPort: Scalars['Int']['output'];
  /** Protected service protocol */
  readonly protectedProtocol: TransportProtocol;
  /** Successful knocks in last 24h */
  readonly recentAccessCount: Scalars['Int']['output'];
  /** Router ID */
  readonly routerId: Scalars['ID']['output'];
  /** When sequence was last updated */
  readonly updatedAt: Scalars['DateTime']['output'];
};

/** Input for creating/updating port knock sequence. */
export type PortKnockSequenceInput = {
  /** Access timeout (e.g., "5m", "1h") */
  readonly accessTimeout: Scalars['String']['input'];
  /** Whether enabled */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Ordered knock ports (2-8) */
  readonly knockPorts: ReadonlyArray<KnockPortInput>;
  /** Knock timeout (e.g., "15s", "30s") */
  readonly knockTimeout: Scalars['String']['input'];
  /** Sequence name */
  readonly name: Scalars['String']['input'];
  /** Protected service port */
  readonly protectedPort: Scalars['Int']['input'];
  /** Protected service protocol */
  readonly protectedProtocol: TransportProtocol;
};

/** A port mirror configuration for traffic monitoring and analysis */
export type PortMirror = Node & {
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Destination interface where mirrored traffic is sent */
  readonly destinationInterface: Interface;
  /** Direction of traffic to mirror */
  readonly direction: MirrorDirection;
  /** Whether the mirror is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Unique port mirror identifier */
  readonly id: Scalars['ID']['output'];
  /** Descriptive name for the mirror configuration */
  readonly name: Scalars['String']['output'];
  /** Source interfaces being mirrored */
  readonly sourceInterfaces: ReadonlyArray<Interface>;
  /** Statistics for the destination interface */
  readonly statistics?: Maybe<PortMirrorStats>;
};

/** Result of a port mirror mutation (create, update) */
export type PortMirrorMutationResult = {
  /** Errors that occurred during the operation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The created or updated port mirror (if successful) */
  readonly portMirror?: Maybe<PortMirror>;
  /** Configuration preview (RouterOS commands) */
  readonly preview?: Maybe<ConfigPreview>;
  /** Whether the operation succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Statistics for a port mirror destination interface */
export type PortMirrorStats = {
  /** Destination interface current load */
  readonly destinationLoad: Scalars['Float']['output'];
  /** Whether the destination is saturated (dropping packets) */
  readonly isSaturated: Scalars['Boolean']['output'];
  /** Total mirrored bytes */
  readonly mirroredBytes: Scalars['Size']['output'];
  /** Total mirrored packets */
  readonly mirroredPackets: Scalars['Size']['output'];
};

/** Port mode for VLAN configuration */
export const PortMode = {
  /** Access port (single VLAN, untagged) */
  Access: 'ACCESS',
  /** Trunk port (carries multiple VLANs with tagging) */
  Trunk: 'TRUNK'
} as const;

export type PortMode = typeof PortMode[keyof typeof PortMode];
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

/** PPPoE client configuration for dial-up WAN */
export type PppoeClient = Node & {
  /** Add default route */
  readonly addDefaultRoute: Scalars['Boolean']['output'];
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether PPPoE is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Underlying interface (ethernet/bridge) */
  readonly interface: Scalars['String']['output'];
  /** MRU setting */
  readonly mru?: Maybe<Scalars['Int']['output']>;
  /** MTU setting */
  readonly mtu?: Maybe<Scalars['Int']['output']>;
  /** PPPoE interface name */
  readonly name: Scalars['String']['output'];
  /** Current connection status */
  readonly running: Scalars['Boolean']['output'];
  /** Service name (optional) */
  readonly serviceName?: Maybe<Scalars['String']['output']>;
  /** Use peer DNS */
  readonly usePeerDNS: Scalars['Boolean']['output'];
  /** Username for authentication */
  readonly username: Scalars['String']['output'];
};

/** Input for creating/updating PPPoE client */
export type PppoeClientInput = {
  /** Add default route (default: true) */
  readonly addDefaultRoute?: InputMaybe<Scalars['Boolean']['input']>;
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Physical interface (ether1, bridge, etc.) */
  readonly interface: Scalars['String']['input'];
  /** MRU (default: auto) */
  readonly mru?: InputMaybe<Scalars['Int']['input']>;
  /** MTU (default: auto) */
  readonly mtu?: InputMaybe<Scalars['Int']['input']>;
  /** PPPoE interface name */
  readonly name: Scalars['String']['input'];
  /** Password for ISP authentication */
  readonly password: Scalars['String']['input'];
  /** Service name (optional, ISP-specific) */
  readonly serviceName?: InputMaybe<Scalars['String']['input']>;
  /** Use peer DNS (default: true) */
  readonly usePeerDNS?: InputMaybe<Scalars['Boolean']['input']>;
  /** Username for ISP authentication */
  readonly username: Scalars['String']['input'];
};

/**
 * Input for previewing a notification template
 * Simpler input for template customization workflow
 */
export type PreviewNotificationTemplateInput = {
  /** Body template with Go template syntax */
  readonly bodyTemplate: Scalars['String']['input'];
  /** Notification channel */
  readonly channel: NotificationChannel;
  /** Event type for sample data generation */
  readonly eventType: Scalars['String']['input'];
  /** Subject template (optional, not all channels use subjects) */
  readonly subjectTemplate?: InputMaybe<Scalars['String']['input']>;
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
/** Pushover API usage statistics */
export type PushoverUsage = {
  /** Monthly message limit */
  readonly limit: Scalars['Int']['output'];
  /** Number of messages remaining this month */
  readonly remaining: Scalars['Int']['output'];
  /** When the usage counter resets */
  readonly resetAt: Scalars['DateTime']['output'];
  /** Number of messages used this month */
  readonly used: Scalars['Int']['output'];
};

export type Query = {
  /**
   * Get entries for a specific address list with cursor-based pagination.
   * Supports infinite scrolling for large lists (10,000+ entries).
   */
  readonly addressListEntries: AddressListEntryConnection;
  /**
   * Get all address lists with aggregated statistics.
   * Returns a list of address lists with entry counts and referencing rule counts.
   */
  readonly addressLists: ReadonlyArray<AddressList>;
  /** Get alert escalations with optional filtering (NAS-18.9) */
  readonly alertEscalations: ReadonlyArray<AlertEscalation>;
  /** Get a single alert rule by ID */
  readonly alertRule?: Maybe<AlertRule>;
  /** Get a single alert rule template by ID */
  readonly alertRuleTemplate?: Maybe<AlertRuleTemplate>;
  /** Get alert rule templates, optionally filtered by category */
  readonly alertRuleTemplates: ReadonlyArray<AlertRuleTemplate>;
  /**
   * Get throttle status for alert rules
   * Returns throttle information for all rules or a specific rule
   */
  readonly alertRuleThrottleStatus: ReadonlyArray<ThrottleStatus>;
  /** Get all alert rules, optionally filtered by device */
  readonly alertRules: ReadonlyArray<AlertRule>;
  /**
   * Get current storm detection status
   * Shows if alert storm is detected and which rules are contributing
   */
  readonly alertStormStatus: StormStatus;
  /** Get a single alert template by ID */
  readonly alertTemplate?: Maybe<AlertTemplate>;
  /** Get all alert templates, optionally filtered by event type or channel */
  readonly alertTemplates: ReadonlyArray<AlertTemplate>;
  /** Get alerts with filtering and pagination */
  readonly alerts: AlertConnection;
  /** Get interfaces available to add to a bridge (not already in any bridge) */
  readonly availableInterfacesForBridge: ReadonlyArray<Interface>;
  /** List all available services from the Feature Marketplace. */
  readonly availableServices: ReadonlyArray<AvailableService>;
  /** Get a single bridge by UUID */
  readonly bridge?: Maybe<Bridge>;
  /** Get bridge ports */
  readonly bridgePorts: ReadonlyArray<BridgePort>;
  /** Get bridge VLANs */
  readonly bridgeVlans: ReadonlyArray<BridgeVlan>;
  /** List all bridges on a router */
  readonly bridges: ReadonlyArray<Bridge>;
  /** Get a change set by ID */
  readonly changeSet?: Maybe<ChangeSet>;
  /** List change sets for a router */
  readonly changeSets: ReadonlyArray<ChangeSetSummary>;
  /** Check if a gateway address is reachable from the router */
  readonly checkGatewayReachability: GatewayReachabilityResult;
  /** Check if an IP address conflicts with existing assignments */
  readonly checkIpConflict: IpConflictResult;
  /** Check if a VLAN ID is available on a parent interface */
  readonly checkVlanIdAvailable: Scalars['Boolean']['output'];
  /**
   * Get circuit breaker status for a router.
   * Shows current state, failure counts, and cooldown timing.
   */
  readonly circuitBreakerStatus: CircuitBreakerStatus;
  /** Get common event types */
  readonly commonEventTypes: ReadonlyArray<Scalars['String']['output']>;
  /** Get the compatibility matrix for all known features */
  readonly compatibilityMatrix: ReadonlyArray<FeatureCompatibilityInfo>;
  /** Get composite resource with all related sub-resources */
  readonly compositeResource?: Maybe<CompositeResource>;
  /**
   * Get recent connection attempts for a router.
   * Returns the most recent attempts, ordered newest first.
   */
  readonly connectionAttempts: ReadonlyArray<ConnectionAttempt>;
  /** Get detailed connection status for a router */
  readonly connectionDetails?: Maybe<ConnectionDetails>;
  /** Get connection manager statistics */
  readonly connectionStats: ConnectionStats;
  /** Get the default configuration for a specific channel type */
  readonly defaultNotificationChannelConfig?: Maybe<NotificationChannelConfig>;
  /** Detect default gateway from DHCP client or static route */
  readonly detectGateway?: Maybe<Scalars['String']['output']>;
  /** Detect ISP information from WAN IP */
  readonly detectISP?: Maybe<IspInfo>;
  /** Detect WAN interface from default route */
  readonly detectWanInterface: Scalars['String']['output'];
  /** Get a device by ID for resource metrics */
  readonly device?: Maybe<Device>;
  /** Get digest delivery history for a channel (NAS-18.11) */
  readonly digestHistory: ReadonlyArray<DigestSummary>;
  /** Get the number of alerts in the digest queue for a channel (NAS-18.11) */
  readonly digestQueueCount: Scalars['Int']['output'];
  /**
   * Run DNS server benchmark against all configured DNS servers.
   * Tests each server with a well-known hostname (google.com) and returns
   * response times sorted from fastest to slowest.
   */
  readonly dnsBenchmark: DnsBenchmarkResult;
  /** Get DNS cache statistics including entries, size, hit rate, and top domains. */
  readonly dnsCacheStats: DnsCacheStats;
  /**
   * Get configured DNS servers for a device.
   * Returns primary and secondary DNS servers configured on the router.
   */
  readonly dnsServers: DnsServers;
  /** Get system health status */
  readonly health: HealthStatus;
  /** Get a network interface by ID */
  readonly interface?: Maybe<Interface>;
  /** Get historical interface statistics for bandwidth analysis */
  readonly interfaceStatsHistory: InterfaceStatsHistory;
  /** List interfaces on a router */
  readonly interfaces: InterfaceConnection;
  /** Get a specific IP address by ID */
  readonly ipAddress?: Maybe<IpAddress>;
  /** Get dependencies for an IP address (DHCP servers, routes, etc.) */
  readonly ipAddressDependencies: IpAddressDependencies;
  /** Get all IP addresses on a router with optional filtering */
  readonly ipAddresses: ReadonlyArray<IpAddress>;
  /** Get available IPsec profiles for GRE tunnel encryption */
  readonly ipsecProfiles: ReadonlyArray<IpsecProfile>;
  /** Check if a feature is supported on a specific router */
  readonly isFeatureSupported: FeatureSupport;
  /** Get current authenticated user */
  readonly me?: Maybe<User>;
  /** Get all active sessions for the current user */
  readonly mySessions: ReadonlyArray<Session>;
  /** Get NAT rules, optionally filtered by chain. */
  readonly natRules: ReadonlyArray<NatRule>;
  /** Fetch any node by its global ID */
  readonly node?: Maybe<Node>;
  /** Get a specific notification channel configuration by ID */
  readonly notificationChannelConfig?: Maybe<NotificationChannelConfig>;
  /** List all notification channel configurations (optionally filtered by type) */
  readonly notificationChannelConfigs: ReadonlyArray<NotificationChannelConfig>;
  /** Get notification delivery logs */
  readonly notificationLogs: ReadonlyArray<NotificationLog>;
  /** Get all port forwards (high-level view). */
  readonly portForwards: ReadonlyArray<PortForward>;
  /** Get port knock attempt log with filtering. */
  readonly portKnockLog: PortKnockAttemptConnection;
  /** Get single port knock sequence by ID. */
  readonly portKnockSequence?: Maybe<PortKnockSequence>;
  /** Get all port knock sequences for a router. */
  readonly portKnockSequences: ReadonlyArray<PortKnockSequence>;
  /** Get a specific port mirror by ID */
  readonly portMirror?: Maybe<PortMirror>;
  /** Get all port mirror configurations on a router */
  readonly portMirrors: ReadonlyArray<PortMirror>;
  /** Preview an alert rule template with variable substitution */
  readonly previewAlertRuleTemplate: AlertRuleTemplatePreview;
  /** Preview an alert template with variables */
  readonly previewAlertTemplate: TemplatePreviewPayload;
  /** Get Pushover API usage statistics */
  readonly pushoverUsage?: Maybe<PushoverUsage>;
  /** Get a resource by ID */
  readonly resource?: Maybe<Resource>;
  /** List resources for a router */
  readonly resources: ResourceConnection;
  /** Get a specific route by ID */
  readonly route?: Maybe<Route>;
  /**
   * Look up which route will be used for a destination IP.
   * Supports optional source address for policy routing testing.
   */
  readonly routeLookup: RouteLookupResult;
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
  /** Get all routes on a router with optional filtering */
  readonly routes: ReadonlyArray<Route>;
  /**
   * Get firewall rules that reference a specific address list.
   * Includes filter, NAT, and mangle rules.
   */
  readonly rulesReferencingAddressList: ReadonlyArray<FirewallRule>;
  /** Get scan history (recent scans) */
  readonly scanHistory: ReadonlyArray<ScanTask>;
  /** Get the status of a scan task by ID */
  readonly scanStatus?: Maybe<ScanTask>;
  /** Search alert templates */
  readonly searchAlertTemplates: ReadonlyArray<AlertTemplate>;
  /** Get a specific service instance. */
  readonly serviceInstance?: Maybe<ServiceInstance>;
  /** List all service instances for a router. */
  readonly serviceInstances: ReadonlyArray<ServiceInstance>;
  /** Get all features supported by a router */
  readonly supportedFeatures: ReadonlyArray<FeatureSupport>;
  /** Get a troubleshooting session by ID */
  readonly troubleshootSession?: Maybe<TroubleshootSession>;
  /** Get a specific tunnel by ID */
  readonly tunnel?: Maybe<Tunnel>;
  /** Get all tunnels on a router with optional filtering by type */
  readonly tunnels: ReadonlyArray<Tunnel>;
  /** Get features not supported by a router with upgrade guidance */
  readonly unsupportedFeatures: ReadonlyArray<FeatureSupport>;
  /** Get upgrade recommendation for a specific feature on a router */
  readonly upgradeRecommendation?: Maybe<UpgradeRecommendation>;
  /** Get all upgrade recommendations for a router */
  readonly upgradeRecommendations: ReadonlyArray<UpgradeRecommendation>;
  /** Get current API version */
  readonly version: Scalars['String']['output'];
  /** Get a specific VLAN by ID */
  readonly vlan?: Maybe<Vlan>;
  /** Get dependencies for a VLAN (IP addresses, DHCP, routes, etc.) */
  readonly vlanDependencies?: Maybe<VlanDependencies>;
  /** Get VLAN topology for a bridge */
  readonly vlanTopology?: Maybe<VlanTopology>;
  /** Get all VLANs on a router with optional filtering */
  readonly vlans: ReadonlyArray<Vlan>;
  /** Get connection history for a WAN interface */
  readonly wanConnectionHistory: WanConnectionEventConnection;
  /** Get a specific WAN interface by ID */
  readonly wanInterface?: Maybe<WanInterface>;
  /** Get all WAN interfaces on a router */
  readonly wanInterfaces: ReadonlyArray<WanInterface>;
  /** Get a single webhook by ID */
  readonly webhook?: Maybe<Webhook>;
  /** Get all webhooks */
  readonly webhooks: ReadonlyArray<Webhook>;
};


export type QueryAddressListEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  listName: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryAddressListsArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryAlertEscalationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<EscalationStatus>;
};


export type QueryAlertRuleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAlertRuleTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAlertRuleTemplatesArgs = {
  category?: InputMaybe<AlertRuleTemplateCategory>;
};


export type QueryAlertRuleThrottleStatusArgs = {
  ruleId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryAlertRulesArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryAlertTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAlertTemplatesArgs = {
  channel?: InputMaybe<NotificationChannel>;
  eventType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAlertsArgs = {
  acknowledged?: InputMaybe<Scalars['Boolean']['input']>;
  deviceId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  severity?: InputMaybe<AlertSeverity>;
};


export type QueryAvailableInterfacesForBridgeArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryAvailableServicesArgs = {
  architecture?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBridgeArgs = {
  uuid: Scalars['ID']['input'];
};


export type QueryBridgePortsArgs = {
  bridgeId: Scalars['ID']['input'];
};


export type QueryBridgeVlansArgs = {
  bridgeId: Scalars['ID']['input'];
};


export type QueryBridgesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryChangeSetArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryChangeSetsArgs = {
  includeCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  routerId: Scalars['ID']['input'];
  status?: InputMaybe<ChangeSetStatus>;
};


export type QueryCheckGatewayReachabilityArgs = {
  gateway: Scalars['IPv4']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryCheckIpConflictArgs = {
  address: Scalars['String']['input'];
  excludeId?: InputMaybe<Scalars['ID']['input']>;
  interfaceId?: InputMaybe<Scalars['ID']['input']>;
  routerId: Scalars['ID']['input'];
};


export type QueryCheckVlanIdAvailableArgs = {
  parentInterface: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
  vlanId: Scalars['Int']['input'];
};


export type QueryCircuitBreakerStatusArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryCompositeResourceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryConnectionAttemptsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  routerId: Scalars['ID']['input'];
};


export type QueryConnectionDetailsArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryDefaultNotificationChannelConfigArgs = {
  channelType: ChannelType;
};


export type QueryDetectGatewayArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryDetectIspArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryDetectWanInterfaceArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDigestHistoryArgs = {
  channelId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestQueueCountArgs = {
  channelId: Scalars['ID']['input'];
};


export type QueryDnsBenchmarkArgs = {
  deviceId: Scalars['String']['input'];
};


export type QueryDnsCacheStatsArgs = {
  deviceId: Scalars['String']['input'];
};


export type QueryDnsServersArgs = {
  deviceId: Scalars['String']['input'];
};


export type QueryInterfaceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryInterfaceStatsHistoryArgs = {
  interfaceId: Scalars['ID']['input'];
  interval?: InputMaybe<Scalars['Duration']['input']>;
  routerId: Scalars['ID']['input'];
  timeRange: StatsTimeRangeInput;
};


export type QueryInterfacesArgs = {
  pagination?: InputMaybe<PaginationInput>;
  routerId: Scalars['ID']['input'];
  type?: InputMaybe<InterfaceType>;
};


export type QueryIpAddressArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryIpAddressDependenciesArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryIpAddressesArgs = {
  interfaceId?: InputMaybe<Scalars['ID']['input']>;
  routerId: Scalars['ID']['input'];
};


export type QueryIpsecProfilesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryIsFeatureSupportedArgs = {
  featureId: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryNatRulesArgs = {
  chain?: InputMaybe<NatChain>;
  routerId: Scalars['ID']['input'];
};


export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNotificationChannelConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNotificationChannelConfigsArgs = {
  channelType?: InputMaybe<ChannelType>;
};


export type QueryNotificationLogsArgs = {
  alertId?: InputMaybe<Scalars['ID']['input']>;
  channel?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  webhookId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPortForwardsArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryPortKnockLogArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<PortKnockLogFilters>;
  first?: InputMaybe<Scalars['Int']['input']>;
  routerId: Scalars['ID']['input'];
};


export type QueryPortKnockSequenceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryPortKnockSequencesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryPortMirrorArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryPortMirrorsArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryPreviewAlertRuleTemplateArgs = {
  templateId: Scalars['ID']['input'];
  variables: Scalars['JSON']['input'];
};


export type QueryPreviewAlertTemplateArgs = {
  templateId: Scalars['ID']['input'];
  variables: Scalars['JSON']['input'];
};


export type QueryResourceArgs = {
  id: Scalars['ID']['input'];
  layers?: InputMaybe<ReadonlyArray<ResourceLayer>>;
  routerId: Scalars['ID']['input'];
};


export type QueryResourcesArgs = {
  category?: InputMaybe<ResourceCategory>;
  pagination?: InputMaybe<PaginationInput>;
  routerId: Scalars['ID']['input'];
  state?: InputMaybe<ResourceLifecycleState>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRouteArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryRouteLookupArgs = {
  destination: Scalars['IPv4']['input'];
  routerId: Scalars['ID']['input'];
  source?: InputMaybe<Scalars['IPv4']['input']>;
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


export type QueryRoutesArgs = {
  routerId: Scalars['ID']['input'];
  table?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<RouteType>;
};


export type QueryRulesReferencingAddressListArgs = {
  listName: Scalars['String']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryScanHistoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryScanStatusArgs = {
  taskId: Scalars['ID']['input'];
};


export type QuerySearchAlertTemplatesArgs = {
  query: Scalars['String']['input'];
};


export type QueryServiceInstanceArgs = {
  instanceID: Scalars['ID']['input'];
  routerID: Scalars['ID']['input'];
};


export type QueryServiceInstancesArgs = {
  featureID?: InputMaybe<Scalars['String']['input']>;
  routerID: Scalars['ID']['input'];
  status?: InputMaybe<ServiceStatus>;
};


export type QuerySupportedFeaturesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryTroubleshootSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTunnelArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryTunnelsArgs = {
  routerId: Scalars['ID']['input'];
  type?: InputMaybe<TunnelType>;
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


export type QueryVlanArgs = {
  id: Scalars['ID']['input'];
};


export type QueryVlanDependenciesArgs = {
  id: Scalars['ID']['input'];
};


export type QueryVlanTopologyArgs = {
  bridgeId: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryVlansArgs = {
  filter?: InputMaybe<VlanFilter>;
  routerId: Scalars['ID']['input'];
};


export type QueryWanConnectionHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
  routerId: Scalars['ID']['input'];
  wanInterfaceId: Scalars['ID']['input'];
};


export type QueryWanInterfaceArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type QueryWanInterfacesArgs = {
  routerId: Scalars['ID']['input'];
};


export type QueryWebhookArgs = {
  id: Scalars['ID']['input'];
};

/** Quiet hours configuration */
export type QuietHoursConfig = {
  /** Whether critical alerts bypass quiet hours */
  readonly bypassCritical: Scalars['Boolean']['output'];
  /** Days of week when quiet hours apply (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday). Empty array means all days. */
  readonly daysOfWeek: ReadonlyArray<Scalars['Int']['output']>;
  /** End time in HH:MM format */
  readonly endTime: Scalars['String']['output'];
  /** Start time in HH:MM format */
  readonly startTime: Scalars['String']['output'];
  /** Timezone (IANA timezone database name) */
  readonly timezone: Scalars['String']['output'];
};

/** Quiet hours configuration input */
export type QuietHoursConfigInput = {
  /** Whether critical alerts bypass quiet hours (default: true) */
  readonly bypassCritical?: InputMaybe<Scalars['Boolean']['input']>;
  /** Days of week when quiet hours apply (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday). Empty array means all days. */
  readonly daysOfWeek?: InputMaybe<ReadonlyArray<Scalars['Int']['input']>>;
  /** End time in HH:MM format */
  readonly endTime: Scalars['String']['input'];
  /** Start time in HH:MM format */
  readonly startTime: Scalars['String']['input'];
  /** Timezone (default: UTC) */
  readonly timezone?: InputMaybe<Scalars['String']['input']>;
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

export type RemoveChangeSetItemPayload = {
  /** The updated change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/**
 * Universal State v2 Resource Interface.
 * Every managed resource implements this interface with 8 layers:
 * 1. configuration - User's desired config (mutable by user)
 * 2. validation - Pre-flight check results (computed by backend)
 * 3. deployment - What's on router (after Apply-Confirm)
 * 4. runtime - Live operational state (polled/streamed)
 * 5. telemetry - Time-series metrics (historical)
 * 6. metadata - Lifecycle info, tags, ownership
 * 7. relationships - Dependencies (embedded + explicit)
 * 8. platform - Capabilities and field mappings
 */
export type Resource = {
  /** Resource category */
  readonly category: ResourceCategory;
  /**
   * Layer 1: CONFIGURATION - User's desired config
   * Mutable by user. Validated by Zod on client, GraphQL on server.
   * Implementations can provide strongly-typed configs.
   */
  readonly configuration?: Maybe<Scalars['JSON']['output']>;
  /**
   * Layer 3: DEPLOYMENT - What's actually on router
   * Written after Apply-Confirm. Includes router-generated fields.
   * Implementations can provide strongly-typed deployment states.
   */
  readonly deployment?: Maybe<DeploymentState>;
  /** Globally unique identifier (ULID) - also serves as Node.id for Relay compatibility */
  readonly id: Scalars['ID']['output'];
  /**
   * Layer 6: METADATA - Resource lifecycle info
   * System-managed. Includes tags, version, ownership.
   */
  readonly metadata: ResourceMetadata;
  /**
   * Layer 8: PLATFORM - Capabilities and field mappings
   * From platform adapter. Router-specific behavior.
   */
  readonly platform?: Maybe<PlatformInfo>;
  /**
   * Layer 7: RELATIONSHIPS - Dependencies
   * Embedded in config (user-defined) + explicit table (system-discovered).
   */
  readonly relationships?: Maybe<ResourceRelationships>;
  /**
   * Layer 4: RUNTIME - Live operational state
   * Polled/streamed from router. Read-only.
   * Implementations can provide strongly-typed runtime states.
   */
  readonly runtime?: Maybe<RuntimeState>;
  /** Scoped identifier for readability (e.g., 'vpn.wg.client:usa-vpn:a1b2') */
  readonly scopedId: Scalars['String']['output'];
  /**
   * Layer 5: TELEMETRY - Time-series metrics
   * Historical data collected over time. Read-only.
   */
  readonly telemetry?: Maybe<TelemetryData>;
  /** Resource type identifier (e.g., 'vpn.wireguard.client') */
  readonly type: Scalars['String']['output'];
  /**
   * Layer 2: VALIDATION - Pre-flight check results
   * Computed by backend. Updated on every configuration change.
   */
  readonly validation?: Maybe<ValidationResult>;
};

/** Categories of managed resources */
export const ResourceCategory = {
  /** Application-level: Port Forwarding, Game Rules */
  Application: 'APPLICATION',
  /** Marketplace features: Tor, AdGuard, sing-box */
  Feature: 'FEATURE',
  /** System infrastructure: Certificates, NTP, DDNS */
  Infrastructure: 'INFRASTRUCTURE',
  /** Network topology: WAN Links, LAN Networks, VLANs */
  Network: 'NETWORK',
  /** Community extensions: Third-party plugins */
  Plugin: 'PLUGIN',
  /** VPN connectivity: WireGuard, OpenVPN, IPsec */
  Vpn: 'VPN'
} as const;

export type ResourceCategory = typeof ResourceCategory[keyof typeof ResourceCategory];
/** Conflict with another resource */
export type ResourceConflict = {
  /** The conflicting resource */
  readonly conflictingResource?: Maybe<Resource>;
  /** Conflicting resource UUID (if resource is not loaded) */
  readonly conflictingResourceUuid: Scalars['ID']['output'];
  /** Description of the conflict */
  readonly description: Scalars['String']['output'];
  /** Suggested resolution */
  readonly resolution?: Maybe<Scalars['String']['output']>;
  /** Type of conflict */
  readonly type: ConflictType;
};

export type ResourceConnection = Connection & {
  readonly edges: ReadonlyArray<ResourceEdge>;
  readonly pageInfo: PageInfo;
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ResourceEdge = Edge & {
  readonly cursor: Scalars['String']['output'];
  readonly node: Resource;
};

/** Impact level for affected resources */
export const ResourceImpact = {
  /** Connections will be dropped */
  ConnectionDrop: 'CONNECTION_DROP',
  /** Resource will be disabled */
  Disabled: 'DISABLED',
  /** Resource will be modified */
  Modified: 'MODIFIED',
  /** Resource will be removed */
  Removed: 'REMOVED'
} as const;

export type ResourceImpact = typeof ResourceImpact[keyof typeof ResourceImpact];
/** Selectable resource layers for optimized fetching */
export const ResourceLayer = {
  Configuration: 'CONFIGURATION',
  Deployment: 'DEPLOYMENT',
  Metadata: 'METADATA',
  Platform: 'PLATFORM',
  Relationships: 'RELATIONSHIPS',
  Runtime: 'RUNTIME',
  Telemetry: 'TELEMETRY',
  Validation: 'VALIDATION'
} as const;

export type ResourceLayer = typeof ResourceLayer[keyof typeof ResourceLayer];
/** Resource lifecycle states for state machine */
export const ResourceLifecycleState = {
  /** Successfully applied and running */
  Active: 'ACTIVE',
  /** Being applied to router */
  Applying: 'APPLYING',
  /** Final state, no longer active */
  Archived: 'ARCHIVED',
  /** Running but with issues */
  Degraded: 'DEGRADED',
  /** Marked for removal */
  Deprecated: 'DEPRECATED',
  /** Initial creation, not yet validated */
  Draft: 'DRAFT',
  /** Failed state (validation or apply) */
  Error: 'ERROR',
  /** Passed validation, ready to apply */
  Valid: 'VALID',
  /** Backend validation in progress */
  Validating: 'VALIDATING'
} as const;

export type ResourceLifecycleState = typeof ResourceLifecycleState[keyof typeof ResourceLifecycleState];
/**
 * Layer 6: Resource lifecycle info, tags, ownership.
 * System-managed with some user-editable fields.
 */
export type ResourceMetadata = {
  /** Resource creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** User who created the resource */
  readonly createdBy: Scalars['String']['output'];
  /** Resource description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Whether resource is marked as favorite */
  readonly isFavorite: Scalars['Boolean']['output'];
  /** Whether resource is pinned */
  readonly isPinned: Scalars['Boolean']['output'];
  /** Custom user notes */
  readonly notes?: Maybe<Scalars['String']['output']>;
  /** Audit trail of recent changes */
  readonly recentChanges?: Maybe<ReadonlyArray<ChangeLogEntry>>;
  /** Current lifecycle state */
  readonly state: ResourceLifecycleState;
  /** User-defined tags for organization */
  readonly tags: ReadonlyArray<Scalars['String']['output']>;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** User who last updated the resource */
  readonly updatedBy?: Maybe<Scalars['String']['output']>;
  /** Optimistic locking version */
  readonly version: Scalars['Int']['output'];
};

/** Real-time resource utilization metrics for a device */
export type ResourceMetrics = {
  /** CPU utilization metrics */
  readonly cpu: CpuMetrics;
  /** Memory utilization metrics */
  readonly memory: MemoryMetrics;
  /** Storage utilization metrics */
  readonly storage: StorageMetrics;
  /** Temperature in Celsius (null if not supported) */
  readonly temperature?: Maybe<Scalars['Float']['output']>;
  /** Timestamp when metrics were collected */
  readonly timestamp: Scalars['DateTime']['output'];
};

/** Reference to another resource */
export type ResourceReference = {
  /** Resource category */
  readonly category: ResourceCategory;
  /** Resource scoped ID */
  readonly id: Scalars['String']['output'];
  /** Current lifecycle state */
  readonly state: ResourceLifecycleState;
  /** Resource type */
  readonly type: Scalars['String']['output'];
  /** Resource UUID */
  readonly uuid: Scalars['ID']['output'];
};

/** Edge in the resource relationship graph */
export type ResourceRelationshipEdge = {
  /** Source resource ID */
  readonly from: Scalars['ID']['output'];
  /** Target resource ID */
  readonly to: Scalars['ID']['output'];
  /** Relationship type */
  readonly type: ResourceRelationshipType;
};

/** Types of relationships between resources */
export const ResourceRelationshipType = {
  /** Custom relationship */
  Custom: 'CUSTOM',
  /** Child depends on parent */
  DependsOn: 'DEPENDS_ON',
  /** Resources are in the same group */
  Group: 'GROUP',
  /** Parent-child hierarchy */
  ParentChild: 'PARENT_CHILD',
  /** Traffic routes via this resource */
  RoutesVia: 'ROUTES_VIA'
} as const;

export type ResourceRelationshipType = typeof ResourceRelationshipType[keyof typeof ResourceRelationshipType];
/**
 * Layer 7: Dependencies and relationships between resources.
 * Combines user-defined relationships and system-discovered dependencies.
 */
export type ResourceRelationships = {
  /** Child resources (for hierarchical resources) */
  readonly children: ReadonlyArray<ResourceReference>;
  /** Custom relationships */
  readonly custom?: Maybe<Scalars['JSON']['output']>;
  /** Resources that depend on this resource */
  readonly dependents: ReadonlyArray<ResourceReference>;
  /** Resources this resource depends on */
  readonly dependsOn: ReadonlyArray<ResourceReference>;
  /** Parent resource (for hierarchical resources) */
  readonly parent?: Maybe<ResourceReference>;
  /** Resources that route traffic via this resource */
  readonly routedBy: ReadonlyArray<ResourceReference>;
  /** Resource this routes traffic via */
  readonly routesVia?: Maybe<ResourceReference>;
};

/** Input for resource relationships */
export type ResourceRelationshipsInput = {
  /** Custom relationship data */
  readonly custom?: InputMaybe<Scalars['JSON']['input']>;
  /** Resources this resource depends on (IDs) */
  readonly dependsOn?: InputMaybe<ReadonlyArray<Scalars['ID']['input']>>;
  /** Parent resource ID (for hierarchical resources) */
  readonly parent?: InputMaybe<Scalars['ID']['input']>;
  /** Resources that route traffic via this resource (ID) */
  readonly routesVia?: InputMaybe<Scalars['ID']['input']>;
};

/** Runtime update event for a resource */
export type ResourceRuntimeEvent = {
  /** Resource ID (ULID) */
  readonly id: Scalars['ID']['output'];
  /** Updated runtime state */
  readonly runtime: RuntimeState;
  /** Timestamp of update */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Resource type */
  readonly type: Scalars['String']['output'];
};

/** Lifecycle state change event */
export type ResourceStateEvent = {
  /** Error message if state is ERROR */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Resource ID (ULID) */
  readonly id: Scalars['ID']['output'];
  /** New state */
  readonly newState: ResourceLifecycleState;
  /** Previous state */
  readonly previousState: ResourceLifecycleState;
  /** Timestamp of change */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Resource type */
  readonly type: Scalars['String']['output'];
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

/** Input for restarting a service instance. */
export type RestartInstanceInput = {
  /** Instance ID to restart */
  readonly instanceID: Scalars['ID']['input'];
  /** Router ID */
  readonly routerID: Scalars['ID']['input'];
};

export type RollbackChangeSetPayload = {
  /** The rolled back change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Items that failed to rollback */
  readonly failedItems?: Maybe<ReadonlyArray<Scalars['ID']['output']>>;
  /** Whether rollback was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Rollback operation type */
export const RollbackOperation = {
  /** Delete a created resource */
  Delete: 'DELETE',
  /** Restore a deleted resource */
  Restore: 'RESTORE',
  /** Revert an updated resource */
  Revert: 'REVERT'
} as const;

export type RollbackOperation = typeof RollbackOperation[keyof typeof RollbackOperation];
/** Rollback step for recovery */
export type RollbackStep = {
  /** Error message if failed */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Item ID being rolled back */
  readonly itemId: Scalars['ID']['output'];
  /** Rollback operation */
  readonly operation: RollbackOperation;
  /** Resource UUID on router */
  readonly resourceUuid?: Maybe<Scalars['ID']['output']>;
  /** State to restore */
  readonly restoreState?: Maybe<Scalars['JSON']['output']>;
  /** Order in rollback sequence */
  readonly rollbackOrder: Scalars['Int']['output'];
  /** Whether rollback succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Route type for static and dynamic routing */
export type Route = Node & {
  /** Whether the route is active */
  readonly active: Scalars['Boolean']['output'];
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Destination network in CIDR notation */
  readonly destination: Scalars['CIDR']['output'];
  /** Whether the route is disabled */
  readonly disabled?: Maybe<Scalars['Boolean']['output']>;
  /** Route distance/metric (1-255) */
  readonly distance: Scalars['Int']['output'];
  /** Gateway address */
  readonly gateway?: Maybe<Scalars['IPv4']['output']>;
  /** Route ID */
  readonly id: Scalars['ID']['output'];
  /** Interface used for this route */
  readonly interface?: Maybe<Scalars['String']['output']>;
  /** Routing mark for policy routing */
  readonly routingMark?: Maybe<Scalars['String']['output']>;
  /** Routing table name (main, vpn, etc.) */
  readonly routingTable?: Maybe<Scalars['String']['output']>;
  /** Route scope */
  readonly scope: RouteScope;
  /** Route type (static, connected, dynamic, BGP, OSPF) */
  readonly type: RouteType;
};

/** Result of a route deletion with impact analysis */
export type RouteDeleteResult = {
  /** Impact analysis for this route deletion */
  readonly impactAnalysis: RouteImpactAnalysis;
  /** Success or error message */
  readonly message?: Maybe<Scalars['String']['output']>;
  /** Whether the deletion succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Analysis of the impact of deleting a route */
export type RouteImpactAnalysis = {
  /** Description of affected traffic */
  readonly affectedTraffic: Scalars['String']['output'];
  /** List of consequences of deleting this route */
  readonly consequences: ReadonlyArray<Scalars['String']['output']>;
  /** Whether this is the default route (0.0.0.0/0) */
  readonly isDefaultRoute: Scalars['Boolean']['output'];
  /** Human-readable message about the impact */
  readonly message: Scalars['String']['output'];
  /** Severity of the deletion (CRITICAL for default route, STANDARD for others) */
  readonly severity: ConfirmationSeverity;
};

/** Input for creating or updating a route */
export type RouteInput = {
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Destination network in CIDR notation */
  readonly destination: Scalars['CIDR']['input'];
  /** Route distance/metric (1-255, default: 1) */
  readonly distance?: InputMaybe<Scalars['Int']['input']>;
  /** Gateway address (optional if interface is provided) */
  readonly gateway?: InputMaybe<Scalars['IPv4']['input']>;
  /** Interface used for this route (optional if gateway is provided) */
  readonly interface?: InputMaybe<Scalars['String']['input']>;
  /** Routing mark for policy routing */
  readonly routingMark?: InputMaybe<Scalars['String']['input']>;
  /** Routing table name (default: main) */
  readonly routingTable?: InputMaybe<Scalars['String']['input']>;
};

/** A candidate route that matches the destination */
export type RouteLookupCandidate = {
  /** Administrative distance */
  readonly distance: Scalars['Int']['output'];
  /** Prefix length (24 for /24, 8 for /8) */
  readonly prefixLength: Scalars['Int']['output'];
  /** The route object */
  readonly route: Route;
  /** Whether this route was selected */
  readonly selected: Scalars['Boolean']['output'];
  /** Reason for selection or non-selection */
  readonly selectionReason?: Maybe<Scalars['String']['output']>;
};

/** Result of a route lookup operation */
export type RouteLookupResult = {
  /** All candidate routes that match destination */
  readonly candidateRoutes: ReadonlyArray<RouteLookupCandidate>;
  /** Destination IP that was looked up */
  readonly destination: Scalars['String']['output'];
  /** Administrative distance of selected route */
  readonly distance?: Maybe<Scalars['Int']['output']>;
  /** Human-readable explanation of route selection */
  readonly explanation: Scalars['String']['output'];
  /** Gateway IP for the selected route */
  readonly gateway?: Maybe<Scalars['String']['output']>;
  /** Outgoing interface for the selected route */
  readonly interface?: Maybe<Scalars['String']['output']>;
  /** Whether this is the default route (0.0.0.0/0) */
  readonly isDefaultRoute: Scalars['Boolean']['output'];
  /** The selected route (null if no route found) */
  readonly matchedRoute?: Maybe<Route>;
  /** Route type (STATIC, CONNECTED, DYNAMIC, BGP, OSPF) */
  readonly routeType: RouteType;
  /** VPN tunnel info if route goes through VPN */
  readonly vpnTunnel?: Maybe<VpnTunnelInfo>;
};

/** Result of a route mutation (create, update) */
export type RouteMutationResult = {
  /** Success or error message */
  readonly message?: Maybe<Scalars['String']['output']>;
  /** The created or updated route (if successful) */
  readonly route?: Maybe<Route>;
  /** Whether the operation succeeded */
  readonly success: Scalars['Boolean']['output'];
};

/** Route resource */
export type RouteResource = Node & Resource & {
  /** Whether route is active */
  readonly active: Scalars['Boolean']['output'];
  readonly category: ResourceCategory;
  readonly configuration: Scalars['JSON']['output'];
  readonly deployment?: Maybe<DeploymentState>;
  /** Route distance/metric */
  readonly distance?: Maybe<Scalars['Int']['output']>;
  /** Destination network */
  readonly dstAddress: Scalars['CIDR']['output'];
  /** Gateway address */
  readonly gateway?: Maybe<Scalars['IPv4']['output']>;
  readonly id: Scalars['ID']['output'];
  /** Outgoing interface */
  readonly interface?: Maybe<Scalars['String']['output']>;
  readonly metadata: ResourceMetadata;
  readonly platform?: Maybe<PlatformInfo>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
};

/** Route scope */
export const RouteScope = {
  /** Global route (forwarded between interfaces) */
  Global: 'GLOBAL',
  /** Host-local route */
  Host: 'HOST',
  /** Link-local route (not forwarded) */
  Link: 'LINK'
} as const;

export type RouteScope = typeof RouteScope[keyof typeof RouteScope];
/** Route type classification */
export const RouteType = {
  /** BGP route */
  Bgp: 'BGP',
  /** Connected route (directly connected network) */
  Connected: 'CONNECTED',
  /** Dynamic route (learned via routing protocol) */
  Dynamic: 'DYNAMIC',
  /** OSPF route */
  Ospf: 'OSPF',
  /** Static route (manually configured) */
  Static: 'STATIC'
} as const;

export type RouteType = typeof RouteType[keyof typeof RouteType];
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

/** Result of running a diagnostic step */
export type RunTroubleshootStepPayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Updated step with result */
  readonly step: TroubleshootStep;
};

/** Runtime health status */
export const RuntimeHealth = {
  /** Resource is running but degraded */
  Degraded: 'DEGRADED',
  /** Resource has failed */
  Failed: 'FAILED',
  /** Resource is healthy and operating normally */
  Healthy: 'HEALTHY',
  /** Health status unknown */
  Unknown: 'UNKNOWN',
  /** Resource is running but with warnings */
  Warning: 'WARNING'
} as const;

export type RuntimeHealth = typeof RuntimeHealth[keyof typeof RuntimeHealth];
/** Resource-specific runtime metrics */
export type RuntimeMetrics = {
  /** Bytes received */
  readonly bytesIn?: Maybe<Scalars['Size']['output']>;
  /** Bytes transmitted */
  readonly bytesOut?: Maybe<Scalars['Size']['output']>;
  /** Resource-specific custom metrics */
  readonly custom?: Maybe<Scalars['JSON']['output']>;
  /** Drops count */
  readonly drops?: Maybe<Scalars['Int']['output']>;
  /** Error count */
  readonly errors?: Maybe<Scalars['Int']['output']>;
  /** Packets received */
  readonly packetsIn?: Maybe<Scalars['Int']['output']>;
  /** Packets transmitted */
  readonly packetsOut?: Maybe<Scalars['Int']['output']>;
  /** Current throughput in (bytes/sec) */
  readonly throughputIn?: Maybe<Scalars['Size']['output']>;
  /** Current throughput out (bytes/sec) */
  readonly throughputOut?: Maybe<Scalars['Size']['output']>;
};

/**
 * Layer 4: Live operational state polled/streamed from router.
 * Updated via polling (5-60s interval) or WebSocket push.
 */
export type RuntimeState = {
  /** Current peers/connections (for VPN, etc.) */
  readonly activeConnections?: Maybe<Scalars['Int']['output']>;
  /** Error message if resource is unhealthy */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Health status of the resource */
  readonly health: RuntimeHealth;
  /** Whether the resource is currently running/active */
  readonly isRunning: Scalars['Boolean']['output'];
  /** Time since last successful operation */
  readonly lastSuccessfulOperation?: Maybe<Scalars['DateTime']['output']>;
  /** Last time runtime was updated */
  readonly lastUpdated: Scalars['DateTime']['output'];
  /** Resource-specific runtime metrics */
  readonly metrics?: Maybe<RuntimeMetrics>;
  /** Resource uptime */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
};

/** Input for saving custom alert rule template */
export type SaveAlertRuleTemplateInput = {
  /** Template category */
  readonly category: AlertRuleTemplateCategory;
  /** Notification channels */
  readonly channels: ReadonlyArray<Scalars['String']['input']>;
  /** Alert conditions */
  readonly conditions: ReadonlyArray<AlertConditionInput>;
  /** Template description */
  readonly description: Scalars['String']['input'];
  /** Event type */
  readonly eventType: Scalars['String']['input'];
  /** Template name */
  readonly name: Scalars['String']['input'];
  /** Alert severity */
  readonly severity: AlertSeverity;
  /** Throttle configuration */
  readonly throttle?: InputMaybe<ThrottleConfigInput>;
  /** Template variables */
  readonly variables?: InputMaybe<ReadonlyArray<AlertRuleAlertTemplateVariableInput>>;
};

/** Input for saving a custom alert template */
export type SaveAlertTemplateInput = {
  /** Body template */
  readonly bodyTemplate: Scalars['String']['input'];
  /** Notification channel */
  readonly channel: NotificationChannel;
  /** Template description */
  readonly description: Scalars['String']['input'];
  /** Event type */
  readonly eventType: Scalars['String']['input'];
  /** Metadata */
  readonly metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** Template name */
  readonly name: Scalars['String']['input'];
  /** Subject template */
  readonly subjectTemplate?: InputMaybe<Scalars['String']['input']>;
  /** Tags */
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  /** Template variables */
  readonly variables: ReadonlyArray<AlertAlertTemplateVariableInput>;
};

/** Input for saving a custom template. */
export type SaveTemplateInput = {
  /** Category */
  readonly category: TemplateCategory;
  /** Template description */
  readonly description: Scalars['String']['input'];
  /** Template name */
  readonly name: Scalars['String']['input'];
  /** Rule definitions */
  readonly rules: ReadonlyArray<TemplateRuleInput>;
  /** Variable definitions */
  readonly variables: ReadonlyArray<FirewallTemplateVariableInput>;
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

/**
 * Service instance running on a router.
 * Represents an installed and potentially running service instance.
 */
export type ServiceInstance = Node & {
  /** SHA256 checksum of the binary */
  readonly binaryChecksum?: Maybe<Scalars['String']['output']>;
  /** Path to the service binary */
  readonly binaryPath?: Maybe<Scalars['String']['output']>;
  /** Version of the service binary */
  readonly binaryVersion?: Maybe<Scalars['String']['output']>;
  /** IP address to bind the service to */
  readonly bindIP?: Maybe<Scalars['String']['output']>;
  /** Service-specific configuration (JSON) */
  readonly config?: Maybe<Scalars['JSON']['output']>;
  /** When the instance was created */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Feature identifier (e.g., 'tor', 'sing-box') */
  readonly featureID: Scalars['String']['output'];
  /** Instance ID (ULID) */
  readonly id: Scalars['ID']['output'];
  /** Human-readable instance name */
  readonly instanceName: Scalars['String']['output'];
  /** Ports used by this service instance */
  readonly ports: ReadonlyArray<Scalars['Int']['output']>;
  /** The router this instance belongs to */
  readonly router?: Maybe<Router>;
  /** Router ID this instance belongs to */
  readonly routerID: Scalars['String']['output'];
  /** Current lifecycle status */
  readonly status: ServiceStatus;
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** VLAN ID for network isolation */
  readonly vlanID?: Maybe<Scalars['Int']['output']>;
};

/** Payload for service instance mutations. */
export type ServiceInstancePayload = {
  /** Mutation errors */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The service instance (null if operation failed) */
  readonly instance?: Maybe<ServiceInstance>;
};

/** Service instance lifecycle status. */
export const ServiceStatus = {
  /** Service is operational with degraded performance */
  Degraded: 'DEGRADED',
  /** Instance is being deleted */
  Deleting: 'DELETING',
  /** Operation failed */
  Failed: 'FAILED',
  /** Service is fully operational */
  Healthy: 'HEALTHY',
  /** Binary installed, ready to start */
  Installed: 'INSTALLED',
  /** Binary is being downloaded and installed */
  Installing: 'INSTALLING',
  /** Process is running */
  Running: 'RUNNING',
  /** Process is starting */
  Starting: 'STARTING',
  /** Process is stopped */
  Stopped: 'STOPPED',
  /** Process is stopping */
  Stopping: 'STOPPING',
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

/** Input for starting a service instance. */
export type StartInstanceInput = {
  /** Instance ID to start */
  readonly instanceID: Scalars['ID']['input'];
  /** Router ID */
  readonly routerID: Scalars['ID']['input'];
};

/** Result of starting a troubleshooting session */
export type StartTroubleshootPayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The created session */
  readonly session?: Maybe<TroubleshootSession>;
};

/** Static IP WAN configuration */
export type StaticIpConfig = Node & {
  /** Static IP address with CIDR */
  readonly address: Scalars['CIDR']['output'];
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Gateway IP address */
  readonly gateway: Scalars['IPv4']['output'];
  /** Unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Interface name */
  readonly interface: Scalars['String']['output'];
  /** Primary DNS server */
  readonly primaryDNS?: Maybe<Scalars['IPv4']['output']>;
  /** Secondary DNS server */
  readonly secondaryDNS?: Maybe<Scalars['IPv4']['output']>;
};

/** Input for configuring static IP WAN */
export type StaticIpInput = {
  /** Static IP address with CIDR (e.g., 203.0.113.5/30) */
  readonly address: Scalars['CIDR']['input'];
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Gateway IP address */
  readonly gateway: Scalars['IPv4']['input'];
  /** Interface to configure */
  readonly interface: Scalars['String']['input'];
  /** Primary DNS server */
  readonly primaryDNS?: InputMaybe<Scalars['IPv4']['input']>;
  /** Secondary DNS server */
  readonly secondaryDNS?: InputMaybe<Scalars['IPv4']['input']>;
};

/** A single data point in interface statistics history */
export type StatsDataPoint = {
  /** Receive rate in bytes per second */
  readonly rxBytesPerSec: Scalars['Float']['output'];
  /** Receive errors in this interval */
  readonly rxErrors: Scalars['Int']['output'];
  /** Receive rate in packets per second */
  readonly rxPacketsPerSec: Scalars['Float']['output'];
  /** Timestamp of the data point */
  readonly timestamp: Scalars['DateTime']['output'];
  /** Transmit rate in bytes per second */
  readonly txBytesPerSec: Scalars['Float']['output'];
  /** Transmission errors in this interval */
  readonly txErrors: Scalars['Int']['output'];
  /** Transmit rate in packets per second */
  readonly txPacketsPerSec: Scalars['Float']['output'];
};

/** Input for specifying a time range */
export type StatsTimeRangeInput = {
  /** End of the time range */
  readonly end: Scalars['DateTime']['input'];
  /** Start of the time range */
  readonly start: Scalars['DateTime']['input'];
};

/** Input for stopping a service instance. */
export type StopInstanceInput = {
  /** Instance ID to stop */
  readonly instanceID: Scalars['ID']['input'];
  /** Router ID */
  readonly routerID: Scalars['ID']['input'];
};

/** Storage utilization metrics */
export type StorageMetrics = {
  /** Storage usage percentage (0-100) */
  readonly percentage: Scalars['Float']['output'];
  /** Total storage in bytes */
  readonly total: Scalars['Float']['output'];
  /** Used storage in bytes */
  readonly used: Scalars['Float']['output'];
};

/** Alert rule contribution to storm detection */
export type StormRuleContribution = {
  /** Number of alerts from this rule in current window */
  readonly alertCount: Scalars['Int']['output'];
  /** Percentage of total alerts */
  readonly percentage: Scalars['Float']['output'];
  /** Alert rule ID */
  readonly ruleId: Scalars['ID']['output'];
  /** Alert rule name */
  readonly ruleName: Scalars['String']['output'];
};

/**
 * Storm detection status
 * Shows if alert storm is detected and current metrics
 */
export type StormStatus = {
  /** Number of alerts in current window */
  readonly alertCount: Scalars['Int']['output'];
  /** Whether storm is currently detected */
  readonly isStormDetected: Scalars['Boolean']['output'];
  /** When storm detection started */
  readonly stormStartedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Storm detection threshold */
  readonly threshold: Scalars['Int']['output'];
  /** Top alert rules contributing to the storm */
  readonly topRules: ReadonlyArray<StormRuleContribution>;
  /** When current window ends */
  readonly windowEnd: Scalars['DateTime']['output'];
  /** Window duration in seconds */
  readonly windowSeconds: Scalars['Int']['output'];
  /** When current window started */
  readonly windowStart: Scalars['DateTime']['output'];
};

export const StpPortRole = {
  Alternate: 'ALTERNATE',
  Backup: 'BACKUP',
  Designated: 'DESIGNATED',
  Disabled: 'DISABLED',
  Root: 'ROOT'
} as const;

export type StpPortRole = typeof StpPortRole[keyof typeof StpPortRole];
export const StpPortState = {
  Blocking: 'BLOCKING',
  Disabled: 'DISABLED',
  Forwarding: 'FORWARDING',
  Learning: 'LEARNING',
  Listening: 'LISTENING'
} as const;

export type StpPortState = typeof StpPortState[keyof typeof StpPortState];
export const StpProtocol = {
  Mstp: 'MSTP',
  None: 'NONE',
  Rstp: 'RSTP',
  Stp: 'STP'
} as const;

export type StpProtocol = typeof StpProtocol[keyof typeof StpProtocol];
export type Subscription = {
  /** Subscribe to alert events for real-time updates */
  readonly alertEvents: AlertEvent;
  /** Subscribe to bridge port changes */
  readonly bridgePortsChanged: ReadonlyArray<BridgePort>;
  /** Subscribe to STP status changes for a bridge */
  readonly bridgeStpStatusChanged: BridgeStpStatus;
  /** Subscribe to change set application progress */
  readonly changeSetProgress: ChangeSetProgressEvent;
  /** Subscribe to change set status changes */
  readonly changeSetStatusChanged: ChangeSetStatusEvent;
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
  /**
   * Subscribe to installation progress events for a router.
   * Emits progress updates during binary download and installation.
   */
  readonly installProgress: InstallProgress;
  /**
   * Subscribe to instance status changes for a router.
   * Emits events when any instance changes state.
   */
  readonly instanceStatusChanged: InstanceStatusChanged;
  /** Subscribe to real-time interface statistics updates */
  readonly interfaceStatsUpdated: InterfaceStats;
  /** Subscribe to interface status changes for real-time updates */
  readonly interfaceStatusChanged: InterfaceStatusEvent;
  /** Subscribe to interface traffic updates */
  readonly interfaceTraffic: InterfaceTrafficEvent;
  /** Subscribe to IP address changes (create, update, delete) */
  readonly ipAddressChanged: IpAddressChangeEvent;
  /** Subscribe to port mirror status changes */
  readonly portMirrorChanged: PortMirror;
  /** Subscribe to real-time resource metrics updates */
  readonly resourceMetrics: ResourceMetrics;
  /** Subscribe to resource runtime updates */
  readonly resourceRuntime: ResourceRuntimeEvent;
  /** Subscribe to resource lifecycle state changes */
  readonly resourceStateChanged: ResourceStateEvent;
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
  /**
   * Subscribe to traceroute progress updates.
   * Emits an event for each hop discovered and when traceroute completes.
   */
  readonly tracerouteProgress: TracerouteProgressEvent;
  /**
   * Subscribe to troubleshooting session progress.
   * Emits events as steps are executed, fixes are applied, and results are updated.
   */
  readonly troubleshootProgress: TroubleshootSession;
  /** Subscribe to tunnel status changes (create, update, delete) */
  readonly tunnelChanged: Tunnel;
  /** Subscribe to VLAN interface changes (create, update, delete) */
  readonly vlanChanged: Vlan;
  /** Subscribe to WAN health check updates */
  readonly wanHealthChanged: WanHealthStatus;
  /** Subscribe to WAN status changes */
  readonly wanStatusChanged: WanInterface;
};


export type SubscriptionAlertEventsArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionBridgePortsChangedArgs = {
  bridgeId: Scalars['ID']['input'];
};


export type SubscriptionBridgeStpStatusChangedArgs = {
  bridgeId: Scalars['ID']['input'];
};


export type SubscriptionChangeSetProgressArgs = {
  changeSetId: Scalars['ID']['input'];
};


export type SubscriptionChangeSetStatusChangedArgs = {
  routerId: Scalars['ID']['input'];
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


export type SubscriptionInstallProgressArgs = {
  routerID: Scalars['ID']['input'];
};


export type SubscriptionInstanceStatusChangedArgs = {
  routerID: Scalars['ID']['input'];
};


export type SubscriptionInterfaceStatsUpdatedArgs = {
  interfaceId: Scalars['ID']['input'];
  interval?: InputMaybe<Scalars['Duration']['input']>;
  routerId: Scalars['ID']['input'];
};


export type SubscriptionInterfaceStatusChangedArgs = {
  interfaceId?: InputMaybe<Scalars['ID']['input']>;
  routerId: Scalars['ID']['input'];
};


export type SubscriptionInterfaceTrafficArgs = {
  interfaceId?: InputMaybe<Scalars['ID']['input']>;
  routerId: Scalars['ID']['input'];
};


export type SubscriptionIpAddressChangedArgs = {
  routerId: Scalars['ID']['input'];
};


export type SubscriptionPortMirrorChangedArgs = {
  routerId: Scalars['ID']['input'];
};


export type SubscriptionResourceMetricsArgs = {
  deviceId: Scalars['ID']['input'];
};


export type SubscriptionResourceRuntimeArgs = {
  id: Scalars['ID']['input'];
  routerId: Scalars['ID']['input'];
};


export type SubscriptionResourceStateChangedArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
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


export type SubscriptionTracerouteProgressArgs = {
  jobId: Scalars['ID']['input'];
};


export type SubscriptionTroubleshootProgressArgs = {
  sessionId: Scalars['ID']['input'];
};


export type SubscriptionTunnelChangedArgs = {
  routerId: Scalars['ID']['input'];
};


export type SubscriptionVlanChangedArgs = {
  routerId: Scalars['ID']['input'];
};


export type SubscriptionWanHealthChangedArgs = {
  routerId: Scalars['ID']['input'];
  wanInterfaceId: Scalars['ID']['input'];
};


export type SubscriptionWanStatusChangedArgs = {
  routerId: Scalars['ID']['input'];
  wanInterfaceId?: InputMaybe<Scalars['ID']['input']>;
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

/**
 * Layer 5: Time-series metrics and historical data.
 * Collected over time for analytics and trending.
 */
export type TelemetryData = {
  /** Bandwidth history (last 24h) */
  readonly bandwidthHistory?: Maybe<ReadonlyArray<BandwidthDataPoint>>;
  /** Daily statistics */
  readonly dailyStats?: Maybe<ReadonlyArray<DailyStats>>;
  /** First data point timestamp */
  readonly dataStartedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Hourly statistics */
  readonly hourlyStats?: Maybe<ReadonlyArray<HourlyStats>>;
  /** Last data point timestamp */
  readonly lastUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Data retention period */
  readonly retentionDays: Scalars['Int']['output'];
  /** Uptime history (availability) */
  readonly uptimeHistory?: Maybe<ReadonlyArray<UptimeDataPoint>>;
};

/** Template categories for organization. */
export const TemplateCategory = {
  /** Basic security rules */
  Basic: 'BASIC',
  /** User-created custom templates */
  Custom: 'CUSTOM',
  /** Gaming-optimized rules */
  Gaming: 'GAMING',
  /** Guest network access */
  Guest: 'GUEST',
  /** Home network configurations */
  Home: 'HOME',
  /** IoT device isolation */
  Iot: 'IOT'
} as const;

export type TemplateCategory = typeof TemplateCategory[keyof typeof TemplateCategory];
/** Template complexity levels. */
export const TemplateComplexity = {
  /** Advanced templates with many rules */
  Advanced: 'ADVANCED',
  /** Moderate complexity */
  Moderate: 'MODERATE',
  /** Simple templates with few rules */
  Simple: 'SIMPLE'
} as const;

export type TemplateComplexity = typeof TemplateComplexity[keyof typeof TemplateComplexity];
/** Detected conflict between template and existing configuration. */
export type TemplateConflict = {
  /** Existing rule ID that conflicts (if applicable) */
  readonly existingRuleId?: Maybe<Scalars['ID']['output']>;
  /** Human-readable conflict description */
  readonly message: Scalars['String']['output'];
  /** Proposed template rule that conflicts */
  readonly proposedRule: TemplateRule;
  /** Type of conflict */
  readonly type: TemplateConflictType;
};

/** Conflict types between template and existing configuration. */
export const TemplateConflictType = {
  /** Chain configuration conflicts */
  ChainConflict: 'CHAIN_CONFLICT',
  /** Duplicate rule already exists */
  DuplicateRule: 'DUPLICATE_RULE',
  /** IP address range overlaps */
  IpOverlap: 'IP_OVERLAP',
  /** Position conflict in chain */
  PositionConflict: 'POSITION_CONFLICT'
} as const;

export type TemplateConflictType = typeof TemplateConflictType[keyof typeof TemplateConflictType];
/** Template preview result */
export type TemplatePreview = {
  /** Rendered body after variable substitution */
  readonly renderedBody: Scalars['String']['output'];
  /** Rendered subject after variable substitution */
  readonly renderedSubject: Scalars['String']['output'];
  /** The template that was previewed */
  readonly template: AlertTemplate;
  /** Validation information */
  readonly validationInfo: TemplateValidationInfo;
  /** Variables used in preview */
  readonly variables: Scalars['JSON']['output'];
};

/** Template preview payload */
export type TemplatePreviewPayload = {
  /** Errors encountered during preview */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Preview result */
  readonly preview?: Maybe<TemplatePreview>;
};

/**
 * Result of template preview operation.
 * Shows what will happen when template is applied.
 */
export type TemplatePreviewResult = {
  /** Detected conflicts with existing rules */
  readonly conflicts: ReadonlyArray<TemplateConflict>;
  /** Impact analysis */
  readonly impactAnalysis: ImpactAnalysis;
  /** Rules with variables resolved */
  readonly resolvedRules: ReadonlyArray<TemplateRule>;
  /** The template being previewed */
  readonly template: FirewallTemplate;
};

/**
 * Template rule definition.
 * Represents a firewall rule that will be created when template is applied.
 */
export type TemplateRule = {
  /** Action to perform */
  readonly action: Scalars['String']['output'];
  /** Chain name */
  readonly chain: Scalars['String']['output'];
  /** Optional comment (can include template metadata) */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Position in the chain (null = append to end) */
  readonly position?: Maybe<Scalars['Int']['output']>;
  /** Rule properties as JSON (can include variable references like {{LAN_INTERFACE}}) */
  readonly properties: Scalars['JSON']['output'];
  /** Firewall table (filter, nat, mangle, raw) */
  readonly table: FirewallTable;
};

/** Input for defining a template rule. */
export type TemplateRuleInput = {
  /** Action */
  readonly action: Scalars['String']['input'];
  /** Chain name */
  readonly chain: Scalars['String']['input'];
  /** Comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Position */
  readonly position?: InputMaybe<Scalars['Int']['input']>;
  /** Rule properties as JSON */
  readonly properties: Scalars['JSON']['input'];
  /** Firewall table */
  readonly table: FirewallTable;
};

/** Template validation information */
export type TemplateValidationInfo = {
  /** Whether the template is valid with provided variables */
  readonly isValid: Scalars['Boolean']['output'];
  /** Missing required variables */
  readonly missingVariables: ReadonlyArray<Scalars['String']['output']>;
  /** Validation warnings */
  readonly warnings: ReadonlyArray<Scalars['String']['output']>;
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

/** Test notification payload */
export type TestNotificationPayload = {
  /** Errors encountered during test */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Test result message */
  readonly message?: Maybe<Scalars['String']['output']>;
  /** Whether test was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Result of test port knock operation. */
export type TestPortKnockResult = {
  /** Message */
  readonly message: Scalars['String']['output'];
  /** Whether test rules were created successfully */
  readonly success: Scalars['Boolean']['output'];
  /** Test instructions for user */
  readonly testInstructions: Scalars['String']['output'];
  /** Test rule IDs (will auto-expire) */
  readonly testRuleIds: ReadonlyArray<Scalars['ID']['output']>;
};

/** Throttle configuration to prevent alert spam */
export type ThrottleConfig = {
  /** Optional field to group alerts by */
  readonly groupByField?: Maybe<Scalars['String']['output']>;
  /** Maximum number of alerts allowed */
  readonly maxAlerts: Scalars['Int']['output'];
  /** Time period in seconds */
  readonly periodSeconds: Scalars['Int']['output'];
};

/** Throttle configuration input */
export type ThrottleConfigInput = {
  /** Optional field to group alerts by */
  readonly groupByField?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of alerts allowed */
  readonly maxAlerts: Scalars['Int']['input'];
  /** Time period in seconds */
  readonly periodSeconds: Scalars['Int']['input'];
};

/** Throttle status for a specific group (when groupByField is used) */
export type ThrottleGroupStatus = {
  /** Group identifier (value of groupByField) */
  readonly groupKey: Scalars['String']['output'];
  /** Whether this group is currently throttled */
  readonly isThrottled: Scalars['Boolean']['output'];
  /** Number of alerts suppressed for this group */
  readonly suppressedCount: Scalars['Int']['output'];
  /** When the throttle window for this group ends */
  readonly windowEnd: Scalars['DateTime']['output'];
  /** When the throttle window for this group started */
  readonly windowStart: Scalars['DateTime']['output'];
};

/**
 * Throttle status for an alert rule
 * Shows current throttling state and suppressed alert counts
 */
export type ThrottleStatus = {
  /** Throttle groups (if groupByField is configured) */
  readonly groups: ReadonlyArray<ThrottleGroupStatus>;
  /** Whether the rule is currently throttled */
  readonly isThrottled: Scalars['Boolean']['output'];
  /** Alert rule ID */
  readonly ruleId: Scalars['ID']['output'];
  /** Number of alerts suppressed in current throttle window */
  readonly suppressedCount: Scalars['Int']['output'];
  /** When the current throttle window ends */
  readonly windowEnd?: Maybe<Scalars['DateTime']['output']>;
  /** When the current throttle window started */
  readonly windowStart?: Maybe<Scalars['DateTime']['output']>;
};

/** Edge connecting nodes in a topology */
export type TopologyEdge = {
  /** Additional edge data */
  readonly data?: Maybe<Scalars['JSON']['output']>;
  /** Edge ID */
  readonly id: Scalars['ID']['output'];
  /** Edge label (optional) */
  readonly label?: Maybe<Scalars['String']['output']>;
  /** Source node ID */
  readonly source: Scalars['ID']['output'];
  /** Edge styling */
  readonly style?: Maybe<TopologyEdgeStyle>;
  /** Target node ID */
  readonly target: Scalars['ID']['output'];
};

/** Styling for topology edges */
export type TopologyEdgeStyle = {
  /** Stroke color (CSS color) */
  readonly stroke?: Maybe<Scalars['String']['output']>;
  /** Stroke dash array (for dashed lines) */
  readonly strokeDasharray?: Maybe<Scalars['String']['output']>;
  /** Stroke width in pixels */
  readonly strokeWidth?: Maybe<Scalars['Float']['output']>;
};

/** Node in a VLAN network topology diagram */
export type TopologyNode = {
  /** Additional node data */
  readonly data?: Maybe<Scalars['JSON']['output']>;
  /** Node ID */
  readonly id: Scalars['ID']['output'];
  /** Display label */
  readonly label: Scalars['String']['output'];
  /** Node position in the diagram */
  readonly position: TopologyPosition;
  /** Node styling */
  readonly style?: Maybe<TopologyNodeStyle>;
  /** Sub-label (optional) */
  readonly sublabel?: Maybe<Scalars['String']['output']>;
  /** Node type (bridge, vlan, port) */
  readonly type: TopologyNodeType;
};

/** Styling for topology nodes */
export type TopologyNodeStyle = {
  /** Fill color (CSS color) */
  readonly fill?: Maybe<Scalars['String']['output']>;
  /** Stroke color (CSS color) */
  readonly stroke?: Maybe<Scalars['String']['output']>;
  /** Stroke width in pixels */
  readonly strokeWidth?: Maybe<Scalars['Float']['output']>;
};

/** Type of topology node */
export const TopologyNodeType = {
  /** Bridge interface */
  Bridge: 'BRIDGE',
  /** Physical port */
  Port: 'PORT',
  /** VLAN interface */
  Vlan: 'VLAN'
} as const;

export type TopologyNodeType = typeof TopologyNodeType[keyof typeof TopologyNodeType];
/** Position of a node in the topology */
export type TopologyPosition = {
  /** X coordinate */
  readonly x: Scalars['Float']['output'];
  /** Y coordinate */
  readonly y: Scalars['Float']['output'];
};

/** Event type for traceroute progress updates */
export const TracerouteEventType = {
  /** Traceroute was cancelled */
  Cancelled: 'CANCELLED',
  /** Traceroute completed */
  Complete: 'COMPLETE',
  /** Traceroute encountered an error */
  Error: 'ERROR',
  /** A new hop was discovered */
  HopDiscovered: 'HOP_DISCOVERED'
} as const;

export type TracerouteEventType = typeof TracerouteEventType[keyof typeof TracerouteEventType];
/** A single hop in the traceroute path */
export type TracerouteHop = {
  /** IP address of the hop (null for timeout) */
  readonly address?: Maybe<Scalars['String']['output']>;
  /** Average latency across successful probes */
  readonly avgLatencyMs?: Maybe<Scalars['Float']['output']>;
  /** Hop number (1-based) */
  readonly hopNumber: Scalars['Int']['output'];
  /** Reverse DNS hostname (if available) */
  readonly hostname?: Maybe<Scalars['String']['output']>;
  /** Packet loss percentage for this hop (0-100) */
  readonly packetLoss: Scalars['Float']['output'];
  /** Individual probe results for this hop */
  readonly probes: ReadonlyArray<HopProbe>;
  /** Status of this hop */
  readonly status: HopStatus;
};

/** Input parameters for starting a traceroute */
export type TracerouteInput = {
  /** Maximum number of hops (default: 30, max: 64) */
  readonly maxHops?: InputMaybe<Scalars['Int']['input']>;
  /** Number of probes per hop (default: 3) */
  readonly probeCount?: InputMaybe<Scalars['Int']['input']>;
  /** Protocol to use for probes (default: ICMP) */
  readonly protocol?: InputMaybe<TracerouteProtocol>;
  /** Target hostname or IP address */
  readonly target: Scalars['String']['input'];
  /** Timeout per hop in milliseconds (default: 3000) */
  readonly timeout?: InputMaybe<Scalars['Int']['input']>;
};

/** Traceroute job reference for subscription tracking */
export type TracerouteJob = {
  /** Unique job identifier */
  readonly jobId: Scalars['ID']['output'];
  /** Current job status */
  readonly status: JobStatus;
};

/** Progress event emitted during traceroute execution */
export type TracerouteProgressEvent = {
  /** Error message (for ERROR events) */
  readonly error?: Maybe<Scalars['String']['output']>;
  /** Type of event */
  readonly eventType: TracerouteEventType;
  /** Newly discovered hop (for HOP_DISCOVERED events) */
  readonly hop?: Maybe<TracerouteHop>;
  /** Job identifier */
  readonly jobId: Scalars['ID']['output'];
  /** Final result (for COMPLETE events) */
  readonly result?: Maybe<TracerouteResult>;
};

/** Protocol to use for traceroute probes */
export const TracerouteProtocol = {
  /** ICMP echo request (default) */
  Icmp: 'ICMP',
  /** TCP SYN probes */
  Tcp: 'TCP',
  /** UDP probes */
  Udp: 'UDP'
} as const;

export type TracerouteProtocol = typeof TracerouteProtocol[keyof typeof TracerouteProtocol];
/** Complete traceroute result */
export type TracerouteResult = {
  /** Whether traceroute completed */
  readonly completed: Scalars['Boolean']['output'];
  /** When the traceroute completed (if finished) */
  readonly completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Discovered hops in order */
  readonly hops: ReadonlyArray<TracerouteHop>;
  /** Maximum hops configured */
  readonly maxHops: Scalars['Int']['output'];
  /** Protocol used for probes */
  readonly protocol: TracerouteProtocol;
  /** Whether destination was reached */
  readonly reachedDestination: Scalars['Boolean']['output'];
  /** When the traceroute started */
  readonly startedAt: Scalars['DateTime']['output'];
  /** Target hostname or IP address */
  readonly target: Scalars['String']['output'];
  /** Resolved target IP address */
  readonly targetIp: Scalars['String']['output'];
  /** Total time from start to completion (ms) */
  readonly totalTimeMs: Scalars['Float']['output'];
};

/** Transport protocol enum for network traffic. */
export const TransportProtocol = {
  Tcp: 'TCP',
  Udp: 'UDP'
} as const;

export type TransportProtocol = typeof TransportProtocol[keyof typeof TransportProtocol];
/** Suggested fix for a failed diagnostic step */
export type TroubleshootFixSuggestion = {
  /** RouterOS command that will be executed */
  readonly command?: Maybe<Scalars['String']['output']>;
  /** Confidence level for this fix */
  readonly confidence: FixConfidence;
  /** Detailed explanation of what will be fixed */
  readonly explanation: Scalars['String']['output'];
  /** Whether this is a manual fix (requires user action) */
  readonly isManualFix: Scalars['Boolean']['output'];
  /** Unique issue code (e.g., WAN_DISABLED, NO_DEFAULT_ROUTE) */
  readonly issueCode: Scalars['String']['output'];
  /** Manual steps if this cannot be automated */
  readonly manualSteps?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  /** Whether user confirmation is required before applying */
  readonly requiresConfirmation: Scalars['Boolean']['output'];
  /** Rollback command if fix needs to be reverted */
  readonly rollbackCommand?: Maybe<Scalars['String']['output']>;
  /** User-friendly fix title */
  readonly title: Scalars['String']['output'];
};

/** Complete troubleshooting session */
export type TroubleshootSession = {
  /** Fixes that have been applied */
  readonly appliedFixes: ReadonlyArray<Scalars['String']['output']>;
  /** When the session completed */
  readonly completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Current step index (0-based) */
  readonly currentStepIndex: Scalars['Int']['output'];
  /** Detected default gateway IP */
  readonly gateway?: Maybe<Scalars['String']['output']>;
  /** Unique session identifier */
  readonly id: Scalars['ID']['output'];
  /** Detected ISP information */
  readonly ispInfo?: Maybe<IspInfo>;
  /** Router being diagnosed */
  readonly routerId: Scalars['ID']['output'];
  /** When the session started */
  readonly startedAt: Scalars['DateTime']['output'];
  /** Overall session status */
  readonly status: TroubleshootSessionStatus;
  /** All diagnostic steps */
  readonly steps: ReadonlyArray<TroubleshootStep>;
  /** Detected WAN interface name */
  readonly wanInterface?: Maybe<Scalars['String']['output']>;
};

/** Overall status of a troubleshooting session */
export const TroubleshootSessionStatus = {
  /** Applying a fix */
  ApplyingFix: 'APPLYING_FIX',
  /** Waiting for user decision on fix */
  AwaitingFixDecision: 'AWAITING_FIX_DECISION',
  /** Session was cancelled */
  Cancelled: 'CANCELLED',
  /** Session completed */
  Completed: 'COMPLETED',
  /** Session created but not started */
  Idle: 'IDLE',
  /** Detecting network configuration */
  Initializing: 'INITIALIZING',
  /** Running diagnostic steps */
  Running: 'RUNNING',
  /** Verifying fix worked */
  VerifyingFix: 'VERIFYING_FIX'
} as const;

export type TroubleshootSessionStatus = typeof TroubleshootSessionStatus[keyof typeof TroubleshootSessionStatus];
/** A single step in the troubleshooting wizard */
export type TroubleshootStep = {
  /** When the step completed */
  readonly completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Step description */
  readonly description: Scalars['String']['output'];
  /** Suggested fix if step failed */
  readonly fix?: Maybe<TroubleshootFixSuggestion>;
  /** Step type/ID */
  readonly id: TroubleshootStepType;
  /** Step display name */
  readonly name: Scalars['String']['output'];
  /** Result of executing this step */
  readonly result?: Maybe<TroubleshootStepResult>;
  /** When the step started */
  readonly startedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Current status of this step */
  readonly status: TroubleshootStepStatus;
};

/** Result of a single diagnostic step */
export type TroubleshootStepResult = {
  /** Technical details for debugging */
  readonly details?: Maybe<Scalars['String']['output']>;
  /** Execution time in milliseconds */
  readonly executionTimeMs: Scalars['Int']['output'];
  /** Detected error code */
  readonly issueCode?: Maybe<Scalars['String']['output']>;
  /** User-friendly message about the result */
  readonly message: Scalars['String']['output'];
  /** Whether the check passed */
  readonly success: Scalars['Boolean']['output'];
  /** Target that was checked (IP, interface name, etc.) */
  readonly target?: Maybe<Scalars['String']['output']>;
};

/** Status of a diagnostic step */
export const TroubleshootStepStatus = {
  /** Step failed */
  Failed: 'FAILED',
  /** Step completed successfully */
  Passed: 'PASSED',
  /** Step not yet started */
  Pending: 'PENDING',
  /** Step currently executing */
  Running: 'RUNNING',
  /** Step skipped */
  Skipped: 'SKIPPED'
} as const;

export type TroubleshootStepStatus = typeof TroubleshootStepStatus[keyof typeof TroubleshootStepStatus];
/** Diagnostic step identifier for internet troubleshooting */
export const TroubleshootStepType = {
  /** Test DNS resolution */
  Dns: 'DNS',
  /** Ping default gateway */
  Gateway: 'GATEWAY',
  /** Ping external internet server */
  Internet: 'INTERNET',
  /** Verify NAT/masquerade rules */
  Nat: 'NAT',
  /** Check WAN interface status */
  Wan: 'WAN'
} as const;

export type TroubleshootStepType = typeof TroubleshootStepType[keyof typeof TroubleshootStepType];
/** A network tunnel interface for connecting remote networks */
export type Tunnel = Node & {
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether the tunnel is disabled */
  readonly disabled?: Maybe<Scalars['Boolean']['output']>;
  /** Unique tunnel identifier */
  readonly id: Scalars['ID']['output'];
  /** IPsec profile name (GRE tunnels only) */
  readonly ipsecProfile?: Maybe<Scalars['String']['output']>;
  /** Local endpoint IP address */
  readonly localAddress: Scalars['String']['output'];
  /** MTU setting for the tunnel interface */
  readonly mtu?: Maybe<Scalars['Int']['output']>;
  /** Tunnel interface name */
  readonly name: Scalars['String']['output'];
  /** VXLAN port (default 4789) */
  readonly port?: Maybe<Scalars['Int']['output']>;
  /** Remote endpoint IP address */
  readonly remoteAddress: Scalars['String']['output'];
  /** Traffic statistics for this tunnel */
  readonly statistics?: Maybe<InterfaceStats>;
  /** Operational status of the tunnel */
  readonly status: InterfaceStatus;
  /** Tunnel ID (EoIP tunnels only, must be unique per remote address pair) */
  readonly tunnelId?: Maybe<Scalars['Int']['output']>;
  /** Tunnel protocol type */
  readonly type: TunnelType;
  /** VXLAN Network Identifier (VXLAN tunnels only) */
  readonly vni?: Maybe<Scalars['Int']['output']>;
  /** VTEP peer addresses (VXLAN tunnels only) */
  readonly vtepPeers?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
};

/** Input for creating or updating a tunnel */
export type TunnelInput = {
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** IPsec profile name (GRE tunnels only) */
  readonly ipsecProfile?: InputMaybe<Scalars['String']['input']>;
  /** Local endpoint IP address */
  readonly localAddress: Scalars['String']['input'];
  /** MTU setting (optional, default calculated based on tunnel type) */
  readonly mtu?: InputMaybe<Scalars['Int']['input']>;
  /** Tunnel interface name (alphanumeric, hyphens, underscores) */
  readonly name: Scalars['String']['input'];
  /** VXLAN port (default 4789) */
  readonly port?: InputMaybe<Scalars['Int']['input']>;
  /** Remote endpoint IP address */
  readonly remoteAddress: Scalars['String']['input'];
  /** Tunnel ID (EoIP tunnels only, 0-65535) */
  readonly tunnelId?: InputMaybe<Scalars['Int']['input']>;
  /** Tunnel protocol type */
  readonly type: TunnelType;
  /** VXLAN Network Identifier (VXLAN tunnels only, 1-16777215) */
  readonly vni?: InputMaybe<Scalars['Int']['input']>;
  /** VTEP peer addresses (VXLAN tunnels only) */
  readonly vtepPeers?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
};

/** Result of a tunnel mutation (create, update) */
export type TunnelMutationResult = {
  /** Errors that occurred during the operation */
  readonly errors: ReadonlyArray<Scalars['String']['output']>;
  /** MTU guidance for the tunnel type */
  readonly mtuGuidance?: Maybe<MtuGuidance>;
  /** Configuration preview (RouterOS commands) */
  readonly preview?: Maybe<Scalars['String']['output']>;
  /** Whether the operation succeeded */
  readonly success: Scalars['Boolean']['output'];
  /** The created or updated tunnel (if successful) */
  readonly tunnel?: Maybe<Tunnel>;
};

/** Status of a VPN tunnel */
export const TunnelStatus = {
  /** Tunnel is connected and active */
  Connected: 'CONNECTED',
  /** Tunnel is attempting to connect */
  Connecting: 'CONNECTING',
  /** Tunnel is disconnected */
  Disconnected: 'DISCONNECTED'
} as const;

export type TunnelStatus = typeof TunnelStatus[keyof typeof TunnelStatus];
/** Result of a tunnel connectivity test */
export type TunnelTestResult = {
  /** Average ping latency in milliseconds (null if unreachable) */
  readonly latency?: Maybe<Scalars['Float']['output']>;
  /** Path MTU discovered (null if not tested) */
  readonly mtuPath?: Maybe<Scalars['Int']['output']>;
  /** Whether the remote endpoint is reachable */
  readonly reachable: Scalars['Boolean']['output'];
  /** Suggestions for common connectivity issues */
  readonly suggestions: ReadonlyArray<Scalars['String']['output']>;
  /** Throughput in Mbps (null if iperf not available) */
  readonly throughput?: Maybe<Scalars['Float']['output']>;
};

/** Network tunnel types supported by MikroTik RouterOS */
export const TunnelType = {
  /** Ethernet over IP - Layer 2 tunnel for bridge extension */
  Eoip: 'EOIP',
  /** Generic Routing Encapsulation (RFC 2784) - L3 with optional IPsec */
  Gre: 'GRE',
  /** IP-in-IP tunnel (RFC 2003) - Basic L3 encapsulation */
  Ipip: 'IPIP',
  /** Layer 2 Tunneling Protocol (future support) */
  L2Tp: 'L2TP',
  /** Secure Socket Tunneling Protocol (future support) */
  Sstp: 'SSTP',
  /** Virtual eXtensible LAN (RFC 7348) - L2 overlay network */
  Vxlan: 'VXLAN'
} as const;

export type TunnelType = typeof TunnelType[keyof typeof TunnelType];
/** Input for updating an alert rule */
export type UpdateAlertRuleInput = {
  /** Notification channels */
  readonly channels?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  /** Array of conditions */
  readonly conditions?: InputMaybe<ReadonlyArray<AlertConditionInput>>;
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Optional device ID filter */
  readonly deviceId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether rule is enabled */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Escalation configuration (NAS-18.9) */
  readonly escalation?: InputMaybe<EscalationConfigInput>;
  /** Event type to match */
  readonly eventType?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable alert rule name */
  readonly name?: InputMaybe<Scalars['String']['input']>;
  /** Quiet hours configuration */
  readonly quietHours?: InputMaybe<QuietHoursConfigInput>;
  /** Alert severity level */
  readonly severity?: InputMaybe<AlertSeverity>;
  /** Throttle configuration */
  readonly throttle?: InputMaybe<ThrottleConfigInput>;
};

export type UpdateBridgeInput = {
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  readonly disabled?: InputMaybe<Scalars['Boolean']['input']>;
  readonly mtu?: InputMaybe<Scalars['Int']['input']>;
  readonly priority?: InputMaybe<Scalars['Int']['input']>;
  readonly protocol?: InputMaybe<StpProtocol>;
  readonly pvid?: InputMaybe<Scalars['Int']['input']>;
  readonly vlanFiltering?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateBridgePortInput = {
  readonly edge?: InputMaybe<Scalars['Boolean']['input']>;
  readonly frameTypes?: InputMaybe<FrameTypes>;
  readonly ingressFiltering?: InputMaybe<Scalars['Boolean']['input']>;
  readonly pathCost?: InputMaybe<Scalars['Int']['input']>;
  readonly pvid?: InputMaybe<Scalars['Int']['input']>;
  readonly taggedVlans?: InputMaybe<ReadonlyArray<Scalars['Int']['input']>>;
  readonly untaggedVlans?: InputMaybe<ReadonlyArray<Scalars['Int']['input']>>;
};

/** Input for updating an item in a change set */
export type UpdateChangeSetItemInput = {
  /** Updated configuration */
  readonly configuration?: InputMaybe<Scalars['JSON']['input']>;
  /** Updated dependencies */
  readonly dependencies?: InputMaybe<ReadonlyArray<Scalars['ID']['input']>>;
  /** Updated description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Updated name */
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChangeSetItemPayload = {
  /** The updated change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
};

/** Input for updating interface settings */
export type UpdateInterfaceInput = {
  /** Interface comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Enable or disable the interface */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** MTU size (68-9000 bytes) */
  readonly mtu?: InputMaybe<Scalars['Int']['input']>;
};

/** Payload returned by updateInterface, enableInterface, and disableInterface mutations */
export type UpdateInterfacePayload = {
  /** Errors that occurred during the operation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Updated interface */
  readonly interface?: Maybe<Interface>;
};

/** Input for updating an existing notification channel configuration */
export type UpdateNotificationChannelConfigInput = {
  /** New configuration (optional, replaces entire config if provided) */
  readonly config?: InputMaybe<Scalars['JSON']['input']>;
  /** New description (optional) */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Enable/disable configuration (optional) */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Set as default (optional) */
  readonly isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** New name (optional) */
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating an existing port mirror configuration */
export type UpdatePortMirrorInput = {
  /** Updated comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Updated destination interface ID */
  readonly destinationInterfaceId?: InputMaybe<Scalars['ID']['input']>;
  /** Updated direction of traffic to mirror */
  readonly direction?: InputMaybe<MirrorDirection>;
  /** Updated name */
  readonly name?: InputMaybe<Scalars['String']['input']>;
  /** Updated source interface IDs (must be bridge members) */
  readonly sourceInterfaceIds?: InputMaybe<ReadonlyArray<Scalars['ID']['input']>>;
};

/** Input for updating resource configuration */
export type UpdateResourceInput = {
  /** Updated configuration (partial or full) */
  readonly configuration?: InputMaybe<Scalars['JSON']['input']>;
  /** Updated description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Updated relationships */
  readonly relationships?: InputMaybe<ResourceRelationshipsInput>;
  /** Updated tags */
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
};

export type UpdateResourcePayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The updated resource */
  readonly resource?: Maybe<Resource>;
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

/** Input for updating a webhook */
export type UpdateWebhookInput = {
  /** Authentication type */
  readonly authType?: InputMaybe<WebhookAuthType>;
  /** Bearer token for Bearer auth (only set if provided) */
  readonly bearerToken?: InputMaybe<Scalars['String']['input']>;
  /** Custom template body */
  readonly customTemplate?: InputMaybe<Scalars['String']['input']>;
  /** Optional description */
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Whether webhook is enabled */
  readonly enabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Custom HTTP headers (as JSON object) */
  readonly headers?: InputMaybe<Scalars['JSON']['input']>;
  /** Maximum retry attempts */
  readonly maxRetries?: InputMaybe<Scalars['Int']['input']>;
  /** HTTP method */
  readonly method?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable webhook name */
  readonly name?: InputMaybe<Scalars['String']['input']>;
  /** Password for Basic auth (only set if provided) */
  readonly password?: InputMaybe<Scalars['String']['input']>;
  /** Whether to retry failed deliveries */
  readonly retryEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Signing secret for HMAC signature (only set if provided) */
  readonly signingSecret?: InputMaybe<Scalars['String']['input']>;
  /** Template type for webhook payload */
  readonly template?: InputMaybe<WebhookTemplate>;
  /** Timeout in seconds */
  readonly timeoutSeconds?: InputMaybe<Scalars['Int']['input']>;
  /** Webhook URL endpoint */
  readonly url?: InputMaybe<Scalars['String']['input']>;
  /** Username for Basic auth */
  readonly username?: InputMaybe<Scalars['String']['input']>;
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

/** An uptime data point */
export type UptimeDataPoint = {
  /** Whether resource was up during this period */
  readonly isUp: Scalars['Boolean']['output'];
  /** Period duration in seconds */
  readonly periodSeconds: Scalars['Int']['output'];
  /** Timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
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

/** VPN tunnel information for routes through VPN */
export type VpnTunnelInfo = {
  /** Tunnel name */
  readonly name: Scalars['String']['output'];
  /** Remote endpoint address */
  readonly remoteAddress?: Maybe<Scalars['String']['output']>;
  /** Current tunnel connection status */
  readonly status: TunnelStatus;
  /** Tunnel type (wireguard, ipsec, ovpn, l2tp, gre, eoip) */
  readonly type: Scalars['String']['output'];
};

export type ValidateChangeSetPayload = {
  /** The validated change set */
  readonly changeSet?: Maybe<ChangeSet>;
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Validation result */
  readonly validation?: Maybe<ChangeSetValidationResult>;
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
export type ValidateResourcePayload = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** The validated resource */
  readonly resource?: Maybe<Resource>;
  /** Validation result */
  readonly validation?: Maybe<ValidationResult>;
};

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

/** A validation issue (error or warning) */
export type ValidationIssue = {
  /** Error code for programmatic handling */
  readonly code: Scalars['String']['output'];
  /** Link to documentation */
  readonly docsUrl?: Maybe<Scalars['String']['output']>;
  /** Field path that caused the issue (e.g., 'configuration.listenPort') */
  readonly field?: Maybe<Scalars['String']['output']>;
  /** Human-readable message */
  readonly message: Scalars['String']['output'];
  /** Severity level */
  readonly severity: ValidationSeverity;
  /** Suggested fix */
  readonly suggestedFix?: Maybe<Scalars['String']['output']>;
};

/**
 * Layer 2: Validation result from 7-stage backend validation pipeline.
 * Computed on every configuration change.
 */
export type ValidationResult = {
  /** Whether the resource can be applied */
  readonly canApply: Scalars['Boolean']['output'];
  /** Resource conflicts detected */
  readonly conflicts: ReadonlyArray<ResourceConflict>;
  /** Validation errors (blocking) */
  readonly errors: ReadonlyArray<ValidationIssue>;
  /** Required dependencies that must be active */
  readonly requiredDependencies: ReadonlyArray<DependencyStatus>;
  /** Current validation stage */
  readonly stage: ValidationStage;
  /** When validation was performed */
  readonly validatedAt: Scalars['DateTime']['output'];
  /** Duration of validation in milliseconds */
  readonly validationDurationMs: Scalars['Int']['output'];
  /** Validation warnings (non-blocking) */
  readonly warnings: ReadonlyArray<ValidationIssue>;
};

/** Validation issue severity */
export const ValidationSeverity = {
  /** Blocks apply, must be fixed */
  Error: 'ERROR',
  /** Informational notice */
  Info: 'INFO',
  /** Does not block, but recommended to address */
  Warning: 'WARNING'
} as const;

export type ValidationSeverity = typeof ValidationSeverity[keyof typeof ValidationSeverity];
/** Validation pipeline stages */
export const ValidationStage = {
  /** All stages complete */
  Complete: 'COMPLETE',
  /** Conflict detection (port/IP/route conflicts) */
  Conflict: 'CONFLICT',
  /** Dependency validation (required resources exist) */
  Dependency: 'DEPENDENCY',
  /** Platform validation (capability checks) */
  Platform: 'PLATFORM',
  /** Quota validation (resource limits) */
  Quota: 'QUOTA',
  /** Schema validation (Zod/GraphQL) */
  Schema: 'SCHEMA',
  /** Semantic validation (business rules) */
  Semantic: 'SEMANTIC',
  /** Pre-flight simulation */
  Simulation: 'SIMULATION'
} as const;

export type ValidationStage = typeof ValidationStage[keyof typeof ValidationStage];
/** Variable types for template parameters. */
export const VariableType = {
  /** Interface name (autocomplete from router) */
  Interface: 'INTERFACE',
  /** IP address */
  Ip: 'IP',
  /** Port number */
  Port: 'PORT',
  /** Free-form string */
  String: 'STRING',
  /** Subnet in CIDR notation */
  Subnet: 'SUBNET',
  /** VLAN ID */
  VlanId: 'VLAN_ID'
} as const;

export type VariableType = typeof VariableType[keyof typeof VariableType];
/** A VLAN (Virtual LAN) interface for network segmentation using 802.1Q tagging */
export type Vlan = Node & {
  /** User comment */
  readonly comment?: Maybe<Scalars['String']['output']>;
  /** Whether the VLAN interface is disabled */
  readonly disabled: Scalars['Boolean']['output'];
  /** Unique VLAN identifier */
  readonly id: Scalars['ID']['output'];
  /** Parent interface (bridge or physical interface) */
  readonly interface: Interface;
  /** IP addresses assigned to this VLAN */
  readonly ipAddresses: ReadonlyArray<IpAddress>;
  /** MAC address of the VLAN interface */
  readonly macAddress?: Maybe<Scalars['MAC']['output']>;
  /** MTU setting (optional, inherits from parent if not set) */
  readonly mtu?: Maybe<Scalars['Int']['output']>;
  /** VLAN interface name (e.g., vlan10, vlan-guest) */
  readonly name: Scalars['String']['output'];
  /** Whether the VLAN interface is running (link up) */
  readonly running: Scalars['Boolean']['output'];
  /** Traffic statistics for this VLAN */
  readonly statistics?: Maybe<InterfaceStats>;
  /** 802.1Q VLAN ID (1-4094) */
  readonly vlanId: Scalars['Int']['output'];
};

/** Resources that depend on a VLAN interface */
export type VlanDependencies = {
  /** Number of active connections on this VLAN */
  readonly activeConnections: Scalars['Int']['output'];
  /** DHCP servers using this VLAN */
  readonly dhcpServers: ReadonlyArray<DhcpServer>;
  /** Firewall rules referencing this VLAN */
  readonly firewallRules: ReadonlyArray<FirewallRuleReference>;
  /** Whether the VLAN has any dependencies */
  readonly hasDependencies: Scalars['Boolean']['output'];
  /** IP addresses assigned to this VLAN */
  readonly ipAddresses: ReadonlyArray<IpAddress>;
  /** Routes using this VLAN interface */
  readonly routes: ReadonlyArray<Route>;
  /** VLAN interface ID */
  readonly vlanId: Scalars['ID']['output'];
};

/** Filter options for querying VLANs */
export type VlanFilter = {
  /** Filter by name containing this string */
  readonly nameContains?: InputMaybe<Scalars['String']['input']>;
  /** Filter by parent interface ID */
  readonly parentInterface?: InputMaybe<Scalars['ID']['input']>;
  /** Filter by VLAN ID range */
  readonly vlanIdRange?: InputMaybe<IntRange>;
};

/** Input for creating a new VLAN interface */
export type VlanInput = {
  /** User comment */
  readonly comment?: InputMaybe<Scalars['String']['input']>;
  /** Parent interface ID (bridge or physical interface) */
  readonly interface: Scalars['ID']['input'];
  /** MTU setting (optional, inherits from parent if not set) */
  readonly mtu?: InputMaybe<Scalars['Int']['input']>;
  /** VLAN interface name (alphanumeric, hyphens, underscores) */
  readonly name: Scalars['String']['input'];
  /** 802.1Q VLAN ID (1-4094) */
  readonly vlanId: Scalars['Int']['input'];
};

/** Result of a VLAN mutation (create, update) */
export type VlanMutationResult = {
  /** Errors that occurred during the operation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Configuration preview (RouterOS commands that will be executed) */
  readonly preview?: Maybe<ConfigPreview>;
  /** Whether the operation succeeded */
  readonly success: Scalars['Boolean']['output'];
  /** The created or updated VLAN (if successful) */
  readonly vlan?: Maybe<Vlan>;
};

/** VLAN topology data (nodes and edges) */
export type VlanTopology = {
  /** Topology edges (connections) */
  readonly edges: ReadonlyArray<TopologyEdge>;
  /** Topology nodes (bridges, VLANs, ports) */
  readonly nodes: ReadonlyArray<TopologyNode>;
};

/** WAN connection history entry */
export type WanConnectionEvent = {
  /** Connection duration (for disconnect events) */
  readonly duration?: Maybe<Scalars['Duration']['output']>;
  /** Event type */
  readonly eventType: WanEventType;
  /** Gateway IP */
  readonly gateway?: Maybe<Scalars['IPv4']['output']>;
  /** Event ID */
  readonly id: Scalars['ID']['output'];
  /** Public IP at the time (if applicable) */
  readonly publicIP?: Maybe<Scalars['IPv4']['output']>;
  /** Reason/error message (if applicable) */
  readonly reason?: Maybe<Scalars['String']['output']>;
  /** Event timestamp */
  readonly timestamp: Scalars['DateTime']['output'];
  /** WAN interface ID */
  readonly wanInterfaceId: Scalars['ID']['output'];
};

/** Connection history pagination */
export type WanConnectionEventConnection = Connection & {
  readonly edges: ReadonlyArray<WanConnectionEventEdge>;
  readonly pageInfo: PageInfo;
  readonly totalCount?: Maybe<Scalars['Int']['output']>;
};

export type WanConnectionEventEdge = Edge & {
  readonly cursor: Scalars['String']['output'];
  readonly node: WanConnectionEvent;
};

/** WAN connection type classification */
export const WanConnectionType = {
  /** DHCP client (dynamic IP) */
  Dhcp: 'DHCP',
  /** LTE/cellular connection */
  Lte: 'LTE',
  /** Not configured */
  None: 'NONE',
  /** PPPoE dial-up connection */
  Pppoe: 'PPPOE',
  /** Static IP configuration */
  Static: 'STATIC'
} as const;

export type WanConnectionType = typeof WanConnectionType[keyof typeof WanConnectionType];
/** WAN event types for history tracking */
export const WanEventType = {
  /** Authentication failed */
  AuthFailed: 'AUTH_FAILED',
  /** Connection established */
  Connected: 'CONNECTED',
  /** Connection lost */
  Disconnected: 'DISCONNECTED',
  /** Gateway changed */
  GatewayChanged: 'GATEWAY_CHANGED',
  /** Health check failed */
  HealthFailed: 'HEALTH_FAILED',
  /** Health check recovered */
  HealthRecovered: 'HEALTH_RECOVERED',
  /** IP address changed */
  IpChanged: 'IP_CHANGED'
} as const;

export type WanEventType = typeof WanEventType[keyof typeof WanEventType];
/** Input for configuring WAN health check */
export type WanHealthCheckInput = {
  /** Enable health check */
  readonly enabled: Scalars['Boolean']['input'];
  /** Check interval in seconds */
  readonly interval: Scalars['Int']['input'];
  /** Target host to ping (IP or hostname) */
  readonly target: Scalars['String']['input'];
};

/** WAN health check status */
export type WanHealthStatus = {
  /** Whether health check is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Consecutive failed checks */
  readonly failureCount: Scalars['Int']['output'];
  /** Check interval */
  readonly interval: Scalars['Duration']['output'];
  /** Last check timestamp */
  readonly lastCheck: Scalars['DateTime']['output'];
  /** Current latency (if reachable) */
  readonly latency?: Maybe<Scalars['Int']['output']>;
  /** Packet loss percentage (0-100) */
  readonly packetLoss: Scalars['Int']['output'];
  /** Overall health status */
  readonly status: HealthCheckStatus;
  /** Consecutive successful checks */
  readonly successCount: Scalars['Int']['output'];
  /** Target host being monitored */
  readonly target: Scalars['String']['output'];
};

/** WAN interface status with connection details */
export type WanInterface = Node & {
  /** DHCP client configuration (if type is DHCP) */
  readonly dhcpClient?: Maybe<DhcpClient>;
  /** Gateway IP address */
  readonly gateway?: Maybe<Scalars['IPv4']['output']>;
  /** Health check status */
  readonly health?: Maybe<WanHealthStatus>;
  /** Unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Underlying network interface */
  readonly interface: Interface;
  /** Whether this is the default route */
  readonly isDefaultRoute: Scalars['Boolean']['output'];
  /** Last connection time */
  readonly lastConnected?: Maybe<Scalars['DateTime']['output']>;
  /** LTE modem configuration (if type is LTE) */
  readonly lteModem?: Maybe<LteModem>;
  /** PPPoE client configuration (if type is PPPOE) */
  readonly pppoeClient?: Maybe<PppoeClient>;
  /** Primary DNS server */
  readonly primaryDNS?: Maybe<Scalars['IPv4']['output']>;
  /** Public IP address (if connected) */
  readonly publicIP?: Maybe<Scalars['IPv4']['output']>;
  /** Secondary DNS server */
  readonly secondaryDNS?: Maybe<Scalars['IPv4']['output']>;
  /** Static IP configuration (if type is STATIC) */
  readonly staticConfig?: Maybe<StaticIpConfig>;
  /** Traffic statistics */
  readonly statistics?: Maybe<InterfaceStats>;
  /** Current connection status */
  readonly status: WanStatus;
  /** WAN connection type */
  readonly type: WanConnectionType;
  /** Connection uptime */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
};

/** WAN Link resource for internet connectivity */
export type WanLink = Node & Resource & {
  readonly category: ResourceCategory;
  readonly configuration?: Maybe<Scalars['JSON']['output']>;
  /** Connection type (static, dhcp, pppoe) */
  readonly connectionType: WanConnectionType;
  readonly deployment?: Maybe<DeploymentState>;
  /** Failover priority (lower = higher priority) */
  readonly failoverPriority?: Maybe<Scalars['Int']['output']>;
  readonly id: Scalars['ID']['output'];
  /** Interface name */
  readonly interface: Scalars['String']['output'];
  /** Whether this is the primary WAN */
  readonly isPrimary: Scalars['Boolean']['output'];
  readonly metadata: ResourceMetadata;
  readonly platform?: Maybe<PlatformInfo>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
  readonly wanRuntime?: Maybe<WanLinkRuntime>;
};

/** WAN Link runtime state */
export type WanLinkRuntime = {
  /** Current IP address */
  readonly currentIP?: Maybe<Scalars['IPv4']['output']>;
  /** DNS servers received */
  readonly dnsServers?: Maybe<ReadonlyArray<Scalars['IPv4']['output']>>;
  /** Current downlink speed (bytes/sec) */
  readonly downlinkSpeed?: Maybe<Scalars['Size']['output']>;
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Gateway address */
  readonly gateway?: Maybe<Scalars['IPv4']['output']>;
  readonly health: RuntimeHealth;
  readonly isRunning: Scalars['Boolean']['output'];
  /** Last connection change */
  readonly lastStateChange?: Maybe<Scalars['DateTime']['output']>;
  readonly lastUpdated: Scalars['DateTime']['output'];
  /** Public IP (may differ due to NAT) */
  readonly publicIP?: Maybe<Scalars['IPv4']['output']>;
  /** Current uplink speed (bytes/sec) */
  readonly uplinkSpeed?: Maybe<Scalars['Size']['output']>;
  /** Total uptime */
  readonly uptime?: Maybe<Scalars['Duration']['output']>;
};

/** Result of WAN configuration mutation */
export type WanMutationResult = {
  /** Errors that occurred */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Configuration preview (RouterOS commands) */
  readonly preview?: Maybe<ConfigPreview>;
  /** Whether the operation succeeded */
  readonly success: Scalars['Boolean']['output'];
  /** The configured WAN interface */
  readonly wanInterface?: Maybe<WanInterface>;
};

/** WAN connection status */
export const WanStatus = {
  /** Connected and online */
  Connected: 'CONNECTED',
  /** Connecting/authenticating */
  Connecting: 'CONNECTING',
  /** Disabled */
  Disabled: 'DISABLED',
  /** Disconnected */
  Disconnected: 'DISCONNECTED',
  /** Connection failed */
  Error: 'ERROR'
} as const;

export type WanStatus = typeof WanStatus[keyof typeof WanStatus];
/** Webhook notification configuration */
export type Webhook = Node & {
  /** Authentication type */
  readonly authType: WebhookAuthType;
  /** Bearer token (masked, only shown on creation) */
  readonly bearerToken?: Maybe<Scalars['String']['output']>;
  /** Record creation timestamp */
  readonly createdAt: Scalars['DateTime']['output'];
  /** Custom template body (for CUSTOM template type) */
  readonly customTemplate?: Maybe<Scalars['String']['output']>;
  /** Delivery statistics */
  readonly deliveryStats?: Maybe<WebhookDeliveryStats>;
  /** Optional description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Whether this webhook is enabled */
  readonly enabled: Scalars['Boolean']['output'];
  /** Custom HTTP headers (as JSON object) */
  readonly headers?: Maybe<Scalars['JSON']['output']>;
  /** Globally unique identifier */
  readonly id: Scalars['ID']['output'];
  /** Last successful delivery timestamp */
  readonly lastDeliveredAt?: Maybe<Scalars['DateTime']['output']>;
  /** Maximum retry attempts (default: 3) */
  readonly maxRetries: Scalars['Int']['output'];
  /** HTTP method (default: POST) */
  readonly method: Scalars['String']['output'];
  /** Human-readable webhook name */
  readonly name: Scalars['String']['output'];
  /** Whether to retry failed deliveries */
  readonly retryEnabled: Scalars['Boolean']['output'];
  /** Signing secret (masked with ******, never returned in plaintext except on creation) */
  readonly signingSecretMasked?: Maybe<Scalars['String']['output']>;
  /** Template type for webhook payload */
  readonly template: WebhookTemplate;
  /** Timeout in seconds (default: 10) */
  readonly timeoutSeconds: Scalars['Int']['output'];
  /** Last update timestamp */
  readonly updatedAt: Scalars['DateTime']['output'];
  /** Webhook URL endpoint */
  readonly url: Scalars['String']['output'];
  /** Username for Basic auth */
  readonly username?: Maybe<Scalars['String']['output']>;
};

/** Webhook authentication types */
export const WebhookAuthType = {
  /** HTTP Basic authentication */
  Basic: 'BASIC',
  /** Bearer token authentication */
  Bearer: 'BEARER',
  /** No authentication required */
  None: 'NONE'
} as const;

export type WebhookAuthType = typeof WebhookAuthType[keyof typeof WebhookAuthType];
/** Webhook delivery statistics */
export type WebhookDeliveryStats = {
  /** Average response time in milliseconds */
  readonly avgResponseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** Failed deliveries */
  readonly failureCount: Scalars['Int']['output'];
  /** Successful deliveries */
  readonly successCount: Scalars['Int']['output'];
  /** Success rate (0-100) */
  readonly successRate: Scalars['Float']['output'];
  /** Total deliveries attempted */
  readonly totalAttempts: Scalars['Int']['output'];
};

/** Webhook mutation payload */
export type WebhookPayload = {
  /** Errors encountered during mutation */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Signing secret (only returned on creation, one-time show) */
  readonly signingSecret?: Maybe<Scalars['String']['output']>;
  /** Created/updated webhook */
  readonly webhook?: Maybe<Webhook>;
};

/** Webhook template types for predefined formats */
export const WebhookTemplate = {
  /** Custom template with user-defined format */
  Custom: 'CUSTOM',
  /** Discord webhook format */
  Discord: 'DISCORD',
  /** Generic JSON format */
  Generic: 'GENERIC',
  /** Slack incoming webhook format */
  Slack: 'SLACK',
  /** Microsoft Teams webhook format */
  Teams: 'TEAMS'
} as const;

export type WebhookTemplate = typeof WebhookTemplate[keyof typeof WebhookTemplate];
/** Webhook test mutation payload */
export type WebhookTestPayload = {
  /** Errors encountered during test */
  readonly errors?: Maybe<ReadonlyArray<MutationError>>;
  /** Test result */
  readonly result?: Maybe<WebhookTestResult>;
};

/** Result of testing a webhook */
export type WebhookTestResult = {
  /** Error message if test failed */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Response body from webhook endpoint */
  readonly responseBody?: Maybe<Scalars['String']['output']>;
  /** Response time in milliseconds */
  readonly responseTimeMs?: Maybe<Scalars['Int']['output']>;
  /** HTTP status code received */
  readonly statusCode?: Maybe<Scalars['Int']['output']>;
  /** Whether the test was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** WireGuard VPN Client resource implementing 8-layer model */
export type WireGuardClient = Node & Resource & {
  readonly category: ResourceCategory;
  readonly config: WireGuardClientConfig;
  readonly configuration?: Maybe<Scalars['JSON']['output']>;
  readonly deployment?: Maybe<DeploymentState>;
  readonly id: Scalars['ID']['output'];
  readonly metadata: ResourceMetadata;
  readonly platform?: Maybe<PlatformInfo>;
  readonly relationships?: Maybe<ResourceRelationships>;
  readonly runtime?: Maybe<RuntimeState>;
  readonly scopedId: Scalars['String']['output'];
  readonly telemetry?: Maybe<TelemetryData>;
  readonly type: Scalars['String']['output'];
  readonly validation?: Maybe<ValidationResult>;
  readonly wireguardDeployment?: Maybe<WireGuardDeployment>;
  readonly wireguardRuntime?: Maybe<WireGuardRuntime>;
};

/** WireGuard client configuration */
export type WireGuardClientConfig = {
  /** Allowed IPs (CIDR notation) */
  readonly allowedIPs: ReadonlyArray<Scalars['CIDR']['output']>;
  /** DNS servers to use */
  readonly dnsServers?: Maybe<ReadonlyArray<Scalars['IPv4']['output']>>;
  /** Enable kill switch */
  readonly killSwitch?: Maybe<Scalars['Boolean']['output']>;
  /** Listen port (0 for auto) */
  readonly listenPort?: Maybe<Scalars['Port']['output']>;
  /** User-friendly name */
  readonly name: Scalars['String']['output'];
  /** Peer endpoint (IP:port) */
  readonly peerEndpoint: Scalars['String']['output'];
  /** Peer public key */
  readonly peerPublicKey: Scalars['String']['output'];
  /** Persistent keepalive interval */
  readonly persistentKeepalive?: Maybe<Scalars['Duration']['output']>;
  /** WireGuard private key */
  readonly privateKey: Scalars['String']['output'];
  /** WAN interface to use */
  readonly wanInterface?: Maybe<Scalars['ID']['output']>;
};

/** WireGuard deployment state (router-generated) */
export type WireGuardDeployment = {
  readonly appliedAt: Scalars['DateTime']['output'];
  readonly appliedBy?: Maybe<Scalars['String']['output']>;
  readonly drift?: Maybe<DriftInfo>;
  /** Assigned interface name */
  readonly interfaceName?: Maybe<Scalars['String']['output']>;
  readonly isInSync: Scalars['Boolean']['output'];
  /** Generated public key */
  readonly publicKey?: Maybe<Scalars['String']['output']>;
  readonly routerResourceId?: Maybe<Scalars['String']['output']>;
  readonly routerVersion?: Maybe<Scalars['Int']['output']>;
};

/** WireGuard runtime state */
export type WireGuardRuntime = {
  /** Current active peers count */
  readonly activePeers: Scalars['Int']['output'];
  /** Bytes transferred in */
  readonly bytesIn: Scalars['Size']['output'];
  /** Bytes transferred out */
  readonly bytesOut: Scalars['Size']['output'];
  /** Current endpoint (may differ from configured) */
  readonly currentEndpoint?: Maybe<Scalars['String']['output']>;
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  readonly health: RuntimeHealth;
  /** Whether connected to peer */
  readonly isConnected: Scalars['Boolean']['output'];
  readonly isRunning: Scalars['Boolean']['output'];
  /** Last handshake time */
  readonly lastHandshake?: Maybe<Scalars['DateTime']['output']>;
  readonly lastUpdated: Scalars['DateTime']['output'];
};
