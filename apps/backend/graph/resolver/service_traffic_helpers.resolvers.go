package resolver

// This file contains helper/conversion functions for traffic resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/graph/model"
	"fmt"
	"time"
)

// mapQuotaPeriod converts a GraphQL QuotaPeriod to a serviceinstance.QuotaPeriod.
func mapQuotaPeriod(period model.QuotaPeriod) (serviceinstance.QuotaPeriod, error) {
	switch period {
	case model.QuotaPeriodDaily:
		return serviceinstance.QuotaPeriodDaily, nil
	case model.QuotaPeriodWeekly:
		return serviceinstance.QuotaPeriodWeekly, nil
	case model.QuotaPeriodMonthly:
		return serviceinstance.QuotaPeriodMonthly, nil
	default:
		return "", fmt.Errorf("unknown quota period: %s", period)
	}
}

// mapQuotaAction converts a GraphQL QuotaAction to a serviceinstance.QuotaAction.
func mapQuotaAction(action model.QuotaAction) (serviceinstance.QuotaAction, error) {
	switch action {
	case model.QuotaActionLogOnly:
		return serviceinstance.QuotaActionLOG_ONLY, nil
	case model.QuotaActionAlert:
		return serviceinstance.QuotaActionALERT, nil
	case model.QuotaActionStopService:
		return serviceinstance.QuotaActionSTOP_SERVICE, nil
	case model.QuotaActionThrottle:
		return serviceinstance.QuotaActionTHROTTLE, nil
	default:
		return "", fmt.Errorf("unknown quota action: %s", action)
	}
}

// buildTrafficQuotaFromInstance builds a GraphQL TrafficQuota from a ServiceInstance.
func buildTrafficQuotaFromInstance(instance *ent.ServiceInstance) *model.TrafficQuota {
	if instance == nil || instance.QuotaBytes == nil {
		return nil
	}

	quota := &model.TrafficQuota{
		ID:         instance.ID,
		InstanceID: instance.ID,
		LimitBytes: int(*instance.QuotaBytes),
	}

	if instance.QuotaPeriod != nil {
		quota.Period = model.QuotaPeriod(*instance.QuotaPeriod)
	}
	if instance.QuotaAction != nil {
		quota.Action = model.QuotaAction(*instance.QuotaAction)
	}

	return quota
}

// quotaPeriodDuration returns the duration of a quota period.
func quotaPeriodDuration(period *serviceinstance.QuotaPeriod) time.Duration {
	if period == nil {
		return 24 * time.Hour
	}
	switch *period {
	case serviceinstance.QuotaPeriodDaily:
		return 24 * time.Hour
	case serviceinstance.QuotaPeriodWeekly:
		return 7 * 24 * time.Hour
	case serviceinstance.QuotaPeriodMonthly:
		return 30 * 24 * time.Hour
	default:
		return 24 * time.Hour
	}
}
