package bootstrap

import (
	"log"

	"backend/generated/ent"
	"backend/internal/services/monitoring"
	"backend/internal/services/pollers"

	"backend/internal/events"
	"backend/internal/router"
)

// MonitoringComponents holds all initialized monitoring service components.
type MonitoringComponents struct {
	TelemetryService *monitoring.TelemetryService
	StatsPoller      *pollers.StatsPoller
}

// InitializeMonitoringServices creates and initializes monitoring services.
// This includes:
// - Telemetry service (interface statistics storage with three-tier architecture)
// - Stats poller (real-time interface statistics polling)
func InitializeMonitoringServices(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) (*MonitoringComponents, error) {
	// 1. Telemetry Service - interface statistics storage with three-tier architecture
	// Tier 1 (Hot): Last 1 hour at full resolution
	// Tier 2 (Warm): Last 24 hours at 5-minute aggregation
	// Tier 3 (Cold): Last 30 days at 1-hour aggregation
	telemetryService := monitoring.NewTelemetryService(routerPort, systemDB, eventBus)
	log.Printf("Telemetry service initialized (three-tier storage)")

	// 2. Stats Poller - real-time interface statistics polling
	statsPoller := pollers.NewStatsPoller(routerPort, eventBus)
	log.Printf("Stats poller initialized (rate limiting: 5s-60s)")

	return &MonitoringComponents{
		TelemetryService: telemetryService,
		StatsPoller:      statsPoller,
	}, nil
}
