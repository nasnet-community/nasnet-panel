package routeros

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Version is a RouterOS release number such as 7.24.5 or 7.12rc1.
type Version struct {
	text  string
	nums  []int
	stage int // a beta sorts before a release candidate, and both before the release
	n     int // the number after "beta" or "rc"
}

const (
	stageBeta = iota
	stageRC
	stageRelease
)

// /system/resource prints the channel after the number: "7.24.5 (stable)".
var versionPattern = regexp.MustCompile(`^(\d+(?:\.\d+){1,2})(?:(beta|rc)(\d+))?(?: \([a-z-]+\))?$`)

// ParseVersion reads a RouterOS version as /system/resource reports it, or as a
// manifest writes it. Anything else is an error rather than a guess, since a
// wrong reading would let an install through (or refuse one) for no reason.
func ParseVersion(s string) (Version, error) {
	m := versionPattern.FindStringSubmatch(strings.TrimSpace(s))
	if m == nil {
		return Version{}, fmt.Errorf("%q is not a RouterOS version such as 7.11, 7.12rc1 or 7.24.5", s)
	}

	var v Version
	for _, part := range strings.Split(m[1], ".") {
		n, err := strconv.Atoi(part)
		if err != nil {
			return Version{}, fmt.Errorf("%q is not a RouterOS version: %w", s, err)
		}
		v.nums = append(v.nums, n)
	}
	v.text = m[1]

	v.stage = stageRelease
	if m[2] != "" {
		n, err := strconv.Atoi(m[3])
		if err != nil {
			return Version{}, fmt.Errorf("%q is not a RouterOS version: %w", s, err)
		}
		v.stage, v.n = stageBeta, n
		if m[2] == "rc" {
			v.stage = stageRC
		}
		v.text += m[2] + m[3]
	}
	return v, nil
}

// String is the version without its channel, as it was written.
func (v Version) String() string { return v.text }

// Compare returns -1, 0 or 1 as v is older than, the same as or newer than
// other. 7.12beta3 < 7.12rc1 < 7.12 < 7.12.1, and a missing part counts as zero.
func (v Version) Compare(other Version) int {
	for i := 0; i < max(len(v.nums), len(other.nums)); i++ {
		if c := cmpInt(partAt(v.nums, i), partAt(other.nums, i)); c != 0 {
			return c
		}
	}
	if c := cmpInt(v.stage, other.stage); c != 0 {
		return c
	}
	return cmpInt(v.n, other.n)
}

func partAt(nums []int, i int) int {
	if i < len(nums) {
		return nums[i]
	}
	return 0
}

func cmpInt(a, b int) int {
	switch {
	case a < b:
		return -1
	case a > b:
		return 1
	}
	return 0
}
