// Package system holds the system API group handlers.
package system

import (
	"regexp"
	"sync"
	"time"
)

const (
	systemUpdatePollInterval = 5 * time.Second
	systemUpdateTimeout      = 15 * time.Minute
	systemUpdateFailGrace    = 2 * time.Minute
)

const (
	systemUpdatePhaseIdle        systemUpdatePhase = "idle"
	systemUpdatePhaseDownloading systemUpdatePhase = "downloading"
	systemUpdatePhaseRebooting   systemUpdatePhase = "rebooting"
	systemUpdatePhaseDone        systemUpdatePhase = "done"
	systemUpdatePhaseError       systemUpdatePhase = "error"
)

var systemUpdates = &systemUpdateState{entries: make(map[string]*systemUpdateEntry)}

const backupFileTimeLayout = "2006-01-02_15-04-05"

const restoreCooldown = 3 * time.Minute

var (
	backupsInProgress  sync.Map
	restoresInProgress sync.Map
	deletesInProgress  sync.Map
	backupOpGuard      sync.Mutex
)

var nonEditableIPServices = map[string]bool{
	"api": true,
}

var (
	schedulerClockPattern        = regexp.MustCompile(`^(\d{1,2}):(\d{2}):(\d{2})$`)
	schedulerIntervalClock       = regexp.MustCompile(`^(?:(\d+)d)?\s*(\d{1,2}):(\d{2}):(\d{2})$`)
	schedulerIntervalLetterUnits = regexp.MustCompile(`^(?:\d+[wdhms])+$`)
)

const schedulerStartupKeyword = "startup"
