/**
 * Unit tests for BandwidthChart GraphQL operations
 * Verifies query and subscription definitions
 *
 * @see graphql.ts
 */

import { describe, it, expect } from 'vitest';
import { GET_BANDWIDTH_HISTORY, BANDWIDTH_UPDATE } from './graphql';

describe('BandwidthChart GraphQL Operations', () => {
  describe('GET_BANDWIDTH_HISTORY', () => {
    it('should be a valid GraphQL query definition', () => {
      expect(GET_BANDWIDTH_HISTORY).toBeDefined();
      expect(GET_BANDWIDTH_HISTORY.kind).toBe('Document');
      expect(GET_BANDWIDTH_HISTORY.definitions).toHaveLength(1);
    });

    it('should have correct operation type', () => {
      const definition = GET_BANDWIDTH_HISTORY.definitions[0] as any;
      expect(definition.operation).toBe('query');
    });

    it('should have correct operation name', () => {
      const definition = GET_BANDWIDTH_HISTORY.definitions[0] as any;
      expect(definition.name?.value).toBe('BandwidthHistory');
    });

    it('should include required variables', () => {
      const definition = GET_BANDWIDTH_HISTORY.definitions[0] as any;
      const variableNames = definition.variableDefinitions?.map((v: any) => v.variable.name.value);
      expect(variableNames).toContain('deviceId');
      expect(variableNames).toContain('timeRange');
      expect(variableNames).toContain('aggregation');
    });

    it('should include optional interface filter variable', () => {
      const definition = GET_BANDWIDTH_HISTORY.definitions[0] as any;
      const variableNames = definition.variableDefinitions?.map((v: any) => v.variable.name.value);
      expect(variableNames).toContain('interfaceId');
    });
  });

  describe('BANDWIDTH_UPDATE', () => {
    it('should be a valid GraphQL subscription definition', () => {
      expect(BANDWIDTH_UPDATE).toBeDefined();
      expect(BANDWIDTH_UPDATE.kind).toBe('Document');
      expect(BANDWIDTH_UPDATE.definitions).toHaveLength(1);
    });

    it('should have correct operation type', () => {
      const definition = BANDWIDTH_UPDATE.definitions[0] as any;
      expect(definition.operation).toBe('subscription');
    });

    it('should have correct operation name', () => {
      const definition = BANDWIDTH_UPDATE.definitions[0] as any;
      expect(definition.name?.value).toBe('Bandwidth');
    });

    it('should include required variables', () => {
      const definition = BANDWIDTH_UPDATE.definitions[0] as any;
      const variableNames = definition.variableDefinitions?.map((v: any) => v.variable.name.value);
      expect(variableNames).toContain('deviceId');
    });

    it('should include optional interface filter variable', () => {
      const definition = BANDWIDTH_UPDATE.definitions[0] as any;
      const variableNames = definition.variableDefinitions?.map((v: any) => v.variable.name.value);
      expect(variableNames).toContain('interfaceId');
    });
  });
});
