package install

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	wifiUplinkTag    = commentTag + "-wifi-uplink"
	wifiJoinTimeout  = 60 * time.Second
	wifiLeaseTimeout = 45 * time.Second
)

// WiFiNetwork is one network the router saw in a scan, on the radio that saw it best.
type WiFiNetwork struct {
	SSID      string `json:"ssid"`
	Signal    int    `json:"signal"`
	Security  string `json:"security"`
	Interface string `json:"interface"`
}

// WiFiChoice is the network the user picked and its password, empty for an open network.
type WiFiChoice struct {
	SSID     string `json:"ssid"`
	Password string `json:"password"`
}

// wifiPkg is the RouterOS package that drives the radios: the legacy
// "wireless" package or the newer "wifi" package.
type wifiPkg int

const (
	wifiLegacy wifiPkg = iota + 1
	wifiNew
)

func (p wifiPkg) menu() string {
	if p == wifiNew {
		return "/interface/wifi"
	}
	return "/interface/wireless"
}

func (p wifiPkg) String() string {
	if p == wifiNew {
		return "wifi"
	}
	return "wireless"
}

// Properties the installer changes on the radio, saved first so cleanup can put them back.
func (p wifiPkg) savedProps() []string {
	if p == wifiNew {
		return []string{"configuration.mode", "configuration.ssid", "security.authentication-types", "security.passphrase", "disabled"}
	}
	return []string{"mode", "ssid", "security-profile", "disabled"}
}

type wifiUplink struct {
	pkg     wifiPkg
	iface   string
	ssid    string
	saved   map[string]string
	bridged bool
}

// rosQuote returns s as a double-quoted RouterOS string.
func rosQuote(s string) string {
	r := strings.NewReplacer(`\`, `\\`, `"`, `\"`, `$`, `\$`, `?`, `\?`)
	return `"` + r.Replace(s) + `"`
}

func (e *Engine) redact(s string) string {
	for _, secret := range e.secrets {
		if secret != "" {
			s = strings.ReplaceAll(s, secret, "***")
		}
	}
	return s
}

func (e *Engine) wifiRadios() (pkg wifiPkg, radios []string) {
	for _, p := range []wifiPkg{wifiNew, wifiLegacy} {
		out, err := e.cl.RunChecked(fmt.Sprintf(`:foreach i in=[%[1]s find] do={:local m ""; :do {:set m [:tostr [%[1]s get $i master-interface]]} on-error={}; :if ($m = "") do={:put ("I=" . [%[1]s get $i name])}}`, p.menu()), 15*time.Second)
		if err != nil {
			continue
		}
		radios = nil
		for _, line := range strings.Split(out, "\n") {
			if name, ok := strings.CutPrefix(strings.TrimSpace(line), "I="); ok && name != "" {
				radios = append(radios, name)
			}
		}
		if len(radios) > 0 {
			return p, radios
		}
	}
	return 0, nil
}

func (e *Engine) stepWiFiUplink() error {
	pkg, radios := e.wifiRadios()
	if len(radios) == 0 {
		return errors.New("the WiFi uplink option is on, but the router has no WiFi interface (neither the wireless nor the wifi package is active). Turn the option off and connect the router with a cable, then run the installer again")
	}
	e.log("router has WiFi (%s package): %s", pkg, strings.Join(radios, ", "))

	var usable []string
	for _, r := range radios {
		if e.installerOn(r) {
			e.log("this computer is connected through %s, so the installer does not use it", r)
			continue
		}
		usable = append(usable, r)
	}
	if len(usable) == 0 {
		return errors.New("this computer is connected to the router over WiFi, and the installer needs that radio for the uplink. Connect the computer to a LAN port with a cable, then run the installer again")
	}

	networks := e.scanWiFi(pkg, usable)
	if len(networks) == 0 {
		return errors.New("the router did not find any WiFi network. Move it closer to the access point, then run the installer again")
	}
	e.log("found %d WiFi network(s)", len(networks))

	choice, ok := e.ev.WiFiPrompt(networks)
	if !ok || choice.SSID == "" {
		return errors.New("no WiFi network picked")
	}
	var picked *WiFiNetwork
	for i := range networks {
		if networks[i].SSID == choice.SSID {
			picked = &networks[i]
			break
		}
	}
	if picked == nil {
		return fmt.Errorf("the router cannot see the WiFi network %q. Check the name and that the network is in range, then run the installer again", choice.SSID)
	}
	e.secrets = append(e.secrets, choice.Password)

	if e.opts.DryRun {
		e.log("[dry-run] would join %q on %s in station mode with a DHCP client", picked.SSID, picked.Interface)
		e.note = "dry-run, WiFi not joined"
		return nil
	}
	if err := e.joinWiFi(pkg, picked.Interface, picked.SSID, choice.Password); err != nil {
		return err
	}
	e.note = fmt.Sprintf("joined %s on %s", picked.SSID, picked.Interface)
	return nil
}

func (e *Engine) scanWiFi(pkg wifiPkg, radios []string) []WiFiNetwork {
	variants := []string{"duration=8s as-value"}
	if pkg == wifiLegacy {
		variants = []string{"background=yes rounds=1 as-value", "duration=8s as-value"}
	}
	best := map[string]WiFiNetwork{}
	for _, radio := range radios {
		e.log("scanning for WiFi networks on %s", radio)
		for _, v := range variants {
			cmd := fmt.Sprintf(`:foreach r in=[%s/scan %s %s] do={:put ("N=" . [:tostr ($r->"ssid")]); :put ("R=" . [:tostr $r])}`, pkg.menu(), rosQuote(radio), v)
			out, err := e.cl.RunChecked(cmd, 40*time.Second)
			if err != nil {
				continue
			}
			found := parseWiFiScan(out, radio)
			for _, n := range found {
				if cur, ok := best[n.SSID]; !ok || n.Signal > cur.Signal {
					best[n.SSID] = n
				}
			}
			if len(found) > 0 {
				break
			}
		}
	}
	networks := make([]WiFiNetwork, 0, len(best))
	for _, n := range best {
		networks = append(networks, n)
	}
	sort.Slice(networks, func(i, j int) bool { return networks[i].Signal > networks[j].Signal })
	return networks
}

func parseWiFiScan(out, radio string) []WiFiNetwork {
	var networks []WiFiNetwork
	var ssid string
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if v, ok := strings.CutPrefix(line, "N="); ok {
			ssid = v
			continue
		}
		raw, ok := strings.CutPrefix(line, "R=")
		if !ok || ssid == "" {
			continue
		}
		n := WiFiNetwork{SSID: ssid, Interface: radio, Signal: -100}
		ssid = ""
		fields := parseDeviceMode(raw)
		for _, key := range []string{"signal", "sig", "signal-strength"} {
			if v, ok := fields[key]; ok {
				if i := strings.IndexAny(v, "@/ "); i > 0 {
					v = v[:i]
				}
				if s, err := strconv.Atoi(v); err == nil {
					n.Signal = s
					break
				}
			}
		}
		n.Security = fields["security"]
		if n.Security == "" && fields["privacy"] == "yes" {
			n.Security = "protected"
		}
		networks = append(networks, n)
	}
	return networks
}

func (e *Engine) wifiGet(pkg wifiPkg, iface, prop string) string {
	out, err := e.cl.RunRaw(fmt.Sprintf(`:put ("V=" . [:tostr [%s get [find name=%s] %s]])`, pkg.menu(), rosQuote(iface), prop), 15*time.Second)
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(out, "\n") {
		if v, ok := strings.CutPrefix(strings.TrimSpace(line), "V="); ok {
			return v
		}
	}
	return ""
}

func (e *Engine) joinWiFi(pkg wifiPkg, iface, ssid, password string) error {
	up := &wifiUplink{pkg: pkg, iface: iface, ssid: ssid, saved: map[string]string{}}
	for _, prop := range pkg.savedProps() {
		up.saved[prop] = e.wifiGet(pkg, iface, prop)
		if strings.HasSuffix(prop, "passphrase") {
			e.secrets = append(e.secrets, up.saved[prop])
		}
	}
	e.wifi = up

	sel := "[find name=" + rosQuote(iface) + "]"
	if e.exists("/interface/bridge/port", fmt.Sprintf("interface=%s disabled=no", rosQuote(iface))) {
		e.log("taking %s out of its bridge while it is the uplink", iface)
		if out, err := e.cl.RunChecked(fmt.Sprintf("/interface/bridge/port disable [find where interface=%s disabled=no]", rosQuote(iface)), 15*time.Second); err != nil {
			return fmt.Errorf("could not take %s out of its bridge: %w (%s)", iface, err, strings.TrimSpace(out))
		}
		up.bridged = true
	}

	var cmd string
	if pkg == wifiNew {
		auth := `""`
		pass := ""
		if password != "" {
			auth = "wpa2-psk,wpa3-psk"
			pass = " security.passphrase=" + rosQuote(password)
		}
		cmd = fmt.Sprintf("/interface/wifi set %s configuration.mode=station configuration.ssid=%s security.authentication-types=%s%s disabled=no", sel, rosQuote(ssid), auth, pass)
	} else {
		profile := rosQuote(wifiUplinkTag)
		secSet := "mode=none"
		if password != "" {
			secSet = fmt.Sprintf("mode=dynamic-keys authentication-types=wpa-psk,wpa2-psk wpa-pre-shared-key=%[1]s wpa2-pre-shared-key=%[1]s", rosQuote(password))
		}
		prof := fmt.Sprintf(`:if ([:len [/interface/wireless/security-profiles find name=%[1]s]] = 0) do={/interface/wireless/security-profiles add name=%[1]s}; /interface/wireless/security-profiles set [find name=%[1]s] %[2]s`, profile, secSet)
		if out, err := e.cl.RunChecked(prof, 15*time.Second); err != nil {
			return fmt.Errorf("could not create the WiFi security profile: %w (%s)", err, e.redact(strings.TrimSpace(out)))
		}
		cmd = fmt.Sprintf("/interface/wireless set %s mode=station ssid=%s security-profile=%s disabled=no", sel, rosQuote(ssid), profile)
	}
	e.log("joining %q on %s in station mode", ssid, iface)
	if out, err := e.cl.RunChecked(cmd, 20*time.Second); err != nil {
		return fmt.Errorf("could not set %s to station mode: %w (%s)", iface, err, e.redact(strings.TrimSpace(out)))
	}

	dhcp := fmt.Sprintf(`:if ([:len [/ip/dhcp-client find where interface=%[1]s]] = 0) do={/ip/dhcp-client add interface=%[1]s add-default-route=yes default-route-distance=1 use-peer-dns=yes use-peer-ntp=yes disabled=no comment=%[2]s}`, rosQuote(iface), rosQuote(wifiUplinkTag))
	if out, err := e.cl.RunChecked(dhcp, 15*time.Second); err != nil {
		return fmt.Errorf("could not add a DHCP client on %s: %w (%s)", iface, err, strings.TrimSpace(out))
	}
	return e.waitForWiFi(up)
}

func (e *Engine) waitForWiFi(up *wifiUplink) error {
	start := time.Now()
	connected := false
	for time.Since(start) < wifiJoinTimeout {
		if err := e.sleep(3 * time.Second); err != nil {
			return err
		}
		if e.exists(up.pkg.menu()+"/registration-table", "where interface="+rosQuote(up.iface)) {
			connected = true
			break
		}
	}
	if !connected {
		return fmt.Errorf("the router could not join the WiFi network %q within %s. The password may be wrong or the network is out of range. Check both, then run the installer again", up.ssid, wifiJoinTimeout)
	}
	e.log("%s is connected to %q, waiting for an address", up.iface, up.ssid)

	deadline := time.Now().Add(wifiLeaseTimeout)
	for time.Now().Before(deadline) {
		out, _ := e.cl.RunRaw(fmt.Sprintf(`:put [/ip/dhcp-client get [find where comment=%s] status]`, rosQuote(wifiUplinkTag)), 10*time.Second)
		if strings.TrimSpace(out) == "bound" {
			addr, _ := e.cl.RunRaw(fmt.Sprintf(`:put [/ip/dhcp-client get [find where comment=%s] address]`, rosQuote(wifiUplinkTag)), 10*time.Second)
			e.log("%s has the address %s", up.iface, strings.TrimSpace(addr))
			return nil
		}
		if err := e.sleep(3 * time.Second); err != nil {
			return err
		}
	}
	return fmt.Errorf("the router joined %q but did not get an address from its DHCP server within %s. Check the access point, then run the installer again", up.ssid, wifiLeaseTimeout)
}

// removeWiFiUplink undoes joinWiFi: it removes the DHCP client, puts the radio
// settings and bridge ports back, and drops the legacy security profile.
func (e *Engine) removeWiFiUplink() {
	up := e.wifi
	if up == nil {
		return
	}
	e.wifi = nil
	if _, err := e.cl.RunRaw(":put ok", 8*time.Second); err != nil {
		if rerr := e.cl.Reconnect(); rerr != nil {
			e.log("could not reach the router to remove the WiFi uplink on %s: %v. Remove it by hand: the DHCP client commented %s, and %s back to its old settings", up.iface, rerr, wifiUplinkTag, up.iface)
			return
		}
	}
	e.log("removing the WiFi uplink on %s", up.iface)
	_, _ = e.cl.RunRaw(fmt.Sprintf("/ip/dhcp-client remove [find where comment=%s]", rosQuote(wifiUplinkTag)), 15*time.Second)

	sel := "[find name=" + rosQuote(up.iface) + "]"
	for _, prop := range up.pkg.savedProps() {
		v := up.saved[prop]
		var cmd string
		switch {
		case prop == "disabled":
			if v == "true" {
				v = "yes"
			} else {
				v = "no"
			}
			cmd = fmt.Sprintf("%s set %s disabled=%s", up.pkg.menu(), sel, v)
		case v != "" || up.pkg == wifiLegacy:
			cmd = fmt.Sprintf("%s set %s %s=%s", up.pkg.menu(), sel, prop, rosQuote(v))
		default:
			cmd = fmt.Sprintf(":do {%s unset %s %s} on-error={}", up.pkg.menu(), sel, prop)
		}
		if out, err := e.cl.RunChecked(cmd, 15*time.Second); err != nil {
			e.log("could not restore %s on %s: %v (%s)", prop, up.iface, err, e.redact(strings.TrimSpace(out)))
		}
	}
	if up.pkg == wifiLegacy {
		_, _ = e.cl.RunRaw(fmt.Sprintf("/interface/wireless/security-profiles remove [find name=%s]", rosQuote(wifiUplinkTag)), 15*time.Second)
	}
	if up.bridged {
		_, _ = e.cl.RunRaw(fmt.Sprintf("/interface/bridge/port enable [find where interface=%s]", rosQuote(up.iface)), 15*time.Second)
	}
	e.log("WiFi uplink removed, %s is back to its old settings", up.iface)
}

func (e *Engine) stepRemoveWiFi() error {
	if e.wifi == nil {
		e.note = "no WiFi uplink to remove"
		return errSkipped
	}
	iface := e.wifi.iface
	e.removeWiFiUplink()
	e.note = iface + " back to its old settings"
	return nil
}
