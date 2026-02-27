//go:build linux

package isolation

import (
	"os/exec"
)

// detectNamespaceSupport probes whether the system supports network namespaces.
// It attempts to run "unshare --net true" and checks if it succeeds.
func detectNamespaceSupport() bool {
	cmd := exec.Command("unshare", "--net", "true")
	err := cmd.Run()
	return err == nil
}
