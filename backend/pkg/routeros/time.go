//nolint:misspell // package name is intentional: routeros not routers
package routeros

import "nasnet-panel/pkg/utils"

// FormatRouterOSTimestamp wraps utils.FormatRouterOSTimestamp for RouterOS timestamp formatting.
func FormatRouterOSTimestamp(timestamp string) string {
	return utils.FormatRouterOSTimestamp(timestamp)
}
