// Package base provides base service patterns for reducing code duplication.
package base

import (
	"backend/internal/events"
	"backend/internal/router"
)

// ServiceConfig provides a standardized service configuration struct.
// Most services use RouterPort + EventBus, so this reduces boilerplate.
//
// Usage:
//
//	type MyService struct {
//	    base.BaseService
//	    eventBus events.EventBus
//	}
//
//	func NewMyService(config base.ServiceConfig) *MyService {
//	    return &MyService{
//	        BaseService: base.NewBaseService(config.RouterPort),
//	        eventBus:    config.EventBus,
//	    }
//	}
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// Validate checks if the service config is valid.
func (c ServiceConfig) Validate() error {
	if c.RouterPort == nil {
		return ErrMissingRouterPort
	}
	// EventBus is optional for some services
	return nil
}
