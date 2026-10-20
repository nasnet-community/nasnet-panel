package env

import (
	"path/filepath"
	"strings"

	"nasnet-panel/test-lab/internal/sh"
)

func (e *Env) startServices() error {
	inet := e.net.ns("internet")

	listeners := make([]string, 0, len(resolverAddresses))
	for _, addr := range resolverAddresses {
		listeners = append(listeners, addr+":53")
	}
	static := []string{
		"s4i.co=" + listSourceIP,
		"ir=" + domesticHostIP,
		"cloudflare-dns.com=" + CloudflareDoH,
		"dns.google=" + GoogleDoH,
		"registry.lab.test=" + registryIP,
	}
	if !e.opts.Internet {
		static = append(static, "raw.githubusercontent.com="+registryIP)
	}

	args := []string{
		e.assets.labsvc, "serve",
		"-ca-dir", e.assets.caDir,
		"-whoami", foreignHostIP + ":80," + domesticHostIP + ":80",
		"-iplist", listSourceIP + ":443",
		"-include", domesticCIDR,
		"-dns", strings.Join(listeners, ","),
		"-dns-static", strings.Join(static, ","),
		"-doh", GoogleDoH + ":443," + CloudflareDoH + ":443",
		"-doh-names", "dns.google,cloudflare-dns.com",
		"-registry", registryIP + ":443",
		"-plugins-dir", e.assets.pluginsDir,
		"-oci-binary", e.assets.staticLabsvc(e.liveArch),
		"-oci-arch", ociArch(e.liveArch),
	}
	if e.opts.Internet {
		args = append(args, "-dns-forward", "9.9.9.9:53")
	} else {
		args = append(args, "-dns-fallback", foreignHostIP)
	}
	if err := e.start("internet", sh.InNS(inet, args...)...); err != nil {
		return err
	}

	upstreams := []struct {
		role, gateway, first, last string
	}{
		{"starlink", starlinkGateway, "100.64.0.100", "100.64.0.200"},
		{"domestic", e.net.domesticGW, e.net.domesticFirst, e.net.domesticLast},
	}
	for _, up := range upstreams {
		if _, _, ok := e.Profile.PortByRole(up.role); !ok {
			continue
		}
		dhcp := sh.InNS(e.net.ns(up.role), "dnsmasq",
			"--keep-in-foreground",
			"--user=root",
			"--port=0",
			"--no-resolv",
			"--no-hosts",
			"--bind-interfaces",
			"--interface=lan0",
			"--dhcp-range="+up.first+","+up.last+",255.255.255.0,1h",
			"--dhcp-option=option:router,"+up.gateway,
			"--dhcp-leasefile="+filepath.Join(e.Dir, up.role+".leases"),
			"--pid-file="+filepath.Join(e.Dir, up.role+"-dhcp.pid"),
			"--log-facility=-",
			"--log-dhcp",
		)
		if err := e.start(up.role+"-dhcp", dhcp...); err != nil {
			return err
		}
	}

	return e.startVPNServers()
}

func ociArch(liveArch string) string {
	if liveArch == "arm64" {
		return "arm64"
	}
	return "amd64"
}
