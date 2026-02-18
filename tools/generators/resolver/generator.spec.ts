import { type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import resolverGenerator from './generator';

describe('resolver generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create resolver files', async () => {
    await resolverGenerator(tree, {
      name: 'Interface',
    });

    expect(tree.exists('apps/backend/graph/interface_resolvers.go')).toBe(true);
    expect(tree.exists('apps/backend/graph/interface_resolvers_test.go')).toBe(true);
  });

  it('should create resolver with correct package name', async () => {
    await resolverGenerator(tree, {
      name: 'DHCPLease',
      module: 'network',
    });

    const resolverContent = tree.read(
      'apps/backend/network/dhcp-lease_resolvers.go',
      'utf-8'
    );

    expect(resolverContent).toContain('package network');
  });

  it('should create resolver struct and constructor', async () => {
    await resolverGenerator(tree, {
      name: 'FirewallRule',
    });

    const content = tree.read(
      'apps/backend/graph/firewall-rule_resolvers.go',
      'utf-8'
    );

    expect(content).toContain('type FirewallRule struct');
    expect(content).toContain('type FirewallRuleResolver struct');
    expect(content).toContain('func NewFirewallRuleResolver()');
  });

  it('should include query methods when withQuery is true', async () => {
    await resolverGenerator(tree, {
      name: 'Route',
      withQuery: true,
      withMutation: false,
    });

    const content = tree.read('apps/backend/graph/route_resolvers.go', 'utf-8');

    expect(content).toContain('func (r *RouteResolver) ListRoutes');
    expect(content).toContain('func (r *RouteResolver) GetRoute');
    expect(content).not.toContain('func (r *RouteResolver) CreateRoute');
  });

  it('should include mutation methods when withMutation is true', async () => {
    await resolverGenerator(tree, {
      name: 'Address',
      withQuery: false,
      withMutation: true,
    });

    const content = tree.read('apps/backend/graph/address_resolvers.go', 'utf-8');

    expect(content).toContain('func (r *AddressResolver) CreateAddress');
    expect(content).toContain('func (r *AddressResolver) UpdateAddress');
    expect(content).toContain('func (r *AddressResolver) DeleteAddress');
    expect(content).not.toContain('func (r *AddressResolver) ListAddresss');
  });

  it('should create test file with testify imports', async () => {
    await resolverGenerator(tree, {
      name: 'Bridge',
    });

    const testContent = tree.read(
      'apps/backend/graph/bridge_resolvers_test.go',
      'utf-8'
    );

    expect(testContent).toContain('github.com/stretchr/testify/assert');
    expect(testContent).toContain('github.com/stretchr/testify/require');
    expect(testContent).toContain('func TestNewBridgeResolver');
  });

  it('should create input struct for mutations', async () => {
    await resolverGenerator(tree, {
      name: 'Pool',
      withMutation: true,
    });

    const content = tree.read('apps/backend/graph/pool_resolvers.go', 'utf-8');

    expect(content).toContain('type PoolInput struct');
  });

  it('should use default graph module when not specified', async () => {
    await resolverGenerator(tree, {
      name: 'Default',
    });

    expect(tree.exists('apps/backend/graph/default_resolvers.go')).toBe(true);
  });

  it('should support custom module location', async () => {
    await resolverGenerator(tree, {
      name: 'Custom',
      module: 'services/firewall',
    });

    expect(
      tree.exists('apps/backend/services/firewall/custom_resolvers.go')
    ).toBe(true);
  });

  it('should handle PascalCase names correctly', async () => {
    await resolverGenerator(tree, {
      name: 'DHCPServer',
    });

    expect(tree.exists('apps/backend/graph/dhcp-server_resolvers.go')).toBe(true);

    const content = tree.read(
      'apps/backend/graph/dhcp-server_resolvers.go',
      'utf-8'
    );
    expect(content).toContain('type DHCPServer struct');
    expect(content).toContain('type DHCPServerResolver struct');
  });

  it('should respect dry-run mode', async () => {
    await resolverGenerator(tree, {
      name: 'DryRun',
      dryRun: true,
    });

    // Files should still be created in tree for preview
    expect(tree.exists('apps/backend/graph/dry-run_resolvers.go')).toBe(true);
  });
});
