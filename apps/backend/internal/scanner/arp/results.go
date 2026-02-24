package arp

import (
	"context"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
)

// =============================================================================
// Result Processing and Aggregation
// =============================================================================
// Scan result collection, deduplication, and event publishing.

// updateProgress publishes a progress event.
func updateProgress(
	ctx context.Context,
	service *ARPScannerService,
	session *ScanSession,
	progress int,
	scannedCount int,
	totalCount int,
	devices []events.DiscoveredDevice,
) {

	session.mu.Lock()
	session.Progress = progress
	session.ScannedCount = scannedCount
	if totalCount > 0 {
		session.TotalCount = totalCount
	}
	session.DevicesFound = len(devices)
	session.Devices = devices
	session.mu.Unlock()

	if service.eventPublisher != nil {
		elapsedTime := int(time.Since(session.StartTime).Milliseconds())
		event := events.NewDeviceScanProgressEvent(
			session.ID,
			session.RouterID,
			events.ScanStatus(session.Status),
			progress,
			scannedCount,
			totalCount,
			devices,
			elapsedTime,
			"arp-scanner",
		)
		if err := service.eventBus.Publish(ctx, event); err != nil {
			service.log.Error("failed to publish progress event", zap.Error(err))
		}
	}
}

// markSessionCompleted marks a session as completed.
func markSessionCompleted(
	ctx context.Context,
	service *ARPScannerService,
	session *ScanSession,
	devices []events.DiscoveredDevice,
) {

	session.mu.Lock()
	session.Status = ScanStatusCompleted
	session.Progress = 100
	session.DevicesFound = len(devices)
	session.Devices = devices
	now := time.Now()
	session.EndTime = &now
	session.mu.Unlock()

	if service.eventPublisher != nil {
		duration := int(time.Since(session.StartTime).Milliseconds())
		event := events.NewDeviceScanCompletedEvent(
			session.ID,
			session.RouterID,
			len(devices),
			duration,
			devices,
			"arp-scanner",
		)
		if err := service.eventBus.Publish(ctx, event); err != nil {
			service.log.Error("failed to publish completed event", zap.Error(err))
		}
	}

	service.log.Info("scan completed",
		zap.String("scanID", session.ID),
		zap.Int("devicesFound", len(devices)),
	)
}

// markSessionFailed marks a session as failed.
func markSessionFailed(
	ctx context.Context,
	service *ARPScannerService,
	session *ScanSession,
	errorMsg string,
) {

	session.mu.Lock()
	session.Status = ScanStatusFailed
	session.Error = errorMsg
	now := time.Now()
	session.EndTime = &now
	session.mu.Unlock()

	if service.eventPublisher != nil {
		event := events.NewDeviceScanFailedEvent(
			session.ID,
			session.RouterID,
			errorMsg,
			"arp-scanner",
		)
		if err := service.eventBus.Publish(ctx, event); err != nil {
			service.log.Error("failed to publish failed event", zap.Error(err))
		}
	}

	service.log.Error("scan failed",
		zap.String("scanID", session.ID),
		zap.String("error", errorMsg),
	)
}
