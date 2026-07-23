package server

import (
	"context"
	"crypto/tls"
	"net"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// ServeTLS starts an HTTPS server on addr using the provided TLS config and Echo handler.
// It bypasses echo.StartServer so that http.Server.ErrorLog is not overridden by Echo
// internally, allowing the caller to control server-level error logging.
func ServeTLS(e *echo.Echo, addr string, tlsConfig *tls.Config) error {
	ln, err := (&net.ListenConfig{}).Listen(context.Background(), "tcp", addr)
	if err != nil {
		return err
	}

	srv := &http.Server{
		Handler:           e,
		ReadHeaderTimeout: 15 * time.Second,
		ErrorLog:          filteredErrorLog("TLS handshake error"),
	}

	return srv.Serve(tls.NewListener(ln, tlsConfig))
}
