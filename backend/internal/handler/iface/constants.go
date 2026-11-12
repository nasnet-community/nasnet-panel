// Package iface holds the interface API group handlers.
package iface

import (
	"time"
)

const (
	wanChangeDoneVariable = "ChangeWANDone"
	scriptDoneTimeout     = time.Minute
	scriptDonePollEvery   = 500 * time.Millisecond
	wanIPModeDHCP         = "dhcp"
	wanForeignPrefix      = 10
	wanDomesticPrefix     = 24
	wanForeignGateway     = "100.64.0.1"
	wanDomesticGateway    = "192.168.1.1"
	wanMaxPrefix          = 30
)
