// Package session holds the auth API group handlers: login and logout.
package session

import "time"

const (
	tokenType = "Bearer"

	loginBurst         = 10
	loginRefillEvery   = 6 * time.Second
	loginLimiterIdle   = 15 * time.Minute
	loginLimiterMaxKey = 10000
)
