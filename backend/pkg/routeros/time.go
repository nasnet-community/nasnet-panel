package routeros

import "nasnet-panel/pkg/utils"

// FormatRouterOSTime wraps utils.FormatRouterOSTime for backward compatibility
func FormatRouterOSTime(routerOSTime string) string {
	return utils.FormatRouterOSTime(routerOSTime)
}
