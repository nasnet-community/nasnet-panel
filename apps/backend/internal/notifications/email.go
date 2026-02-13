// Package notifications implements email notification delivery.
package notifications

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"html/template"
	"mime/multipart"
	"net/smtp"
	"net/textproto"
	"strings"
	"time"

	"backend/templates/alerts"
)

// EmailChannel delivers notifications via SMTP email.
// Per Task 3.2: Implement EmailChannel with SMTP support (TLS, auth).
type EmailChannel struct {
	config EmailConfig
}

// EmailConfig holds SMTP configuration.
type EmailConfig struct {
	SMTPHost    string   `json:"smtp_host"`
	SMTPPort    int      `json:"smtp_port"`
	Username    string   `json:"username"`
	Password    string   `json:"password"`
	FromAddress string   `json:"from_address"`
	FromName    string   `json:"from_name"`
	UseTLS      bool     `json:"use_tls"`
	SkipVerify  bool     `json:"skip_verify"`  // Skip TLS certificate verification
	ToAddresses []string `json:"to_addresses"` // Recipient addresses
}

// NewEmailChannel creates a new email notification channel.
func NewEmailChannel(config EmailConfig) *EmailChannel {
	return &EmailChannel{config: config}
}

// Name returns the channel identifier.
func (e *EmailChannel) Name() string {
	return "email"
}

// Send delivers a notification via email with multipart HTML+plaintext.
func (e *EmailChannel) Send(ctx context.Context, notification Notification) error {
	if len(e.config.ToAddresses) == 0 {
		return fmt.Errorf("no recipient addresses configured")
	}

	// Build template data
	templateData := e.buildTemplateData(notification)

	// Build multipart MIME message
	message, err := e.buildMultipartMessage(templateData)
	if err != nil {
		return fmt.Errorf("failed to build email message: %w", err)
	}

	// Send via SMTP
	return e.sendSMTP(message)
}

// buildTemplateData prepares data for email templates.
func (e *EmailChannel) buildTemplateData(notification Notification) map[string]interface{} {
	// Extract data fields
	deviceName := "Unknown"
	deviceIP := "N/A"
	eventType := "alert.triggered"
	ruleName := notification.Title

	if notification.Data != nil {
		if name, ok := notification.Data["device_name"].(string); ok && name != "" {
			deviceName = name
		}
		if ip, ok := notification.Data["device_ip"].(string); ok && ip != "" {
			deviceIP = ip
		}
		if evType, ok := notification.Data["event_type"].(string); ok && evType != "" {
			eventType = evType
		}
		if rule, ok := notification.Data["rule_name"].(string); ok && rule != "" {
			ruleName = rule
		}
	}

	// Get severity (uppercase for template)
	severity := strings.ToUpper(notification.Severity)
	if severity == "" {
		severity = "INFO"
	}

	// Extract suggested actions as array
	var suggestedActions []string
	if notification.Data != nil {
		if actions, ok := notification.Data["suggested_actions"].([]string); ok {
			suggestedActions = actions
		} else if actionsStr, ok := notification.Data["suggested_actions"].(string); ok && actionsStr != "" {
			// If it's a string, split by newlines
			suggestedActions = strings.Split(actionsStr, "\n")
		}
	}

	// Format time
	formattedTime := time.Now().Format("2006-01-02 15:04:05 MST")

	return map[string]interface{}{
		"Title":            notification.Title,
		"Message":          notification.Message,
		"Severity":         severity,
		"RuleName":         ruleName,
		"EventType":        eventType,
		"DeviceName":       deviceName,
		"DeviceIP":         deviceIP,
		"FormattedTime":    formattedTime,
		"SuggestedActions": suggestedActions,
	}
}

// buildMultipartMessage creates a multipart/alternative MIME message.
func (e *EmailChannel) buildMultipartMessage(data map[string]interface{}) ([]byte, error) {
	var buf bytes.Buffer

	// Build From header
	from := e.config.FromAddress
	if e.config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", e.config.FromName, e.config.FromAddress)
	}

	// Build subject with severity
	severity := data["Severity"].(string)
	title := data["Title"].(string)
	subject := fmt.Sprintf("[NasNet Alert - %s] %s", severity, title)

	// Extract alert ID for custom header
	alertID := data["AlertID"].(string)

	// Write main headers
	buf.WriteString(fmt.Sprintf("From: %s\r\n", from))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(e.config.ToAddresses, ", ")))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	buf.WriteString("MIME-Version: 1.0\r\n")

	// Custom headers
	buf.WriteString(fmt.Sprintf("X-NasNet-Alert-ID: %s\r\n", alertID))
	buf.WriteString(fmt.Sprintf("X-NasNet-Severity: %s\r\n", severity))

	// Create multipart writer
	writer := multipart.NewWriter(&buf)
	boundary := writer.Boundary()
	buf.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=%s\r\n", boundary))
	buf.WriteString("\r\n")

	// Add plaintext part
	plaintext, err := e.renderTemplate("default-body.txt", data)
	if err != nil {
		return nil, fmt.Errorf("failed to render plaintext template: %w", err)
	}

	plaintextHeader := make(textproto.MIMEHeader)
	plaintextHeader.Set("Content-Type", "text/plain; charset=utf-8")
	plaintextHeader.Set("Content-Transfer-Encoding", "quoted-printable")

	plaintextPart, err := writer.CreatePart(plaintextHeader)
	if err != nil {
		return nil, fmt.Errorf("failed to create plaintext part: %w", err)
	}
	plaintextPart.Write([]byte(plaintext))

	// Add HTML part
	html, err := e.renderTemplate("default-body.html", data)
	if err != nil {
		return nil, fmt.Errorf("failed to render HTML template: %w", err)
	}

	htmlHeader := make(textproto.MIMEHeader)
	htmlHeader.Set("Content-Type", "text/html; charset=utf-8")
	htmlHeader.Set("Content-Transfer-Encoding", "quoted-printable")

	htmlPart, err := writer.CreatePart(htmlHeader)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTML part: %w", err)
	}
	htmlPart.Write([]byte(html))

	// Close multipart writer
	writer.Close()

	return buf.Bytes(), nil
}

// renderTemplate loads and renders an email template using the alerts package.
func (e *EmailChannel) renderTemplate(templateName string, data map[string]interface{}) (string, error) {
	// Load template content from alerts package
	tmplContent, err := alerts.GetTemplate("email", templateName)
	if err != nil {
		return "", fmt.Errorf("failed to read template %s: %w", templateName, err)
	}

	// Parse template with func map
	tmpl, err := template.New("email").Funcs(alerts.TemplateFuncMap()).Parse(tmplContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	// Execute template
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// sendSMTP sends email via SMTP with TLS support.
func (e *EmailChannel) sendSMTP(message []byte) error {
	addr := fmt.Sprintf("%s:%d", e.config.SMTPHost, e.config.SMTPPort)

	// Create authentication
	var auth smtp.Auth
	if e.config.Username != "" && e.config.Password != "" {
		auth = smtp.PlainAuth("", e.config.Username, e.config.Password, e.config.SMTPHost)
	}

	if e.config.UseTLS {
		// Use TLS connection
		return e.sendWithTLS(addr, auth, message)
	}

	// Use plain SMTP
	return smtp.SendMail(addr, auth, e.config.FromAddress, e.config.ToAddresses, message)
}

// sendWithTLS sends email over TLS connection.
func (e *EmailChannel) sendWithTLS(addr string, auth smtp.Auth, message []byte) error {
	// Connect with TLS
	conn, err := tls.Dial("tcp", addr, &tls.Config{
		ServerName:         e.config.SMTPHost,
		InsecureSkipVerify: e.config.SkipVerify,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	// Create SMTP client
	client, err := smtp.NewClient(conn, e.config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	// Authenticate if credentials provided
	if auth != nil {
		if err := client.Auth(auth); err != nil {
			// Sanitize error to prevent credential leakage
			return fmt.Errorf("SMTP authentication failed (check username/password)")
		}
	}

	// Set sender
	if err := client.Mail(e.config.FromAddress); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	// Set recipients
	for _, addr := range e.config.ToAddresses {
		if err := client.Rcpt(addr); err != nil {
			return fmt.Errorf("failed to set recipient %s: %w", addr, err)
		}
	}

	// Send message body
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to initiate data transfer: %w", err)
	}

	_, err = writer.Write(message)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close message writer: %w", err)
	}

	return client.Quit()
}

// Test verifies the email configuration by sending a test message.
// Per AC4: User can send test notification with success/error feedback.
// Thread-safe: creates a new instance instead of mutating the receiver.
func (e *EmailChannel) Test(ctx context.Context, config map[string]interface{}) error {
	// Parse config
	emailConfig, err := ParseEmailConfig(config)
	if err != nil {
		return fmt.Errorf("invalid email configuration: %w", err)
	}

	// Create new instance with test config (thread-safe)
	testChannel := NewEmailChannel(emailConfig)

	// Send test notification
	testNotification := Notification{
		Title:    "NasNetConnect Test Notification",
		Message:  "This is a test notification from NasNetConnect. If you received this, email notifications are configured correctly.",
		Severity: "INFO",
	}

	return testChannel.Send(ctx, testNotification)
}

// ParseEmailConfig converts a map to EmailConfig.
func ParseEmailConfig(config map[string]interface{}) (EmailConfig, error) {
	cfg := EmailConfig{}

	smtpHost, ok := config["smtp_host"].(string)
	if !ok || smtpHost == "" {
		return cfg, fmt.Errorf("smtp_host is required")
	}
	cfg.SMTPHost = smtpHost

	smtpPort, ok := config["smtp_port"].(float64)
	if !ok {
		return cfg, fmt.Errorf("smtp_port is required")
	}
	cfg.SMTPPort = int(smtpPort)

	if username, ok := config["username"].(string); ok {
		cfg.Username = username
	}

	if password, ok := config["password"].(string); ok {
		cfg.Password = password
	}

	fromAddress, ok := config["from_address"].(string)
	if !ok || fromAddress == "" {
		return cfg, fmt.Errorf("from_address is required")
	}
	cfg.FromAddress = fromAddress

	if fromName, ok := config["from_name"].(string); ok {
		cfg.FromName = fromName
	}

	if useTLS, ok := config["use_tls"].(bool); ok {
		cfg.UseTLS = useTLS
	}

	if skipVerify, ok := config["skip_verify"].(bool); ok {
		cfg.SkipVerify = skipVerify
	}

	// Parse to_addresses array
	if toAddrs, ok := config["to_addresses"].([]interface{}); ok {
		addresses := make([]string, 0, len(toAddrs))
		for _, addr := range toAddrs {
			if addrStr, ok := addr.(string); ok {
				addresses = append(addresses, addrStr)
			}
		}
		cfg.ToAddresses = addresses
	}

	if len(cfg.ToAddresses) == 0 {
		return cfg, fmt.Errorf("at least one recipient address is required")
	}

	return cfg, nil
}
