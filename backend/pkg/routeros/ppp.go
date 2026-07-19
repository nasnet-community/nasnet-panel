package routeros

import (
	"fmt"
	"strconv"
	"strings"
)

// PPPProfile represents a PPP profile from RouterOS /ppp/profile.
type PPPProfile struct {
	ID             string
	Name           string
	Default        bool
	LocalAddress   string
	RemoteAddress  string
	DNSServer      string
	WINSServer     string
	Bridge         string
	RateLimit      string
	SessionTimeout string
	IdleTimeout    string
	UseCompression string
	UseEncryption  string
	OnlyOne        string
	AddressList    string
	Comment        string
}

func parsePPPProfile(raw map[string]string) PPPProfile {
	return PPPProfile{
		ID:             raw[".id"],
		Name:           raw["name"],
		Default:        raw["default"] == "true" || raw["default"] == "yes",
		LocalAddress:   raw["local-address"],
		RemoteAddress:  raw["remote-address"],
		DNSServer:      raw["dns-server"],
		WINSServer:     raw["wins-server"],
		Bridge:         raw["bridge"],
		RateLimit:      raw["rate-limit"],
		SessionTimeout: raw["session-timeout"],
		IdleTimeout:    raw["idle-timeout"],
		UseCompression: raw["use-compression"],
		UseEncryption:  raw["use-encryption"],
		OnlyOne:        raw["only-one"],
		AddressList:    raw["address-list"],
		Comment:        raw["comment"],
	}
}

// PPPSecret represents a PPP secret (VPN user) from RouterOS /ppp/secret.
type PPPSecret struct {
	ID            string
	Name          string
	Service       string
	Profile       string
	Password      string
	Disabled      bool
	LimitBytesIn  int64
	LimitBytesOut int64
	CallerID      string
	Routes        string
	Comment       string
}

func parsePPPSecret(raw map[string]string) PPPSecret {
	s := PPPSecret{
		ID:       raw[".id"],
		Name:     raw["name"],
		Service:  raw["service"],
		Profile:  raw["profile"],
		Password: raw["password"],
		CallerID: raw["caller-id"],
		Routes:   raw["routes"],
		Comment:  raw["comment"],
		Disabled: raw["disabled"] == "true" || raw["disabled"] == "yes",
	}

	if v, err := strconv.ParseInt(raw["limit-bytes-in"], 10, 64); err == nil {
		s.LimitBytesIn = v
	}
	if v, err := strconv.ParseInt(raw["limit-bytes-out"], 10, 64); err == nil {
		s.LimitBytesOut = v
	}

	return s
}

// ListPPPSecrets retrieves all PPP secrets from RouterOS.
func (c *Client) ListPPPSecrets() ([]PPPSecret, error) {
	results, err := c.GetAll("/ppp/secret")
	if err != nil {
		if strings.Contains(err.Error(), "no results found") {
			return []PPPSecret{}, nil
		}
		return nil, fmt.Errorf("failed to list PPP secrets: %w", err)
	}

	secrets := make([]PPPSecret, len(results))
	for i, raw := range results {
		secrets[i] = parsePPPSecret(raw)
	}

	return secrets, nil
}

// PPPSecretExistsByName returns true if a PPP secret with the given name already exists.
func (c *Client) PPPSecretExistsByName(name string) (bool, error) {
	result, err := c.GetFirst("/ppp/secret", "?=name="+name)
	if err != nil {
		if strings.Contains(err.Error(), "no results found") {
			return false, nil
		}
		return false, fmt.Errorf("failed to check PPP secret existence: %w", err)
	}
	return result["name"] != "", nil
}

// ListPPPProfiles retrieves all PPP profiles from RouterOS.
func (c *Client) ListPPPProfiles() ([]PPPProfile, error) {
	results, err := c.GetAll("/ppp/profile")
	if err != nil {
		return nil, fmt.Errorf("failed to list PPP profiles: %w", err)
	}

	profiles := make([]PPPProfile, len(results))
	for i, raw := range results {
		profiles[i] = parsePPPProfile(raw)
	}

	return profiles, nil
}

// GetPPPProfile retrieves a single PPP profile by name.
func (c *Client) GetPPPProfile(name string) (PPPProfile, error) {
	results, err := c.GetAll("/ppp/profile", "?=name="+name)
	if err != nil {
		return PPPProfile{}, fmt.Errorf("failed to get PPP profile %s: %w", name, err)
	}

	if len(results) == 0 {
		return PPPProfile{}, fmt.Errorf("PPP profile %s not found", name)
	}

	return parsePPPProfile(results[0]), nil
}
