//go:build windows

package isolation

// detectNamespaceSupport always returns false on Windows.
// Network namespaces are a Linux kernel feature.
func detectNamespaceSupport() bool {
	return false
}
