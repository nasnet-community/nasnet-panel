//go:build linux

package isolation

import (
	"hash/fnv"
)

// AllocateUID generates a deterministic UID and GID for a service instance.
// It uses FNV hash of the instanceID to map to a reserved range (65534-66534).
// This ensures the same instanceID always gets the same UID.
func AllocateUID(instanceID string) (uid, gid uint32) {
	// FNV-1a hash
	h := fnv.New32a()
	h.Write([]byte(instanceID))
	hash := h.Sum32()

	// Map to range 65534-66534 (1000 UIDs reserved for services)
	// UID 65534 is typically "nobody" but we use the range as a service pool
	uid = 65534 + (hash % 1000)
	gid = uid // Use same value as GID for simplicity

	return uid, gid
}
