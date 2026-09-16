package probe

import (
	"context"
	"fmt"
	"os"
	"strings"

	"nasnet-panel/test-lab/internal/sh"
)

type Prober struct {
	Labsvc     string
	Namespaces map[string]string
}

func (p *Prober) ns(from string) (string, error) {
	ns, ok := p.Namespaces[from]
	if !ok {
		return "", fmt.Errorf("no lab client on %q", from)
	}
	return ns, nil
}

func (p *Prober) Fetch(ctx context.Context, from, url string) (string, error) {
	ns, err := p.ns(from)
	if err != nil {
		return "", err
	}
	out, err := sh.Output(ctx, sh.InNS(ns, p.Labsvc, "fetch", "-timeout", "5s", url)...)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

func (p *Prober) Resolve(ctx context.Context, from, server, qtype, name string) ([]string, error) {
	ns, err := p.ns(from)
	if err != nil {
		return nil, err
	}
	out, err := sh.Output(ctx, sh.InNS(ns, p.Labsvc, "resolve", "-server", server, "-type", qtype, "-timeout", "5s", name)...)
	if err != nil {
		return nil, err
	}
	return strings.Split(strings.TrimSpace(string(out)), "\n"), nil
}

func (p *Prober) DHCP(ctx context.Context, from string) (map[string]string, error) {
	ns, err := p.ns(from)
	if err != nil {
		return nil, err
	}
	script, err := os.CreateTemp("", "udhcpc-*.sh")
	if err != nil {
		return nil, err
	}
	defer func() { _ = os.Remove(script.Name()) }()
	_, _ = script.WriteString("#!/bin/sh\n[ \"$1\" = bound ] && echo \"LEASE ip=$ip mask=$subnet router=${router%% *} dns=${dns%% *} server=$serverid\"\nexit 0\n")
	_ = script.Close()
	if err := os.Chmod(script.Name(), 0o755); err != nil {
		return nil, err
	}

	out, err := sh.Output(ctx, sh.InNS(ns, "busybox", "udhcpc", "-i", "lan0", "-n", "-q", "-f", "-t", "6", "-T", "3", "-s", script.Name())...)
	for _, line := range strings.Split(string(out), "\n") {
		fields, ok := strings.CutPrefix(line, "LEASE ")
		if !ok {
			continue
		}
		offer := map[string]string{}
		for _, field := range strings.Fields(fields) {
			if key, value, ok := strings.Cut(field, "="); ok && value != "" {
				offer[key] = value
			}
		}
		return offer, nil
	}
	if err != nil {
		return nil, err
	}
	return nil, fmt.Errorf("no DHCP lease received")
}

func (p *Prober) Dial(ctx context.Context, from, addr string) error {
	ns, err := p.ns(from)
	if err != nil {
		return err
	}
	_, err = sh.Output(ctx, sh.InNS(ns, p.Labsvc, "dial", "-timeout", "3s", addr)...)
	return err
}
