# Data Validation Patterns

## Multi-Stage Validation Pipeline

```typescript
// 7-stage validation
const ValidationPipeline = [
  // Stage 1: Schema validation (Zod)
  async (data, schema) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return { valid: false, errors: result.error.issues };
    }
    return { valid: true, data: result.data };
  },

  // Stage 2: Syntax validation (platform-specific)
  async (data, context) => {
    const adapter = context.adapters.get(context.platform);
    return adapter.validateSyntax(data);
  },

  // Stage 3: Cross-resource validation
  async (data, context) => {
    // Check references exist
    // Validate no circular dependencies
    return validateReferences(data, context.resources);
  },

  // Stage 4: Dependency validation
  async (data, context) => {
    // Ensure dependencies are in valid state
    const deps = data.relationships?.dependencies || [];
    for (const dep of deps) {
      const resource = await context.resources.get(dep);
      if (resource.lifecycle !== 'active') {
        return { valid: false, error: `Dependency ${dep} not active` };
      }
    }
    return { valid: true };
  },

  // Stage 5: Conflict detection
  async (data, context) => {
    // Check for IP conflicts, name conflicts, etc.
    return detectConflicts(data, context);
  },

  // Stage 6: Capability validation
  async (data, context) => {
    const required = extractRequiredCapabilities(data);
    const available = context.device.capabilities;
    const missing = required.filter(r => !available.includes(r));
    if (missing.length > 0) {
      return { valid: false, error: `Missing capabilities: ${missing.join(', ')}` };
    }
    return { valid: true };
  },

  // Stage 7: Dry-run validation
  async (data, context) => {
    if (!context.options.skipDryRun) {
      const adapter = context.adapters.get(context.platform);
      return adapter.dryRun(data);
    }
    return { valid: true };
  },
];

async function validate(data: unknown, schema: ZodSchema, context: ValidationContext) {
  let current = data;

  for (const stage of ValidationPipeline) {
    const result = await stage(current, context);
    if (!result.valid) {
      return result;
    }
    current = result.data || current;
  }

  return { valid: true, data: current };
}
```

## Capability-Based Validation

```typescript
// Feature matrix per platform
const CapabilityMatrix: Record<PlatformType, Capabilities> = {
  mikrotik: {
    vlan: { minVersion: '6.0' },
    bonding: { minVersion: '6.0', packages: ['advanced-tools'] },
    container: { minVersion: '7.4', hardware: ['arm64', 'x86_64'] },
    wireguard: { minVersion: '7.0' },
    bgp: { packages: ['routing'] },
    mpls: { packages: ['mpls'], license: 'L5+' },
  },
  openwrt: {
    vlan: { minVersion: '19.07' },
    wireguard: { packages: ['wireguard-tools'] },
    sqm: { packages: ['sqm-scripts'] },
  },
  vyos: {
    vlan: { minVersion: '1.3' },
    wireguard: { minVersion: '1.3' },
    bgp: { minVersion: '1.3' },
  },
};

function checkCapability(
  platform: PlatformType,
  feature: string,
  deviceInfo: DeviceInfo
): CapabilityResult {
  const requirements = CapabilityMatrix[platform]?.[feature];

  if (!requirements) {
    return { supported: false, reason: 'Feature not available on platform' };
  }

  // Version check
  if (requirements.minVersion &&
      !semver.gte(deviceInfo.version, requirements.minVersion)) {
    return {
      supported: false,
      reason: `Requires version ${requirements.minVersion}+`
    };
  }

  // Package check
  if (requirements.packages) {
    const missing = requirements.packages.filter(
      p => !deviceInfo.packages.includes(p)
    );
    if (missing.length > 0) {
      return {
        supported: false,
        reason: `Missing packages: ${missing.join(', ')}`
      };
    }
  }

  // Hardware check
  if (requirements.hardware &&
      !requirements.hardware.includes(deviceInfo.arch)) {
    return {
      supported: false,
      reason: `Requires hardware: ${requirements.hardware.join(' or ')}`
    };
  }

  return { supported: true };
}
```

---
