package handler

// HealthCheck godoc
// @Summary Health check endpoint
// @Description Returns health status of the API
// @Tags System
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
type HealthCheck struct{}

// GetSystemInfo godoc
// @Summary Get system information
// @Description Retrieve system information from RouterOS device
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "System information"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/info [get]
type GetSystemInfo struct{}

// GetSystemIdentity godoc
// @Summary Get system identity
// @Description Retrieve the system identity/hostname
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "System identity"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/identity [get]
type GetSystemIdentity struct{}

// SetSystemIdentity godoc
// @Summary Set system identity
// @Description Change the system identity/hostname
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param body body SetSystemIdentityRequest true "System identity"
// @Success 200 {object} map[string]interface{} "Identity updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/identity [post]
type SetSystemIdentity struct{}

// GetSystemUpdates godoc
// @Summary Get system update information
// @Description Retrieve available system updates
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "Update information"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/updates [get]
type GetSystemUpdates struct{}

// GetResourceInfo godoc
// @Summary Get system resource information
// @Description Retrieve CPU, memory, and storage information
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "Resource information"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/resources [get]
type GetResourceInfo struct{}

// ChangeUserPassword godoc
// @Summary Change user password
// @Description Change the password for a RouterOS user
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param body body ChangeUserPasswordRequest true "User password change"
// @Success 200 {object} map[string]interface{} "Password changed"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/password [post]
type ChangeUserPassword struct{}

// RebootSystem godoc
// @Summary Reboot system
// @Description Initiate a system reboot
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "Reboot initiated"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/reboot [post]
type RebootSystem struct{}

// ShutdownSystem godoc
// @Summary Shutdown system
// @Description Initiate a system shutdown
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "Shutdown initiated"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/shutdown [post]
type ShutdownSystem struct{}

// ListWiFiInterfaces godoc
// @Summary List WiFi interfaces
// @Description Get all WiFi interfaces on the device
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "WiFi interfaces list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces [get]
type ListWiFiInterfaces struct{}

// GetWiFiInterface godoc
// @Summary Get WiFi interface details
// @Description Get details of a specific WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param name path string true "Interface name"
// @Success 200 {object} map[string]interface{} "WiFi interface details"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces/{name} [get]
type GetWiFiInterface struct{}

// GetWiFiPassphrase godoc
// @Summary Get WiFi passphrase
// @Description Get the current passphrase of a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param name path string true "Interface name"
// @Success 200 {object} map[string]interface{} "WiFi passphrase"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/passphrase/{name} [get]
type GetWiFiPassphrase struct{}

// ChangeWiFiPassphrase godoc
// @Summary Change WiFi passphrase
// @Description Change the passphrase for a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param name path string true "Interface name"
// @Param body body ChangeWiFiPassphraseRequest true "New passphrase"
// @Success 200 {object} map[string]interface{} "Passphrase changed"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/passphrase/{name} [post]
type ChangeWiFiPassphrase struct{}

// ListWiFiConnectedClients godoc
// @Summary List connected WiFi clients
// @Description Get all clients connected to WiFi interfaces
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param interface query string false "Filter by interface name"
// @Success 200 {object} map[string]interface{} "Connected clients list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/clients [get]
type ListWiFiConnectedClients struct{}

// RemoveWiFiConnectedClient godoc
// @Summary Remove WiFi client
// @Description Disconnect a WiFi client
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param mac path string true "MAC address"
// @Success 200 {object} map[string]interface{} "Client removed"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/clients/{mac}/remove [post]
type RemoveWiFiConnectedClient struct{}

// EnableWiFiInterface godoc
// @Summary Enable WiFi interface
// @Description Enable a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param name path string true "Interface name"
// @Success 200 {object} map[string]interface{} "Interface enabled"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces/{name}/enable [post]
type EnableWiFiInterface struct{}

// DisableWiFiInterface godoc
// @Summary Disable WiFi interface
// @Description Disable a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param name path string true "Interface name"
// @Success 200 {object} map[string]interface{} "Interface disabled"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces/{name}/disable [post]
type DisableWiFiInterface struct{}

// ListDHCPLeases godoc
// @Summary List DHCP leases
// @Description Get all active DHCP leases
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "DHCP leases list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/leases [get]
type ListDHCPLeases struct{}

// ListFirewallRules godoc
// @Summary List firewall rules
// @Description Get all firewall filter rules
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Success 200 {object} map[string]interface{} "Firewall rules list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/firewall/rules [get]
type ListFirewallRules struct{}
