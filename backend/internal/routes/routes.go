package routes

import (
	"nasnet-panel/internal/handler"
	"nasnet-panel/internal/middleware"

	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"
	_ "nasnet-panel/docs"
)

func RegisterRoutes(e *echo.Echo) {
	e.GET("/health", handler.HandleHealthCheck)
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	systemGroup := e.Group("/api/system")
	systemGroup.Use(middleware.RouterOSAuth)
	{
		systemGroup.GET("/info", handler.HandleGetSystemInfo)
		systemGroup.GET("/identity", handler.HandleGetSystemIdentity)
		systemGroup.PUT("/identity", handler.HandleSetSystemIdentity)
		systemGroup.GET("/updates", handler.HandleGetSystemUpdates)
		systemGroup.GET("/resources", handler.HandleGetResourceInfo)
		systemGroup.PUT("/password", handler.HandleChangeUserPassword)
		systemGroup.POST("/reboot", handler.HandleRebootSystem)
		systemGroup.POST("/shutdown", handler.HandleShutdownSystem)
	}

	wifiGroup := e.Group("/api/wifi")
	wifiGroup.Use(middleware.RouterOSAuth)
	{
		wifiGroup.GET("/interfaces", handler.HandleListWiFiInterfaces)
		wifiGroup.GET("/interfaces/:name", handler.HandleGetWiFiInterface)
		wifiGroup.PUT("/interfaces/:name", handler.HandleUpdateWiFiInterface)
		wifiGroup.GET("/clients", handler.HandleListWiFiConnectedClients)
		wifiGroup.DELETE("/clients/:mac", handler.HandleRemoveWiFiConnectedClient)
		wifiGroup.GET("/passphrase/:name", handler.HandleGetWiFiPassphrase)
		wifiGroup.PUT("/passphrase/:name", handler.HandleChangeWiFiPassphrase)
	}

	dhcpGroup := e.Group("/api/dhcp")
	dhcpGroup.Use(middleware.RouterOSAuth)
	{
		dhcpGroup.GET("/leases", handler.HandleListDHCPLeases)
	}

	firewallGroup := e.Group("/api/firewall")
	firewallGroup.Use(middleware.RouterOSAuth)
	{
		firewallGroup.GET("/rules", handler.HandleListFirewallRules)
	}
}
