package wgcfg

import (
	"fmt"
	"math"
	"net"
)

// IP is an IPv4 or an IPv6 address.
//
// Internally the address is always represented in its IPv6 form.
// IPv4 addresses use the IPv4-in-IPv6 syntax.
type IP struct {
	Addr [16]byte
}

func (ip IP) String() string { return net.IP(ip.Addr[:]).String() }

// IP converts ip into a standard library net.IP. The address bytes
// are copied, so the returned net.IP shares no state with the
// original IP.
func (ip *IP) IP() net.IP { return append(net.IP(nil), ip.Addr[:]...) }

// Is6 reports whether ip is an IPv6 address.
func (ip *IP) Is6() bool { return !ip.Is4() }

// Is4 reports whether ip is an IPv4 address (stored as IPv4-in-IPv6).
func (ip *IP) Is4() bool {
	return ip.Addr[0] == 0 && ip.Addr[1] == 0 &&
		ip.Addr[2] == 0 && ip.Addr[3] == 0 &&
		ip.Addr[4] == 0 && ip.Addr[5] == 0 &&
		ip.Addr[6] == 0 && ip.Addr[7] == 0 &&
		ip.Addr[8] == 0 && ip.Addr[9] == 0 &&
		ip.Addr[10] == 0xff && ip.Addr[11] == 0xff
}

// To4 returns the 4-byte IPv4 representation or nil if ip is IPv6.
func (ip *IP) To4() []byte {
	if ip.Is4() {
		return ip.Addr[12:16]
	}
	return nil
}

// Equal reports whether ip and x are the same address.
func (ip *IP) Equal(x *IP) bool {
	if ip == nil || x == nil {
		return false
	}
	// TODO: this isn't hard, write a more efficient implementation.
	return ip.IP().Equal(x.IP())
}

// MarshalText implements encoding.TextMarshaler.
func (ip IP) MarshalText() ([]byte, error) {
	return []byte(ip.String()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (ip *IP) UnmarshalText(text []byte) error {
	parsedIP := ParseIP(string(text))
	if parsedIP == nil {
		return fmt.Errorf("wgcfg.IP: UnmarshalText: bad IP address %q", string(text))
	}
	*ip = *parsedIP
	return nil
}

// IPv4 returns the IP address representation of the given byte values.
func IPv4(b0, b1, b2, b3 byte) (ip IP) {
	ip.Addr[10], ip.Addr[11] = 0xff, 0xff // IPv4-in-IPv6 prefix
	ip.Addr[12] = b0
	ip.Addr[13] = b1
	ip.Addr[14] = b2
	ip.Addr[15] = b3
	return ip
}

// ParseIP parses the string representation of an address into an IP.
//
// It accepts IPv4 notation such as "1.2.3.4" and IPv6 notation like ""::0".
// If the string is not a valid IP address, ParseIP returns nil.
func ParseIP(s string) *IP {
	netIP := net.ParseIP(s)
	if netIP == nil {
		return nil
	}
	ip := new(IP)
	copy(ip.Addr[:], netIP.To16())
	return ip
}

// CIDR is a compact IP address and subnet mask.
type CIDR struct {
	IP   IP
	Mask uint8 // 0-32 for IsIPv4, 4-128 for IsIPv6
}

// ParseCIDR parses CIDR notation into a CIDR type.
// Typical CIDR strings look like "192.168.1.0/24".
func ParseCIDR(s string) (*CIDR, error) {
	netIP, netAddr, err := net.ParseCIDR(s)
	if err != nil {
		return nil, err
	}
	cidr := new(CIDR)
	copy(cidr.IP.Addr[:], netIP.To16())
	ones, _ := netAddr.Mask.Size()
	cidr.Mask = uint8(ones) //nolint:gosec // G115: net.ParseCIDR guarantees ones is 0-128

	return cidr, nil
}

func (r CIDR) String() string { return r.IPNet().String() }

// IPNet converts r to a net.IPNet.
func (r *CIDR) IPNet() *net.IPNet {
	bits := 128
	if r.IP.Is4() {
		bits = 32
	}
	return &net.IPNet{IP: r.IP.IP(), Mask: net.CIDRMask(int(r.Mask), bits)}
}

// Contains reports whether ip is within the CIDR range.
func (r *CIDR) Contains(ip *IP) bool {
	if r == nil || ip == nil {
		return false
	}
	c := int(r.Mask)
	i := 0
	if r.IP.Is4() {
		i = 12
		if ip.Is6() {
			return false
		}
	}
	for ; i < 16 && c > 0; i++ {
		var x uint8
		if c < 8 {
			x = 8 - uint8(c) //nolint:gosec // G115: c < 8 guaranteed by if condition above
		}
		m := uint8(math.MaxUint8) >> x << x
		a := r.IP.Addr[i] & m
		b := ip.Addr[i] & m
		if a != b {
			return false
		}
		c -= 8
	}
	return true
}

// MarshalText implements encoding.TextMarshaler.
func (r CIDR) MarshalText() ([]byte, error) {
	return []byte(r.String()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (r *CIDR) UnmarshalText(text []byte) error {
	cidr, err := ParseCIDR(string(text))
	if err != nil {
		return fmt.Errorf("wgcfg.CIDR: UnmarshalText: %w", err)
	}
	*r = *cidr
	return nil
}
