package auth

import (
	"errors"
)

const (
	// RouterOSHostHeader is the HTTP header name for the RouterOS host.
	RouterOSHostHeader = "X-RouterOS-Host"
)

var (
	// ErrMissingAuth indicates missing Authorization header.
	ErrMissingAuth = errors.New("missing Authorization header")
	// ErrInvalidAuthFormat indicates invalid Authorization header format.
	ErrInvalidAuthFormat = errors.New("invalid Authorization header format, expected 'Basic <base64>'")
	// ErrInvalidBase64 indicates invalid base64 encoding in Authorization header.
	ErrInvalidBase64 = errors.New("invalid base64 encoding in Authorization header")
	// ErrInvalidCredentialFormat indicates invalid credential format.
	ErrInvalidCredentialFormat = errors.New("invalid credential format, expected 'username:password'")
	// ErrMissingRouterOSHost indicates missing X-RouterOS-Host header.
	ErrMissingRouterOSHost = errors.New("missing X-RouterOS-Host header")
)
