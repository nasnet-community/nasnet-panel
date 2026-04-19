package context

import (
	"nasnet-panel/internal/auth"

	"github.com/labstack/echo/v4"
)

const CredentialsContextKey = "credentials"

func SetCredentials(c echo.Context, creds *auth.Credentials) {
	c.Set(CredentialsContextKey, creds)
}

func GetCredentials(c echo.Context) (*auth.Credentials, bool) {
	creds, ok := c.Get(CredentialsContextKey).(*auth.Credentials)
	return creds, ok
}
