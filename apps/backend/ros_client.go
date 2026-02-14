package main

// Thin wrapper that delegates to pkg/router/adapters/mikrotik.
// The original implementation has been moved to backend/pkg/router/adapters/mikrotik/.

import (
	"backend/pkg/router/adapters/mikrotik"
)

// Type aliases for backward compatibility within package main.
type ROSClient = mikrotik.ROSClient
type ROSClientConfig = mikrotik.ROSClientConfig
type ROSClientPool = mikrotik.ROSClientPool

// Constructor wrappers for backward compatibility.
var NewROSClient = mikrotik.NewROSClient
var NewROSClientPool = mikrotik.NewROSClientPool
