//nolint:misspell // package name is intentional: routeros not routers
package routeros

import (
	"fmt"
	"strconv"
)

// VPNClientInfo represents a VPN client interface.
type VPNClientInfo struct {
	ID           string
	Name         string
	Type         string
	Running      bool
	Disabled     bool
	MTU          int
	MacAddress   string
	RxByte       int64
	TxByte       int64
	RxPacket     int64
	TxPacket     int64
	LastLinkUp   string
	LastLinkDown string
	LinkDowns    int
	Comment      string
}

// VPN client interface types.
const (
	VPNTypeL2TPOut   = "l2tp-out"
	VPNTypeL2TPIn    = "l2tp-in"
	VPNTypeOVPNOut   = "ovpn-out"
	VPNTypeOVPNIn    = "ovpn-in"
	VPNTypePPPoEOut  = "pppoe-out"
	VPNTypePPPoEIn   = "pppoe-in"
	VPNTypeWireGuard = "wg"
	VPNTypePPTPOut   = "pptp-out"
	VPNTypePPTPIn    = "pptp-in"
	VPNTypeEoIP      = "eoip"
	VPNTypeGRE       = "gre"
	VPNTypeIPIP      = "ipip"
	VPNTypeSIT       = "sit"
)

// vpnInterfaceTypes defines all VPN-related interface types.
var vpnInterfaceTypes = map[string]bool{
	VPNTypeL2TPOut:   true,
	VPNTypeL2TPIn:    true,
	VPNTypeOVPNOut:   true,
	VPNTypeOVPNIn:    true,
	VPNTypePPPoEOut:  true,
	VPNTypePPPoEIn:   true,
	VPNTypeWireGuard: true,
	VPNTypePPTPOut:   true,
	VPNTypePPTPIn:    true,
	VPNTypeEoIP:      true,
	VPNTypeGRE:       true,
	VPNTypeIPIP:      true,
	VPNTypeSIT:       true,
}

// IsVPNInterfaceType checks if a given type is a VPN interface type.
func IsVPNInterfaceType(interfaceType string) bool {
	return vpnInterfaceTypes[interfaceType]
}

// ListVPNClients returns all VPN client interfaces.
func (c *Client) ListVPNClients() ([]VPNClientInfo, error) {
	results, err := c.GetAll("/interface")
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	vpnClients := make([]VPNClientInfo, 0)
	for _, result := range results {
		interfaceType := result["type"]

		// Filter by VPN interface types
		if !IsVPNInterfaceType(interfaceType) {
			continue
		}

		mtu, _ := strconv.Atoi(result["mtu"])
		rxByte, _ := strconv.ParseInt(result["rx-byte"], 10, 64)
		txByte, _ := strconv.ParseInt(result["tx-byte"], 10, 64)
		rxPacket, _ := strconv.ParseInt(result["rx-packet"], 10, 64)
		txPacket, _ := strconv.ParseInt(result["tx-packet"], 10, 64)
		linkDowns, _ := strconv.Atoi(result["link-downs"])

		vpnClients = append(vpnClients, VPNClientInfo{
			ID:           result[".id"],
			Name:         result["name"],
			Type:         interfaceType,
			Running:      result["running"] == "true",
			Disabled:     result["disabled"] == "true",
			MTU:          mtu,
			MacAddress:   result["mac-address"],
			RxByte:       rxByte,
			TxByte:       txByte,
			RxPacket:     rxPacket,
			TxPacket:     txPacket,
			LastLinkUp:   result["last-link-up-time"],
			LastLinkDown: result["last-link-down-time"],
			LinkDowns:    linkDowns,
			Comment:      result["comment"],
		})
	}

	return vpnClients, nil
}

// GetVPNClient returns a specific VPN client by name or ID.
func (c *Client) GetVPNClient(nameOrID string) (*VPNClientInfo, error) {
	result, err := c.GetFirst("/interface", "?=.id="+nameOrID)
	if err != nil {
		// Try by name
		result, err = c.GetFirst("/interface", "?=name="+nameOrID)
		if err != nil {
			return nil, fmt.Errorf("failed to get VPN client %s: %w", nameOrID, err)
		}
	}

	interfaceType := result["type"]
	if !IsVPNInterfaceType(interfaceType) {
		return nil, fmt.Errorf("interface %s is not a VPN client type", nameOrID)
	}

	mtu, _ := strconv.Atoi(result["mtu"])
	rxByte, _ := strconv.ParseInt(result["rx-byte"], 10, 64)
	txByte, _ := strconv.ParseInt(result["tx-byte"], 10, 64)
	rxPacket, _ := strconv.ParseInt(result["rx-packet"], 10, 64)
	txPacket, _ := strconv.ParseInt(result["tx-packet"], 10, 64)
	linkDowns, _ := strconv.Atoi(result["link-downs"])

	return &VPNClientInfo{
		ID:           result[".id"],
		Name:         result["name"],
		Type:         interfaceType,
		Running:      result["running"] == "true",
		Disabled:     result["disabled"] == "true",
		MTU:          mtu,
		MacAddress:   result["mac-address"],
		RxByte:       rxByte,
		TxByte:       txByte,
		RxPacket:     rxPacket,
		TxPacket:     txPacket,
		LastLinkUp:   result["last-link-up-time"],
		LastLinkDown: result["last-link-down-time"],
		LinkDowns:    linkDowns,
		Comment:      result["comment"],
	}, nil
}

// SetVPNClientDisabled enables or disables a VPN client.
func (c *Client) SetVPNClientDisabled(nameOrID string, disabled bool) error {
	// Verify it's a VPN client first and get the actual ID
	vpnClient, err := c.GetVPNClient(nameOrID)
	if err != nil {
		return err
	}

	value := "no"
	if disabled {
		value = "yes"
	}
	_, err = c.Set("/interface", "=.id="+vpnClient.ID, "disabled="+value)
	if err != nil {
		return fmt.Errorf("failed to set VPN client disabled status: %w", err)
	}

	return nil
}

// UpdateVPNClientSettings updates VPN client settings (disabled status and/or comment).
func (c *Client) UpdateVPNClientSettings(nameOrID string, disabled *bool, comment *string) error {
	// Verify it's a VPN client first and get the actual ID
	vpnClient, err := c.GetVPNClient(nameOrID)
	if err != nil {
		return err
	}

	args := []string{"=.id=" + vpnClient.ID}

	if disabled != nil {
		value := "no"
		if *disabled {
			value = "yes"
		}
		args = append(args, "=disabled="+value)
	}

	if comment != nil {
		args = append(args, "=comment="+*comment)
	}

	// If no fields to update, return early
	if len(args) == 1 {
		return nil
	}

	_, err = c.Set("/interface", args...)
	if err != nil {
		return fmt.Errorf("failed to update VPN client settings: %w", err)
	}

	return nil
}
