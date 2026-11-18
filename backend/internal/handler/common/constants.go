// Package common holds the helpers, DTOs and constants shared by the API group packages.
package common

import (
	"errors"
	"regexp"

	"nasnet-panel/pkg/routeros"
)

// AppContainerName is the name of the application container.
const (
	AppContainerName = "nasnet-panel" // matches CONTAINER_NAME in scripts/install.sh
)

// The release channel names.
const (
	ReleaseChannelStable = "stable"
	ReleaseChannelRC     = "rc"
	ReleaseChannelDev    = "dev"
)

// ReleaseVersionPattern matches a release tag and captures its version parts.
var (
	ReleaseVersionPattern = regexp.MustCompile(`^v?(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+)|-dev\.(\d{8})\.(\d+))?$`)
)

// ErrClientCreationFailed marks that the RouterOS client could not be created and the error response was already written.
var ErrClientCreationFailed = errors.New("routeros client creation failed")

// NasnetPanelDir is the directory in the router's root storage where the
// wizard and diagnostic scripts keep the files they create.
const NasnetPanelDir = routeros.NasnetPanelDir

// ErrMissingCredentials is returned when the request context has no RouterOS credentials.
var (
	ErrMissingCredentials = errors.New("missing RouterOS credentials in request context")
)
