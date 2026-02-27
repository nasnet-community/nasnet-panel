package resolver

import (
	"backend/generated/ent"
	"context"
	"time"
)

func (r *queryResolver) calculatePeriodTraffic(
	ctx context.Context,
	endTime time.Time,
	instanceID string,
	instance *ent.ServiceInstance,
	totalUpload, totalDownload int64,
) (periodUpload, periodDownload int64) {

	if instance.QuotaResetAt != nil {
		periodDur := quotaPeriodDuration(instance.QuotaPeriod)
		periodStart := instance.QuotaResetAt.Add(-periodDur)
		periodRecords, getPeriodErr := r.TrafficAggregator.GetHourlyTraffic(
			ctx,
			instanceID,
			periodStart,
			endTime,
		)
		if getPeriodErr == nil {
			for _, rec := range periodRecords {
				periodUpload += rec.TxBytes
				periodDownload += rec.RxBytes
			}
		}
	} else {
		periodUpload = totalUpload
		periodDownload = totalDownload
	}

	return periodUpload, periodDownload
}
