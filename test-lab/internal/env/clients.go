package env

import (
	"context"
	"fmt"
	"net"
	"path/filepath"
	"strings"

	"nasnet-panel/test-lab/internal/profile"
	"nasnet-panel/test-lab/internal/sh"
)

func (e *Env) AttachSegmentClient(ctx context.Context, client, bridge string) error {
	idx, ok := e.net.spare[client]
	if !ok {
		return fmt.Errorf("no spare port client %q", client)
	}
	port := profile.LabInterface(idx)
	n, err := e.Router.SetWhere(ctx, "/interface/bridge/port", map[string]string{"interface": port}, map[string]string{"bridge": bridge})
	if err != nil {
		return err
	}
	if n == 0 {
		if _, err := e.Router.Run(ctx, "/interface/bridge/port/add", "=bridge="+bridge, "=interface="+port); err != nil {
			return err
		}
	}

	e.EnableDHCPDebug(ctx)
	offer, err := e.Probe.DHCP(ctx, client)
	if err != nil {
		return fmt.Errorf("segment client on %s got no lease: %w (%s, %s)", bridge, err, e.DHCPServers(ctx), e.Probe.DHCPTrace(client))
	}
	mask := net.IPMask(net.ParseIP(offer["mask"]).To4())
	ones, _ := mask.Size()
	if ones == 0 {
		ones = 24
	}
	ns := e.net.ns(client)
	_ = sh.Run("ip", "-n", ns, "addr", "flush", "dev", "lan0")
	cmds := [][]string{{"ip", "-n", ns, "addr", "add", fmt.Sprintf("%s/%d", offer["ip"], ones), "dev", "lan0"}}
	if offer["router"] != "" {
		cmds = append(cmds, []string{"ip", "-n", ns, "route", "replace", "default", "via", offer["router"]})
	}
	return sh.RunAll(cmds...)
}

func (e *Env) PrepareLabRegistry(ctx context.Context) error {
	if err := e.Upload(ctx, e.assets.caFile(), "test-lab-ca.pem"); err != nil {
		return err
	}
	if _, err := e.Router.Run(ctx, "/certificate/import", "=file-name=test-lab-ca.pem", "=passphrase=", "=trusted=yes"); err != nil {
		return err
	}
	if e.opts.Internet {
		return nil
	}
	_, err := e.Router.Run(ctx, "/container/config/set", "=registry-url=https://registry.lab.test", "=tmpdir="+filepath.Join("images", "tmp"))
	return err
}

func (e *Env) OvpnServerName(ctx context.Context) (string, error) {
	rows, err := e.Router.Print(ctx, "/interface/ovpn-server/server")
	if err != nil {
		return "", err
	}
	for _, row := range rows {
		if row["name"] != "" {
			return row["name"], nil
		}
	}
	return "", fmt.Errorf("no OpenVPN server on the router")
}

func (e *Env) DHCPServers(ctx context.Context) string {
	rows, err := e.Router.Print(ctx, "/ip/dhcp-server")
	if err != nil {
		return "dhcp servers: " + err.Error()
	}
	var parts []string
	for _, row := range rows {
		parts = append(parts, fmt.Sprintf("%s on %s disabled=%s invalid=%s", row["name"], row["interface"], row["disabled"], row["invalid"]))
	}
	if rules, err := e.Router.Print(ctx, "/system/logging"); err == nil {
		for _, row := range rules {
			parts = append(parts, "logging "+row["topics"]+" "+row["action"]+" disabled="+row["disabled"])
		}
	} else {
		parts = append(parts, "logging: "+err.Error())
	}
	if hosts, err := e.Router.Print(ctx, "/interface/bridge/host"); err == nil {
		for _, row := range hosts {
			if row["local"] != "true" {
				parts = append(parts, "host "+row["mac-address"]+" on "+row["bridge"]+"/"+row["on-interface"])
			}
		}
	}
	if logs, err := e.Router.Print(ctx, "/log"); err == nil {
		var dhcp []string
		for _, row := range logs {
			if strings.Contains(row["topics"], "dhcp") {
				dhcp = append(dhcp, "log "+row["topics"]+" "+row["message"])
			}
		}
		if len(dhcp) > 15 {
			dhcp = dhcp[len(dhcp)-15:]
		}
		parts = append(parts, dhcp...)
	}
	return "dhcp servers: " + strings.Join(parts, "; ")
}

func (e *Env) EnableDHCPDebug(ctx context.Context) {
	rows, err := e.Router.Print(ctx, "/system/logging", "?topics=dhcp")
	if err != nil || len(rows) > 0 {
		return
	}
	if _, err := e.Router.Run(ctx, "/system/logging/add", "=topics=dhcp", "=action=memory"); err != nil {
		fmt.Printf("enable dhcp logging: %v\n", err)
	}
}
