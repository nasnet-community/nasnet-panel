package routeros

import (
	"strings"

	"github.com/go-routeros/routeros/v3/proto"
)

// nameOrIDFilterArg builds a GetFirst filter for either a RouterOS internal
// .id (e.g. "*1") or a resource name.
func nameOrIDFilterArg(nameOrID string) string {
	if strings.HasPrefix(nameOrID, "*") {
		return "?=.id=" + nameOrID
	}
	return "?=name=" + nameOrID
}

// joinPairValues concatenates every value for key found in pairs, in order,
// separated by "; ". RouterOS can return more than one entry for a key such
// as .about (e.g. a progress message followed by the actual error); a plain
// map collapses those down to just the last one, so callers that need all of
// them must read the sentence's raw ordered pair list instead.
func joinPairValues(pairs []proto.Pair, key string) string {
	var values []string
	for _, p := range pairs {
		if p.Key == key && p.Value != "" {
			values = append(values, p.Value)
		}
	}
	return strings.Join(values, "; ")
}
