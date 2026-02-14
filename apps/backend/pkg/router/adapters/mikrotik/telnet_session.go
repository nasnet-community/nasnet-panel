package mikrotik

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"
)

// RunCommand executes a single command and returns output.
func (c *TelnetClient) RunCommand(ctx context.Context, command string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return "", fmt.Errorf("telnet client not connected")
	}

	if deadline, ok := ctx.Deadline(); ok {
		c.conn.SetDeadline(deadline)
		defer c.conn.SetDeadline(time.Time{})
	} else {
		c.conn.SetDeadline(time.Now().Add(30 * time.Second))
		defer c.conn.SetDeadline(time.Time{})
	}

	cmd := strings.TrimSpace(command)
	log.Printf("[TELNET] Executing: %s", TruncateForLog(cmd, 100))

	if _, err := c.conn.Write([]byte(cmd + "\r\n")); err != nil {
		return "", fmt.Errorf("sending command: %w", err)
	}

	output, err := c.readCommandOutput(ctx, cmd)
	if err != nil {
		return output, err
	}

	return output, nil
}

// readCommandOutput reads command output until the next prompt.
func (c *TelnetClient) readCommandOutput(ctx context.Context, sentCommand string) (string, error) {
	var output strings.Builder
	var lineBuffer strings.Builder
	echoSkipped := false

	for {
		select {
		case <-ctx.Done():
			return output.String(), ctx.Err()
		default:
		}

		b, err := c.reader.ReadByte()
		if err != nil {
			return output.String(), err
		}

		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
				return output.String(), err
			}
			continue
		}

		if b == '\n' {
			line := lineBuffer.String()
			lineBuffer.Reset()

			if !echoSkipped && strings.Contains(line, sentCommand) {
				echoSkipped = true
				continue
			}

			trimmed := strings.TrimSpace(line)
			if isRouterOSPrompt(trimmed) {
				break
			}

			if echoSkipped {
				output.WriteString(line)
				output.WriteByte('\n')
			}
		} else if b != '\r' {
			lineBuffer.WriteByte(b)
		}
	}

	return strings.TrimSpace(output.String()), nil
}

// isRouterOSPrompt checks if a line is a RouterOS prompt.
func isRouterOSPrompt(line string) bool {
	if line == "" {
		return false
	}
	return strings.HasSuffix(line, ">") || strings.HasSuffix(line, "] >")
}

// RunCommands executes multiple commands and returns results.
func (c *TelnetClient) RunCommands(ctx context.Context, commands []string) ([]TelnetCommandResult, error) {
	var results []TelnetCommandResult

	for i, cmd := range commands {
		select {
		case <-ctx.Done():
			return results, ctx.Err()
		default:
		}

		trimmed := strings.TrimSpace(cmd)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		output, err := c.RunCommand(ctx, trimmed)
		result := TelnetCommandResult{
			LineNumber: i + 1,
			Command:    cmd,
			Output:     output,
			Success:    err == nil,
		}
		if err != nil {
			result.Error = err.Error()
		}
		results = append(results, result)
	}

	return results, nil
}

// TelnetClientPool manages a pool of Telnet connections.
type TelnetClientPool struct {
	clients map[string]*TelnetClient
	mu      sync.RWMutex
}

// NewTelnetClientPool creates a new Telnet client pool.
func NewTelnetClientPool() *TelnetClientPool {
	return &TelnetClientPool{
		clients: make(map[string]*TelnetClient),
	}
}

// Get retrieves or creates a Telnet client for the given configuration.
func (p *TelnetClientPool) Get(cfg TelnetClientConfig) (*TelnetClient, error) {
	key := fmt.Sprintf("telnet:%s:%s", cfg.Address, cfg.Username)

	p.mu.RLock()
	if client, ok := p.clients[key]; ok {
		p.mu.RUnlock()
		if client.IsConnected() {
			return client, nil
		}
		p.Remove(key)
	} else {
		p.mu.RUnlock()
	}

	client, err := NewTelnetClient(cfg)
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	p.clients[key] = client
	p.mu.Unlock()

	return client, nil
}

// Remove removes a client from the pool.
func (p *TelnetClientPool) Remove(key string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[key]; ok {
		client.Close()
		delete(p.clients, key)
	}
}

// CloseAll closes all clients in the pool.
func (p *TelnetClientPool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, client := range p.clients {
		client.Close()
	}
	p.clients = make(map[string]*TelnetClient)
}
