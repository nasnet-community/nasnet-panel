package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

func fetch(args []string) error {
	fs := flag.NewFlagSet("fetch", flag.ContinueOnError)
	timeout := fs.Duration("timeout", 5*time.Second, "request timeout")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.NArg() != 1 {
		return errors.New("fetch needs exactly one URL")
	}

	client := &http.Client{Timeout: *timeout, Transport: &http.Transport{Proxy: nil}}
	resp, err := client.Get(fs.Arg(0))
	if err != nil {
		return err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s: status %d", fs.Arg(0), resp.StatusCode)
	}
	_, err = io.Copy(os.Stdout, io.LimitReader(resp.Body, 1<<20))
	return err
}
