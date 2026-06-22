package main

import (
	"crypto/tls"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/middleware"
	"nasnet-panel/internal/routes"
	"nasnet-panel/pkg/utils"
)

// @title NASNET-Panel API
// @version 1.0
// @description RouterOS Network Management Panel - REST API for managing RouterOS devices
// @contact.name API Support
// @host localhost:8080
// @basePath /
// @schemes http https
// @securityDefinitions.basic BasicAuth
func main() {
	e := echo.New()

	e.HideBanner = true

	middleware.RegisterGlobalMiddleware(e)

	routes.RegisterRoutes(e)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	httpsPort := os.Getenv("HTTPS_PORT")
	if httpsPort == "" {
		httpsPort = "8443"
	}

	cert, err := utils.GenerateSelfSignedCert("nasnet.panel")
	if err != nil {
		log.Fatalf("Failed to generate certificate: %v", err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}

	printStartupInfo(port, httpsPort)

	go func() {
		if err := e.Start(":" + port); err != nil && !errors.Is(err, http.ErrServerClosed) {
			e.Logger.Error(err)
		}
	}()

	if err := e.StartServer(&http.Server{
		Addr:              ":" + httpsPort,
		TLSConfig:         tlsConfig,
		ReadHeaderTimeout: 15 * time.Second,
	}); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("HTTPS server error: %v", err)
	}
}

func printStartupInfo(httpPort, httpsPort string) {
	fmt.Println()
	fmt.Println("╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                       NASNET-PANEL API                         ║")
	fmt.Println("║               RouterOS Network Management Panel                ║")
	fmt.Println("╠════════════════════════════════════════════════════════════════╣")
	fmt.Println("║                                                                ║")
	fmt.Printf("║  🚀 HTTP  Server  running at http://0.0.0.0:%-15s    ║\n", httpPort)
	fmt.Printf("║  🔒 HTTPS Server running at https://0.0.0.0:%-14s     ║\n", httpsPort)
	fmt.Println("║                                                                ║")
	fmt.Printf("║  📚 API Docs: http://localhost:%s/swagger/%-17s  ║\n", httpPort, "")
	fmt.Println("║                                                                ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")
	fmt.Println()
}
