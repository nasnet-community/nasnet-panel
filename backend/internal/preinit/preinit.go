// Package preinit runs the checks and operations a router needs before the panel uses its database.
package preinit

import (
	"context"
	"log"

	"nasnet-panel/pkg/routeros"
)

var steps = []Step{
	{Name: "move certificate files", Run: moveCertificateFiles},
	{Name: "rename the base config success file", Run: renameSuccessFile},
}

// Run executes every step in order. A failing step is logged and does not stop the others. It
// returns when the steps finish or ctx ends, whichever comes first. The RouterOS client does not
// take a context, so a step stuck in a router call keeps running in the background, but no step
// starts after ctx has ended.
func Run(ctx context.Context, host string, client *routeros.Client) {
	done := make(chan struct{})
	go func() {
		defer close(done)
		for _, step := range steps {
			if ctx.Err() != nil {
				return
			}
			if err := step.Run(ctx, client); err != nil {
				log.Printf("Pre-init step %q failed on router %s: %v", step.Name, host, err)
			}
		}
	}()

	select {
	case <-done:
	case <-ctx.Done():
		log.Printf("Pre-init on router %s did not finish in time: %v", host, ctx.Err())
	}
}
