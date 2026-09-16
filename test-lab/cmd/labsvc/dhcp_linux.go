package main

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"errors"
	"flag"
	"net"
	"os"
	"syscall"
	"time"
)

func dhcp(args []string) error {
	fs := flag.NewFlagSet("dhcp", flag.ContinueOnError)
	iface := fs.String("iface", "lan0", "interface to probe")
	timeout := fs.Duration("timeout", 15*time.Second, "time to wait for an offer")
	if err := fs.Parse(args); err != nil {
		return err
	}

	link, err := net.InterfaceByName(*iface)
	if err != nil {
		return err
	}

	lc := net.ListenConfig{Control: func(_, _ string, c syscall.RawConn) error {
		var sockErr error
		err := c.Control(func(fd uintptr) {
			if sockErr = syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1); sockErr != nil {
				return
			}
			if sockErr = syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_BROADCAST, 1); sockErr != nil {
				return
			}
			sockErr = syscall.BindToDevice(int(fd), *iface)
		})
		if err != nil {
			return err
		}
		return sockErr
	}}
	pc, err := lc.ListenPacket(context.Background(), "udp4", "0.0.0.0:68")
	if err != nil {
		return err
	}
	defer func() { _ = pc.Close() }()

	var xid [4]byte
	if _, err := rand.Read(xid[:]); err != nil {
		return err
	}
	discover := dhcpDiscover(xid, link.HardwareAddr)

	deadline := time.Now().Add(*timeout)
	buf := make([]byte, 1500)
	for time.Now().Before(deadline) {
		if _, err := pc.WriteTo(discover, &net.UDPAddr{IP: net.IPv4bcast, Port: 67}); err != nil {
			return err
		}
		_ = pc.SetReadDeadline(time.Now().Add(3 * time.Second))
		for {
			n, _, err := pc.ReadFrom(buf)
			if err != nil {
				break
			}
			offer, ok := parseOffer(buf[:n], xid)
			if ok {
				return json.NewEncoder(os.Stdout).Encode(offer)
			}
		}
	}
	return errors.New("no DHCP offer received")
}

func dhcpDiscover(xid [4]byte, mac net.HardwareAddr) []byte {
	p := make([]byte, 240)
	p[0], p[1], p[2] = 1, 1, 6
	copy(p[4:8], xid[:])
	binary.BigEndian.PutUint16(p[10:12], 0x8000)
	copy(p[28:34], mac)
	copy(p[236:240], []byte{99, 130, 83, 99})
	p = append(p, 53, 1, 1)
	p = append(p, 55, 3, 1, 3, 6)
	p = append(p, 255)
	if len(p) < 300 {
		p = append(p, make([]byte, 300-len(p))...)
	}
	return p
}

func parseOffer(p []byte, xid [4]byte) (map[string]string, bool) {
	if len(p) < 240 || p[0] != 2 || string(p[4:8]) != string(xid[:]) {
		return nil, false
	}
	offer := map[string]string{"ip": net.IP(p[16:20]).String()}
	isOffer := false
	for i := 240; i < len(p); {
		code := p[i]
		if code == 255 {
			break
		}
		if code == 0 {
			i++
			continue
		}
		if i+1 >= len(p) {
			break
		}
		size := int(p[i+1])
		if i+2+size > len(p) {
			break
		}
		value := p[i+2 : i+2+size]
		switch code {
		case 53:
			isOffer = size == 1 && value[0] == 2
		case 1:
			if size == 4 {
				offer["mask"] = net.IP(value).String()
			}
		case 3:
			if size >= 4 {
				offer["router"] = net.IP(value[:4]).String()
			}
		case 6:
			if size >= 4 {
				offer["dns"] = net.IP(value[:4]).String()
			}
		case 54:
			if size == 4 {
				offer["server"] = net.IP(value).String()
			}
		}
		i += 2 + size
	}
	return offer, isOffer
}
