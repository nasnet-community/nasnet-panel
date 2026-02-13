// +build integration

package notifications

import (
	"context"
	"fmt"
	"net"
	"net/smtp"
	"strings"
	"sync"
	"testing"
	"time"

	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"
)

// MockSMTPServer implements a simple SMTP server for testing.
type MockSMTPServer struct {
	listener   net.Listener
	messages   []MockSMTPMessage
	mu         sync.Mutex
	started    bool
	shouldFail bool
	port       int
}

// MockSMTPMessage represents a captured SMTP message.
type MockSMTPMessage struct {
	From       string
	To         []string
	Data       string
	HasHTML    bool
	HasText    bool
	Subject    string
	Headers    map[string]string
	ReceivedAt time.Time
}

// NewMockSMTPServer creates a new mock SMTP server.
func NewMockSMTPServer() *MockSMTPServer {
	return &MockSMTPServer{
		messages: make([]MockSMTPMessage, 0),
	}
}

// Start starts the mock SMTP server on a random port.
func (s *MockSMTPServer) Start() error {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}

	s.listener = listener
	s.port = listener.Addr().(*net.TCPAddr).Port
	s.started = true

	go s.accept()
	return nil
}

// Stop stops the mock SMTP server.
func (s *MockSMTPServer) Stop() {
	if s.listener != nil {
		s.listener.Close()
	}
}

// GetPort returns the port the server is listening on.
func (s *MockSMTPServer) GetPort() int {
	return s.port
}

// GetMessages returns all captured messages.
func (s *MockSMTPServer) GetMessages() []MockSMTPMessage {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]MockSMTPMessage{}, s.messages...)
}

// ClearMessages clears all captured messages.
func (s *MockSMTPServer) ClearMessages() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.messages = make([]MockSMTPMessage, 0)
}

// accept accepts incoming connections and handles them.
func (s *MockSMTPServer) accept() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			return // Server stopped
		}
		go s.handleConnection(conn)
	}
}

// handleConnection handles a single SMTP connection.
func (s *MockSMTPServer) handleConnection(conn net.Conn) {
	defer conn.Close()

	// Send greeting
	conn.Write([]byte("220 localhost SMTP Mock Server\r\n"))

	var from string
	var to []string
	var data strings.Builder
	inData := false

	buf := make([]byte, 4096)
	for {
		n, err := conn.Read(buf)
		if err != nil {
			return
		}

		line := string(buf[:n])

		if inData {
			data.WriteString(line)
			if strings.Contains(line, "\r\n.\r\n") {
				// End of data
				inData = false
				conn.Write([]byte("250 OK\r\n"))

				// Store message
				msg := s.parseMessage(from, to, data.String())
				s.mu.Lock()
				s.messages = append(s.messages, msg)
				s.mu.Unlock()

				from = ""
				to = nil
				data.Reset()
			}
			continue
		}

		// Handle SMTP commands
		if strings.HasPrefix(line, "HELO") || strings.HasPrefix(line, "EHLO") {
			conn.Write([]byte("250 OK\r\n"))
		} else if strings.HasPrefix(line, "MAIL FROM:") {
			from = extractEmail(line[10:])
			conn.Write([]byte("250 OK\r\n"))
		} else if strings.HasPrefix(line, "RCPT TO:") {
			to = append(to, extractEmail(line[8:]))
			conn.Write([]byte("250 OK\r\n"))
		} else if strings.HasPrefix(line, "DATA") {
			conn.Write([]byte("354 Start mail input\r\n"))
			inData = true
		} else if strings.HasPrefix(line, "QUIT") {
			conn.Write([]byte("221 Bye\r\n"))
			return
		} else {
			conn.Write([]byte("250 OK\r\n"))
		}
	}
}

// extractEmail extracts email address from SMTP envelope.
func extractEmail(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "<>")
	s = strings.TrimSuffix(s, "\r\n")
	return s
}

// parseMessage parses the SMTP message data.
func (s *MockSMTPServer) parseMessage(from string, to []string, data string) MockSMTPMessage {
	msg := MockSMTPMessage{
		From:       from,
		To:         to,
		Data:       data,
		Headers:    make(map[string]string),
		ReceivedAt: time.Now(),
	}

	lines := strings.Split(data, "\r\n")
	for _, line := range lines {
		if strings.Contains(line, "Content-Type: text/html") {
			msg.HasHTML = true
		}
		if strings.Contains(line, "Content-Type: text/plain") {
			msg.HasText = true
		}
		if strings.HasPrefix(line, "Subject:") {
			msg.Subject = strings.TrimSpace(line[8:])
		}
		if strings.HasPrefix(line, "X-NasNet-") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				msg.Headers[parts[0]] = strings.TrimSpace(parts[1])
			}
		}
	}

	return msg
}

// TestEmailIntegration_FullFlowWithMultipart tests complete email flow with multipart MIME.
// Covers Task 8.1: Alert event → dispatcher → email sent with correct multipart content
func TestEmailIntegration_FullFlowWithMultipart(t *testing.T) {
	// Start mock SMTP server
	server := NewMockSMTPServer()
	err := server.Start()
	require.NoError(t, err)
	defer server.Stop()

	// Create email channel
	config := EmailConfig{
		SMTPHost:    "127.0.0.1",
		SMTPPort:    server.GetPort(),
		FromAddress: "alerts@nasnet.local",
		FromName:    "NasNet Alerts",
		ToAddresses: []string{"admin@example.com"},
		UseTLS:      false, // No TLS for mock server
		Username:    "",
		Password:    "",
	}
	channel := NewEmailChannel(config)

	// Create notification
	ctx := context.Background()
	notification := Notification{
		Title:    "Router Offline",
		Message:  "Router router-1 is offline and unreachable",
		Severity: "CRITICAL",
		Data: map[string]interface{}{
			"router_name":      "router-1",
			"alert_id":         "alert-123",
			"event_type":       "router.disconnected",
			"suggested_actions": []string{"Check network cable", "Restart router"},
		},
	}

	// Send email
	err = channel.Send(ctx, notification)
	require.NoError(t, err, "Email send should succeed")

	// Wait for message to be received
	time.Sleep(100 * time.Millisecond)

	// Verify message received
	messages := server.GetMessages()
	require.Len(t, messages, 1, "Should receive exactly one email")

	msg := messages[0]

	// Verify recipients
	assert.Equal(t, "alerts@nasnet.local", msg.From)
	assert.Equal(t, []string{"admin@example.com"}, msg.To)

	// Verify multipart MIME structure
	assert.True(t, msg.HasHTML, "Email should contain HTML part")
	assert.True(t, msg.HasText, "Email should contain plain text part")

	// Verify subject format
	assert.Equal(t, "[NasNet Alert - CRITICAL] Router Offline", msg.Subject)

	// Verify custom headers
	assert.Equal(t, "alert-123", msg.Headers["X-NasNet-Alert-ID"])
	assert.Equal(t, "CRITICAL", msg.Headers["X-NasNet-Severity"])

	// Verify message data contains MIME headers
	assert.Contains(t, msg.Data, "MIME-Version: 1.0")
	assert.Contains(t, msg.Data, "Content-Type: multipart/alternative")
}

// TestEmailIntegration_MultipleRecipients tests email delivery to multiple recipients.
// Covers Task 8.2: Configure 3 ToAddresses, verify all appear in RCPT TO commands
func TestEmailIntegration_MultipleRecipients(t *testing.T) {
	// Start mock SMTP server
	server := NewMockSMTPServer()
	err := server.Start()
	require.NoError(t, err)
	defer server.Stop()

	// Create email channel with 3 recipients
	config := EmailConfig{
		SMTPHost:    "127.0.0.1",
		SMTPPort:    server.GetPort(),
		FromAddress: "alerts@nasnet.local",
		ToAddresses: []string{
			"admin1@example.com",
			"admin2@example.com",
			"admin3@example.com",
		},
		UseTLS:   false,
		Username: "",
		Password: "",
	}
	channel := NewEmailChannel(config)

	// Send notification
	ctx := context.Background()
	notification := Notification{
		Title:    "Test Alert",
		Message:  "Testing multiple recipients",
		Severity: "INFO",
		Data: map[string]interface{}{
			"router_name": "test-router",
			"alert_id":    "alert-456",
		},
	}

	err = channel.Send(ctx, notification)
	require.NoError(t, err)

	// Wait for message
	time.Sleep(100 * time.Millisecond)

	// Verify message
	messages := server.GetMessages()
	require.Len(t, messages, 1)

	msg := messages[0]

	// Verify all recipients received the email
	assert.Len(t, msg.To, 3, "All 3 recipients should be in RCPT TO list")
	assert.Contains(t, msg.To, "admin1@example.com")
	assert.Contains(t, msg.To, "admin2@example.com")
	assert.Contains(t, msg.To, "admin3@example.com")
}

// TestEmailIntegration_DispatcherRetry tests dispatcher retry logic with email channel.
// Covers Task 8.4: Mock SMTP failure twice then success → verify 3 attempts with backoff
func TestEmailIntegration_DispatcherRetry(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	// Create mock channel that fails first 2 attempts
	attemptCount := 0
	mockChannel := &MockChannelWithCapture{
		onSend: func(n Notification) error {
			attemptCount++
			if attemptCount <= 2 {
				return fmt.Errorf("SMTP connection failed")
			}
			return nil
		},
	}

	channels := map[string]Channel{
		"email": mockChannel,
	}

	// Create dispatcher with retry config
	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	// Create notification
	ctx := context.Background()
	notification := Notification{
		Title:    "Test Alert",
		Message:  "Testing retry logic",
		Severity: "WARNING",
		Data:     map[string]interface{}{},
	}

	// Dispatch
	startTime := time.Now()
	results := dispatcher.Dispatch(ctx, notification, []string{"email"})
	duration := time.Since(startTime)

	// Verify eventual success
	require.Len(t, results, 1)
	assert.True(t, results[0].Success, "Should succeed after retries")

	// Verify retry attempts (fail 2, succeed 1 = 3 total)
	assert.Equal(t, 3, attemptCount, "Should have 3 total attempts")

	// Verify backoff delays occurred (should take at least 30ms for 10ms + 20ms backoff)
	assert.GreaterOrEqual(t, duration.Milliseconds(), int64(30), "Should have exponential backoff delays")
}

// MockChannelWithCapture is an updated mock that can simulate failures.
type MockChannelWithCapture struct {
	onSend func(Notification) error
}

func (m *MockChannelWithCapture) Send(ctx context.Context, notification Notification) error {
	if m.onSend != nil {
		return m.onSend(notification)
	}
	return nil
}

func (m *MockChannelWithCapture) Test(ctx context.Context, config map[string]interface{}) error {
	return nil
}

// TestEmailIntegration_ChannelIsolation tests that email failure doesn't block other channels.
// Covers Task 8.5: Mock email hanging, verify Pushover/Telegram channels still deliver
func TestEmailIntegration_ChannelIsolation(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	// Create channels
	emailDelivered := false
	pushoverDelivered := false
	telegramDelivered := false

	emailChannel := &MockChannelWithCapture{
		onSend: func(n Notification) error {
			// Simulate slow/hanging email
			time.Sleep(100 * time.Millisecond)
			return fmt.Errorf("email timeout")
		},
	}

	pushoverChannel := &MockChannelWithCapture{
		onSend: func(n Notification) error {
			pushoverDelivered = true
			return nil
		},
	}

	telegramChannel := &MockChannelWithCapture{
		onSend: func(n Notification) error {
			telegramDelivered = true
			return nil
		},
	}

	channels := map[string]Channel{
		"email":    emailChannel,
		"pushover": pushoverChannel,
		"telegram": telegramChannel,
	}

	// Create dispatcher
	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     0, // No retries for this test
		InitialBackoff: 10 * time.Millisecond,
	})

	// Dispatch to all channels
	ctx := context.Background()
	notification := Notification{
		Title:    "Test Alert",
		Message:  "Testing channel isolation",
		Severity: "CRITICAL",
		Data:     map[string]interface{}{},
	}

	results := dispatcher.Dispatch(ctx, notification, []string{"email", "pushover", "telegram"})

	// Verify results
	require.Len(t, results, 3)

	// Email should fail
	emailResult := findResult(results, "email")
	require.NotNil(t, emailResult)
	assert.False(t, emailResult.Success, "Email should fail")

	// Pushover and Telegram should succeed
	pushoverResult := findResult(results, "pushover")
	require.NotNil(t, pushoverResult)
	assert.True(t, pushoverResult.Success, "Pushover should succeed despite email failure")

	telegramResult := findResult(results, "telegram")
	require.NotNil(t, telegramResult)
	assert.True(t, telegramResult.Success, "Telegram should succeed despite email failure")

	// Verify other channels actually delivered
	assert.True(t, pushoverDelivered, "Pushover should have delivered")
	assert.True(t, telegramDelivered, "Telegram should have delivered")
	assert.False(t, emailDelivered, "Email should not have delivered")
}

// findResult finds a delivery result by channel name.
func findResult(results []DeliveryResult, channel string) *DeliveryResult {
	for i := range results {
		if results[i].Channel == channel {
			return &results[i]
		}
	}
	return nil
}

// TestEmailIntegration_SubjectFormatting tests subject format for different severity levels.
func TestEmailIntegration_SubjectFormatting(t *testing.T) {
	server := NewMockSMTPServer()
	err := server.Start()
	require.NoError(t, err)
	defer server.Stop()

	config := EmailConfig{
		SMTPHost:    "127.0.0.1",
		SMTPPort:    server.GetPort(),
		FromAddress: "alerts@nasnet.local",
		ToAddresses: []string{"admin@example.com"},
		UseTLS:      false,
	}

	testCases := []struct {
		severity        string
		title           string
		expectedSubject string
	}{
		{"CRITICAL", "Router Down", "[NasNet Alert - CRITICAL] Router Down"},
		{"WARNING", "High CPU", "[NasNet Alert - WARNING] High CPU"},
		{"INFO", "Config Applied", "[NasNet Alert - INFO] Config Applied"},
	}

	for _, tc := range testCases {
		t.Run(tc.severity, func(t *testing.T) {
			server.ClearMessages()

			channel := NewEmailChannel(config)
			notification := Notification{
				Title:    tc.title,
				Message:  "Test message",
				Severity: tc.severity,
				Data: map[string]interface{}{
					"router_name": "test-router",
					"alert_id":    "alert-test",
				},
			}

			err := channel.Send(context.Background(), notification)
			require.NoError(t, err)

			time.Sleep(50 * time.Millisecond)

			messages := server.GetMessages()
			require.Len(t, messages, 1)
			assert.Equal(t, tc.expectedSubject, messages[0].Subject)
		})
	}
}
