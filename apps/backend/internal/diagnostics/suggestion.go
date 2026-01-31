package diagnostics

// SuggestionMapper maps errors and diagnostic results to actionable suggestions.
type SuggestionMapper struct {
	docsBaseURL string
}

// NewSuggestionMapper creates a new suggestion mapper.
func NewSuggestionMapper(docsBaseURL string) *SuggestionMapper {
	if docsBaseURL == "" {
		docsBaseURL = "https://docs.nasnetconnect.io"
	}
	return &SuggestionMapper{
		docsBaseURL: docsBaseURL,
	}
}

// GenerateSuggestions analyzes diagnostic results and generates suggestions.
func (m *SuggestionMapper) GenerateSuggestions(report *DiagnosticReport) []DiagnosticSuggestion {
	var suggestions []DiagnosticSuggestion

	// Check network reachability
	if !report.NetworkReachable {
		suggestions = append(suggestions, m.networkUnreachableSuggestion())
		return suggestions // No point checking other things if network is down
	}

	// Analyze port status
	suggestions = append(suggestions, m.analyzePortStatus(report.PortStatus)...)

	// Analyze TLS status
	if report.TLSStatus != nil && !report.TLSStatus.Valid {
		suggestions = append(suggestions, m.tlsErrorSuggestion(report.TLSStatus))
	}

	// Analyze auth status
	if report.AuthStatus.Tested && !report.AuthStatus.Success {
		suggestions = append(suggestions, m.authFailedSuggestion(report.AuthStatus))
	}

	// If no issues found, add success message
	if len(suggestions) == 0 {
		suggestions = append(suggestions, DiagnosticSuggestion{
			Severity:    SuggestionSeverityInfo,
			Title:       "Connection looks healthy",
			Description: "All diagnostic checks passed successfully.",
			Action:      "No action required. If you're still experiencing issues, try reconnecting.",
		})
	}

	return suggestions
}

// MapErrorToSuggestion maps an error category to a suggestion.
func (m *SuggestionMapper) MapErrorToSuggestion(category ErrorCategory, detail string) DiagnosticSuggestion {
	switch category {
	case ErrorCategoryTimeout:
		return m.timeoutSuggestion(detail)
	case ErrorCategoryRefused:
		return m.connectionRefusedSuggestion(detail)
	case ErrorCategoryAuthFailed:
		return m.authFailedFromCategory(detail)
	case ErrorCategoryProtocolError:
		return m.protocolErrorSuggestion(detail)
	case ErrorCategoryNetworkError:
		return m.networkErrorSuggestion(detail)
	case ErrorCategoryTLSError:
		return m.tlsErrorFromCategory(detail)
	default:
		return m.genericErrorSuggestion(detail)
	}
}

func (m *SuggestionMapper) networkUnreachableSuggestion() DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/network-connectivity"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityCritical,
		Title:       "Router is unreachable",
		Description: "Cannot establish any network connection to the router. The router may be powered off, disconnected from the network, or blocked by a firewall.",
		Action:      "1. Verify the router is powered on and connected to the network\n2. Check that the IP address is correct\n3. Verify there's no firewall blocking access from this device",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) analyzePortStatus(ports []PortStatus) []DiagnosticSuggestion {
	var suggestions []DiagnosticSuggestion

	// Count open ports
	openPorts := 0
	for _, p := range ports {
		if p.Open {
			openPorts++
		}
	}

	// If no ports are open
	if openPorts == 0 {
		docsURL := m.docsBaseURL + "/troubleshooting/all-ports-closed"
		suggestions = append(suggestions, DiagnosticSuggestion{
			Severity:    SuggestionSeverityCritical,
			Title:       "All service ports are closed",
			Description: "None of the standard MikroTik service ports (API, SSH, HTTP) are accessible. Services may be disabled or blocked by firewall.",
			Action:      "1. Connect to the router via WinBox or console\n2. Enable API service: /ip service enable api\n3. Enable SSH if needed: /ip service enable ssh\n4. Check firewall input rules allow access",
			DocsURL:     &docsURL,
		})
		return suggestions
	}

	// Check specific ports
	for _, p := range ports {
		if p.Open {
			continue
		}

		switch p.Service {
		case "API":
			if !hasOpenPort(ports, "API-SSL") {
				docsURL := m.docsBaseURL + "/troubleshooting/api-port"
				suggestions = append(suggestions, DiagnosticSuggestion{
					Severity:    SuggestionSeverityWarning,
					Title:       "API port (8728) is closed",
					Description: "The RouterOS API port is not accessible. This is the preferred connection method.",
					Action:      "Enable API service in RouterOS:\n/ip service enable api\n/ip service set api address=0.0.0.0/0",
					DocsURL:     &docsURL,
				})
			}
		case "SSH":
			docsURL := m.docsBaseURL + "/troubleshooting/ssh-port"
			suggestions = append(suggestions, DiagnosticSuggestion{
				Severity:    SuggestionSeverityInfo,
				Title:       "SSH port (22) is closed",
				Description: "SSH is a fallback connection method. While not required, it provides additional connectivity options.",
				Action:      "Enable SSH service if needed:\n/ip service enable ssh",
				DocsURL:     &docsURL,
			})
		}
	}

	return suggestions
}

func (m *SuggestionMapper) tlsErrorSuggestion(status *TLSStatus) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/tls-certificate"
	errDetail := "unknown error"
	if status.Error != nil {
		errDetail = *status.Error
	}

	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityWarning,
		Title:       "TLS certificate issue",
		Description: "The router's TLS certificate has an issue: " + errDetail,
		Action:      "1. Check certificate expiration date\n2. Regenerate self-signed certificate if needed:\n/certificate add name=nasnet common-name=router\n3. Or import a valid certificate from a CA",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) authFailedSuggestion(status AuthStatus) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/authentication"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Authentication failed",
		Description: "Could not authenticate with the provided credentials. The username or password may be incorrect, or the user may not have API access.",
		Action:      "1. Verify the username and password are correct\n2. Ensure the user has 'api' and 'read' policies enabled\n3. Check the user is not disabled or expired",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) timeoutSuggestion(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/timeout"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Connection timeout",
		Description: "The connection attempt timed out. The router may be overloaded, network latency may be high, or a firewall may be silently dropping packets.",
		Action:      "1. Check router CPU and memory usage\n2. Verify network path has acceptable latency\n3. Check for firewall rules that may drop packets without response\n4. Try again in a few moments",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) connectionRefusedSuggestion(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/connection-refused"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Connection refused",
		Description: "The router actively refused the connection. The service may be disabled or not listening on this port.",
		Action:      "1. Check that the required service is enabled in /ip service\n2. Verify the service is listening on the correct address\n3. Check for any IP restrictions on the service",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) authFailedFromCategory(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/authentication"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Authentication failed",
		Description: "Could not authenticate with the router. " + detail,
		Action:      "1. Verify username and password\n2. Check user has required policies (api, read, write)\n3. Ensure user account is not disabled",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) protocolErrorSuggestion(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/protocol-error"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Protocol error",
		Description: "A protocol-level error occurred during communication. " + detail,
		Action:      "1. Check RouterOS version compatibility\n2. Try a different connection protocol\n3. Restart the router's API service",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) networkErrorSuggestion(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/network-error"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Network error",
		Description: "A network-level error prevented connection. " + detail,
		Action:      "1. Check network connectivity to the router\n2. Verify routing and DNS settings\n3. Check for network equipment issues between this device and the router",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) tlsErrorFromCategory(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting/tls-error"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityWarning,
		Title:       "TLS/SSL error",
		Description: "A TLS/SSL error occurred. " + detail,
		Action:      "1. Try connecting without TLS (API port 8728 instead of 8729)\n2. Check router certificate validity\n3. Verify TLS version compatibility",
		DocsURL:     &docsURL,
	}
}

func (m *SuggestionMapper) genericErrorSuggestion(detail string) DiagnosticSuggestion {
	docsURL := m.docsBaseURL + "/troubleshooting"
	return DiagnosticSuggestion{
		Severity:    SuggestionSeverityError,
		Title:       "Connection error",
		Description: "An error occurred while connecting to the router. " + detail,
		Action:      "1. Check router is accessible\n2. Verify credentials\n3. Try different connection protocol\n4. Check router logs for errors",
		DocsURL:     &docsURL,
	}
}

// hasOpenPort checks if a specific service port is open.
func hasOpenPort(ports []PortStatus, service string) bool {
	for _, p := range ports {
		if p.Service == service && p.Open {
			return true
		}
	}
	return false
}

// ClassifyError determines the error category from an error.
func ClassifyError(err error) ErrorCategory {
	if err == nil {
		return ""
	}

	errStr := err.Error()

	// Check for timeout
	if contains(errStr, "timeout") || contains(errStr, "deadline exceeded") {
		return ErrorCategoryTimeout
	}

	// Check for connection refused
	if contains(errStr, "connection refused") || contains(errStr, "actively refused") {
		return ErrorCategoryRefused
	}

	// Check for auth errors
	if contains(errStr, "auth") || contains(errStr, "password") ||
		contains(errStr, "login") || contains(errStr, "credential") ||
		contains(errStr, "401") || contains(errStr, "403") {
		return ErrorCategoryAuthFailed
	}

	// Check for TLS errors
	if contains(errStr, "tls") || contains(errStr, "certificate") ||
		contains(errStr, "ssl") || contains(errStr, "x509") {
		return ErrorCategoryTLSError
	}

	// Check for network errors
	if contains(errStr, "no route") || contains(errStr, "unreachable") ||
		contains(errStr, "dns") || contains(errStr, "network") {
		return ErrorCategoryNetworkError
	}

	// Default to protocol error
	return ErrorCategoryProtocolError
}
