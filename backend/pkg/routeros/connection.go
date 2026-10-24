package routeros

import (
	"fmt"
	"net"
	"strings"
)

const connectionRemoveBatchSize = 100

// RemoveFirewallConnections removes the tracked connections whose source address belongs to one of
// the srcLists address lists and whose destination is a public address outside the skipDstLists
// address lists, and returns how many were removed. Connections to private destinations are kept,
// since they include the user's own session with the panel and the router. The RouterOS binary API
// cannot filter on address containment, so it is evaluated here.
func (c *Client) RemoveFirewallConnections(srcLists, skipDstLists []string) (int, error) {
	sources, err := c.addressListNets(srcLists)
	if err != nil {
		return 0, err
	}
	if len(sources) == 0 {
		return 0, nil
	}
	skipped, err := c.addressListNets(skipDstLists)
	if err != nil {
		return 0, err
	}

	connections, err := c.GetAll("/ip/firewall/connection", "=.proplist=.id,src-address,dst-address")
	if err != nil {
		return 0, fmt.Errorf("failed to list firewall connections: %w", err)
	}

	ids := make([]string, 0)
	for _, connection := range connections {
		src, err := parseAddressOrCIDR(connectionHost(connection["src-address"]))
		if err != nil || !containedInAny(sources, src) {
			continue
		}
		dstHost := connectionHost(connection["dst-address"])
		dstIP := net.ParseIP(dstHost)
		if dstIP == nil || dstIP.IsPrivate() || dstIP.IsLoopback() || dstIP.IsLinkLocalUnicast() {
			continue
		}
		dst, err := parseAddressOrCIDR(dstHost)
		if err != nil || containedInAny(skipped, dst) {
			continue
		}
		ids = append(ids, connection[".id"])
	}

	for start := 0; start < len(ids); start += connectionRemoveBatchSize {
		end := min(start+connectionRemoveBatchSize, len(ids))
		if _, err := c.Remove("/ip/firewall/connection", "=.id="+strings.Join(ids[start:end], ",")); err != nil {
			return start, fmt.Errorf("failed to remove firewall connections: %w", err)
		}
	}

	return len(ids), nil
}

func (c *Client) addressListNets(lists []string) ([]*net.IPNet, error) {
	nets := make([]*net.IPNet, 0)
	for _, list := range lists {
		items, err := c.ListFirewallAddressListItems(FirewallAddressListFilter{ListName: list})
		if err != nil {
			return nil, err
		}
		for i := range items {
			if items[i].Disabled {
				continue
			}
			if n, err := parseAddressOrCIDR(items[i].Address); err == nil {
				nets = append(nets, n)
			}
		}
	}

	return nets, nil
}

func containedInAny(nets []*net.IPNet, target *net.IPNet) bool {
	for _, n := range nets {
		if cidrContains(n, target) {
			return true
		}
	}

	return false
}

func connectionHost(address string) string {
	if host, _, err := net.SplitHostPort(address); err == nil {
		return host
	}

	return address
}
