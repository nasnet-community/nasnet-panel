// Package diag holds the diag API group handlers.
package diag

import (
	"nasnet-panel/internal/handler/common"
)

// diagFilename is the name of the generated diagnostic report file on the router.
const diagFilename = common.NasnetPanelDir + "/nasnet-diagnostic-report.txt"
