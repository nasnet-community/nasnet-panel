package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

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
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

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

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

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
	defer client.Close()

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
