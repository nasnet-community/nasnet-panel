// Package iface holds the interface API group handlers.
package iface

import (
	"errors"
	"time"
)

const (
	wanChangeDoneVariable    = "ChangeWANDone"
	wanRemoveDoneVariable    = "RemoveWANDone"
	scriptDoneTimeout        = time.Minute
	scriptDonePollEvery      = 500 * time.Millisecond
	wanIPModeDHCP            = "dhcp"
	wanForeignPrefix         = 10
	wanDomesticPrefix        = 24
	wanForeignGateway        = "100.64.0.1"
	wanDomesticGateway       = "192.168.1.1"
	wanCommentPrefix         = "WAN -"
	wanAddressTypeStatic     = "static"
	wanMaxPrefix             = 30
	wanWiFiMinPasswordLength = 8
	wanWiFiMode              = "station-pseudobridge"
	wanWiFiAuthTypes         = "wpa2-psk,wpa3-psk"
)

var wanWiFiAllowedAuthTypes = []string{"wpa-psk", "wpa2-psk", "wpa3-psk"}

var errWANNotFound = errors.New("interface is not a WAN link")
