//go:build !linux

package main

import "errors"

func dhcp(_ []string) error {
	return errors.New("dhcp probing needs Linux")
}
