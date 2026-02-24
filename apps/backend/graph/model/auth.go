package model

import (
	"time"
)

// AuthPayload represents the response from a successful login
type AuthPayload struct {
	Token     string    `json:"-"`
	User      *User     `json:"user"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// User represents a user account
type User struct {
	ID          string     `json:"id"`
	Username    string     `json:"username"`
	Role        UserRole   `json:"role"`
	Email       *string    `json:"email,omitempty"`
	DisplayName *string    `json:"displayName,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
}

// IsNode implements the Node interface
func (User) IsNode() {}

// UserRole represents user authorization levels
type UserRole string

const (
	UserRoleAdmin    UserRole = "ADMIN"
	UserRoleOperator UserRole = "OPERATOR"
	UserRoleViewer   UserRole = "VIEWER"
)

// AllUserRole contains all valid user roles
var AllUserRole = []UserRole{
	UserRoleAdmin,
	UserRoleOperator,
	UserRoleViewer,
}

// IsValid checks if the role is valid
func (e UserRole) IsValid() bool {
	switch e {
	case UserRoleAdmin, UserRoleOperator, UserRoleViewer:
		return true
	}
	return false
}

// String returns the string value
func (e UserRole) String() string {
	return string(e)
}

// Session represents an active user session
type Session struct {
	ID           string    `json:"id"`
	IPAddress    *string   `json:"ipAddress,omitempty"`
	UserAgent    *string   `json:"userAgent,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	LastActivity time.Time `json:"lastActivity"`
	IsCurrent    bool      `json:"isCurrent"`
}

// AuthErrorCode represents authentication error codes
type AuthErrorCode string

const (
	AuthErrorCodeInvalidCredentials      AuthErrorCode = "INVALID_CREDENTIALS"
	AuthErrorCodeSessionExpired          AuthErrorCode = "SESSION_EXPIRED"
	AuthErrorCodeTokenInvalid            AuthErrorCode = "TOKEN_INVALID"
	AuthErrorCodeTokenExpired            AuthErrorCode = "TOKEN_EXPIRED"
	AuthErrorCodeInsufficientRole        AuthErrorCode = "INSUFFICIENT_ROLE"
	AuthErrorCodeRateLimited             AuthErrorCode = "RATE_LIMITED"
	AuthErrorCodePasswordPolicyViolation AuthErrorCode = "PASSWORD_POLICY_VIOLATION"
)

// AllAuthErrorCode contains all valid auth error codes
var AllAuthErrorCode = []AuthErrorCode{
	AuthErrorCodeInvalidCredentials,
	AuthErrorCodeSessionExpired,
	AuthErrorCodeTokenInvalid,
	AuthErrorCodeTokenExpired,
	AuthErrorCodeInsufficientRole,
	AuthErrorCodeRateLimited,
	AuthErrorCodePasswordPolicyViolation,
}

// IsValid checks if the error code is valid
func (e AuthErrorCode) IsValid() bool {
	switch e {
	case AuthErrorCodeInvalidCredentials, AuthErrorCodeSessionExpired,
		AuthErrorCodeTokenInvalid, AuthErrorCodeTokenExpired,
		AuthErrorCodeInsufficientRole, AuthErrorCodeRateLimited,
		AuthErrorCodePasswordPolicyViolation:
		return true
	}
	return false
}

// String returns the string value
func (e AuthErrorCode) String() string {
	return string(e)
}
