// Package domesticips provisions the DomesticIP address list update script on MikroTik routers.
//
// The DomesticIPS module creates a RouterOS script + scheduler that:
//  1. Fetches Iranian IP ranges from https://s4i.co/irip (paginated API, up to 50 pages of 1000 IPs)
//  2. Populates the firewall address list "DOMAddList" with all fetched addresses
//  3. Supports source routing (forces fetch requests through a specific interface IP)
//  4. Retries failed pages up to 10 times with backoff
//  5. Validates each IP/CIDR before adding to address list
//  6. Runs on a schedule (Daily/Weekly/Monthly) and also as a one-time script on first boot
//
// The address list "DOMAddList" is used by firewall/routing rules to route domestic
// (Iranian) traffic through the Domestic WAN interface instead of the Foreign/VPN interface.
//
// RouterOS API paths used:
//
//	/system/script          — create the script body
//	/system/scheduler       — schedule the script (recurring)
//	/ip/firewall/address-list — populated by the script at runtime (not at provision time)
//
// Key parameters:
//
//	Time          string         — HH:MM start time for scheduled execution
//	Interval      FrequencyValue — "Daily" | "Weekly" | "Monthly"
//	SourceAddress string         — IP address to use as fetch source (for source routing)
//
// The one-time variant adds a ":delay 120s" prefix to wait for the network to come up
// before the first fetch.
//
// Files in this package:
//
//	provisioner.go — Service type, Config/Result types, Provision and Remove methods
//	script.go      — RouterOS script constant and buildScriptBody helper
//	router_ops.go  — createScript, createScheduler, removeByComment helpers
package domesticips

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// FrequencyValue represents the schedule frequency.
type FrequencyValue string

const (
	FrequencyDaily   FrequencyValue = "Daily"
	FrequencyWeekly  FrequencyValue = "Weekly"
	FrequencyMonthly FrequencyValue = "Monthly"
)

// Service provisions the DomesticIP address list update script.
type Service struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	logger     *zap.SugaredLogger
}

// ServiceConfig holds configuration for Service.
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewService creates a new domesticips provisioning Service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// Config holds parameters for domestic IP provisioning.
type Config struct {
	Time          string         // HH:MM start time
	Interval      FrequencyValue // Daily, Weekly, Monthly
	SourceAddress string         // IP address for source routing
}

// ProvisionResult holds IDs of created resources.
type ProvisionResult struct {
	ScriptID          string
	SchedulerID       string
	OneTimeScriptID   string
	OneTimeScheduleID string
}

// frequencyToInterval maps FrequencyValue to RouterOS interval string.
func frequencyToInterval(freq FrequencyValue) string {
	switch freq {
	case FrequencyDaily:
		return "1d"
	case FrequencyWeekly:
		return "7d"
	case FrequencyMonthly:
		return "30d"
	default:
		return "1d"
	}
}

// Provision creates the domestic IP script and schedulers on the router.
func (s *Service) Provision(ctx context.Context, sessionID string, cfg Config) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	userID := uuid.New().String()
	scriptBody := buildScriptBody(userID, cfg.SourceAddress)

	// Normalise the start time to HH:MM:SS as RouterOS expects.
	startTime := cfg.Time
	if len(startTime) == 5 { // "HH:MM"
		startTime += ":00"
	}

	// 1. Create the recurring script.
	scriptID, err := s.createScript(ctx, "DomesticIPUpdate", scriptBody, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create domestic IP script: %w", err)
	}
	result.ScriptID = scriptID

	// 2. Create the recurring scheduler.
	schedID, err := s.createScheduler(ctx, "DomesticIPUpdate-schedule", "DomesticIPUpdate",
		frequencyToInterval(cfg.Interval), startTime, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create domestic IP scheduler: %w", err)
	}
	result.SchedulerID = schedID

	// 3. Create one-time script (runs on startup after 120s delay).
	oneTimeBody := ":delay 120s\n" + scriptBody
	oneTimeScriptID, err := s.createScript(ctx, "DomesticIPUpdate-OneTime", oneTimeBody, comment)
	if err != nil {
		s.logger.Warnw("failed to create one-time domestic IP script", "error", err)
	} else {
		result.OneTimeScriptID = oneTimeScriptID
	}

	// 4. Create one-time scheduler (runs on startup).
	if result.OneTimeScriptID != "" {
		oneTimeSchedID, err := s.createScheduler(ctx, "DomesticIPUpdate-OneTime-schedule",
			"DomesticIPUpdate-OneTime", "", "startup", comment)
		if err != nil {
			s.logger.Warnw("failed to create one-time scheduler", "error", err)
		} else {
			result.OneTimeScheduleID = oneTimeSchedID
		}
	}

	s.logger.Infow("domestic IP provisioning complete",
		"scriptID", result.ScriptID,
		"schedulerID", result.SchedulerID,
		"oneTimeScriptID", result.OneTimeScriptID,
		"oneTimeScheduleID", result.OneTimeScheduleID,
	)
	return result, nil
}

// Remove removes all domestic IP scripts and schedulers tagged with the session ID.
// Resources are removed in reverse order of creation (schedulers before scripts).
func (s *Service) Remove(ctx context.Context, sessionID string) error {
	comment := "nnc-provisioned-" + sessionID

	// Schedulers first (they reference the scripts).
	if err := s.removeByComment(ctx, "/system/scheduler", comment); err != nil {
		s.logger.Warnw("failed to remove domestic IP schedulers", "error", err)
	}

	// Then the scripts.
	if err := s.removeByComment(ctx, "/system/script", comment); err != nil {
		return fmt.Errorf("failed to remove domestic IP scripts: %w", err)
	}

	s.logger.Infow("domestic IP resources removed", "sessionID", sessionID)
	return nil
}
