// Package notifications implements email notification delivery.
package notifications

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/smtp"
	"strings"
)

// EmailChannel delivers notifications via SMTP email.
// Per Task 3.2: Implement EmailChannel with SMTP support (TLS, auth).
type EmailChannel struct {
	config EmailConfig
}

// EmailConfig holds SMTP configuration.
type EmailConfig struct {
	SMTPHost    string `json:"smtp_host"`
	SMTPPort    int    `json:"smtp_port"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	FromAddress string `json:"from_address"`
	FromName    string `json:"from_name"`
	UseTLS      bool   `json:"use_tls"`
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

// Send delivers a notification via email.
func (e *EmailChannel) Send(ctx context.Context, notification Notification) error {
	if len(e.config.ToAddresses) == 0 {
		return fmt.Errorf("no recipient addresses configured")
	}

	// Build email message
	subject := notification.Title
	body := notification.Message

	// Add severity indicator
	if notification.Severity != "" {
		subject = fmt.Sprintf("[%s] %s", notification.Severity, subject)
	}

	// Build RFC 822 email format
	from := e.config.FromAddress
	if e.config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", e.config.FromName, e.config.FromAddress)
	}

	message := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s\r\n",
		from,
		strings.Join(e.config.ToAddresses, ", "),
		subject,
		body))

	// Send via SMTP
	return e.sendSMTP(message)
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
		ServerName: e.config.SMTPHost,
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
			return fmt.Errorf("SMTP authentication failed: %w", err)
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
func (e *EmailChannel) Test(ctx context.Context, config map[string]interface{}) error {
	// Parse config
	emailConfig, err := parseEmailConfig(config)
	if err != nil {
		return fmt.Errorf("invalid email configuration: %w", err)
	}

	// Temporarily use test config
	originalConfig := e.config
	e.config = emailConfig
	defer func() { e.config = originalConfig }()

	// Send test notification
	testNotification := Notification{
		Title:    "NasNetConnect Test Notification",
		Message:  "This is a test notification from NasNetConnect. If you received this, email notifications are configured correctly.",
		Severity: "INFO",
	}

	return e.Send(ctx, testNotification)
}

// parseEmailConfig converts a map to EmailConfig.
func parseEmailConfig(config map[string]interface{}) (EmailConfig, error) {
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
