package auth

import "time"

// LoginRequest is the body of POST /api/auth/login.
type LoginRequest struct {
	Host     string `json:"host" example:"192.168.88.1"`
	Username string `json:"username" example:"admin"`
	Password string `json:"password" example:"password123"`
}

// LoginResponse is the response of POST /api/auth/login.
type LoginResponse struct {
	Token     string    `json:"token" example:"eyJhbGciOiJIUzI1NiIs..."`
	TokenType string    `json:"tokenType" example:"Bearer"`
	ExpiresAt time.Time `json:"expiresAt"`
	Host      string    `json:"host" example:"192.168.88.1"`
	Username  string    `json:"username" example:"admin"`
}
