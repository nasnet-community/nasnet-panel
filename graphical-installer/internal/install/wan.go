package install

import (
	"errors"
	"fmt"
	"net"
	"strings"
	"time"
)

const (
	wanPort         = "ether1"
	wanLeaseTimeout = 30 * time.Second
)

// wanProbeScript reports the uplink the router already has: a WAN list member,
// an LTE interface, or the interface holding the active default route, in that order.
const wanProbeScript = `:local up ""; :local src ""; ` +
	`:do {:foreach m in=[/interface/list/member find where list="WAN" disabled=no] do={:if ($up = "") do={:set up [:tostr [/interface/list/member get $m interface]]; :set src "wan-list"}}} on-error={}; ` +
	`:if ($up = "") do={:do {:foreach i in=[/interface find where (name="lte1" || type="lte")] do={:if ($up = "") do={:set up [/interface get $i name]; :set src "lte"}}} on-error={}}; ` +
	`:if ($up = "") do={:do {:foreach r in=[/ip/route find where dst-address=0.0.0.0/0 active] do={:if ($up = "") do={:local g ""; :do {:set g [:tostr [/ip/route get $r immediate-gw]]} on-error={}; :local p [:find $g "%"]; :if ([:typeof $p] = "num") do={:set g [:pick $g ($p + 1) [:len $g]]}; :if ($g = "") do={:set g "default route"}; :set up $g; :set src "route"}}} on-error={}}; ` +
	`:put ("U=" . $up); :put ("S=" . $src); ` +
	`:put ("E=" . [:len [/interface find where name="ether1"]]); ` +
	`:put ("B=" . [:len [/interface/bridge/port find where interface="ether1"]]); ` +
	`:put ("L=" . [:len [/interface/bridge find where name="LANBridgeSplit"]])`

// installerSeenOnScript prints H=<n>, the number of bridge hosts on an interface that carry
// the MAC address of the given client IP. Non-zero means the installer reaches the router through it.
const installerSeenOnScript = `:local mac ""; :do {:set mac [:tostr [/ip/arp get ([/ip/arp find where address=%[1]s]->0) mac-address]]} on-error={}; ` +
	`:local n 0; :if ($mac != "") do={:set n [:len [/interface/bridge/host find where mac-address=$mac on-interface="%[2]s"]]}; :put ("H=" . $n)`

const wanEther1Script = `:foreach p in=[/interface/bridge/port find where interface="ether1"] do={/interface/bridge/port remove $p}; ` +
	`/interface/list/member remove [find where list="LAN" interface="ether1"]; ` +
	`:if ([:len [/ip/dhcp-client find where interface="ether1"]] = 0) do={/ip/dhcp-client add interface=ether1 add-default-route=yes use-peer-dns=yes use-peer-ntp=yes disabled=no comment="nasnet-panel-baseline: WAN uplink"}`

const wanListScript = `:if ([:len [/interface/list find where name="WAN"]] = 0) do={/interface/list add name=WAN comment="nasnet-panel-baseline"}; ` +
	`:if ([:len [/interface/list/member find where list="WAN" interface="%[1]s"]] = 0) do={/interface/list/member add list=WAN interface="%[1]s" comment="nasnet-panel-baseline"}; ` +
	`:if ([:len [/ip/firewall/nat find where chain="srcnat" action="masquerade" out-interface-list="WAN"]] = 0) do={/ip/firewall/nat add chain=srcnat action=masquerade out-interface-list=WAN comment="nasnet-panel-baseline: masquerade WAN"}`

type wanState struct {
	uplink        string
	source        string
	hasEther1     bool
	ether1Bridged bool
	layoutPresent bool
}

func (e *Engine) probeWAN() (wanState, error) {
	out, err := e.cl.RunRaw(wanProbeScript, 20*time.Second)
	if err != nil {
		return wanState{}, fmt.Errorf("could not read the router WAN setup: %w", err)
	}
	var st wanState
	for _, line := range strings.Split(out, "\n") {
		key, value, ok := strings.Cut(strings.TrimSpace(line), "=")
		if !ok {
			continue
		}
		value = strings.TrimSpace(value)
		switch key {
		case "U":
			st.uplink = value
		case "S":
			st.source = value
		case "E":
			st.hasEther1 = value != "" && value != "0"
		case "B":
			st.ether1Bridged = value != "" && value != "0"
		case "L":
			st.layoutPresent = value != "" && value != "0"
		}
	}
	return st, nil
}

func (e *Engine) stepPrepareWAN() error {
	st, err := e.probeWAN()
	if err != nil {
		return err
	}

	if st.uplink != "" {
		return e.keepUplink(st)
	}
	if st.layoutPresent {
		e.log("%s already exists and no uplink was found, the WAN is left as it is", lanBridge)
		e.note = "NasNet layout present, WAN left as it is"
		return errSkipped
	}
	if !st.hasEther1 {
		return errors.New("the router has no internet uplink the installer can use: there is no ether1 port, no LTE interface, no interface in the WAN list, and no default route. Connect the router to the internet, or add its uplink interface to the WAN interface list, then run the installer again")
	}
	return e.useEther1(st)
}

func (e *Engine) keepUplink(st wanState) error {
	switch st.source {
	case "wan-list":
		e.log("keeping %s, which is already in the WAN interface list", st.uplink)
	case "lte":
		e.log("keeping the LTE uplink %s", st.uplink)
	default:
		e.log("keeping %s, which holds the default route", st.uplink)
	}
	if st.source == "route" {
		e.note = st.uplink + " kept as is"
		return nil
	}
	if e.opts.DryRun {
		e.log("[dry-run] would make sure %s is in the WAN list and the WAN list is masqueraded", st.uplink)
		e.note = st.uplink + " kept as is"
		return nil
	}
	if out, err := e.cl.RunChecked(fmt.Sprintf(wanListScript, st.uplink), 20*time.Second); err != nil {
		return fmt.Errorf("could not add %s to the WAN interface list: %w (%s)", st.uplink, err, strings.TrimSpace(out))
	}
	e.note = st.uplink + " kept as is"
	return nil
}

func (e *Engine) useEther1(st wanState) error {
	e.log("no uplink found, using %s as the WAN", wanPort)
	if st.ether1Bridged && e.installerOn(wanPort) {
		return fmt.Errorf("this computer is connected to the router through %s, which the installer has to turn into the WAN port. Plug the computer into another LAN port of the router, then run the installer again", wanPort)
	}
	if e.opts.DryRun {
		e.log("[dry-run] would take %s out of its bridge, add a DHCP client on it, and add it to the WAN list", wanPort)
		e.note = "dry-run, " + wanPort + " not changed"
		return nil
	}
	if out, err := e.cl.RunChecked(wanEther1Script, 20*time.Second); err != nil {
		return fmt.Errorf("could not set %s up as the WAN: %w (%s)", wanPort, err, strings.TrimSpace(out))
	}
	if out, err := e.cl.RunChecked(fmt.Sprintf(wanListScript, wanPort), 20*time.Second); err != nil {
		return fmt.Errorf("could not add %s to the WAN interface list: %w (%s)", wanPort, err, strings.TrimSpace(out))
	}
	e.log("%s is now the WAN uplink with a DHCP client", wanPort)

	bound, err := e.waitForWANLease()
	if err != nil {
		return err
	}
	if !bound {
		e.log("%s has no DHCP lease after %s. Check that the internet cable is plugged into %s", wanPort, wanLeaseTimeout, wanPort)
		e.note = wanPort + " set up as WAN, no DHCP lease yet"
		return nil
	}
	e.note = wanPort + " set up as WAN"
	return nil
}

func (e *Engine) installerOn(iface string) bool {
	ip := net.ParseIP(e.cl.LocalIP())
	if ip == nil {
		return false
	}
	out, err := e.cl.RunRaw(fmt.Sprintf(installerSeenOnScript, ip.String(), iface), 15*time.Second)
	if err != nil {
		return false
	}
	for _, line := range strings.Split(out, "\n") {
		if v, ok := strings.CutPrefix(strings.TrimSpace(line), "H="); ok {
			return v != "" && v != "0"
		}
	}
	return false
}

func (e *Engine) waitForWANLease() (bool, error) {
	deadline := time.Now().Add(wanLeaseTimeout)
	for time.Now().Before(deadline) {
		out, _ := e.cl.RunRaw(fmt.Sprintf(`:put [/ip/dhcp-client get [find where interface=%q] status]`, wanPort), 10*time.Second)
		if strings.TrimSpace(out) == "bound" {
			return true, nil
		}
		if err := e.sleep(3 * time.Second); err != nil {
			return false, err
		}
	}
	return false, nil
}
