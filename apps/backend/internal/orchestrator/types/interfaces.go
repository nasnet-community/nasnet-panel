package types

import "context"

// HealthProbe defines an interface for health checking
type HealthProbe interface {
	Check(ctx context.Context) error
	Name() string
}
