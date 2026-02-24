package provisioning

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/internal/events"
	"backend/internal/provisioning/orchestrator"
)

// ValidationIssue describes a single problem found during session validation.
type ValidationIssue struct {
	ResourceID string
	Field      string
	Message    string
	Severity   string // "error" or "warning"
}

// ValidateSession checks all resources in a draft session for configuration problems.
// Transitions the session to Validated status if no blocking errors are found.
// Returns all issues (warnings included) even on success.
func (s *Service) ValidateSession(ctx context.Context, sessionID string) ([]ValidationIssue, error) {
	session, err := s.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.Status != SessionStatusDraft {
		return nil, fmt.Errorf("session %q must be in draft status to validate (current: %s)", sessionID, session.Status)
	}

	var issues []ValidationIssue
	for _, resource := range session.Resources {
		issues = append(issues, validateResource(resource)...)
	}

	hasErrors := false
	for _, issue := range issues {
		if issue.Severity == "error" {
			hasErrors = true
			break
		}
	}
	if !hasErrors {
		s.mu.Lock()
		if sess, ok := s.sessions[sessionID]; ok {
			sess.Status = SessionStatusValidated
		}
		s.mu.Unlock()
	}

	return issues, nil
}

// validateResource performs basic structural checks on a session resource.
func validateResource(resource SessionResource) []ValidationIssue {
	var issues []ValidationIssue

	if resource.ResourceType == "" {
		issues = append(issues, ValidationIssue{
			ResourceID: resource.ID,
			Field:      "resourceType",
			Message:    "resource type must not be empty",
			Severity:   "error",
		})
	}

	if resource.Configuration == nil {
		issues = append(issues, ValidationIssue{
			ResourceID: resource.ID,
			Field:      "configuration",
			Message:    "resource configuration must not be nil",
			Severity:   "error",
		})
		return issues
	}

	// Resources with a "name" field in the config must have a non-empty value.
	requiresName := strings.HasPrefix(resource.ResourceType, "wan.link.") ||
		strings.HasPrefix(resource.ResourceType, "vpn.")
	if requiresName {
		if name, ok := resource.Configuration["name"]; !ok || name == "" {
			issues = append(issues, ValidationIssue{
				ResourceID: resource.ID,
				Field:      "name",
				Message:    "resource must have a non-empty name",
				Severity:   "error",
			})
		}
	}

	return issues
}

// ApplySession provisions all resources in a validated session via the orchestrator.
// Transitions: Validated → Applying → Applied | Failed.
// Emits ProvisioningSessionAppliedEvent on success or ProvisioningSessionFailedEvent on failure.
func (s *Service) ApplySession(ctx context.Context, sessionID string) error {
	session, err := s.GetSession(ctx, sessionID)
	if err != nil {
		return err
	}
	if session.Status != SessionStatusValidated {
		return fmt.Errorf("session %q must be validated before applying (current: %s)", sessionID, session.Status)
	}

	s.mu.Lock()
	if sess, ok := s.sessions[sessionID]; ok {
		sess.Status = SessionStatusApplying
	}
	s.mu.Unlock()

	startedAt := time.Now()
	provResources := sessionResourcesToProvisioningResources(session.Resources)
	_, applyErr := s.orchestrator.Provision(ctx, session.RouterID, sessionID, provResources)
	durationMs := int(time.Since(startedAt).Milliseconds())

	if applyErr != nil {
		s.mu.Lock()
		if sess, ok := s.sessions[sessionID]; ok {
			sess.Status = SessionStatusFailed
			sess.ErrorMessage = applyErr.Error()
		}
		s.mu.Unlock()

		_ = s.publisher.Publish(ctx, events.NewProvisioningSessionFailedEvent( //nolint:errcheck // fire-and-forget event
			sessionID, session.RouterID, "apply", applyErr.Error(), false, "provisioning-service",
		))
		return fmt.Errorf("applying session %q: %w", sessionID, applyErr)
	}

	resourceIDs := make([]string, 0, len(session.Resources))
	for _, r := range session.Resources {
		resourceIDs = append(resourceIDs, r.ID)
	}

	s.mu.Lock()
	if sess, ok := s.sessions[sessionID]; ok {
		sess.Status = SessionStatusApplied
	}
	s.mu.Unlock()

	_ = s.publisher.Publish(ctx, events.NewProvisioningSessionAppliedEvent( //nolint:errcheck // fire-and-forget event
		sessionID, session.RouterID, len(resourceIDs), resourceIDs, durationMs, "provisioning-service",
	))
	return nil
}

// sessionResourcesToProvisioningResources converts session resources to orchestrator inputs.
// String-formats all configuration values for the RouterOS command API.
func sessionResourcesToProvisioningResources(resources []SessionResource) []orchestrator.ProvisioningResource {
	result := make([]orchestrator.ProvisioningResource, 0, len(resources))
	for _, r := range resources {
		args := make(map[string]string, len(r.Configuration))
		for k, v := range r.Configuration {
			if v != nil {
				args[k] = fmt.Sprintf("%v", v)
			}
		}
		result = append(result, orchestrator.ProvisioningResource{
			Path:   resourceTypeToRouterOSPath(r.ResourceType),
			Action: "add",
			Args:   args,
		})
	}
	return result
}

// resourceTypeToRouterOSPath maps a session resource type to its RouterOS API path.
func resourceTypeToRouterOSPath(resourceType string) string {
	paths := map[string]string{
		"vpn.wireguard.client":   "/interface/wireguard",
		"vpn.openvpn.client":     "/interface/ovpn-client",
		"vpn.pptp.client":        "/interface/pptp-client",
		"vpn.l2tp.client":        "/interface/l2tp-client",
		"vpn.sstp.client":        "/interface/sstp-client",
		"vpn.ikev2.client":       "/ip/ipsec/peer",
		"vpn.wireguard.server":   "/interface/wireguard",
		"vpn.pptp.server":        "/interface/pptp-server",
		"vpn.l2tp.server":        "/interface/l2tp-server",
		"vpn.sstp.server":        "/interface/sstp-server",
		"vpn.openvpn.server":     "/interface/ovpn-server",
		"vpn.ikev2.server":       "/ip/ipsec/profile",
		"tunnel.ipip":            "/interface/ipip",
		"tunnel.eoip":            "/interface/eoip",
		"tunnel.gre":             "/interface/gre",
		"tunnel.vxlan":           "/interface/vxlan",
		"system.identity":        "/system/identity",
		"system.ntp":             "/system/ntp/client",
		"system.services":        "/ip/service",
		"system.ddns":            "/ip/cloud",
		"system.dns":             "/ip/dns",
		"system.rui":             "/ip/service",
		"wan.link.domestic":      "/ip/dhcp-client",
		"wan.link.foreign":       "/ip/dhcp-client",
		"wan.multilink.domestic": "/routing/table",
		"wan.multilink.foreign":  "/routing/table",
	}
	if path, ok := paths[resourceType]; ok {
		return path
	}
	return "/" + strings.ReplaceAll(resourceType, ".", "/")
}
