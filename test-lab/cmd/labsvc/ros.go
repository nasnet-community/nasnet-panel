package main

import (
	"encoding/json"
	"errors"
	"flag"
	"net"
	"os"
	"strings"
	"time"

	"github.com/go-routeros/routeros/v3"
)

type listFlag []string

func (l *listFlag) String() string {
	return strings.Join(*l, ",")
}

func (l *listFlag) Set(value string) error {
	*l = append(*l, value)
	return nil
}

func ros(args []string) error {
	fs := flag.NewFlagSet("ros", flag.ContinueOnError)
	addr := fs.String("addr", "", "router address, port 8728 when omitted")
	user := fs.String("user", "admin", "router user")
	pass := fs.String("pass", "", "router password")
	cmd := fs.String("cmd", "", "API command, for example /routing/table/print")
	timeout := fs.Duration("timeout", 10*time.Second, "connect timeout")
	var words listFlag
	fs.Var(&words, "q", "extra API word such as a query, repeatable")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *addr == "" || *cmd == "" {
		return errors.New("ros needs -addr and -cmd")
	}

	address := *addr
	if _, _, err := net.SplitHostPort(address); err != nil {
		address = net.JoinHostPort(address, "8728")
	}

	client, err := routeros.DialTimeout(address, *user, *pass, *timeout)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	reply, err := client.Run(append([]string{*cmd}, words...)...)
	if err != nil {
		return err
	}

	rows := make([]map[string]string, 0, len(reply.Re))
	for _, re := range reply.Re {
		rows = append(rows, re.Map)
	}
	return json.NewEncoder(os.Stdout).Encode(rows)
}
