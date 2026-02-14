# Kill Switch Implementation Summary

**Story:** NAS-8.13 - Network Kill Switch
**Team Member:** Backend Core Developer
**Status:** ✅ Complete (Tasks 2, 3, 4)

## Overview

The Kill Switch protects client device privacy by automatically blocking or redirecting traffic when the primary service instance becomes unhealthy. It uses pre-created, disabled MikroTik firewall filter rules that can be atomically enabled/disabled in response to health events.

## Architecture

### Components

1. **KillSwitchManager** (`kill_switch.go`)
   - Core logic for managing firewall filter rules
   - Methods: Enable(), Disable(), Activate(), Deactivate(), ReconcileRouter()
   - Uses RouterPort interface for command execution
   - Follows Apply-Confirm-Merge pattern with rollback

2. **KillSwitchListener** (`kill_switch_listener.go`)
   - Event-driven subscriber to health state changes
   - Automatically triggers activation/deactivation
   - Publishes kill switch lifecycle events

3. **Kill Switch Events** (`kill_switch_events.go`)
   - KillSwitchActivatedEvent (immediate priority)
   - KillSwitchDeactivatedEvent (normal priority)

### Database Schema

The `DeviceRouting` entity was extended with kill switch fields:

```go
kill_switch_enabled              bool      // Whether kill switch is enabled
kill_switch_mode                 enum      // block_all | fallback_service | allow_direct
kill_switch_rule_id              string    // RouterOS .id for O(1) operations
kill_switch_active               bool      // Current activation state
kill_switch_activated_at         time      // When last activated
kill_switch_fallback_interface_id string    // Fallback interface for fallback_service mode
```

## Kill Switch Modes

### 1. Block All (Default - Most Secure)
- **Action:** Drop all traffic from device
- **Use Case:** Maximum privacy protection
- **Firewall Rule:** `action=drop`

### 2. Fallback Service (Not Yet Implemented)
- **Action:** Route traffic to fallback service instance
- **Use Case:** Failover to backup VPN
- **Firewall Rule:** `action=mark-routing new-routing-mark=fallback-mark`
- **Status:** TODO - requires fallback interface lookup

### 3. Allow Direct (Least Secure)
- **Action:** Allow direct internet access
- **Use Case:** Connectivity over privacy
- **Firewall Rule:** `action=accept`

## Operation Flow

### Enable Kill Switch
1. Validate parameters (mode, fallback interface)
2. Create DISABLED firewall filter rule on router
3. Store rule ID and configuration in database
4. Emit `killswitch.enabled` event

**Firewall Rule Pattern:**
```
/ip/firewall/filter/add
  chain=forward
  src-mac-address=AA:BB:CC:DD:EE:FF
  action=drop (or accept)
  disabled=yes
  comment=nnc-killswitch-{routingID}
  place-before=0  # Top priority
```

### Activation (Health Failure)
1. Receive EventTypeHealthChanged (HEALTHY → UNHEALTHY)
2. Query all device routings for affected instance
3. For each routing with kill switch enabled:
   - Enable firewall rule: `/ip/firewall/filter/set .id=*X disabled=no`
   - Update database: `kill_switch_active=true`, `kill_switch_activated_at=now`
   - Publish KillSwitchActivatedEvent (immediate priority)

### Deactivation (Health Recovery)
1. Receive EventTypeHealthChanged (UNHEALTHY → HEALTHY)
2. Query all device routings for affected instance
3. For each routing with active kill switch:
   - Disable firewall rule: `/ip/firewall/filter/set .id=*X disabled=yes`
   - Update database: `kill_switch_active=false`
   - Publish KillSwitchDeactivatedEvent (normal priority)

### Disable Kill Switch
1. Fetch DeviceRouting record
2. Remove firewall filter rule from router
3. Clear all kill switch fields in database
4. Emit `killswitch.disabled` event

## Reconciliation (Startup)

The `ReconcileRouter()` method handles four scenarios:

### 1. Orphaned Rules
- **Scenario:** Rule exists on router but no DB entry
- **Action:** Delete rule from router
- **Detection:** Rule comment matches `nnc-killswitch-*` but no corresponding DB record

### 2. Missing Rules
- **Scenario:** DB says enabled but rule doesn't exist
- **Action:** Recreate rule on router with correct disabled state
- **Recovery:** Update DB with new rule ID

### 3. State Mismatch
- **Scenario:** DB active state doesn't match router disabled state
- **Action:** Set router rule to match DB state
- **Examples:**
  - DB: active=true, Router: disabled=yes → Set disabled=no
  - DB: active=false, Router: disabled=no → Set disabled=yes

### 4. Stale Activations
- **Scenario:** Kill switch active but service is now healthy
- **Action:** Deactivate kill switch
- **Status:** TODO - requires health service API

## Comment Tagging Convention

All kill switch firewall rules use the comment pattern:
```
nnc-killswitch-{routingID}
```

Where `{routingID}` is the ULID of the DeviceRouting record.

This enables:
- O(1) rule identification during reconciliation
- Clear distinction from other NasNetConnect rules
- Easy cleanup via pattern matching

## Event Priority

| Event | Priority | Classification | Persistence |
|-------|----------|----------------|-------------|
| KillSwitchActivatedEvent | Immediate | Critical | Warm tier (immediate) |
| KillSwitchDeactivatedEvent | Normal | Normal | Warm tier (daily sync) |
| killswitch.enabled | Normal | Normal | Warm tier (daily sync) |
| killswitch.disabled | Normal | Normal | Warm tier (daily sync) |
| killswitch.reconciled | Normal | Normal | Warm tier (daily sync) |

## Error Handling & Rollback

All operations follow the Apply-Confirm-Merge pattern:

1. **Apply:** Execute router command
2. **Confirm:** Update database
3. **Merge:** Emit event

If step 2 fails, step 1 is rolled back:
```go
if err := updateDatabase(); err != nil {
    _ = rollbackRouterCommand()
    return err
}
```

## Testing

### Unit Tests (7 tests)
- `TestKillSwitchManager_Enable` - Rule creation and DB update
- `TestKillSwitchManager_Disable` - Rule removal and DB cleanup
- `TestKillSwitchManager_Activate` - Atomic enable operation
- `TestKillSwitchManager_Deactivate` - Atomic disable operation
- `TestKillSwitchManager_ReconcileRouter` - Orphaned rule detection
- `TestKillSwitchManager_ModeHandling` - block_all and allow_direct modes

### Integration Tests (7 tests)
- `TestKillSwitchListener_HealthEventActivation` - Unhealthy transition
- `TestKillSwitchListener_HealthEventDeactivation` - Healthy transition
- `TestKillSwitchListener_IgnoreNonTransitions` - HEALTHY → HEALTHY ignored
- `TestKillSwitchListener_NoKillSwitchEnabled` - Skip disabled routings

### Mock Infrastructure
- MockRouterPort for command verification
- In-memory SQLite database for ent tests
- Event bus with subscription testing

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| Enable | O(1) | Single rule creation |
| Disable | O(1) | Single rule removal |
| Activate | O(1) | Single set command |
| Deactivate | O(1) | Single set command |
| ReconcileRouter | O(N + M) | N=DB records, M=router rules |

All operations use RouterOS `.id` for O(1) rule lookup.

## Integration Points

### Dependencies
- `backend/ent` - Database ORM for DeviceRouting
- `backend/internal/router` - RouterPort interface
- `backend/internal/events` - Event bus and publisher
- `backend/internal/orchestrator` - Health checker (event source)

### Consumed Events
- `EventTypeHealthChanged` - From health checker (Story 8.6)

### Published Events
- `KillSwitchActivatedEvent` - Immediate priority, critical tier
- `KillSwitchDeactivatedEvent` - Normal priority, normal tier
- `killswitch.enabled` - Configuration change
- `killswitch.disabled` - Configuration change
- `killswitch.reconciled` - Startup reconciliation summary

## Next Steps (Blocked on Other Teams)

### Task 5: GraphQL Schema & Resolvers (backend-graphql-dev)
- Mutation: `enableKillSwitch(routingId, mode, fallbackInterfaceId)`
- Mutation: `disableKillSwitch(routingId)`
- Query: `killSwitchStatus(routingId)`
- Subscription: `onKillSwitchActivated(routerId)`

### Task 6: PBREngine Integration (backend-graphql-dev)
- Add kill switch cleanup to RemoveDeviceRouting()
- Handle cascade delete when VIF is removed

### Task 7-9: Frontend Integration (frontend-dev)
- API client hooks
- KillSwitchToggle pattern component
- Routing matrix integration

## Files Created

1. `apps/backend/internal/vif/kill_switch.go` (620 lines)
2. `apps/backend/internal/vif/kill_switch_listener.go` (220 lines)
3. `apps/backend/internal/vif/kill_switch_events.go` (90 lines)
4. `apps/backend/internal/vif/kill_switch_test.go` (580 lines)
5. `apps/backend/internal/vif/kill_switch_listener_test.go` (380 lines)

**Total:** 1,890 lines of production + test code

## Known Limitations

1. **Fallback Service Mode:** Not yet implemented (requires VIF lookup logic)
2. **Stale Activation Detection:** Requires health service API integration
3. **Wildcard Comment Filtering:** Router adapters may not support wildcard filtering, so reconciliation fetches all rules and filters in code

## Security Considerations

- Kill switch rules are placed at top priority (`place-before=0`) to ensure they execute first
- Activation is atomic (single RouterOS command) to minimize exposure window
- Default mode is `block_all` (most secure) if not specified
- All operations have rollback to prevent orphaned state
