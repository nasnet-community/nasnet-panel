// Package firewall holds the firewall API group handlers.
package firewall

import (
	"regexp"
)

var (
	routerOSIDPattern   = regexp.MustCompile(`^\*[0-9A-Fa-f]+$`)
	routerOSTimePattern = regexp.MustCompile(`^(?:\d+w)?(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?$|^\d+:\d{2}(?::\d{2})?$`)
)

// DomesticAddressList and the following names identify the domestic block list, interface list and user entries.
const (
	DomesticAddressList      = "DOMAddList"
	DomesticWANInterfaceList = "!Domestic-WAN"
	DomesticUserEntryComment = "NasNet Panel: user added"
)
