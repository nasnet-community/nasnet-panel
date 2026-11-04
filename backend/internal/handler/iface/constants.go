// Package iface holds the interface API group handlers.
package iface

import (
	"time"
)

const (
	wanChangeDoneVariable = "ChangeWANDone"
	scriptDoneTimeout     = time.Minute
	scriptDonePollEvery   = 500 * time.Millisecond
)
