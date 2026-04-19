package auth

import (
	"encoding/base64"
	"strings"
)

type Credentials struct {
	Username     string
	Password     string
	RouterOSHost string
}

func ExtractBasicAuth(authHeader string) (*Credentials, error) {
	if authHeader == "" {
		return nil, ErrMissingAuth
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Basic" {
		return nil, ErrInvalidAuthFormat
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrInvalidBase64
	}

	credentials := strings.SplitN(string(decoded), ":", 2)
	if len(credentials) != 2 {
		return nil, ErrInvalidCredentialFormat
	}

	return &Credentials{
		Username: credentials[0],
		Password: credentials[1],
	}, nil
}

func ExtractRouterOSHost(hostHeader string) (string, error) {
	if hostHeader == "" {
		return "", ErrMissingRouterOSHost
	}

	host := strings.TrimSpace(hostHeader)
	if host == "" {
		return "", ErrMissingRouterOSHost
	}

	return host, nil
}
