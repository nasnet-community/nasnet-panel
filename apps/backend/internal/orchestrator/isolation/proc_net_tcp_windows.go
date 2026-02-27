//go:build windows

package isolation

// ProcessBindingConflict represents a detected process binding conflict
type ProcessBindingConflict struct {
	LocalIP   string
	LocalPort int
	State     string // TCP state (LISTEN, ESTABLISHED, etc.)
}

// parseProcNetTCP is a Windows stub that always returns nil (process binding verification not supported on Windows)
func (iv *IsolationVerifier) parseProcNetTCP(bindIP string) ([]ProcessBindingConflict, error) {
	if iv.logger != nil {
		iv.logger.Debug("process binding verification not supported on Windows, skipping")
	}
	return nil, nil
}
