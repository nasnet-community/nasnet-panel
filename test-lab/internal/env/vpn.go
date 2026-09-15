package env

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"nasnet-panel/test-lab/internal/sh"
)

const chapSecrets = "/etc/ppp/chap-secrets"

type vpnServers struct {
	wireguard     bool
	l2tp          bool
	wgServerPub   string
	wgClientPriv  string
	l2tpUser      string
	l2tpPassword  string
	openvpnClient bool
}

func (e *Env) startVPNServers() error {
	e.vpn = &vpnServers{}
	inet := e.net.ns("internet")

	if len(MissingFeatureTools("wireguard")) == 0 {
		serverPriv, serverPub, err := e.wgKeys()
		if err != nil {
			return err
		}
		clientPriv, clientPub, err := e.wgKeys()
		if err != nil {
			return err
		}
		keyFile := filepath.Join(e.Dir, "wg-server.key")
		if err := os.WriteFile(keyFile, []byte(serverPriv+"\n"), 0o600); err != nil {
			return err
		}
		if err := sh.RunAll(
			[]string{"ip", "-n", inet, "link", "add", "wg0", "type", "wireguard"},
			[]string{"ip", "-n", inet, "addr", "add", "10.66.0.1/24", "dev", "wg0"},
			sh.InNS(inet, "wg", "set", "wg0", "listen-port", "51820", "private-key", keyFile,
				"peer", clientPub, "allowed-ips", "10.66.0.2/32"),
			[]string{"ip", "-n", inet, "link", "set", "wg0", "up"},
		); err != nil {
			return err
		}
		e.vpn.wireguard = true
		e.vpn.wgServerPub = serverPub
		e.vpn.wgClientPriv = clientPriv
	}

	if len(MissingFeatureTools("l2tp")) == 0 {
		e.vpn.l2tpUser = "lab" + e.ID
		e.vpn.l2tpPassword = randomHex(8)
		if err := e.writeL2TPConfig(); err != nil {
			return err
		}
		if err := e.start("l2tp", sh.InNS(inet, "xl2tpd", "-D",
			"-c", filepath.Join(e.Dir, "xl2tpd.conf"),
			"-p", filepath.Join(e.Dir, "xl2tpd.pid"),
			"-C", filepath.Join(e.Dir, "xl2tpd.control"))...); err != nil {
			return err
		}
		e.vpn.l2tp = true
	}
	return nil
}

func (e *Env) wgKeys() (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	out, err := sh.Output(ctx, e.assets.labsvc, "wgkey")
	if err != nil {
		return "", "", err
	}
	fields := strings.Fields(string(out))
	if len(fields) != 2 {
		return "", "", fmt.Errorf("unexpected wgkey output %q", out)
	}
	return fields[0], fields[1], nil
}

func (e *Env) writeL2TPConfig() error {
	ppp := filepath.Join(e.Dir, "l2tp.ppp")
	pppOptions := strings.Join([]string{
		"name lab-lns",
		"require-mschap-v2",
		"refuse-pap",
		"refuse-chap",
		"refuse-mschap",
		"ms-dns " + VPNResolver,
		"noccp",
		"nodefaultroute",
		"mtu 1400",
		"mru 1400",
		"",
	}, "\n")
	if err := os.WriteFile(ppp, []byte(pppOptions), 0o644); err != nil {
		return err
	}

	conf := strings.Join([]string{
		"[global]",
		"listen-addr = " + l2tpIP,
		"port = 1701",
		"access control = no",
		"[lns default]",
		"ip range = 10.67.0.2-10.67.0.50",
		"local ip = 10.67.0.1",
		"require authentication = yes",
		"require chap = yes",
		"refuse pap = yes",
		"length bit = yes",
		"name = lab-lns",
		"pppoptfile = " + ppp,
		"",
	}, "\n")
	if err := os.WriteFile(filepath.Join(e.Dir, "xl2tpd.conf"), []byte(conf), 0o644); err != nil {
		return err
	}

	line := fmt.Sprintf("%q * %q * # test-lab %s\n", e.vpn.l2tpUser, e.vpn.l2tpPassword, e.ID)
	f, err := os.OpenFile(chapSecrets, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return err
	}
	if _, err := f.WriteString(line); err != nil {
		_ = f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	e.cleanups = append(e.cleanups, func() { removeTaggedLines(chapSecrets, "# test-lab "+e.ID) })
	return nil
}

func removeTaggedLines(path, tag string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	var kept []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		if !strings.HasSuffix(scanner.Text(), tag) {
			kept = append(kept, scanner.Text())
		}
	}
	_ = f.Close()
	content := strings.Join(kept, "\n")
	if content != "" {
		content += "\n"
	}
	_ = os.WriteFile(path, []byte(content), 0o600)
}

func (e *Env) HasVPNServer(kind string) bool {
	switch kind {
	case "wireguard":
		return e.vpn.wireguard
	case "l2tp":
		return e.vpn.l2tp
	}
	return false
}

func (e *Env) WireGuardClientConfig() string {
	return strings.Join([]string{
		"[Interface]",
		"PrivateKey = " + e.vpn.wgClientPriv,
		"Address = 10.66.0.2/24",
		"",
		"[Peer]",
		"PublicKey = " + e.vpn.wgServerPub,
		"Endpoint = " + wireguardIP + ":51820",
		"AllowedIPs = 0.0.0.0/0",
		"PersistentKeepalive = 25",
		"",
	}, "\n")
}

func (e *Env) L2TPClient() (string, string, string) {
	return l2tpIP, e.vpn.l2tpUser, e.vpn.l2tpPassword
}

func (e *Env) SetVPNServer(kind string, up bool) error {
	switch kind {
	case "wireguard":
		state := "down"
		if up {
			state = "up"
		}
		return sh.Run("ip", "-n", e.net.ns("internet"), "link", "set", "wg0", state)
	case "l2tp":
		if up {
			return e.restartProcess("l2tp")
		}
		e.stopProcess("l2tp")
		return nil
	}
	return fmt.Errorf("unknown VPN server %q", kind)
}

func (e *Env) RouterWANAddress(role string) (string, error) {
	data, err := os.ReadFile(filepath.Join(e.Dir, role+".leases"))
	if err != nil {
		return "", fmt.Errorf("no DHCP lease on the %s upstream yet: %w", role, err)
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		fields := strings.Fields(lines[i])
		if len(fields) >= 3 {
			return fields[2], nil
		}
	}
	return "", fmt.Errorf("no DHCP lease on the %s upstream yet", role)
}

func (e *Env) ConnectOpenVPN(ctx context.Context, config, user, password, keyPassword string) error {
	if missing := MissingFeatureTools("openvpn"); len(missing) > 0 {
		return fmt.Errorf("missing tools: %s", strings.Join(missing, ", "))
	}
	cfg := filepath.Join(e.Dir, "ovpn-client.ovpn")
	auth := filepath.Join(e.Dir, "ovpn-client.auth")
	pass := filepath.Join(e.Dir, "ovpn-client.pass")
	if err := os.WriteFile(cfg, []byte(config), 0o600); err != nil {
		return err
	}
	if err := os.WriteFile(auth, []byte(user+"\n"+password+"\n"), 0o600); err != nil {
		return err
	}
	if err := os.WriteFile(pass, []byte(keyPassword+"\n"), 0o600); err != nil {
		return err
	}

	e.stopProcess("openvpn")
	if err := e.start("openvpn", sh.InNS(e.net.ns("domestic"), "openvpn",
		"--config", cfg, "--auth-user-pass", auth, "--askpass", pass, "--route-nopull", "--verb", "3")...); err != nil {
		return err
	}
	e.vpn.openvpnClient = true

	logPath := filepath.Join(e.Dir, "openvpn.log")
	for {
		data, _ := os.ReadFile(logPath)
		if strings.Contains(string(data), "Initialization Sequence Completed") {
			return nil
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("OpenVPN client did not connect, see openvpn.log")
		case <-time.After(2 * time.Second):
		}
	}
}
