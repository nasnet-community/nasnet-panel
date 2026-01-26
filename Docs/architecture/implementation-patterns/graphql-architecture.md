# GraphQL Architecture

## Schema-First with Platform Directives

```graphql
# Custom directives for platform mapping
directive @mikrotik(path: String!, cmd: String) on FIELD_DEFINITION
directive @openwrt(ubus: String!, method: String) on FIELD_DEFINITION
directive @vyos(path: String!) on FIELD_DEFINITION
directive @capability(requires: [String!]!) on FIELD_DEFINITION

type Interface {
  id: ID!
  name: String!

  # Platform-specific field mapping
  macAddress: String!
    @mikrotik(path: "/interface", cmd: "print")
    @openwrt(ubus: "network.device", method: "status")
    @vyos(path: "interfaces ethernet")

  # Capability-gated field
  poe: POEStatus
    @capability(requires: ["poe"])
    @mikrotik(path: "/interface/ethernet/poe")
}

type Query {
  # Fleet operations
  fleet(id: ID!): Fleet
  devices(fleetId: ID, status: DeviceStatus): [Device!]!

  # Resource queries
  interfaces(deviceId: ID!): [Interface!]!
  routes(deviceId: ID!, table: String): [Route!]!

  # Cross-device queries
  findByMAC(mac: String!): [Device!]!
}

type Mutation {
  # Resource mutations
  createInterface(deviceId: ID!, input: InterfaceInput!): Interface!
  updateInterface(id: ID!, input: InterfaceUpdateInput!): Interface!
  deleteInterface(id: ID!): Boolean!

  # Batch operations
  deployConfig(deviceId: ID!, config: ConfigInput!): DeploymentResult!
  rollbackConfig(deviceId: ID!, version: Int!): DeploymentResult!

  # Fleet operations
  batchUpdate(deviceIds: [ID!]!, operation: BatchOperation!): BatchResult!
}

type Subscription {
  # Real-time updates
  deviceStatus(deviceId: ID!): DeviceStatus!
  resourceChanged(deviceId: ID!, types: [ResourceType!]): ResourceChange!
  driftDetected(fleetId: ID!): DriftEvent!
}
```

## Resolver Pattern with Platform Abstraction

```typescript
const resolvers = {
  Query: {
    interfaces: async (_, { deviceId }, { dataSources }) => {
      const device = await dataSources.devices.get(deviceId);
      const adapter = dataSources.adapters.get(device.platform);

      const rawData = await adapter.query({
        resource: 'interface',
        operation: 'list',
      });

      return adapter.transform(rawData, InterfaceSchema);
    },
  },

  Interface: {
    // Field resolver with capability check
    poe: async (parent, _, { dataSources, device }) => {
      if (!device.capabilities.includes('poe')) {
        return null;
      }

      const adapter = dataSources.adapters.get(device.platform);
      return adapter.query({
        resource: 'interface/poe',
        filter: { interface: parent.name },
      });
    },
  },

  Mutation: {
    updateInterface: async (_, { id, input }, { dataSources }) => {
      // Validation pipeline
      const validated = await dataSources.validator.validate(input, InterfaceSchema);

      // Platform translation
      const device = await dataSources.devices.getByResourceId(id);
      const adapter = dataSources.adapters.get(device.platform);
      const cmd = adapter.translate({
        operation: 'update',
        resource: 'interface',
        id,
        data: validated,
      });

      // Execute with event sourcing
      const result = await adapter.execute(cmd);
      await dataSources.events.append({
        type: 'ResourceUpdated',
        aggregateId: id,
        payload: { before: parent, after: result },
      });

      return result;
    },
  },
};
```

---
