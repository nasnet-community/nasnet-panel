// Package scan holds the scan API group handlers.
package scan

import (
	"time"

	pkgScanner "nasnet-panel/internal/scanner"
)

var (
	scannerPool = &Pool{
		activeTasks: make(map[string]*Task),
	}
	scanConfig = pkgScanner.Config{
		MaxWorkers:  20,
		Timeout:     200 * time.Millisecond,
		TargetPorts: []int{80, 443, 8728, 8729, 8291},
	}
	statusCompleted = "completed"
)
