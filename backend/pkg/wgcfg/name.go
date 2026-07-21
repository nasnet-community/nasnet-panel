/* SPDX-License-Identifier: MIT
 *
 * Copyright (C) 2019 WireGuard LLC. All Rights Reserved.
 */

package wgcfg

import (
	"strings"
)

var reservedNames = []string{
	"CON", "PRN", "AUX", "NUL",
	"COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
	"LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}

func isReserved(name string) bool {
	for _, reserved := range reservedNames {
		if strings.EqualFold(name, reserved) {
			return true
		}
	}
	return false
}

func TunnelNameIsValid(name string) bool {
	// name must match /^[a-zA-Z0-9_=+.-]{1,32}$/ and not be a Windows
	// reserved name.
	if len(name) < 1 || len(name) > 32 || isReserved(name) {
		return false
	}
	for i := 0; i < len(name); i++ {
		c := name[i]
		if 'a' <= c && c <= 'z' ||
			'A' <= c && c <= 'Z' ||
			'0' <= c && c <= '9' {
			continue
		}
		switch c {
		case '_', '=', '+', '.', '-':
		default:
			return false
		}

	}
	return true
}
