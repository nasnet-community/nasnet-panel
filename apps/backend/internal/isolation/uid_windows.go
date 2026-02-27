//go:build windows

package isolation

// AllocateUID is a stub on Windows.
// UIDs are a POSIX concept and don't apply on Windows.
// This always returns 0, 0 (no user separation on Windows).
func AllocateUID(instanceID string) (uid, gid uint32) {
	return 0, 0
}
