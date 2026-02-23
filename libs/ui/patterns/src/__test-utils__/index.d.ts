/**
 * Test Utilities & Fixtures
 *
 * Shared test data, mock fixtures, and helper utilities for component testing.
 * Used in unit tests, component tests, and Storybook stories.
 *
 * Organized by domain:
 * - Connection tracking fixtures - TCP/UDP/ICMP connections, filtering, settings
 * - Rate limiting fixtures - Rules, SYN flood configs, blocked IPs, statistics
 * - Firewall template fixtures - Template transforms, variable resolution
 *
 * Usage Examples:
 *
 * In component tests:
 * ```tsx
 * import { mockConnectionsQueryResponse, generateMockRules } from '@nasnet/ui/patterns/__test-utils__';
 *
 * const mockHandlers = [
 *   graphql.query('GetConnections', () => mockConnectionsQueryResponse),
 * ];
 * ```
 *
 * In Storybook stories:
 * ```tsx
 * import { mockRateLimitRules, mockStatsWithActivity } from '@nasnet/ui/patterns/__test-utils__';
 *
 * export const WithData = {
 *   args: { rules: mockRateLimitRules, stats: mockStatsWithActivity },
 * };
 * ```
 *
 * @see libs/ui/patterns/src/sortable/__tests__/ for example usage
 * @see MSW service worker for GraphQL mocking patterns
 */
export { mockEstablishedConnection, mockUdpConnection, mockIcmpConnection, mockTimeWaitConnection, mockSynSentConnection, mockNatConnection, mockConnections, generateMockConnections, mockDefaultSettings, mockModifiedSettings, mockDisabledSettings, mockIpFilter, mockWildcardFilter, mockProtocolFilter, mockPortFilter, mockStateFilter, mockCombinedFilters, mockConnectionsQueryResponse, mockEmptyConnectionsQueryResponse, mockLargeConnectionsQueryResponse, mockSettingsQueryResponse, mockKillConnectionMutationResponse, mockUpdateSettingsMutationResponse, mockErrorResponse, filterConnectionsByIP, filterConnectionsByPort, filterConnectionsByProtocol, filterConnectionsByState, applyConnectionFilters, formatDuration, parseDuration, } from './connection-tracking-fixtures';
export type { Connection, ConnectionTrackingSettings, ConnectionFilters, ConnectionTrackingState, ConnectionState, } from './connection-tracking-fixtures';
export { mockDropRule, mockTarpitRule, mockAddToListRule, mockDisabledRule, mockWhitelistRule, mockStrictRule, mockSpecificIPRule, mockRateLimitRules, emptyRuleInput, mockSynFloodDrop, mockSynFloodTarpit, mockSynFloodDisabled, mockSynFloodStrict, mockBlockedIP1, mockBlockedIP2, mockBlockedIP3, mockBlockedIP4, mockBlockedIP5, mockBlockedIPs, mockTopBlockedIPs, mockStatsWithActivity, mockStatsEmpty, mockStatsRecent, createMockRule, createMockBlockedIP, createMockSynFloodConfig, generateMockRules, generateMockBlockedIPs, generateTriggerEvents, } from './rate-limit-fixtures';
export type { RateLimitRule, SynFloodConfig, BlockedIP, RateLimitStats, TimeWindow, RateLimitAction, } from './rate-limit-fixtures';
//# sourceMappingURL=index.d.ts.map