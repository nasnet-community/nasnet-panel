package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"

	"nasnet-panel/pkg/routeros"
)

// validateSecurityTypes validates security types format.
func validateSecurityTypes(securityTypes string) error {
	if securityTypes == "" {
		return nil
	}

	validTypes := map[string]bool{
		"wpa-psk":  true,
		"wpa2-psk": true,
		"wpa3-psk": true,
	}

	parts := strings.Split(securityTypes, ",")
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			return fmt.Errorf("invalid security types format")
		}
		if !validTypes[trimmed] {
			return fmt.Errorf("invalid security type: %s. Must be one of: wpa-psk, wpa2-psk, wpa3-psk", trimmed)
		}
	}

	return nil
}

// validatePassword validates password length.
func validatePassword(password string) error {
	if password == "" {
		return nil
	}

	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	return nil
}

// HandleListWiFiInterfaces godoc
// @Summary List WiFi interfaces
// @Description Get all WiFi interfaces on the device
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "WiFi interfaces list"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces [get]
func HandleListWiFiInterfaces(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	interfaces, err := client.ListWifiInterfaces()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list WiFi interfaces", err)
	}

	response := ToWiFiInterfacesResponse(interfaces)
	return SuccessResponse(c, http.StatusOK, "WiFi interfaces retrieved successfully", response)
}

// HandleGetWiFiInterface godoc
// @Summary Get WiFi interface details
// @Description Get details of a specific WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Success 200 {object} map[string]interface{} "WiFi interface details"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces/{name} [get]
func HandleGetWiFiInterface(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	iface, err := client.GetWifiInterface(name)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get WiFi interface", err)
	}

	response := ToWiFiInterfaceResponse(iface)
	return SuccessResponse(c, http.StatusOK, "WiFi interface retrieved", response)
}

// HandleScanWiFiAccessPoints godoc
// @Summary Scan available WiFi access points
// @Description Scan nearby access points for 5 seconds on the specified WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WiFi interface name or ID"
// @Param duration query int false "Scan duration in seconds (default: 5)"
// @Success 200 {object} Response{data=[]wiFiAccessPointResponse}
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "WiFi interface not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/scan/{nameOrID} [get].
func HandleScanWiFiAccessPoints(c echo.Context) error {
	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	durationArg := "5s"
	if durationValue := strings.TrimSpace(c.QueryParam("duration")); durationValue != "" {
		durationSeconds, err := strconv.Atoi(durationValue)
		if err != nil || durationSeconds <= 0 {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid duration value", fmt.Errorf("duration must be a positive integer in seconds"))
		}
		durationArg = fmt.Sprintf("%ds", durationSeconds)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	aps, err := client.ScanWiFiAccessPoints(nameOrID, durationArg)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to scan WiFi access points", err)
	}

	response := toWiFiAccessPointsResponse(aps)
	return SuccessResponse(c, http.StatusOK, "WiFi access points scanned successfully", response)
}

// HandleListWiFiConnectedClients godoc
// @Summary List connected WiFi clients
// @Description Get all clients connected to WiFi interfaces
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param interface query string false "Filter by interface name"
// @Success 200 {object} map[string]interface{} "Connected clients list"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/clients [get]
func HandleListWiFiConnectedClients(c echo.Context) error {
	interfaceName := c.QueryParam("interface")

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if interfaceName != "" {
		iface, err := client.GetWifiInterface(interfaceName)
		if err != nil {
			if IsCredentialError(err) {
				return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", nil)
		}
		if iface == nil {
			return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", nil)
		}
	}

	clients, err := client.ListWifiConnectedClients(interfaceName)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list connected clients", err)
	}

	response := ToWiFiConnectedClientsResponse(clients)
	return SuccessResponse(c, http.StatusOK, "Connected clients retrieved", response)
}

// HandleRemoveWiFiConnectedClient godoc
// @Summary Remove WiFi client
// @Description Disconnect a WiFi client by MAC address
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param mac path string true "MAC address"
// @Success 200 {object} map[string]interface{} "Client removed"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Client not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/clients/{mac} [delete]
func HandleRemoveWiFiConnectedClient(c echo.Context) error {
	mac := c.Param("mac")
	if mac == "" {
		return ErrorResponse(c, http.StatusBadRequest, "MAC address is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.RemoveWifiConnectedClient(mac)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to remove WiFi client", err)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "WiFi client removed")
}

// HandleGetWiFiPassphrase godoc
// @Summary Get WiFi passphrase
// @Description Get the current passphrase of a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Success 200 {object} map[string]interface{} "WiFi passphrase"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/passphrase/{name} [get]
func HandleGetWiFiPassphrase(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	password, err := client.GetWifiPassword(name)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get WiFi passphrase", err)
	}

	if password == nil {
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", nil)
	}

	response := &WiFiPassphraseResponse{
		InterfaceName: name,
		Passphrase:    password.Passphrase,
	}

	return SuccessResponse(c, http.StatusOK, "WiFi passphrase retrieved", response)
}

// HandleChangeWiFiPassphrase godoc
// @Summary Update WiFi passphrase
// @Description Update the passphrase for a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Param body body ChangeWiFiPassphraseRequest true "New passphrase"
// @Success 200 {object} map[string]interface{} "Passphrase updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/passphrase/{name} [put]
func HandleChangeWiFiPassphrase(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	var req ChangeWiFiPassphraseRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Passphrase == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Passphrase is required", nil)
	}

	// Validate password length.
	if err := validatePassword(req.Passphrase); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid passphrase", err)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.ChangeWifiPassphrase(name, req.Passphrase)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to change WiFi passphrase", err)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "WiFi passphrase changed")
}

// HandleUpdateWiFiInterface godoc
// @Summary Update WiFi interface state
// @Description Enable or disable a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Param body body UpdateWiFiInterfaceRequest true "Interface state"
// @Success 200 {object} map[string]interface{} "Interface updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/interfaces/{name} [put]
func HandleUpdateWiFiInterface(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	var req UpdateWiFiInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	iface, err := client.GetWifiInterface(name)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", err)
	}

	if iface == nil {
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", nil)
	}

	if req.Enabled && iface.Disabled {
		err = client.EnableWifiInterface(name)
		if err != nil {
			if IsCredentialError(err) {
				return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to enable WiFi interface", err)
		}
		return SimpleSuccessResponse(c, http.StatusOK, "WiFi interface enabled")
	}

	if !req.Enabled && !iface.Disabled {
		err = client.DisableWifiInterface(name)
		if err != nil {
			if IsCredentialError(err) {
				return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to disable WiFi interface", err)
		}
		return SimpleSuccessResponse(c, http.StatusOK, "WiFi interface disabled")
	}

	status := "enabled"
	if !req.Enabled {
		status = "disabled"
	}
	return SimpleSuccessResponse(c, http.StatusOK, "WiFi interface already "+status)
}

// validateWiFiMode validates the high-level WiFi mode.
func validateWiFiMode(mode string) error {
	switch mode {
	case "ap", "station":
		return nil
	default:
		return fmt.Errorf("invalid mode: %s. Must be one of: ap, station", mode)
	}
}

// HandleUpdateWiFiSettings godoc
// @Summary Update WiFi interface settings
// @Description Update SSID, password, security types, and mode for a WiFi interface
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Param body body UpdateWiFiSettingsRequest true "WiFi settings"
// @Success 200 {object} map[string]interface{} "WiFi settings updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Interface not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/settings/{name} [put].
func HandleUpdateWiFiSettings(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	var req UpdateWiFiSettingsRequest
	bindErr := c.Bind(&req)
	if bindErr != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", bindErr)
	}

	// Validate password if provided.
	if req.Password != nil {
		pwErr := validatePassword(*req.Password)
		if pwErr != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid password", pwErr)
		}
	}

	// Validate security types if provided.
	if req.SecurityTypes != nil {
		vErr := validateSecurityTypes(*req.SecurityTypes)
		if vErr != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid security types", vErr)
		}
	}

	// Validate mode if provided.
	if req.Mode != nil {
		modeErr := validateWiFiMode(*req.Mode)
		if modeErr != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid mode", modeErr)
		}
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	// Verify interface exists
	iface, err := client.GetWifiInterface(name)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", err)
	}

	if iface == nil {
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", nil)
	}

	// Update settings.
	settings := routeros.WiFiSettings{
		SSID:          req.SSID,
		Password:      req.Password,
		SecurityTypes: req.SecurityTypes,
		Mode:          req.Mode,
	}

	err = client.UpdateWiFiSettings(name, settings)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update WiFi settings", err)
	}

	// Fetch updated interface to return in response
	updated, err := client.GetWifiInterface(name)
	if err == nil && updated != nil {
		response := UpdateWiFiSettingsResponse{
			Name:         updated.Name,
			SSID:         updated.SSID,
			SecurityType: updated.SecurityType,
			Mode:         updated.Mode,
		}
		return SuccessResponse(c, http.StatusOK, "WiFi settings updated successfully", response)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "WiFi settings updated successfully")
}

// HandleConnectWiFi godoc
// @Summary Connect WiFi interface to an access point
// @Description Configure a WiFi interface to station mode and connect to an access point
// @Tags WiFi
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WiFi interface name or ID"
// @Param body body WiFiConnectRequest true "Connection details (SSID required; both securityTypes and password required together, or both empty for open network)"
// @Success 200 {object} map[string]interface{} "Connected to access point"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "WiFi interface not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/wifi/connect/{nameOrID} [post].
func HandleConnectWiFi(c echo.Context) error {
	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	var req WiFiConnectRequest
	bindErr := c.Bind(&req)
	if bindErr != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", bindErr)
	}

	if req.SSID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "SSID is required", nil)
	}

	// Both security types and password must be provided together, or both empty (for open network)
	hasSecurityTypes := req.SecurityTypes != ""
	hasPassword := req.Password != ""

	if hasSecurityTypes != hasPassword {
		return ErrorResponse(c, http.StatusBadRequest, "Security types and password must be both provided or both empty (open network)", nil)
	}

	if hasSecurityTypes {
		vErr := validateSecurityTypes(req.SecurityTypes)
		if vErr != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid security types", vErr)
		}

		pwErr := validatePassword(req.Password)
		if pwErr != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid password", pwErr)
		}
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	iface, err := client.GetWifiInterface(nameOrID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", err)
	}

	if iface == nil {
		return ErrorResponse(c, http.StatusNotFound, "WiFi interface not found", nil)
	}

	err = client.ConnectWiFiToAccessPoint(nameOrID, req.SSID, req.SecurityTypes, req.Password)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to connect to access point", err)
	}

	response := WiFiConnectResponse{
		InterfaceName: iface.Name,
		Mode:          "station",
		SSID:          req.SSID,
		SecurityType:  req.SecurityTypes,
		Message:       "WiFi interface configured to connect to access point",
	}

	return SuccessResponse(c, http.StatusOK, "Connected to access point", response)
}
