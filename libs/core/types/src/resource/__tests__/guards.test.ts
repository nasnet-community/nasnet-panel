/**
 * Resource Type Guards Tests
 *
 * Tests for runtime type checking functions.
 */

import { describe, it, expect } from 'vitest';
import type { Resource, ResourceCategory } from '../resource';
import {
  isVPNResource,
  isNetworkResource,
  isInfrastructureResource,
  isApplicationResource,
  isFeatureResource,
  isPluginResource,
  isWireGuardClient,
  isLANNetwork,
  isWANLink,
  hasValidation,
  hasDeployment,
  hasRuntime,
  hasTelemetry,
  hasMetadata,
  hasRelationships,
  hasPlatform,
  isDraft,
  isValidating,
  isValid,
  isApplying,
  isActive,
  isDegraded,
  isError,
  isDeprecated,
  isArchived,
  isHealthy,
  isRunning,
  hasDrift,
  isInSync,
} from '../guards';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockResource(
  overrides: Partial<Resource> = {}
): Resource {
  return {
    uuid: 'test-uuid',
    id: 'test-resource',
    type: 'test-type',
    category: 'NETWORK' as ResourceCategory,
    configuration: {},
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'test-user',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'test-user',
      state: 'DRAFT',
      version: 1,
      tags: [],
    },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Resource Type Guards', () => {
  describe('Category Guards', () => {
    it('isVPNResource should identify VPN resources', () => {
      const vpnResource = createMockResource({ category: 'VPN' });
      const networkResource = createMockResource({ category: 'NETWORK' });

      expect(isVPNResource(vpnResource)).toBe(true);
      expect(isVPNResource(networkResource)).toBe(false);
    });

    it('isNetworkResource should identify NETWORK resources', () => {
      const networkResource = createMockResource({ category: 'NETWORK' });
      const vpnResource = createMockResource({ category: 'VPN' });

      expect(isNetworkResource(networkResource)).toBe(true);
      expect(isNetworkResource(vpnResource)).toBe(false);
    });

    it('isInfrastructureResource should identify INFRASTRUCTURE resources', () => {
      const infraResource = createMockResource({ category: 'INFRASTRUCTURE' });
      expect(isInfrastructureResource(infraResource)).toBe(true);
    });

    it('isApplicationResource should identify APPLICATION resources', () => {
      const appResource = createMockResource({ category: 'APPLICATION' });
      expect(isApplicationResource(appResource)).toBe(true);
    });

    it('isFeatureResource should identify FEATURE resources', () => {
      const featureResource = createMockResource({ category: 'FEATURE' });
      expect(isFeatureResource(featureResource)).toBe(true);
    });

    it('isPluginResource should identify PLUGIN resources', () => {
      const pluginResource = createMockResource({ category: 'PLUGIN' });
      expect(isPluginResource(pluginResource)).toBe(true);
    });
  });

  describe('Type Guards', () => {
    it('isWireGuardClient should identify wireguard-client type', () => {
      const wgClient = createMockResource({ type: 'wireguard-client' });
      const other = createMockResource({ type: 'lan-network' });

      expect(isWireGuardClient(wgClient)).toBe(true);
      expect(isWireGuardClient(other)).toBe(false);
    });

    it('isLANNetwork should identify lan-network type', () => {
      const lanNetwork = createMockResource({ type: 'lan-network' });
      const other = createMockResource({ type: 'wireguard-client' });

      expect(isLANNetwork(lanNetwork)).toBe(true);
      expect(isLANNetwork(other)).toBe(false);
    });

    it('isWANLink should identify wan-link type', () => {
      const wanLink = createMockResource({ type: 'wan-link' });
      const other = createMockResource({ type: 'lan-network' });

      expect(isWANLink(wanLink)).toBe(true);
      expect(isWANLink(other)).toBe(false);
    });
  });

  describe('Layer Presence Guards', () => {
    it('hasValidation should check for validation layer', () => {
      const withValidation = createMockResource({
        validation: { canApply: true, stage: 'FINAL', errors: [], warnings: [] },
      });
      const withoutValidation = createMockResource();

      expect(hasValidation(withValidation)).toBe(true);
      expect(hasValidation(withoutValidation)).toBe(false);
    });

    it('hasDeployment should check for deployment layer', () => {
      const withDeployment = createMockResource({
        deployment: {
          routerResourceId: '123',
          appliedAt: '2024-01-01T00:00:00Z',
          appliedBy: 'test',
          isInSync: true,
        },
      });
      const withoutDeployment = createMockResource();

      expect(hasDeployment(withDeployment)).toBe(true);
      expect(hasDeployment(withoutDeployment)).toBe(false);
    });

    it('hasRuntime should check for runtime layer', () => {
      const withRuntime = createMockResource({
        runtime: { isRunning: true, health: 'HEALTHY', lastUpdated: '2024-01-01T00:00:00Z' },
      });
      const withoutRuntime = createMockResource();

      expect(hasRuntime(withRuntime)).toBe(true);
      expect(hasRuntime(withoutRuntime)).toBe(false);
    });

    it('hasTelemetry should check for telemetry layer', () => {
      const withTelemetry = createMockResource({
        telemetry: { lastUpdatedAt: '2024-01-01T00:00:00Z' },
      });
      const withoutTelemetry = createMockResource();

      expect(hasTelemetry(withTelemetry)).toBe(true);
      expect(hasTelemetry(withoutTelemetry)).toBe(false);
    });

    it('hasMetadata should check for metadata layer', () => {
      const withMetadata = createMockResource();
      expect(hasMetadata(withMetadata)).toBe(true);
    });

    it('hasRelationships should check for relationships layer', () => {
      const withRelationships = createMockResource({
        relationships: { dependsOn: [] },
      });
      const withoutRelationships = createMockResource();

      expect(hasRelationships(withRelationships)).toBe(true);
      expect(hasRelationships(withoutRelationships)).toBe(false);
    });

    it('hasPlatform should check for platform layer', () => {
      const withPlatform = createMockResource({
        platform: { current: 'mikrotik' },
      });
      const withoutPlatform = createMockResource();

      expect(hasPlatform(withPlatform)).toBe(true);
      expect(hasPlatform(withoutPlatform)).toBe(false);
    });
  });

  describe('State Guards', () => {
    it('isDraft should check for DRAFT state', () => {
      const draft = createMockResource({
        metadata: { state: 'DRAFT', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      const active = createMockResource({
        metadata: { state: 'ACTIVE', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });

      expect(isDraft(draft)).toBe(true);
      expect(isDraft(active)).toBe(false);
    });

    it('isValidating should check for VALIDATING state', () => {
      const validating = createMockResource({
        metadata: { state: 'VALIDATING', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isValidating(validating)).toBe(true);
    });

    it('isValid should check for VALID state', () => {
      const valid = createMockResource({
        metadata: { state: 'VALID', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isValid(valid)).toBe(true);
    });

    it('isApplying should check for APPLYING state', () => {
      const applying = createMockResource({
        metadata: { state: 'APPLYING', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isApplying(applying)).toBe(true);
    });

    it('isActive should check for ACTIVE state', () => {
      const active = createMockResource({
        metadata: { state: 'ACTIVE', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isActive(active)).toBe(true);
    });

    it('isDegraded should check for DEGRADED state', () => {
      const degraded = createMockResource({
        metadata: { state: 'DEGRADED', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isDegraded(degraded)).toBe(true);
    });

    it('isError should check for ERROR state', () => {
      const error = createMockResource({
        metadata: { state: 'ERROR', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isError(error)).toBe(true);
    });

    it('isDeprecated should check for DEPRECATED state', () => {
      const deprecated = createMockResource({
        metadata: { state: 'DEPRECATED', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isDeprecated(deprecated)).toBe(true);
    });

    it('isArchived should check for ARCHIVED state', () => {
      const archived = createMockResource({
        metadata: { state: 'ARCHIVED', createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', version: 1, tags: [] },
      });
      expect(isArchived(archived)).toBe(true);
    });
  });

  describe('Health Guards', () => {
    it('isHealthy should check for HEALTHY health', () => {
      const healthy = createMockResource({
        runtime: { isRunning: true, health: 'HEALTHY', lastUpdated: '2024-01-01T00:00:00Z' },
      });
      const degraded = createMockResource({
        runtime: { isRunning: true, health: 'DEGRADED', lastUpdated: '2024-01-01T00:00:00Z' },
      });

      expect(isHealthy(healthy)).toBe(true);
      expect(isHealthy(degraded)).toBe(false);
    });

    it('isRunning should check runtime isRunning', () => {
      const running = createMockResource({
        runtime: { isRunning: true, health: 'HEALTHY', lastUpdated: '2024-01-01T00:00:00Z' },
      });
      const stopped = createMockResource({
        runtime: { isRunning: false, health: 'UNKNOWN', lastUpdated: '2024-01-01T00:00:00Z' },
      });
      const noRuntime = createMockResource();

      expect(isRunning(running)).toBe(true);
      expect(isRunning(stopped)).toBe(false);
      expect(isRunning(noRuntime)).toBe(false);
    });

    it('hasDrift should check for drift in deployment', () => {
      const withDrift = createMockResource({
        deployment: {
          routerResourceId: '123',
          appliedAt: '2024-01-01T00:00:00Z',
          appliedBy: 'test',
          isInSync: false,
          drift: {
            detectedAt: '2024-01-02T00:00:00Z',
            driftedFields: [],
            suggestedAction: 'SYNC',
          },
        },
      });
      const noDrift = createMockResource({
        deployment: {
          routerResourceId: '123',
          appliedAt: '2024-01-01T00:00:00Z',
          appliedBy: 'test',
          isInSync: true,
        },
      });
      const noDeployment = createMockResource();

      expect(hasDrift(withDrift)).toBe(true);
      expect(hasDrift(noDrift)).toBe(false);
      expect(hasDrift(noDeployment)).toBe(false);
    });

    it('isInSync should check deployment sync status', () => {
      const inSync = createMockResource({
        deployment: {
          routerResourceId: '123',
          appliedAt: '2024-01-01T00:00:00Z',
          appliedBy: 'test',
          isInSync: true,
        },
      });
      const notInSync = createMockResource({
        deployment: {
          routerResourceId: '123',
          appliedAt: '2024-01-01T00:00:00Z',
          appliedBy: 'test',
          isInSync: false,
        },
      });
      const noDeployment = createMockResource();

      expect(isInSync(inSync)).toBe(true);
      expect(isInSync(notInSync)).toBe(false);
      expect(isInSync(noDeployment)).toBe(false);
    });
  });
});
