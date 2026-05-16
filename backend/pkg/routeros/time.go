package routeros

import "nasnet-panel/pkg/utils"

// FormatRouterOSTime wraps utils.FormatRouterOSTime for RouterOS timestamp formatting.
func FormatRouterOSTime(timestamp string) string {
	return utils.FormatRouterOSTime(timestamp)
}
