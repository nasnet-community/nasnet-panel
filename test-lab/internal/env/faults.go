package env

import (
	"context"
	"fmt"
	"time"
)

func (e *Env) SetUpstream(role string, up bool) error {
	if role != "starlink" && role != "domestic" {
		return fmt.Errorf("unknown upstream %q", role)
	}
	if err := e.net.setLinkState(role, "up0", up); err != nil {
		return err
	}
	if !up {
		return nil
	}
	if role == "starlink" {
		return e.net.upstreamRoutes(role, 1, StarlinkPublic)
	}
	return e.net.upstreamRoutes(role, 2, DomesticPublic)
}

func (e *Env) SetCarrier(role string, up bool) error {
	i, _, ok := e.Profile.PortByRole(role)
	if !ok {
		return fmt.Errorf("profile %s has no %s port", e.Profile.Name, role)
	}
	state := "off"
	if up {
		state = "on"
	}
	return e.monitorCommand(fmt.Sprintf("set_link net%d %s", i+1, state))
}

func (e *Env) AddFilter(link, target string) error {
	addr, ok := Address(target)
	if !ok {
		return fmt.Errorf("unknown filter target %q", target)
	}
	if link != "" && link != "starlink" && link != "domestic" {
		return fmt.Errorf("unknown filter link %q", link)
	}
	e.filters = append(e.filters, filter{link: link, target: addr})
	return e.net.setFilters(e.filters)
}

func (e *Env) ClearFilters() error {
	e.filters = nil
	return e.net.setFilters(nil)
}

func (e *Env) DisconnectPanel(ctx context.Context, d time.Duration) error {
	if err := e.net.setLinkState("mgmt", "lan0", false); err != nil {
		return err
	}
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
	return e.net.setLinkState("mgmt", "lan0", true)
}

func (e *Env) Counters(ctx context.Context) (map[string]uint64, error) {
	return e.net.counters(ctx)
}

func (e *Env) ResetCounters() error {
	return e.net.resetCounters()
}

func LeakCounterNames() (string, string) {
	return counterStarlinkToDomestic, counterDomesticToForeign
}
