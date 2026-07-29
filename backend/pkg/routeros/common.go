package routeros

import "strings"

// nameOrIDFilterArg builds a GetFirst filter for either a RouterOS internal
// .id (e.g. "*1") or a resource name.
func nameOrIDFilterArg(nameOrID string) string {
	if strings.HasPrefix(nameOrID, "*") {
		return "?=.id=" + nameOrID
	}
	return "?=name=" + nameOrID
}
