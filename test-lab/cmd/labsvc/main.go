package main

import (
	"fmt"
	"os"
	"strings"
)

var commands = map[string]func([]string) error{
	"serve":   serve,
	"fetch":   fetch,
	"ros":     ros,
	"resolve": resolve,
	"dial":    dial,
	"wgkey":   wgkey,
	"upload":  upload,
	"proxy":   proxy,
	"ca":      caCmd,
}

func main() {
	if len(os.Args) < 2 {
		usage()
	}
	cmd, ok := commands[os.Args[1]]
	if !ok {
		usage()
	}
	if err := cmd(os.Args[2:]); err != nil {
		fmt.Fprintln(os.Stderr, "labsvc:", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: labsvc serve|fetch|ros|resolve|dhcp|dial|wgkey|upload|proxy|ca [flags]")
	os.Exit(2)
}

func splitList(value string) []string {
	var items []string
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			items = append(items, item)
		}
	}
	return items
}
