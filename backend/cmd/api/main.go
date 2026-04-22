package main

import (
	"fmt"
	"log"
	"os"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/middleware"
	"nasnet-panel/internal/routes"
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

	printStartupInfo(port)

	if err := e.Start(":" + port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func printStartupInfo(port string) {
	fmt.Println()
	fmt.Println("╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                       NASNET-PANEL API                         ║")
	fmt.Println("║               RouterOS Network Management Panel                ║")
	fmt.Println("╠════════════════════════════════════════════════════════════════╣")
	fmt.Println("║                                                                ║")
	fmt.Printf("║  🚀 Server running at http://0.0.0.0:%s                      ║\n", port)
	fmt.Println("║                                                                ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")
	fmt.Println()
}
