package utils

import (
	"strconv"
	"strings"
)

// IsNewerVersion returns true when latest is a higher semver than current.
// Returns false if either string cannot be parsed as vX.Y.Z (e.g. a dummy
// development version).
func IsNewerVersion(latest, current string) bool {
	lv, ok1 := ParseSemver(latest)
	cv, ok2 := ParseSemver(current)
	if !ok1 || !ok2 {
		return false
	}
	if lv[0] != cv[0] {
		return lv[0] > cv[0]
	}
	if lv[1] != cv[1] {
		return lv[1] > cv[1]
	}
	return lv[2] > cv[2]
}

// ParseSemver parses vX.Y.Z (optional v prefix, optional pre-release suffix after patch).
func ParseSemver(v string) ([3]int, bool) {
	v = strings.TrimPrefix(v, "v")
	parts := strings.SplitN(v, ".", 3)
	if len(parts) != 3 {
		return [3]int{}, false
	}
	var nums [3]int
	for i, p := range parts {
		p, _, _ = strings.Cut(p, "-")
		n, err := strconv.Atoi(p)
		if err != nil {
			return [3]int{}, false
		}
		nums[i] = n
	}
	return nums, true
}
