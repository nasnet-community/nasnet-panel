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
	systemGroup.GET("/info", handler.HandleGetSystemInfo)
	systemGroup.GET("/identity", handler.HandleGetSystemIdentity)
	systemGroup.PUT("/identity", handler.HandleSetSystemIdentity)
	systemGroup.GET("/updates", handler.HandleGetSystemUpdates)
	systemGroup.GET("/resources", handler.HandleGetResourceInfo)
	systemGroup.PUT("/password", handler.HandleChangeUserPassword)
	systemGroup.POST("/reboot", handler.HandleRebootSystem)
	systemGroup.POST("/shutdown", handler.HandleShutdownSystem)

	wifiGroup := e.Group("/api/wifi")
	wifiGroup.Use(middleware.RouterOSAuth)
	wifiGroup.GET("/interfaces", handler.HandleListWiFiInterfaces)
	wifiGroup.GET("/interfaces/:name", handler.HandleGetWiFiInterface)
	wifiGroup.PUT("/interfaces/:name", handler.HandleUpdateWiFiInterface)
	wifiGroup.PUT("/settings/:name", handler.HandleUpdateWiFiSettings)
	wifiGroup.GET("/clients", handler.HandleListWiFiConnectedClients)
	wifiGroup.DELETE("/clients/:mac", handler.HandleRemoveWiFiConnectedClient)
	wifiGroup.GET("/passphrase/:name", handler.HandleGetWiFiPassphrase)
	wifiGroup.PUT("/passphrase/:name", handler.HandleChangeWiFiPassphrase)

	dhcpGroup := e.Group("/api/dhcp")
	dhcpGroup.Use(middleware.RouterOSAuth)
	dhcpGroup.GET("/leases", handler.HandleListDHCPLeases)
	dhcpGroup.POST("/leases/make-static", handler.HandleMakeDHCPLeaseStatic)
	dhcpGroup.DELETE("/leases/:macAddress", handler.HandleRemoveDHCPLease)
	dhcpGroup.GET("/clients", handler.HandleListDHCPClients)
	dhcpGroup.GET("/servers", handler.HandleListDHCPServers)

	firewallGroup := e.Group("/api/firewall")
	firewallGroup.Use(middleware.RouterOSAuth)
	firewallGroup.GET("/rules", handler.HandleListFirewallRules)

	scanGroup := e.Group("/api/scan")
	scanGroup.POST("", handler.HandleStartScan)
	scanGroup.GET("/status/:taskId", handler.HandleScanStatus)
	scanGroup.POST("/stop", handler.HandleStopScan)
	scanGroup.POST("/auto", handler.HandleAutoScan)
	scanGroup.POST("/verify", handler.HandleVerifyIP)

	logsGroup := e.Group("/api/logs")
	logsGroup.Use(middleware.RouterOSAuth)
	logsGroup.GET("", handler.HandleGetLogs)

	dnsGroup := e.Group("/api/dns")
	dnsGroup.Use(middleware.RouterOSAuth)
	dnsGroup.GET("/info", handler.HandleGetDNSInfo)
	dnsGroup.PUT("/info", handler.HandleUpdateDNS)

	vpnGroup := e.Group("/api/vpn")
	vpnGroup.Use(middleware.RouterOSAuth)
	vpnGroup.GET("/clients", handler.HandleListVPNClients)
	vpnGroup.GET("/clients/:name", handler.HandleGetVPNClient)
	vpnGroup.PUT("/clients/:name", handler.HandleUpdateVPNClient)
	vpnGroup.GET("/servers", handler.HandleGetVPNServersStatus)
	vpnGroup.GET("/ovpn-server/:name", handler.HandleGetOvpnServerDetails)
	vpnGroup.GET("/pptp-server", handler.HandleGetPptpServerDetails)
	vpnGroup.GET("/l2tp-server", handler.HandleGetL2tpServerDetails)
	vpnGroup.GET("/sstp-server", handler.HandleGetSstpServerDetails)
	vpnGroup.GET("/wireguard-server/:name", handler.HandleGetWireguardServerDetails)

	handler.RegisterSPA(e)
}
