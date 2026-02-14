package bridge

import (
	"fmt"

	"backend/internal/events"
)

// extractInstanceID extracts the instance ID from a service event.
func extractInstanceID(event events.Event) (string, error) {
	switch e := event.(type) {
	case *events.ServiceStateChangedEvent:
		return e.InstanceID, nil
	case *events.ServiceCrashedEvent:
		return e.InstanceID, nil
	case *events.ServiceRestartedEvent:
		return e.InstanceID, nil
	case *events.ServiceHealthFailingEvent:
		return e.InstanceID, nil
	case *events.ServiceResourceWarningEvent:
		return e.InstanceID, nil
	case *events.ServiceKillSwitchEvent:
		return e.InstanceID, nil
	case *events.ServiceInstalledEvent:
		return e.InstanceID, nil
	case *events.ServiceRemovedEvent:
		return e.InstanceID, nil
	case *events.ServiceHealthEvent:
		return e.InstanceID, nil
	case *events.ServiceUpdateAvailableEvent:
		return e.ServiceType, nil
	default:
		return "", fmt.Errorf("unknown service event type: %T", event)
	}
}

// extractServiceType extracts the service type from a service event.
func extractServiceType(event events.Event) (string, error) {
	switch e := event.(type) {
	case *events.ServiceStateChangedEvent:
		return e.ServiceType, nil
	case *events.ServiceCrashedEvent:
		return e.ServiceType, nil
	case *events.ServiceRestartedEvent:
		return e.ServiceType, nil
	case *events.ServiceHealthFailingEvent:
		return e.ServiceType, nil
	case *events.ServiceResourceWarningEvent:
		return e.ServiceType, nil
	case *events.ServiceKillSwitchEvent:
		return e.ServiceType, nil
	case *events.ServiceInstalledEvent:
		return e.ServiceType, nil
	case *events.ServiceRemovedEvent:
		return e.ServiceType, nil
	case *events.ServiceUpdateAvailableEvent:
		return e.ServiceType, nil
	case *events.ServiceHealthEvent:
		return e.ServiceType, nil
	default:
		return "", fmt.Errorf("unknown service event type: %T", event)
	}
}

// buildNotificationTitle builds a notification title from a service event.
func buildNotificationTitle(event events.Event) string {
	switch event.GetType() {
	case events.EventTypeServiceCrashed:
		return "Service Crashed"
	case events.EventTypeServiceHealthFailing:
		return "Service Health Failing"
	case events.EventTypeServiceResourceWarning:
		return "Service Resource Warning"
	case events.EventTypeServiceKillSwitch:
		return "Service Kill Switch Activated"
	case events.EventTypeServiceInstalled:
		return "Service Installed"
	case events.EventTypeServiceRemoved:
		return "Service Removed"
	case events.EventTypeServiceRestarted:
		return "Service Restarted"
	case events.EventTypeServiceUpdateAvailable:
		return "Service Update Available"
	default:
		return "Service Alert"
	}
}

// buildNotificationMessage builds a notification message from a service event.
func buildNotificationMessage(event events.Event) string {
	switch e := event.(type) {
	case *events.ServiceCrashedEvent:
		return fmt.Sprintf("Service %s crashed with exit code %d", e.ServiceName, e.ExitCode)
	case *events.ServiceHealthFailingEvent:
		return fmt.Sprintf("Service %s has %d consecutive health check failures", e.ServiceName, e.ConsecutiveFailures)
	case *events.ServiceResourceWarningEvent:
		return fmt.Sprintf("Service %s %s usage at %.1f%%", e.ServiceName, e.ResourceType, e.PercentUsed)
	case *events.ServiceKillSwitchEvent:
		return fmt.Sprintf("Kill switch activated for service %s: %s", e.ServiceName, e.Reason)
	case *events.ServiceInstalledEvent:
		return fmt.Sprintf("Service %s v%s installed successfully", e.ServiceName, e.Version)
	case *events.ServiceRemovedEvent:
		return fmt.Sprintf("Service %s removed", e.ServiceName)
	case *events.ServiceRestartedEvent:
		return fmt.Sprintf("Service %s restarted (count: %d)", e.ServiceName, e.RestartCount)
	case *events.ServiceUpdateAvailableEvent:
		return fmt.Sprintf("Update available for %s: %s -> %s", e.ServiceName, e.CurrentVersion, e.LatestVersion)
	default:
		return "Service event occurred"
	}
}

// extractEventData extracts data fields from a service event for notification context.
func extractEventData(event events.Event) map[string]interface{} {
	data := make(map[string]interface{})

	switch e := event.(type) {
	case *events.ServiceCrashedEvent:
		data["exitCode"] = e.ExitCode
		data["crashCount"] = e.CrashCount
		data["willRestart"] = e.WillRestart
	case *events.ServiceHealthFailingEvent:
		data["consecutiveFailures"] = e.ConsecutiveFailures
		data["lastError"] = e.LastHealthCheckError
	case *events.ServiceResourceWarningEvent:
		data["resourceType"] = e.ResourceType
		data["percentUsed"] = e.PercentUsed
		data["currentValue"] = e.CurrentValue
		data["limitValue"] = e.LimitValue
	case *events.ServiceRestartedEvent:
		data["restartCount"] = e.RestartCount
	}

	return data
}
