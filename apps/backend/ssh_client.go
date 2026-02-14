package main

// Thin wrapper that delegates to pkg/router/adapters/mikrotik.
// The original implementation has been moved to backend/pkg/router/adapters/mikrotik/.

import (
	"backend/pkg/router/adapters/mikrotik"
)

// Type aliases for backward compatibility within package main.
type SSHClient = mikrotik.SSHClient
type SSHClientConfig = mikrotik.SSHClientConfig
type SSHClientPool = mikrotik.SSHClientPool
type SSHCommandResult = mikrotik.SSHCommandResult

// Constructor wrappers for backward compatibility.
var NewSSHClientPool = mikrotik.NewSSHClientPool
