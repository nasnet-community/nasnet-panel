package main

import (
	"crypto/rand"
	"encoding/binary"
	"errors"
	"flag"
	"fmt"
	"net"
	"strings"
	"time"

	"golang.org/x/net/dns/dnsmessage"
)

func resolve(args []string) error {
	fs := flag.NewFlagSet("resolve", flag.ContinueOnError)
	server := fs.String("server", "", "resolver address, port 53 when omitted")
	qtype := fs.String("type", "A", "A or TXT")
	timeout := fs.Duration("timeout", 5*time.Second, "query timeout")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *server == "" || fs.NArg() != 1 {
		return errors.New("resolve needs -server and one name")
	}

	address := *server
	if _, _, err := net.SplitHostPort(address); err != nil {
		address = net.JoinHostPort(address, "53")
	}

	t := dnsmessage.TypeA
	if strings.EqualFold(*qtype, "TXT") {
		t = dnsmessage.TypeTXT
	}

	name, err := dnsmessage.NewName(strings.TrimSuffix(fs.Arg(0), ".") + ".")
	if err != nil {
		return err
	}
	var idBytes [2]byte
	if _, err := rand.Read(idBytes[:]); err != nil {
		return err
	}
	msg := dnsmessage.Message{
		Header:    dnsmessage.Header{ID: binary.BigEndian.Uint16(idBytes[:]), RecursionDesired: true},
		Questions: []dnsmessage.Question{{Name: name, Type: t, Class: dnsmessage.ClassINET}},
	}
	req, err := msg.Pack()
	if err != nil {
		return err
	}

	conn, err := net.DialTimeout("udp", address, *timeout)
	if err != nil {
		return err
	}
	defer func() { _ = conn.Close() }()
	_ = conn.SetDeadline(time.Now().Add(*timeout))
	if _, err := conn.Write(req); err != nil {
		return err
	}
	buf := make([]byte, 4096)
	n, err := conn.Read(buf)
	if err != nil {
		return err
	}

	var resp dnsmessage.Message
	if err := resp.Unpack(buf[:n]); err != nil {
		return err
	}
	if resp.RCode != dnsmessage.RCodeSuccess {
		return fmt.Errorf("rcode %s", resp.RCode)
	}
	if len(resp.Answers) == 0 {
		return errors.New("no answers")
	}
	for _, answer := range resp.Answers {
		switch body := answer.Body.(type) {
		case *dnsmessage.AResource:
			fmt.Println(net.IP(body.A[:]).String())
		case *dnsmessage.TXTResource:
			fmt.Println(strings.Join(body.TXT, " "))
		}
	}
	return nil
}
