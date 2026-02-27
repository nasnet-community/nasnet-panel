package svcalert

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/alertdigestentry"

	"go.uber.org/zap"
)

// GetDigestQueueCount returns the number of alerts in the digest queue for a channel.
func (s *Service) GetDigestQueueCount(ctx context.Context, channelID string) (int, error) {
	count, err := s.db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtIsNil(),
		).
		Count(ctx)
	if err != nil {
		s.log.Error("failed to count digest queue", zap.Error(err), zap.String("channel_id", channelID))
		return 0, fmt.Errorf("failed to count digest queue: %w", err)
	}
	return count, nil
}

// GetDigestHistory retrieves digest delivery history for a channel.
func (s *Service) GetDigestHistory(ctx context.Context, channelID string, limit int) ([]DigestSummary, error) {
	if limit <= 0 {
		limit = 10
	}

	entries, err := s.db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
			alertdigestentry.DigestIDNotNil(),
		).
		Order(ent.Desc("delivered_at")).
		Limit(limit * 10).
		All(ctx)
	if err != nil {
		s.log.Error("failed to query digest history", zap.Error(err), zap.String("channel_id", channelID))
		return nil, fmt.Errorf("failed to query digest history: %w", err)
	}

	digestMap := make(map[string]*DigestSummary)
	digestOrder := []string{}

	for _, entry := range entries {
		if entry.DigestID == "" || entry.DeliveredAt == nil {
			continue
		}
		digestID := entry.DigestID
		if _, exists := digestMap[digestID]; !exists {
			period := "Unknown"
			if !entry.QueuedAt.IsZero() && !entry.DeliveredAt.IsZero() {
				duration := entry.DeliveredAt.Sub(entry.QueuedAt)
				switch {
				case duration < time.Hour:
					period = fmt.Sprintf("Last %d minutes", int(duration.Minutes()))
				case duration < 24*time.Hour:
					period = fmt.Sprintf("Last %d hours", int(duration.Hours()))
				default:
					period = fmt.Sprintf("Last %d days", int(duration.Hours()/24))
				}
			}
			digestMap[digestID] = &DigestSummary{
				ID:          digestID,
				ChannelID:   channelID,
				DeliveredAt: *entry.DeliveredAt,
				AlertCount:  1,
				Period:      period,
			}
			digestOrder = append(digestOrder, digestID)
		} else {
			digestMap[digestID].AlertCount++
		}
	}

	result := make([]DigestSummary, 0, limit)
	for i := 0; i < len(digestOrder) && i < limit; i++ {
		digest := digestMap[digestOrder[i]]
		if digest == nil {
			continue
		}
		result = append(result, *digest)
	}
	return result, nil
}

// TriggerDigestNow forces immediate digest delivery for a channel.
func (s *Service) TriggerDigestNow(ctx context.Context, channelID string) (*DigestSummary, error) {
	if s.digestService == nil {
		return nil, fmt.Errorf("digest service not available")
	}

	if err := s.digestService.DeliverDigest(ctx, channelID); err != nil {
		s.log.Error("failed to trigger digest delivery", zap.Error(err), zap.String("channel_id", channelID))
		return nil, fmt.Errorf("failed to trigger digest delivery: %w", err)
	}

	history, err := s.GetDigestHistory(ctx, channelID, 1)
	if err != nil {
		s.log.Warn("failed to get digest history after trigger", zap.Error(err), zap.String("channel_id", channelID))
		return &DigestSummary{
			ID:          fmt.Sprintf("digest-%d", time.Now().Unix()),
			ChannelID:   channelID,
			DeliveredAt: time.Now(),
			AlertCount:  0,
			Period:      "Immediate",
		}, nil
	}

	if len(history) == 0 {
		return &DigestSummary{
			ID:          fmt.Sprintf("digest-%d", time.Now().Unix()),
			ChannelID:   channelID,
			DeliveredAt: time.Now(),
			AlertCount:  0,
			Period:      "Immediate",
		}, nil
	}

	return &history[0], nil
}
