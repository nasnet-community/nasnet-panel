package sharing

import (
	"encoding/json"
	"fmt"

	"backend/internal/events"
)

// ImportError represents an error during import operation.
type ImportError struct {
	Code    string
	Message string
	Details []ValidationError
}

func (e *ImportError) Error() string {
	if len(e.Details) > 0 {
		return fmt.Sprintf("[%s] %s (details: %d errors)", e.Code, e.Message, len(e.Details))
	}

	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// ServiceConfigImportedEvent is emitted when a service config is imported.
type ServiceConfigImportedEvent struct {
	events.BaseEvent
	InstanceID          string `json:"instanceId"`
	ServiceType         string `json:"serviceType"`
	ServiceName         string `json:"serviceName"`
	ConflictResolution  string `json:"conflictResolution,omitempty"`
	RoutingRulesApplied int    `json:"routingRulesApplied"`
	ImportedByUserID    string `json:"importedByUserId,omitempty"`
}

// Payload returns the JSON-serialized event payload.
func (e *ServiceConfigImportedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewServiceConfigImportedEvent creates a new ServiceConfigImportedEvent.
func NewServiceConfigImportedEvent(
	instanceID, serviceType, serviceName, conflictResolution string,
	routingRulesApplied int,
	importedByUserID, source string,
) *ServiceConfigImportedEvent {

	return &ServiceConfigImportedEvent{
		BaseEvent:           events.NewBaseEvent("service.config.imported", events.PriorityCritical, source),
		InstanceID:          instanceID,
		ServiceType:         serviceType,
		ServiceName:         serviceName,
		ConflictResolution:  conflictResolution,
		RoutingRulesApplied: routingRulesApplied,
		ImportedByUserID:    importedByUserID,
	}
}
