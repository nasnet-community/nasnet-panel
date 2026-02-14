package main

// Thin wrapper that delegates to pkg/router/adapters/mikrotik.
// The original implementation has been moved to backend/pkg/router/adapters/mikrotik/.

import (
	"backend/pkg/router/adapters/mikrotik"
)

// Type aliases for backward compatibility within package main.
type TelnetClient = mikrotik.TelnetClient
type TelnetClientConfig = mikrotik.TelnetClientConfig
type TelnetClientPool = mikrotik.TelnetClientPool

// Constructor wrappers for backward compatibility.
var NewTelnetClientPool = mikrotik.NewTelnetClientPool
