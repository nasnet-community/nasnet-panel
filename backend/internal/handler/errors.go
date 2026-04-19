package handler

import "errors"

var (
	ErrMissingCredentials = errors.New("missing RouterOS credentials in request context")
)
