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

// maxUploadedBackupSize caps the .backup file accepted by the restore-from-file route.
const maxUploadedBackupSize = 16 << 20

// uploadedBackupFormOverhead is the room left in the request body for the multipart framing and the
// password field on top of the file itself.
const uploadedBackupFormOverhead = 64 << 10

// uploadedBackupPrefix starts the name of a backup uploaded from the user's computer, so it can be told
// apart from the ones the panel created on the router.
const uploadedBackupPrefix = "uploaded_"

const (
	uploadedBackupWaitTimeout  = 5 * time.Second
	uploadedBackupPollInterval = 250 * time.Millisecond
)

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
