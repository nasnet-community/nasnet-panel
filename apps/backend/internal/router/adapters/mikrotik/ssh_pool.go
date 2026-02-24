package mikrotik

import (
	"fmt"
	"sync"

	"go.uber.org/zap"
)

// SSHClientPool manages a pool of SSH connections.
type SSHClientPool struct {
	clients map[string]*SSHClient
	mu      sync.RWMutex
}

// NewSSHClientPool creates a new SSH client pool.
func NewSSHClientPool() *SSHClientPool {
	return &SSHClientPool{
		clients: make(map[string]*SSHClient),
	}
}

// Get retrieves or creates an SSH client for the given configuration.
func (p *SSHClientPool) Get(cfg SSHClientConfig) (*SSHClient, error) {
	key := fmt.Sprintf("ssh:%s:%s", cfg.Address, cfg.Username)

	p.mu.RLock()
	//nolint:nestif // pool lookup logic
	if client, ok := p.clients[key]; ok {
		p.mu.RUnlock()
		if client.IsConnected() {
			if err := client.Ping(); err == nil {
				return client, nil
			}

			p.Remove(key)
		}
	} else {
		p.mu.RUnlock()
	}

	client, err := NewSSHClient(cfg, zap.NewNop())
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	p.clients[key] = client
	p.mu.Unlock()

	return client, nil
}

// Remove removes a client from the pool.
func (p *SSHClientPool) Remove(key string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[key]; ok {
		client.Close()
		delete(p.clients, key)
	}
}

// CloseAll closes all clients in the pool.
func (p *SSHClientPool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, client := range p.clients {
		client.Close()
	}
	p.clients = make(map[string]*SSHClient)
}
