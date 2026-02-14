package main

// Thin wrapper that delegates to pkg/router/adapters/mikrotik.
// The original implementation has been moved to backend/pkg/router/adapters/mikrotik/.

import (
	"net/http"

	"backend/pkg/router/adapters/mikrotik"
)

// RouterProxyRequest delegates to mikrotik.RouterProxyRequest.
type RouterProxyRequest = mikrotik.RouterProxyRequest

// RouterProxyResponse delegates to mikrotik.RouterProxyResponse.
type RouterProxyResponse = mikrotik.RouterProxyResponse

// initializeContainerIPs delegates to the mikrotik package.
func initializeContainerIPs() {
	mikrotik.InitializeContainerIPs()
}

// detectDefaultGateway delegates to the mikrotik package.
func detectDefaultGateway() {
	mikrotik.DetectDefaultGateway()
}

// handleRouterProxy delegates to the mikrotik package.
func handleRouterProxy(w http.ResponseWriter, r *http.Request) {
	mikrotik.HandleRouterProxy(w, r)
}
