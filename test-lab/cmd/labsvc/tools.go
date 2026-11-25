package main

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/curve25519"
	"golang.org/x/crypto/ssh"
)

func dial(args []string) error {
	fs := flag.NewFlagSet("dial", flag.ContinueOnError)
	timeout := fs.Duration("timeout", 3*time.Second, "connect timeout")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.NArg() != 1 {
		return errors.New("dial needs one host:port")
	}
	conn, err := net.DialTimeout("tcp", fs.Arg(0), *timeout)
	if err != nil {
		return err
	}
	_ = conn.Close()
	fmt.Println("open")
	return nil
}

func wgkey(_ []string) error {
	var private [32]byte
	if _, err := rand.Read(private[:]); err != nil {
		return err
	}
	private[0] &= 248
	private[31] = (private[31] & 127) | 64
	public, err := curve25519.X25519(private[:], curve25519.Basepoint)
	if err != nil {
		return err
	}
	fmt.Println(base64.StdEncoding.EncodeToString(private[:]), base64.StdEncoding.EncodeToString(public))
	return nil
}

func upload(args []string) error {
	fs := flag.NewFlagSet("upload", flag.ContinueOnError)
	addr := fs.String("addr", "", "router address, port 22 when omitted")
	user := fs.String("user", "admin", "router user")
	pass := fs.String("pass", "", "router password")
	local := fs.String("local", "", "local file")
	remote := fs.String("remote", "", "remote file name")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *addr == "" || *local == "" || *remote == "" {
		return errors.New("upload needs -addr, -local and -remote")
	}

	address := *addr
	if _, _, err := net.SplitHostPort(address); err != nil {
		address = net.JoinHostPort(address, "22")
	}

	client, err := ssh.Dial("tcp", address, &ssh.ClientConfig{
		User: *user,
		Auth: []ssh.AuthMethod{
			ssh.Password(*pass),
			ssh.KeyboardInteractive(func(_, _ string, questions []string, _ []bool) ([]string, error) {
				answers := make([]string, len(questions))
				for i := range answers {
					answers[i] = *pass
				}
				return answers, nil
			}),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         15 * time.Second,
	})
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	sc, err := sftp.NewClient(client)
	if err != nil {
		return err
	}
	defer func() { _ = sc.Close() }()

	src, err := os.Open(*local)
	if err != nil {
		return err
	}
	defer func() { _ = src.Close() }()

	dst, err := sc.Create(*remote)
	if err != nil {
		return err
	}
	if _, err := io.Copy(dst, src); err != nil {
		_ = dst.Close()
		return err
	}
	return dst.Close()
}

func proxy(args []string) error {
	fs := flag.NewFlagSet("proxy", flag.ContinueOnError)
	listen := fs.String("listen", "", "listen address")
	to := fs.String("to", "", "target address")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *listen == "" || *to == "" {
		return errors.New("proxy needs -listen and -to")
	}

	ln, err := net.Listen("tcp", *listen)
	if err != nil {
		return err
	}
	for {
		conn, err := ln.Accept()
		if err != nil {
			return err
		}
		go func() {
			defer func() { _ = conn.Close() }()
			target, err := net.DialTimeout("tcp", *to, 10*time.Second)
			if err != nil {
				return
			}
			defer func() { _ = target.Close() }()
			done := make(chan struct{}, 2)
			go func() { _, _ = io.Copy(target, conn); done <- struct{}{} }()
			go func() { _, _ = io.Copy(conn, target); done <- struct{}{} }()
			<-done
		}()
	}
}
