package auth

import (
	"errors"
)

var (
	ErrMissingAuth             = errors.New("missing Authorization header")
	ErrInvalidAuthFormat       = errors.New("invalid Authorization header format, expected 'Basic <base64>'")
	ErrInvalidBase64           = errors.New("invalid base64 encoding in Authorization header")
	ErrInvalidCredentialFormat = errors.New("invalid credential format, expected 'username:password'")
	ErrMissingRouterOSHost     = errors.New("missing X-RouterOS-Host header")
	ErrEmptyRouterOSHost       = errors.New("X-RouterOS-Host header cannot be empty")
)
