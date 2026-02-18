// Package http implements HTTP-based notification channels (email via SMTP, webhooks).
package http

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	htmltemplate "html/template"
	"mime/multipart"
	"net/smtp"
	"net/textproto"
	"strings"
	"time"

	"backend/internal/notifications"
	"backend/templates/alerts"
)

// EmailChannel delivers notifications via SMTP email.
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
	SkipVerify  bool     `json:"skip_verify"`
	ToAddresses []string `json:"to_addresses"`
}

// NewEmailChannel creates a new email notification channel.
func NewEmailChannel(config EmailConfig) *EmailChannel {
	return &EmailChannel{config: config}
}

// Name returns the channel identifier.
func (e *EmailChannel) Name() string { return "email" }

// Send delivers a notification via email with multipart HTML+plaintext.
func (e *EmailChannel) Send(ctx context.Context, notification notifications.Notification) error {
	if len(e.config.ToAddresses) == 0 {
		return fmt.Errorf("no recipient addresses configured")
	}
	templateData := e.buildTemplateData(notification)
	message, err := e.buildMultipartMessage(templateData)
	if err != nil {
		return fmt.Errorf("failed to build email message: %w", err)
	}
	return e.sendSMTP(message)
}

func (e *EmailChannel) buildTemplateData(notification notifications.Notification) map[string]interface{} {
	deviceName := "Unknown"
	deviceIP := "N/A"
	eventType := "alert.triggered"
	ruleName := notification.Title

	if notification.Data != nil {
		e.extractDataField(notification.Data, "device_name", &deviceName)
		e.extractDataField(notification.Data, "device_ip", &deviceIP)
		e.extractDataField(notification.Data, "event_type", &eventType)
		e.extractDataField(notification.Data, "rule_name", &ruleName)
	}

	const severityInfo = "INFO"
	severity := strings.ToUpper(notification.Severity)
	if severity == "" {
		severity = severityInfo
	}

	suggestedActions := e.extractSuggestedActions(notification.Data)
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
		"AlertID":          notification.Data["alertId"],
	}
}

// extractDataField extracts a string field from notification data.
func (e *EmailChannel) extractDataField(data map[string]interface{}, field string, dest *string) {
	if value, ok := data[field].(string); ok && value != "" {
		*dest = value
	}
}

// extractSuggestedActions extracts suggested actions from various formats.
func (e *EmailChannel) extractSuggestedActions(data map[string]interface{}) []string {
	if data == nil {
		return nil
	}

	if actions, ok := data["suggested_actions"].([]string); ok {
		return actions
	}

	if actionsStr, ok := data["suggested_actions"].(string); ok && actionsStr != "" {
		return strings.Split(actionsStr, "\n")
	}

	return nil
}

func (e *EmailChannel) buildMultipartMessage(data map[string]interface{}) ([]byte, error) {
	var buf bytes.Buffer

	from := e.config.FromAddress
	if e.config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", e.config.FromName, e.config.FromAddress)
	}

	severity, _ := data["Severity"].(string) //nolint:errcheck // use zero value default
	title, _ := data["Title"].(string)       //nolint:errcheck // use zero value default
	subject := fmt.Sprintf("[NasNet Alert - %s] %s", severity, title)

	alertID := ""
	if id, ok := data["AlertID"].(string); ok {
		alertID = id
	}

	buf.WriteString(fmt.Sprintf("From: %s\r\n", from))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(e.config.ToAddresses, ", ")))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	buf.WriteString("MIME-Version: 1.0\r\n")

	if alertID != "" {
		buf.WriteString(fmt.Sprintf("X-NasNet-Alert-ID: %s\r\n", alertID))
	}
	buf.WriteString(fmt.Sprintf("X-NasNet-Severity: %s\r\n", severity))

	writer := multipart.NewWriter(&buf)
	boundary := writer.Boundary()
	buf.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=%s\r\n", boundary))
	buf.WriteString("\r\n")

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
	_, _ = plaintextPart.Write([]byte(plaintext)) //nolint:errcheck // best-effort write

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
	_, _ = htmlPart.Write([]byte(html)) //nolint:errcheck // best-effort write

	_ = writer.Close()
	return buf.Bytes(), nil
}

func (e *EmailChannel) renderTemplate(templateName string, data map[string]interface{}) (string, error) {
	tmplContent, err := alerts.GetTemplate("email", templateName)
	if err != nil {
		return "", fmt.Errorf("failed to read template %s: %w", templateName, err)
	}
	tmpl, err := htmltemplate.New("email").Funcs(alerts.TemplateFuncMap()).Parse(tmplContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}
	return buf.String(), nil
}

// Test verifies the email configuration by sending a test message.
func (e *EmailChannel) Test(ctx context.Context, config map[string]interface{}) error {
	emailConfig, err := ParseEmailConfig(config)
	if err != nil {
		return fmt.Errorf("invalid email configuration: %w", err)
	}
	testChannel := NewEmailChannel(emailConfig)
	testNotification := notifications.Notification{
		Title:    "NasNetConnect Test Notification",
		Message:  "This is a test notification from NasNetConnect. If you received this, email notifications are configured correctly.",
		Severity: "INFO",
		Data:     map[string]interface{}{"alertId": "test"},
	}
	return testChannel.Send(ctx, testNotification)
}

// sendSMTP sends email via SMTP with TLS support.
func (e *EmailChannel) sendSMTP(message []byte) error {
	addr := fmt.Sprintf("%s:%d", e.config.SMTPHost, e.config.SMTPPort)

	var auth smtp.Auth
	if e.config.Username != "" && e.config.Password != "" {
		auth = smtp.PlainAuth("", e.config.Username, e.config.Password, e.config.SMTPHost)
	}

	if e.config.UseTLS {
		return e.sendWithTLS(addr, auth, message)
	}
	return smtp.SendMail(addr, auth, e.config.FromAddress, e.config.ToAddresses, message)
}

func (e *EmailChannel) sendWithTLS(addr string, auth smtp.Auth, message []byte) error {
	conn, err := tls.Dial("tcp", addr, &tls.Config{
		ServerName:         e.config.SMTPHost,
		InsecureSkipVerify: e.config.SkipVerify, //nolint:gosec // G402: user-configurable TLS verification for SMTP
	})
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, e.config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	if auth != nil {
		authErr := client.Auth(auth)
		if authErr != nil {
			return fmt.Errorf("SMTP authentication failed (check username/password)")
		}
	}
	mailErr := client.Mail(e.config.FromAddress)
	if mailErr != nil {
		return fmt.Errorf("failed to set sender: %w", mailErr)
	}
	for _, addr := range e.config.ToAddresses {
		rcptErr := client.Rcpt(addr)
		if rcptErr != nil {
			return fmt.Errorf("failed to set recipient %s: %w", addr, rcptErr)
		}
	}
	writer, writeErr := client.Data()
	if writeErr != nil {
		return fmt.Errorf("failed to initiate data transfer: %w", writeErr)
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

	if usernameVal, okUsername := config["username"].(string); okUsername {
		cfg.Username = usernameVal
	}
	if passwordVal, okPassword := config["password"].(string); okPassword {
		cfg.Password = passwordVal
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
