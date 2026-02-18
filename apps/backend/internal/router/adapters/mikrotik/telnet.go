package mikrotik

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"strings"
	"sync"
	"time"
)

// Telnet protocol bytes.
const (
	telnetIAC  = 255 // Interpret As Command
	telnetDONT = 254
	telnetDO   = 253
	telnetWONT = 252
	telnetWILL = 251
	telnetSB   = 250 // Sub-negotiation Begin
	telnetSE   = 240 // Sub-negotiation End
)

// TelnetClientConfig holds configuration for Telnet client.
type TelnetClientConfig struct {
	Address  string
	Username string
	Password string
	Timeout  time.Duration
}

// TelnetClient wraps Telnet connection for RouterOS command execution.
type TelnetClient struct {
	conn     net.Conn
	reader   *bufio.Reader
	address  string
	username string
	mu       sync.Mutex
}

// TelnetCommandResult holds the result of a single Telnet command execution.
type TelnetCommandResult struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
	Success    bool   `json:"success"`
}

// NewTelnetClient creates a new Telnet client for RouterOS.
func NewTelnetClient(cfg TelnetClientConfig) (*TelnetClient, error) {
	address := cfg.Address
	if !strings.Contains(address, ":") {
		address += ":23"
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	log.Printf("[TELNET] Connecting to %s as user %s", address, cfg.Username)

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return nil, fmt.Errorf("telnet dial failed: %w", err)
	}

	client := &TelnetClient{
		conn:     conn,
		reader:   bufio.NewReader(conn),
		address:  address,
		username: cfg.Username,
	}

	if err := client.login(cfg.Username, cfg.Password, timeout); err != nil {
		conn.Close()
		return nil, fmt.Errorf("telnet login failed: %w", err)
	}

	log.Printf("[TELNET] Successfully connected and authenticated to %s", address)

	return client, nil
}

// login handles the RouterOS login process.
func (c *TelnetClient) login(username, password string, timeout time.Duration) error {
	_ = c.conn.SetDeadline(time.Now().Add(timeout)) //nolint:errcheck // best effort deadline
	defer c.conn.SetDeadline(time.Time{})           //nolint:errcheck // best effort deadline

	if err := c.readUntilLogin(); err != nil {
		return fmt.Errorf("waiting for login prompt: %w", err)
	}

	if _, err := c.conn.Write([]byte(username + "\r\n")); err != nil {
		return fmt.Errorf("sending username: %w", err)
	}

	if err := c.readUntil("Password:"); err != nil {
		return fmt.Errorf("waiting for password prompt: %w", err)
	}

	if _, err := c.conn.Write([]byte(password + "\r\n")); err != nil {
		return fmt.Errorf("sending password: %w", err)
	}

	if err := c.readUntilPrompt(); err != nil {
		return fmt.Errorf("waiting for command prompt: %w", err)
	}

	return nil
}

// readUntilLogin reads and handles telnet negotiations until login prompt.
func (c *TelnetClient) readUntilLogin() error {
	var buffer strings.Builder
	for {
		b, err := c.reader.ReadByte()
		if err != nil {
			return err
		}

		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
				return err
			}
			continue
		}

		buffer.WriteByte(b)
		s := buffer.String()

		if strings.Contains(s, "Login:") || strings.Contains(s, "login:") ||
			strings.Contains(s, "Username:") || strings.Contains(s, "username:") {

			return nil
		}
	}
}

// handleTelnetCommand handles telnet protocol negotiations.
func (c *TelnetClient) handleTelnetCommand() error {
	cmd, err := c.reader.ReadByte()
	if err != nil {
		return err
	}

	switch cmd {
	case telnetDO, telnetDONT:
		opt, err := c.reader.ReadByte()
		if err != nil {
			return err
		}
		_, _ = c.conn.Write([]byte{telnetIAC, telnetWONT, opt}) //nolint:errcheck // best effort write

	case telnetWILL, telnetWONT:
		opt, err := c.reader.ReadByte()
		if err != nil {
			return err
		}
		_, _ = c.conn.Write([]byte{telnetIAC, telnetDONT, opt}) //nolint:errcheck // best effort write

	case telnetSB:
		for {
			b, err := c.reader.ReadByte()
			if err != nil {
				return err
			}
			if b == telnetIAC {
				next, err := c.reader.ReadByte()
				if err != nil {
					return err
				}
				if next == telnetSE {
					break
				}
			}
		}
	}

	return nil
}

// readUntil reads from connection until the specified string is found.
func (c *TelnetClient) readUntil(marker string) error {
	var buffer strings.Builder
	for {
		b, err := c.reader.ReadByte()
		if err != nil {
			return err
		}

		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
				return err
			}
			continue
		}

		buffer.WriteByte(b)
		if strings.Contains(buffer.String(), marker) {
			return nil
		}
	}
}

// readUntilPrompt reads until RouterOS command prompt.
func (c *TelnetClient) readUntilPrompt() error {
	var buffer strings.Builder
	for {
		b, err := c.reader.ReadByte()
		if err != nil {
			return err
		}

		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
				return err
			}
			continue
		}

		buffer.WriteByte(b)
		s := buffer.String()

		trimmed := strings.TrimSpace(s)
		if strings.HasSuffix(trimmed, ">") || strings.HasSuffix(trimmed, "]") {
			return nil
		}
	}
}

// Close closes the Telnet connection.
func (c *TelnetClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		_ = c.conn.SetWriteDeadline(time.Now().Add(2 * time.Second)) //nolint:errcheck // best effort deadline
		_, _ = c.conn.Write([]byte("/quit\r\n"))                     //nolint:errcheck // best effort quit
		_ = c.conn.Close()
		c.conn = nil
		log.Printf("[TELNET] Connection to %s closed", c.address)
	}
}

// IsConnected checks if client is still connected.
func (c *TelnetClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.conn != nil
}
