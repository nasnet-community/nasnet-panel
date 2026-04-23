//nolint:misspell // intentional package name
package routeros

import "fmt"

// BridgeHost represents a bridge host entry with MAC and interface information.
type BridgeHost struct {
	MacAddress  string
	OnInterface string
}

// GetAllBridgeHosts retrieves all bridge host entries from RouterOS.
func (c *Client) GetAllBridgeHosts() ([]BridgeHost, error) {
	results, err := c.GetAll("/interface/bridge/host")
	if err != nil {
		return nil, fmt.Errorf("failed to query bridge hosts: %w", err)
	}

	hosts := make([]BridgeHost, 0, len(results))
	for _, result := range results {
		macAddr, macExists := result["mac-address"]
		onIface, ifaceExists := result["on-interface"]

		if macExists && ifaceExists {
			hosts = append(hosts, BridgeHost{
				MacAddress:  macAddr,
				OnInterface: onIface,
			})
		}
	}

	return hosts, nil
}

// GetBridgePortByMAC retrieves the bridge port (on-interface) for a given MAC address.
func (c *Client) GetBridgePortByMAC(macAddress string) (string, error) {
	results, err := c.GetAll("/interface/bridge/host", fmt.Sprintf("?=mac-address=%s", macAddress))
	if err != nil {
		return "", fmt.Errorf("failed to query bridge hosts: %w", err)
	}

	if len(results) == 0 {
		return "", fmt.Errorf("MAC address %s not found in bridge", macAddress)
	}

	onInterface, exists := results[0]["on-interface"]
	if !exists {
		return "", fmt.Errorf("on-interface property not found for MAC %s", macAddress)
	}

	return onInterface, nil
}
