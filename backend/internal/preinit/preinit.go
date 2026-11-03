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

// Run executes every step in order. A failing step is logged and does not stop the others.
func Run(ctx context.Context, host string, client *routeros.Client) {
	for _, step := range steps {
		if err := step.Run(ctx, client); err != nil {
			log.Printf("Pre-init step %q failed on router %s: %v", step.Name, host, err)
		}
	}
}
