package probe

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

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

func (p *Prober) DHCPTrace(from string) string {
	ns, err := p.ns(from)
	if err != nil {
		return err.Error()
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	capture := exec.CommandContext(ctx, "ip", "netns", "exec", ns, "timeout", "12", "tcpdump", "-lnei", "lan0", "-c", "20", "udp port 67 or udp port 68")
	var out bytes.Buffer
	capture.Stdout = &out
	capture.Stderr = &out
	if err := capture.Start(); err != nil {
		return "capture: " + err.Error()
	}
	time.Sleep(time.Second)
	_, _ = sh.Output(ctx, sh.InNS(ns, p.Labsvc, "dhcp", "-iface", "lan0", "-timeout", "8s")...)
	_ = capture.Wait()
	return "capture: " + strings.Join(strings.Fields(out.String()), " ")
}

func (p *Prober) DHCP(ctx context.Context, from string) (map[string]string, error) {
	ns, err := p.ns(from)
	if err != nil {
		return nil, err
	}
	out, err := sh.Output(ctx, sh.InNS(ns, p.Labsvc, "dhcp", "-iface", "lan0", "-timeout", "20s")...)
	if err != nil {
		return nil, err
	}
	offer := map[string]string{}
	if err := json.Unmarshal(out, &offer); err != nil {
		return nil, err
	}
	return offer, nil
}

func (p *Prober) Dial(ctx context.Context, from, addr string) error {
	ns, err := p.ns(from)
	if err != nil {
		return err
	}
	_, err = sh.Output(ctx, sh.InNS(ns, p.Labsvc, "dial", "-timeout", "3s", addr)...)
	return err
}
