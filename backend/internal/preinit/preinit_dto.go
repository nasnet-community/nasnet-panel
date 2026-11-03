package preinit

import (
	"context"

	"nasnet-panel/pkg/routeros"
)

// Step is one check or operation that runs on a router before its database is used.
type Step struct {
	Name string
	Run  func(ctx context.Context, client *routeros.Client) error
}
