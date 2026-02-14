package events

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// -----------------------------------------------------------------------------
// ServiceStateChangedEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceStateChangedEvent(t *testing.T) {
	tests := []struct {
		name             string
		instanceID       string
		serviceType      string
		serviceName      string
		fromStatus       string
		toStatus         string
		reason           string
		errorMessage     string
		source           string
		expectedPriority Priority
	}{
		{
			name:             "transition to failed - immediate priority",
			instanceID:       "instance-1",
			serviceType:      "tor",
			serviceName:      "Tor Proxy",
			fromStatus:       "running",
			toStatus:         "failed",
			reason:           "process exited",
			errorMessage:     "exit code 1",
			source:           "instance-manager",
			expectedPriority: PriorityImmediate,
		},
		{
			name:             "transition to crashed - immediate priority",
			instanceID:       "instance-2",
			serviceType:      "xray",
			serviceName:      "Xray Core",
			fromStatus:       "running",
			toStatus:         "crashed",
			reason:           "segfault",
			source:           "supervisor",
			expectedPriority: PriorityImmediate,
		},
		{
			name:             "transition to running - critical priority",
			instanceID:       "instance-3",
			serviceType:      "singbox",
			serviceName:      "sing-box",
			fromStatus:       "starting",
			toStatus:         "running",
			source:           "instance-manager",
			expectedPriority: PriorityCritical,
		},
		{
			name:             "transition to stopped - critical priority",
			instanceID:       "instance-4",
			serviceType:      "adguard",
			serviceName:      "AdGuard Home",
			fromStatus:       "stopping",
			toStatus:         "stopped",
			reason:           "user requested",
			source:           "instance-manager",
			expectedPriority: PriorityCritical,
		},
		{
			name:             "transition to starting - normal priority",
			instanceID:       "instance-5",
			serviceType:      "mtproxy",
			serviceName:      "MTProxy",
			fromStatus:       "stopped",
			toStatus:         "starting",
			source:           "instance-manager",
			expectedPriority: PriorityNormal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceStateChangedEvent(
				tt.instanceID,
				tt.serviceType,
				tt.serviceName,
				tt.fromStatus,
				tt.toStatus,
				tt.reason,
				tt.errorMessage,
				tt.source,
			)

			assert.Equal(t, EventTypeServiceStateChanged, event.GetType())
			assert.Equal(t, tt.expectedPriority, event.GetPriority())
			assert.Equal(t, tt.source, event.GetSource())
			assert.Equal(t, tt.instanceID, event.InstanceID)
			assert.Equal(t, tt.serviceType, event.ServiceType)
			assert.Equal(t, tt.serviceName, event.ServiceName)
			assert.Equal(t, tt.fromStatus, event.FromStatus)
			assert.Equal(t, tt.toStatus, event.ToStatus)
			assert.Equal(t, tt.reason, event.Reason)
			assert.Equal(t, tt.errorMessage, event.ErrorMessage)

			// Verify serialization
			payload, err := event.Payload()
			require.NoError(t, err)

			var decoded ServiceStateChangedEvent
			err = json.Unmarshal(payload, &decoded)
			require.NoError(t, err)
			assert.Equal(t, tt.instanceID, decoded.InstanceID)
			assert.Equal(t, tt.toStatus, decoded.ToStatus)
		})
	}
}

// -----------------------------------------------------------------------------
// ServiceRestartedEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceRestartedEvent(t *testing.T) {
	tests := []struct {
		name             string
		restartCount     int
		expectedPriority Priority
	}{
		{
			name:             "first restart - normal priority",
			restartCount:     1,
			expectedPriority: PriorityNormal,
		},
		{
			name:             "second restart - normal priority",
			restartCount:     2,
			expectedPriority: PriorityNormal,
		},
		{
			name:             "third restart - critical priority",
			restartCount:     3,
			expectedPriority: PriorityCritical,
		},
		{
			name:             "many restarts - critical priority",
			restartCount:     10,
			expectedPriority: PriorityCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceRestartedEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"process crashed",
				tt.restartCount,
				"supervisor",
			)

			assert.Equal(t, EventTypeServiceRestarted, event.GetType())
			assert.Equal(t, tt.expectedPriority, event.GetPriority())
			assert.Equal(t, tt.restartCount, event.RestartCount)
		})
	}
}

// -----------------------------------------------------------------------------
// ServiceHealthEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceHealthEvent(t *testing.T) {
	event := NewServiceHealthEvent(
		"instance-1",
		"xray",
		"Xray Core",
		true,
		3600, // 1 hour uptime
		12.5, // 12.5% CPU
		128,  // 128 MB memory
		"health-checker",
	)

	assert.Equal(t, EventTypeServiceHealth, event.GetType())
	assert.Equal(t, PriorityBackground, event.GetPriority())
	assert.Equal(t, "instance-1", event.InstanceID)
	assert.Equal(t, true, event.Healthy)
	assert.Equal(t, int64(3600), event.Uptime)
	assert.Equal(t, 12.5, event.CPUPercent)
	assert.Equal(t, int64(128), event.MemoryMB)

	// Verify serialization
	payload, err := event.Payload()
	require.NoError(t, err)

	var decoded ServiceHealthEvent
	err = json.Unmarshal(payload, &decoded)
	require.NoError(t, err)
	assert.Equal(t, true, decoded.Healthy)
	assert.Equal(t, 12.5, decoded.CPUPercent)
}

// -----------------------------------------------------------------------------
// ServiceUpdateAvailableEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceUpdateAvailableEvent(t *testing.T) {
	event := NewServiceUpdateAvailableEvent(
		"tor",
		"Tor Proxy",
		"0.4.7.13",
		"0.4.8.0",
		"New security patches and performance improvements",
		"https://example.com/updates",
		"update-checker",
	)

	assert.Equal(t, EventTypeServiceUpdateAvailable, event.GetType())
	assert.Equal(t, PriorityLow, event.GetPriority())
	assert.Equal(t, "tor", event.ServiceType)
	assert.Equal(t, "0.4.7.13", event.CurrentVersion)
	assert.Equal(t, "0.4.8.0", event.LatestVersion)
	assert.Contains(t, event.ReleaseNotes, "security patches")
}

// -----------------------------------------------------------------------------
// ServiceKillSwitchEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceKillSwitchEvent(t *testing.T) {
	tests := []struct {
		name        string
		triggerType string
	}{
		{
			name:        "manual kill switch",
			triggerType: "manual",
		},
		{
			name:        "ip leak detection",
			triggerType: "ip_leak",
		},
		{
			name:        "dns leak detection",
			triggerType: "dns_leak",
		},
		{
			name:        "detection failure",
			triggerType: "detection_failure",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceKillSwitchEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"Privacy leak detected",
				tt.triggerType,
				"kill-switch-monitor",
			)

			assert.Equal(t, EventTypeServiceKillSwitch, event.GetType())
			assert.Equal(t, PriorityImmediate, event.GetPriority())
			assert.Equal(t, tt.triggerType, event.TriggerType)
			assert.Equal(t, "Privacy leak detected", event.Reason)
		})
	}
}

// -----------------------------------------------------------------------------
// ServiceCrashedEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceCrashedEvent(t *testing.T) {
	event := NewServiceCrashedEvent(
		"instance-1",
		"xray",
		"Xray Core",
		"out of memory",
		137, // SIGKILL
		3,
		10, // 10 second backoff
		true,
		"supervisor",
	)

	assert.Equal(t, EventTypeServiceCrashed, event.GetType())
	assert.Equal(t, PriorityImmediate, event.GetPriority())
	assert.Equal(t, "instance-1", event.InstanceID)
	assert.Equal(t, 137, event.ExitCode)
	assert.Equal(t, 3, event.CrashCount)
	assert.Equal(t, true, event.WillRestart)
	assert.Equal(t, 10, event.BackoffDelay)
	assert.Equal(t, "out of memory", event.LastError)

	// Verify serialization
	payload, err := event.Payload()
	require.NoError(t, err)

	var decoded ServiceCrashedEvent
	err = json.Unmarshal(payload, &decoded)
	require.NoError(t, err)
	assert.Equal(t, 137, decoded.ExitCode)
	assert.Equal(t, 3, decoded.CrashCount)
}

// -----------------------------------------------------------------------------
// ServiceInstalledEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceInstalledEvent(t *testing.T) {
	tests := []struct {
		name     string
		verified bool
	}{
		{
			name:     "verified installation",
			verified: true,
		},
		{
			name:     "unverified installation",
			verified: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceInstalledEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"0.4.8.0",
				"/opt/nasnet/features/tor/bin/tor",
				tt.verified,
				"instance-manager",
			)

			assert.Equal(t, EventTypeServiceInstalled, event.GetType())
			assert.Equal(t, PriorityCritical, event.GetPriority())
			assert.Equal(t, tt.verified, event.Verified)
			assert.Equal(t, "0.4.8.0", event.Version)
		})
	}
}

// -----------------------------------------------------------------------------
// ServiceRemovedEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceRemovedEvent(t *testing.T) {
	tests := []struct {
		name   string
		reason string
	}{
		{
			name:   "user requested removal",
			reason: "user_requested",
		},
		{
			name:   "dependency removed",
			reason: "dependency_removed",
		},
		{
			name:   "failed installation",
			reason: "failed_install",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceRemovedEvent(
				"instance-1",
				"adguard",
				"AdGuard Home",
				tt.reason,
				"instance-manager",
			)

			assert.Equal(t, EventTypeServiceRemoved, event.GetType())
			assert.Equal(t, PriorityCritical, event.GetPriority())
			assert.Equal(t, tt.reason, event.Reason)
		})
	}
}

// -----------------------------------------------------------------------------
// ServiceResourceWarningEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceResourceWarningEvent(t *testing.T) {
	tests := []struct {
		name             string
		percentUsed      float64
		expectedPriority Priority
	}{
		{
			name:             "80% usage - low priority",
			percentUsed:      80.0,
			expectedPriority: PriorityLow,
		},
		{
			name:             "85% usage - low priority",
			percentUsed:      85.0,
			expectedPriority: PriorityLow,
		},
		{
			name:             "90% usage - normal priority",
			percentUsed:      90.0,
			expectedPriority: PriorityNormal,
		},
		{
			name:             "92% usage - normal priority",
			percentUsed:      92.0,
			expectedPriority: PriorityNormal,
		},
		{
			name:             "95% usage - critical priority",
			percentUsed:      95.0,
			expectedPriority: PriorityCritical,
		},
		{
			name:             "98% usage - critical priority",
			percentUsed:      98.0,
			expectedPriority: PriorityCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceResourceWarningEvent(
				"instance-1",
				"xray",
				"Xray Core",
				"memory",
				"90%",
				128*1024*1024, // 128 MB current
				256*1024*1024, // 256 MB limit
				tt.percentUsed,
				"resource-monitor",
			)

			assert.Equal(t, EventTypeServiceResourceWarning, event.GetType())
			assert.Equal(t, tt.expectedPriority, event.GetPriority())
			assert.Equal(t, "memory", event.ResourceType)
			assert.Equal(t, tt.percentUsed, event.PercentUsed)
		})
	}
}

// -----------------------------------------------------------------------------
// ServiceHealthFailingEvent Tests
// -----------------------------------------------------------------------------

func TestNewServiceHealthFailingEvent(t *testing.T) {
	tests := []struct {
		name                string
		consecutiveFailures int
		expectedPriority    Priority
	}{
		{
			name:                "1 failure - normal priority",
			consecutiveFailures: 1,
			expectedPriority:    PriorityNormal,
		},
		{
			name:                "2 failures - normal priority",
			consecutiveFailures: 2,
			expectedPriority:    PriorityNormal,
		},
		{
			name:                "3 failures - normal priority",
			consecutiveFailures: 3,
			expectedPriority:    PriorityNormal,
		},
		{
			name:                "5 failures - critical priority",
			consecutiveFailures: 5,
			expectedPriority:    PriorityCritical,
		},
		{
			name:                "10 failures - critical priority",
			consecutiveFailures: 10,
			expectedPriority:    PriorityCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceHealthFailingEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"connection timeout",
				tt.consecutiveFailures,
				5*time.Minute,
				"health-checker",
			)

			assert.Equal(t, EventTypeServiceHealthFailing, event.GetType())
			assert.Equal(t, tt.expectedPriority, event.GetPriority())
			assert.Equal(t, tt.consecutiveFailures, event.ConsecutiveFailures)
			assert.Equal(t, 5*time.Minute, event.FailureDuration)
			assert.Equal(t, "connection timeout", event.LastHealthCheckError)
		})
	}
}

// -----------------------------------------------------------------------------
// GetServiceEventSeverity Tests
// -----------------------------------------------------------------------------

func TestGetServiceEventSeverity(t *testing.T) {
	tests := []struct {
		eventType        string
		expectedSeverity AlertSeverity
	}{
		// CRITICAL
		{EventTypeServiceCrashed, SeverityCritical},
		{EventTypeServiceKillSwitch, SeverityCritical},
		{EventTypeServiceStateChanged, SeverityCritical}, // Default - may vary at runtime

		// WARNING
		{EventTypeServiceHealthFailing, SeverityWarning},
		{EventTypeServiceResourceWarning, SeverityWarning},
		{EventTypeServiceRestarted, SeverityWarning},

		// INFO
		{EventTypeServiceHealth, SeverityInfo},
		{EventTypeServiceUpdateAvailable, SeverityInfo},
		{EventTypeServiceInstalled, SeverityInfo},
		{EventTypeServiceRemoved, SeverityInfo},

		// Unknown defaults to INFO
		{"unknown.event.type", SeverityInfo},
	}

	for _, tt := range tests {
		t.Run(tt.eventType, func(t *testing.T) {
			severity := GetServiceEventSeverity(tt.eventType)
			assert.Equal(t, tt.expectedSeverity, severity)
		})
	}
}

// -----------------------------------------------------------------------------
// GetServiceEventSeverityDynamic Tests
// -----------------------------------------------------------------------------

func TestGetServiceEventSeverityDynamic_StateChanged(t *testing.T) {
	tests := []struct {
		name             string
		toStatus         string
		expectedSeverity AlertSeverity
	}{
		{
			name:             "state changed to failed - critical",
			toStatus:         "failed",
			expectedSeverity: SeverityCritical,
		},
		{
			name:             "state changed to crashed - critical",
			toStatus:         "crashed",
			expectedSeverity: SeverityCritical,
		},
		{
			name:             "state changed to running - info",
			toStatus:         "running",
			expectedSeverity: SeverityInfo,
		},
		{
			name:             "state changed to stopped - info",
			toStatus:         "stopped",
			expectedSeverity: SeverityInfo,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceStateChangedEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"running",
				tt.toStatus,
				"",
				"",
				"test",
			)

			severity := GetServiceEventSeverityDynamic(event)
			assert.Equal(t, tt.expectedSeverity, severity)
		})
	}
}

func TestGetServiceEventSeverityDynamic_Restarted(t *testing.T) {
	tests := []struct {
		name             string
		restartCount     int
		expectedSeverity AlertSeverity
	}{
		{
			name:             "1 restart - warning",
			restartCount:     1,
			expectedSeverity: SeverityWarning,
		},
		{
			name:             "2 restarts - warning",
			restartCount:     2,
			expectedSeverity: SeverityWarning,
		},
		{
			name:             "3 restarts - critical",
			restartCount:     3,
			expectedSeverity: SeverityCritical,
		},
		{
			name:             "10 restarts - critical",
			restartCount:     10,
			expectedSeverity: SeverityCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceRestartedEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"crashed",
				tt.restartCount,
				"supervisor",
			)

			severity := GetServiceEventSeverityDynamic(event)
			assert.Equal(t, tt.expectedSeverity, severity)
		})
	}
}

func TestGetServiceEventSeverityDynamic_ResourceWarning(t *testing.T) {
	tests := []struct {
		name             string
		percentUsed      float64
		expectedSeverity AlertSeverity
	}{
		{
			name:             "80% - warning",
			percentUsed:      80.0,
			expectedSeverity: SeverityWarning,
		},
		{
			name:             "90% - warning",
			percentUsed:      90.0,
			expectedSeverity: SeverityWarning,
		},
		{
			name:             "95% - critical",
			percentUsed:      95.0,
			expectedSeverity: SeverityCritical,
		},
		{
			name:             "99% - critical",
			percentUsed:      99.0,
			expectedSeverity: SeverityCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceResourceWarningEvent(
				"instance-1",
				"xray",
				"Xray Core",
				"memory",
				"warning",
				128*1024*1024,
				256*1024*1024,
				tt.percentUsed,
				"resource-monitor",
			)

			severity := GetServiceEventSeverityDynamic(event)
			assert.Equal(t, tt.expectedSeverity, severity)
		})
	}
}

func TestGetServiceEventSeverityDynamic_HealthFailing(t *testing.T) {
	tests := []struct {
		name                string
		consecutiveFailures int
		expectedSeverity    AlertSeverity
	}{
		{
			name:                "2 failures - warning",
			consecutiveFailures: 2,
			expectedSeverity:    SeverityWarning,
		},
		{
			name:                "4 failures - warning",
			consecutiveFailures: 4,
			expectedSeverity:    SeverityWarning,
		},
		{
			name:                "5 failures - critical",
			consecutiveFailures: 5,
			expectedSeverity:    SeverityCritical,
		},
		{
			name:                "10 failures - critical",
			consecutiveFailures: 10,
			expectedSeverity:    SeverityCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewServiceHealthFailingEvent(
				"instance-1",
				"tor",
				"Tor Proxy",
				"connection timeout",
				tt.consecutiveFailures,
				5*time.Minute,
				"health-checker",
			)

			severity := GetServiceEventSeverityDynamic(event)
			assert.Equal(t, tt.expectedSeverity, severity)
		})
	}
}

func TestGetServiceEventSeverityDynamic_FallbackToStatic(t *testing.T) {
	// Test that non-dynamic events fall back to static mapping
	event := NewServiceHealthEvent(
		"instance-1",
		"tor",
		"Tor Proxy",
		true,
		3600,
		10.0,
		64,
		"health-checker",
	)

	severity := GetServiceEventSeverityDynamic(event)
	assert.Equal(t, SeverityInfo, severity)
}

// -----------------------------------------------------------------------------
// Event Type Constants Tests
// -----------------------------------------------------------------------------

func TestEventTypeConstants(t *testing.T) {
	// Verify event type naming convention: "service.entity.action"
	assert.Equal(t, "service.state.changed", EventTypeServiceStateChanged)
	assert.Equal(t, "service.restarted", EventTypeServiceRestarted)
	assert.Equal(t, "service.health", EventTypeServiceHealth)
	assert.Equal(t, "service.update.available", EventTypeServiceUpdateAvailable)
	assert.Equal(t, "service.killswitch", EventTypeServiceKillSwitch)
	assert.Equal(t, "service.crashed", EventTypeServiceCrashed)
	assert.Equal(t, "service.installed", EventTypeServiceInstalled)
	assert.Equal(t, "service.removed", EventTypeServiceRemoved)
	assert.Equal(t, "service.resource.warning", EventTypeServiceResourceWarning)
	assert.Equal(t, "service.health.failing", EventTypeServiceHealthFailing)
}

// -----------------------------------------------------------------------------
// Severity Constants Tests
// -----------------------------------------------------------------------------

func TestAlertSeverityConstants(t *testing.T) {
	assert.Equal(t, AlertSeverity("CRITICAL"), SeverityCritical)
	assert.Equal(t, AlertSeverity("WARNING"), SeverityWarning)
	assert.Equal(t, AlertSeverity("INFO"), SeverityInfo)
}
