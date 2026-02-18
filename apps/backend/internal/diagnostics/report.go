package diagnostics

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// ReportFormatter formats diagnostic reports for export.
type ReportFormatter struct {
	// Fields to redact from exports
	sensitivePatterns []string
}

// NewReportFormatter creates a new report formatter.
func NewReportFormatter() *ReportFormatter {
	return &ReportFormatter{
		sensitivePatterns: []string{
			"password",
			"secret",
			"api_key",
			"apikey",
			"token",
			"credential",
			"private_key",
			"privatekey",
		},
	}
}

// FormatAsText formats a diagnostic report as human-readable text.
func (f *ReportFormatter) FormatAsText(report *DiagnosticReport, systemInfo map[string]string) string {
	var sb strings.Builder

	f.writeHeader(&sb, report)
	f.writeSystemInfo(&sb, systemInfo)
	f.writeNetworkReachability(&sb, report)
	f.writePortStatus(&sb, report)
	f.writeTLSStatus(&sb, report)
	f.writeAuthStatus(&sb, report)
	f.writeSuggestions(&sb, report)
	f.writeFooter(&sb)

	return sb.String()
}

func (f *ReportFormatter) writeHeader(sb *strings.Builder, report *DiagnosticReport) {
	sb.WriteString("═══════════════════════════════════════════════════════════════\n")
	sb.WriteString("              NasNetConnect Diagnostic Report\n")
	sb.WriteString("═══════════════════════════════════════════════════════════════\n\n")
	fmt.Fprintf(sb, "Generated:  %s\n", report.Timestamp.Format(time.RFC3339))
	fmt.Fprintf(sb, "Router ID:  %s\n", f.redact(report.RouterID))
	fmt.Fprint(sb, "\n")
}

func (f *ReportFormatter) writeSystemInfo(sb *strings.Builder, systemInfo map[string]string) {
	if len(systemInfo) == 0 {
		return
	}
	sb.WriteString("─── System Information ───────────────────────────────────────\n")
	for key, value := range systemInfo {
		fmt.Fprintf(sb, "  %s: %s\n", key, f.redactValue(key, value))
	}
	fmt.Fprint(sb, "\n")
}

func (f *ReportFormatter) writeNetworkReachability(sb *strings.Builder, report *DiagnosticReport) {
	sb.WriteString("─── Network Reachability ─────────────────────────────────────\n")
	if report.NetworkReachable {
		sb.WriteString("  ✓ Router is reachable on the network\n")
	} else {
		sb.WriteString("  ✗ Router is NOT reachable on the network\n")
	}
	sb.WriteString("\n")
}

func (f *ReportFormatter) writePortStatus(sb *strings.Builder, report *DiagnosticReport) {
	sb.WriteString("─── Port Status ──────────────────────────────────────────────\n")
	for _, port := range report.PortStatus {
		status := "✗ CLOSED"
		if port.Open {
			status = "✓ OPEN"
			if port.ResponseTimeMs != nil {
				status += fmt.Sprintf(" (%dms)", *port.ResponseTimeMs)
			}
		}
		fmt.Fprintf(sb, "  Port %5d (%s): %s", port.Port, padRight(port.Service, 8), status)
		if port.Error != nil && !port.Open {
			fmt.Fprintf(sb, " - %s", *port.Error)
		}
		fmt.Fprint(sb, "\n")
	}
	fmt.Fprint(sb, "\n")
}

func (f *ReportFormatter) writeTLSStatus(sb *strings.Builder, report *DiagnosticReport) {
	if report.TLSStatus == nil {
		return
	}
	sb.WriteString("─── TLS Certificate ──────────────────────────────────────────\n")
	if report.TLSStatus.Valid {
		sb.WriteString("  ✓ Certificate is valid\n")
	} else {
		sb.WriteString("  ✗ Certificate is INVALID\n")
		if report.TLSStatus.Error != nil {
			fmt.Fprintf(sb, "    Error: %s\n", *report.TLSStatus.Error)
		}
	}
	if report.TLSStatus.Subject != nil {
		fmt.Fprintf(sb, "  Subject: %s\n", *report.TLSStatus.Subject)
	}
	if report.TLSStatus.Issuer != nil {
		fmt.Fprintf(sb, "  Issuer:  %s\n", *report.TLSStatus.Issuer)
	}
	if report.TLSStatus.ExpiresAt != nil {
		fmt.Fprintf(sb, "  Expires: %s\n", report.TLSStatus.ExpiresAt.Format(time.RFC3339))
	}
	fmt.Fprint(sb, "\n")
}

func (f *ReportFormatter) writeAuthStatus(sb *strings.Builder, report *DiagnosticReport) {
	redactedAuth := f.redactAuthStatus(report.AuthStatus)
	sb.WriteString("─── Authentication ───────────────────────────────────────────\n")
	switch {
	case !redactedAuth.Tested:
		sb.WriteString("  ○ Authentication was not tested\n")
	case redactedAuth.Success:
		sb.WriteString("  ✓ Authentication successful\n")
	default:
		sb.WriteString("  ✗ Authentication FAILED\n")
		if redactedAuth.Error != nil {
			fmt.Fprintf(sb, "    Error: %s\n", *redactedAuth.Error)
		}
		if redactedAuth.ErrorCode != nil {
			fmt.Fprintf(sb, "    Code:  %s\n", *redactedAuth.ErrorCode)
		}
	}
	fmt.Fprint(sb, "\n")
}

func (f *ReportFormatter) writeSuggestions(sb *strings.Builder, report *DiagnosticReport) {
	if len(report.Suggestions) == 0 {
		return
	}
	sb.WriteString("─── Recommendations ──────────────────────────────────────────\n")
	for i, suggestion := range report.Suggestions {
		icon := getSeverityIcon(suggestion.Severity)
		fmt.Fprintf(sb, "\n  %s %d. %s [%s]\n", icon, i+1, suggestion.Title, suggestion.Severity)
		fmt.Fprintf(sb, "     %s\n", wrapText(suggestion.Description, 55, "     "))
		fmt.Fprint(sb, "\n     Action:\n")
		for _, line := range strings.Split(suggestion.Action, "\n") {
			fmt.Fprintf(sb, "       %s\n", line)
		}
		if suggestion.DocsURL != nil {
			fmt.Fprintf(sb, "\n     Docs: %s\n", *suggestion.DocsURL)
		}
	}
	fmt.Fprint(sb, "\n")
}

func (f *ReportFormatter) writeFooter(sb *strings.Builder) {
	sb.WriteString("═══════════════════════════════════════════════════════════════\n")
	sb.WriteString("  Report generated by NasNetConnect\n")
	sb.WriteString("  https://nasnetconnect.io\n")
	sb.WriteString("═══════════════════════════════════════════════════════════════\n")
}

// FormatAsJSON formats a diagnostic report as JSON.
func (f *ReportFormatter) FormatAsJSON(report *DiagnosticReport, systemInfo map[string]string) (string, error) {
	// Create a copy of the report to avoid modifying the original
	exportReport := struct {
		Timestamp        time.Time              `json:"timestamp"`
		RouterID         string                 `json:"routerId"`
		SystemInfo       map[string]string      `json:"systemInfo,omitempty"`
		NetworkReachable bool                   `json:"networkReachable"`
		PortStatus       []PortStatus           `json:"portStatus"`
		TLSStatus        *TLSStatus             `json:"tlsStatus,omitempty"`
		AuthStatus       AuthStatus             `json:"authStatus"`
		Suggestions      []DiagnosticSuggestion `json:"suggestions"`
		Version          string                 `json:"version"`
	}{
		Timestamp:        report.Timestamp,
		RouterID:         f.redact(report.RouterID),
		SystemInfo:       f.redactMap(systemInfo),
		NetworkReachable: report.NetworkReachable,
		PortStatus:       report.PortStatus,
		TLSStatus:        report.TLSStatus,
		AuthStatus:       f.redactAuthStatus(report.AuthStatus),
		Suggestions:      report.Suggestions,
		Version:          "1.0",
	}

	data, err := json.MarshalIndent(exportReport, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal report: %w", err)
	}

	return string(data), nil
}

// redact redacts sensitive values from a string.
func (f *ReportFormatter) redact(value string) string {
	// For router IDs, show partial info
	if len(value) > 8 {
		return value[:4] + "****" + value[len(value)-4:]
	}
	return value
}

// redactValue redacts a value if the key suggests it's sensitive.
func (f *ReportFormatter) redactValue(key, value string) string {
	keyLower := strings.ToLower(key)
	for _, pattern := range f.sensitivePatterns {
		if strings.Contains(keyLower, pattern) {
			return "[REDACTED]"
		}
	}
	return value
}

// redactMap redacts sensitive values from a map.
func (f *ReportFormatter) redactMap(m map[string]string) map[string]string {
	result := make(map[string]string, len(m))
	for k, v := range m {
		result[k] = f.redactValue(k, v)
	}
	return result
}

// redactAuthStatus creates a copy of AuthStatus with sensitive info redacted.
func (f *ReportFormatter) redactAuthStatus(status AuthStatus) AuthStatus {
	result := status
	// Redact any error messages that might contain credentials
	if result.Error != nil {
		errMsg := *result.Error
		for _, pattern := range f.sensitivePatterns {
			if strings.Contains(strings.ToLower(errMsg), pattern) {
				redacted := "[error details redacted]"
				result.Error = &redacted
				break
			}
		}
	}
	return result
}

// getSeverityIcon returns an icon for the severity level.
func getSeverityIcon(severity SuggestionSeverity) string {
	switch severity {
	case SuggestionSeverityInfo:
		return "ℹ"
	case SuggestionSeverityWarning:
		return "⚠"
	case SuggestionSeverityError:
		return "✗"
	case SuggestionSeverityCritical:
		return "‼"
	default:
		return "•"
	}
}

// padRight pads a string to the specified width.
func padRight(s string, width int) string {
	if len(s) >= width {
		return s
	}
	return s + strings.Repeat(" ", width-len(s))
}

// wrapText wraps text to the specified width with a prefix for continuation lines.
func wrapText(text string, width int, prefix string) string {
	if len(text) <= width {
		return text
	}

	var result strings.Builder
	words := strings.Fields(text)
	lineLen := 0

	for i, word := range words {
		if lineLen+len(word)+1 > width && lineLen > 0 {
			result.WriteString("\n")
			result.WriteString(prefix)
			lineLen = 0
		}
		if i > 0 && lineLen > 0 {
			result.WriteString(" ")
			lineLen++
		}
		result.WriteString(word)
		lineLen += len(word)
	}

	return result.String()
}
