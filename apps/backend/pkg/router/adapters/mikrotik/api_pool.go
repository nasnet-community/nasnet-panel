package mikrotik

import (
	"fmt"
	"sync"
)

// ROSClientPool manages a pool of RouterOS API connections.
type ROSClientPool struct {
	clients map[string]*ROSClient
	mu      sync.RWMutex
}

// NewROSClientPool creates a new client pool.
func NewROSClientPool() *ROSClientPool {
	return &ROSClientPool{
		clients: make(map[string]*ROSClient),
	}
}

// Get retrieves or creates a client for the given configuration.
func (p *ROSClientPool) Get(cfg ROSClientConfig) (*ROSClient, error) {
	key := fmt.Sprintf("%s:%s:%v", cfg.Address, cfg.Username, cfg.UseTLS)

	p.mu.RLock()
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

	client, err := NewROSClient(cfg)
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	p.clients[key] = client
	p.mu.Unlock()

	return client, nil
}

// Remove removes a client from the pool.
func (p *ROSClientPool) Remove(key string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[key]; ok {
		client.Close()
		delete(p.clients, key)
	}
}

// CloseAll closes all clients in the pool.
func (p *ROSClientPool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, client := range p.clients {
		client.Close()
	}
	p.clients = make(map[string]*ROSClient)
}
