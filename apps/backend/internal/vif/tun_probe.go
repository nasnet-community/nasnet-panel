package vif

import (
	"context"
	"fmt"
	"net"
)

// TUNProbe checks if a TUN interface exists
type TUNProbe struct {
	tunName string
}

// NewTUNProbe creates a new TUN interface probe
func NewTUNProbe(tunName string) *TUNProbe {
	return &TUNProbe{tunName: tunName}
}

// Check verifies the TUN interface exists
func (p *TUNProbe) Check(ctx context.Context) error {
	_, err := net.InterfaceByName(p.tunName)
	if err != nil {
		return fmt.Errorf("TUN interface %s not found: %w", p.tunName, err)
	}
	return nil
}

// Name returns the name of the health probe
func (p *TUNProbe) Name() string {
	return fmt.Sprintf("TUNProbe(%s)", p.tunName)
}
