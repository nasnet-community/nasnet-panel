package routeros

import (
	"errors"
	"fmt"
	"strconv"

	"nasnet-panel/pkg/utils"
)

// ErrIPServiceNotFound is returned by GetIPService when no entry matches.
var ErrIPServiceNotFound = errors.New("IP service not found")

// IPServiceInfo represents an /ip/service entry.
type IPServiceInfo struct {
	ID          string
	Name        string
	Port        int
	Address     string
	Certificate string
	TLSVersion  string
	VRF         string
	Proto       string
	Local       string
	Remote      string
	Container   string
	Netns       string
	MaxSessions int
	Disabled    bool
	Dynamic     bool
	Invalid     bool
	Connection  bool
}

// UpdateIPServiceParams holds the optional fields for updating an /ip/service entry.
type UpdateIPServiceParams struct {
	Port        *int
	Address     *string
	Certificate *string
	TLSVersion  *string
	VRF         *string
	MaxSessions *int
	Disabled    *bool
}

func parseIPServiceInfo(result map[string]string) IPServiceInfo {
	port, _ := strconv.Atoi(result["port"])
	maxSessions, _ := strconv.Atoi(result["max-sessions"])

	return IPServiceInfo{
		ID:          result[".id"],
		Name:        result["name"],
		Port:        port,
		Address:     result["available-from"],
		Certificate: result["certificate"],
		TLSVersion:  result["tls-version"],
		VRF:         result["vrf"],
		Proto:       result["proto"],
		Local:       result["local"],
		Remote:      result["remote"],
		Container:   result["container"],
		Netns:       result["netns"],
		MaxSessions: maxSessions,
		Disabled:    parseRouterOSBool(result["disabled"]),
		Dynamic:     parseRouterOSBool(result["dynamic"]),
		Invalid:     parseRouterOSBool(result["invalid"]),
		Connection:  parseRouterOSBool(result["connection"]),
	}
}

// ListIPServices returns every entry of /ip/service.
func (c *Client) ListIPServices() ([]IPServiceInfo, error) {
	results, err := c.GetAll("/ip/service")
	if err != nil {
		return nil, fmt.Errorf("failed to list IP services: %w", err)
	}

	services := make([]IPServiceInfo, 0, len(results))
	for _, result := range results {
		services = append(services, parseIPServiceInfo(result))
	}

	return services, nil
}

// GetIPService returns an /ip/service entry by name or .id. A name can match
// several entries (e.g. the configured ssh service and its dynamic
// connections); the configured, non-dynamic one is preferred.
func (c *Client) GetIPService(nameOrID string) (*IPServiceInfo, error) {
	if nameOrID == "" {
		return nil, fmt.Errorf("service name or ID is required")
	}

	results, err := c.GetAll("/ip/service", nameOrIDFilterArg(nameOrID))
	if err != nil {
		return nil, fmt.Errorf("failed to get IP service %s: %w", nameOrID, err)
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("%w: %s", ErrIPServiceNotFound, nameOrID)
	}

	service := parseIPServiceInfo(results[0])
	for _, result := range results {
		if candidate := parseIPServiceInfo(result); !candidate.Dynamic {
			service = candidate
			break
		}
	}

	return &service, nil
}

// UpdateIPService applies params' non-nil fields to the /ip/service entry with
// the given .id.
func (c *Client) UpdateIPService(id string, params UpdateIPServiceParams) error {
	if id == "" {
		return fmt.Errorf("service ID is required")
	}

	args := []string{"=.id=" + id}

	if params.Port != nil {
		args = append(args, "=port="+strconv.Itoa(*params.Port))
	}
	if params.Address != nil {
		args = append(args, "=address="+*params.Address)
	}
	if params.Certificate != nil {
		args = append(args, "=certificate="+*params.Certificate)
	}
	if params.TLSVersion != nil {
		args = append(args, "=tls-version="+*params.TLSVersion)
	}
	if params.VRF != nil {
		args = append(args, "=vrf="+*params.VRF)
	}
	if params.MaxSessions != nil {
		args = append(args, "=max-sessions="+strconv.Itoa(*params.MaxSessions))
	}
	if params.Disabled != nil {
		args = append(args, "=disabled="+utils.ToYesNo(*params.Disabled))
	}

	if len(args) == 1 {
		return nil
	}

	if _, err := c.Set("/ip/service", args...); err != nil {
		return fmt.Errorf("failed to update IP service %s: %w", id, err)
	}

	return nil
}
