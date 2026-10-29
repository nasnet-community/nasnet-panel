// Package handler contains Echo HTTP handler functions for the nasnet-panel REST API.
package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"
	"unicode/utf8"

	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const (
	githubLatestReleaseURL = "https://api.github.com/repos/nasnet-community/nasnet-panel/releases/latest"
	githubReleasesURL      = "https://api.github.com/repos/nasnet-community/nasnet-panel/releases?per_page=100"
	githubReleaseByTagURL  = "https://api.github.com/repos/nasnet-community/nasnet-panel/releases/tags/"
	githubAPIPrefix        = "https://api.github.com/"
	maxGitHubReleasePages  = 10
	releaseListCacheTTL    = 5 * time.Minute
	releaseFetchTimeout    = 30 * time.Second
	appContainerImage      = "ghcr.io/nasnet-community/nasnet-panel"
	appContainerName       = "nasnet-panel" // matches CONTAINER_NAME in scripts/install.sh
	appUpdateContainerName = "nasnet-panel-update"
	appDatabaseMountList   = "nasnet-panel-database"
	appDatabaseDir         = routeros.NasnetPanelDir + "/database"

	updateWatchInterval         = 3 * time.Second
	updateWatchTimeout          = 5 * time.Minute
	restartScheduleDelaySeconds = 3 // gives this request/response time to complete before nasnet-panel restarts

	minUpdateFreeStorageBytes = 30 * 1024 * 1024 // 30MB, headroom for the pulled image layers
)

const (
	maxSettingKeyLength   = 128
	maxSettingValueLength = 64 * 1024

	releaseChannelStable = "stable"
	releaseChannelRC     = "rc"
	releaseChannelDev    = "dev"

	defaultMinRouterOSVersion = "7.24"
	defaultMinAppVersion      = "1.2.0"
	localDevVersion           = "v0.0.0-dev"
)

var (
	githubNextLinkPattern  = regexp.MustCompile(`<([^>]+)>;\s*rel="next"`)
	settingKeyPattern      = regexp.MustCompile(`^[A-Za-z0-9_.:-]+$`)
	stableTagPattern       = regexp.MustCompile(`^v?\d+\.\d+\.\d+$`)
	minAppVersionPattern   = regexp.MustCompile(`^\d+\.\d+\.\d+$`)
	releaseMetaPattern     = regexp.MustCompile(`(?s)<!--\s*nasnet-meta:\s*(\{.*?\})\s*-->`)
	releaseChangesHeading  = regexp.MustCompile(`(?i)^#+\s*what's changed\s*$`)
	changePrefixPattern    = regexp.MustCompile(`^[A-Za-z]+(?:\([^)]*\))?!?:\s*`)
	changeSuffixPattern    = regexp.MustCompile(`\s+by\s+@\S+\s+in\s+(?:https?://\S+|#\d+)\s*$`)
	errGitHubNotFound      = errors.New("GitHub API returned 404")
	appDatabases           *db.Registry
	releaseVersionPattern  = regexp.MustCompile(`^v?(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+)|-dev\.(\d{8})\.(\d+))?$`)
	routerOSVersionPattern = regexp.MustCompile(`^(\d+)\.(\d+)(?:\.(\d+))?(?:(beta|rc)(\d+))?`)
)

type githubRelease struct {
	TagName     string `json:"tag_name"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
}

type githubReleaseEntry struct {
	TagName     string `json:"tag_name"`
	HTMLURL     string `json:"html_url"`
	Prerelease  bool   `json:"prerelease"`
	Draft       bool   `json:"draft"`
	PublishedAt string `json:"published_at"`
	Body        string `json:"body"`
}

type releaseVersion struct {
	major, minor, patch int
	channel             string
	rc                  int
	date                int
	build               int
}

type routerOSVersion struct {
	major, minor, patch int
	preRank             int
	preNumber           int
}

type releaseCache struct {
	mu        sync.Mutex
	releases  []githubReleaseEntry
	fetchedAt time.Time
}

type releaseMeta struct {
	MinAppVersion string `json:"minAppVersion"`
	RouterOS      struct {
		MinVersion string `json:"minVersion"`
	} `json:"routeros"`
}

// SetDatabases gives the handlers the registry of per-router SQLite databases that backs the app settings endpoints.
func SetDatabases(registry *db.Registry) {
	appDatabases = registry
}

// HandleAppVersion godoc
// @Summary Get panel version
// @Description Returns the current running version of nasnet-panel
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=AppVersionResponse}
// @Router /api/app/version [get].
func HandleAppVersion(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "Version retrieved", AppVersionResponse{
		Version: buildinfo.Version,
	})
}

// HandleAppCheckForUpdates godoc
// @Summary Check for a newer nasnet-panel release
// @Description Compares the running version against the latest GitHub release
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=CheckForUpdatesResponse}
// @Failure 502 {object} Response
// @Router /api/app/check-for-updates [get].
func HandleAppCheckForUpdates(c echo.Context) error {
	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	return SuccessResponse(c, http.StatusOK, "Update check complete", CheckForUpdatesResponse{
		AppVersion:      buildinfo.Version,
		LatestVersion:   release.TagName,
		ReleaseDate:     release.PublishedAt,
		ReleaseURL:      release.HTMLURL,
		UpdateAvailable: utils.IsNewerVersion(release.TagName, buildinfo.Version),
	})
}

// HandleAppUpdates godoc
// @Summary List nasnet-panel releases of a channel
// @Description Lists the GitHub releases whose tag belongs to the channel: stable (vX.Y.Z), rc (vX.Y.Z-rc.N) or dev (vX.Y.Z-dev.DATE.N). The minimum RouterOS version comes from the metadata embedded in the release body, 7.24 when the release has none
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param channel query string true "Release channel" Enums(stable, rc, dev)
// @Param hideLowerVer query bool false "Hide releases lower than the running version. Versions are compared across channels, and by each channel's own numbering within one. Nothing is hidden when the running version is not a release version" default(false)
// @Produce json
// @Success 200 {object} Response{data=[]ReleaseUpdateResponse}
// @Failure 400 {object} Response
// @Failure 502 {object} Response
// @Router /api/app/updates [get].
func HandleAppUpdates(c echo.Context) error {
	channel := c.QueryParam("channel")
	switch channel {
	case releaseChannelStable, releaseChannelRC, releaseChannelDev:
	default:
		return ErrorResponse(c, http.StatusBadRequest, "channel must be one of stable, rc, dev", nil)
	}

	hideLower := false
	switch c.QueryParam("hideLowerVer") {
	case "", "false":
	case "true":
		hideLower = true
	default:
		return ErrorResponse(c, http.StatusBadRequest, "hideLowerVer must be true or false", nil)
	}

	releases, err := allGitHubReleases(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch releases from GitHub", err)
	}

	persistUpdateChannelSetting(c, channel)

	current, currentOK := parseReleaseVersion(buildinfo.Version)

	updates := make([]ReleaseUpdateResponse, 0, len(releases))
	for i := range releases {
		release := &releases[i]
		if release.Draft || releaseChannel(release.TagName) != channel {
			continue
		}
		if hideLower && currentOK {
			if version, ok := parseReleaseVersion(release.TagName); ok && compareForInstall(version, current) < 0 {
				continue
			}
		}
		updates = append(updates, toReleaseUpdateResponse(release))
	}

	return SuccessResponse(c, http.StatusOK, "Releases retrieved", updates)
}

// HandleAppUpdateRelease godoc
// @Summary Get a single nasnet-panel release
// @Description Returns one GitHub release by tag, in the same format as the entries of GET /api/app/updates
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param tag path string true "Release tag" example(v0.0.2)
// @Produce json
// @Success 200 {object} Response{data=ReleaseUpdateResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 502 {object} Response
// @Router /api/app/update/{tag} [get].
func HandleAppUpdateRelease(c echo.Context) error {
	tag := c.Param("tag")
	if _, ok := parseReleaseVersion(tag); !ok {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid release tag", fmt.Errorf("%q is not a release version", tag))
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), releaseFetchTimeout)
	defer cancel()

	var release githubReleaseEntry
	if err := fetchGitHubJSON(ctx, githubReleaseByTagURL+url.PathEscape(tag), &release); err != nil {
		if errors.Is(err, errGitHubNotFound) {
			return ErrorResponse(c, http.StatusNotFound, "Release not found", fmt.Errorf("no release tagged %s", tag))
		}
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch the release from GitHub", err)
	}
	if release.Draft {
		return ErrorResponse(c, http.StatusNotFound, "Release not found", fmt.Errorf("no release tagged %s", tag))
	}

	return SuccessResponse(c, http.StatusOK, "Release retrieved", toReleaseUpdateResponse(&release))
}

func toReleaseUpdateResponse(release *githubReleaseEntry) ReleaseUpdateResponse {
	minAppVersion := releaseMinAppVersion(release.TagName, release.Body)
	return ReleaseUpdateResponse{
		Tag:                release.TagName,
		Prerelease:         release.Prerelease,
		ReleaseDate:        release.PublishedAt,
		ReleaseURL:         release.HTMLURL,
		MinRouterosVersion: releaseMinRouterOSVersion(release.Body),
		MinAppVersion:      minAppVersion,
		Installable:        releaseInstallable(release.TagName, minAppVersion),
		Changelog:          releaseChanges(release.Body),
	}
}

// HandleAppUpdateChannel godoc
// @Summary Get the last used update channel
// @Description Returns the channel last requested from GET /api/app/updates for the router named by X-RouterOS-Host, stable when none was requested yet
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=UpdateChannelResponse}
// @Failure 500 {object} Response
// @Router /api/app/update/channel [get].
func HandleAppUpdateChannel(c echo.Context) error {
	conn, ok, err := routerSettingsDB(c)
	if !ok {
		return err
	}

	channel := releaseChannelStable
	setting, err := db.GetSetting(c.Request().Context(), conn, settingKeyUpdateChannel)
	switch {
	case err == nil:
		channel = setting.Value
	case !errors.Is(err, db.ErrSettingNotFound):
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get the update channel", err)
	}

	return SuccessResponse(c, http.StatusOK, "Update channel retrieved", UpdateChannelResponse{Channel: channel})
}

func parseReleaseVersion(v string) (releaseVersion, bool) {
	m := releaseVersionPattern.FindStringSubmatch(v)
	if m == nil {
		return releaseVersion{}, false
	}

	n := func(s string) int {
		i, _ := strconv.Atoi(s)
		return i
	}
	rv := releaseVersion{major: n(m[1]), minor: n(m[2]), patch: n(m[3]), channel: releaseChannelStable}
	switch {
	case m[4] != "":
		rv.channel, rv.rc = releaseChannelRC, n(m[4])
	case m[5] != "":
		rv.channel, rv.date, rv.build = releaseChannelDev, n(m[5]), n(m[6])
	}
	return rv, true
}

func (v releaseVersion) base() [3]int {
	return [3]int{v.major, v.minor, v.patch}
}

func channelRank(channel string) int {
	switch channel {
	case releaseChannelDev:
		return 0
	case releaseChannelRC:
		return 1
	}
	return 2
}

func compareInts(a, b int) int {
	switch {
	case a < b:
		return -1
	case a > b:
		return 1
	}
	return 0
}

func compareBase(a, b releaseVersion) int {
	ab, bb := a.base(), b.base()
	for i := range ab {
		if c := compareInts(ab[i], bb[i]); c != 0 {
			return c
		}
	}
	return 0
}

// compareReleaseVersions orders two release versions. Within one channel it follows how that channel
// is numbered: stable by X.Y.Z, rc by X.Y.Z then the rc number, dev by build date, then X.Y.Z, then the
// build number of that day. Across channels it compares X.Y.Z first and, when equal, ranks
// dev below rc below stable.
func compareReleaseVersions(a, b releaseVersion) int {
	if a.channel != b.channel {
		if c := compareBase(a, b); c != 0 {
			return c
		}
		return compareInts(channelRank(a.channel), channelRank(b.channel))
	}

	switch a.channel {
	case releaseChannelDev:
		if c := compareInts(a.date, b.date); c != 0 {
			return c
		}
		if c := compareBase(a, b); c != 0 {
			return c
		}
		return compareInts(a.build, b.build)
	case releaseChannelRC:
		if c := compareBase(a, b); c != 0 {
			return c
		}
		return compareInts(a.rc, b.rc)
	}
	return compareBase(a, b)
}

func parseRouterOSVersion(v string) (routerOSVersion, bool) {
	m := routerOSVersionPattern.FindStringSubmatch(strings.TrimSpace(v))
	if m == nil {
		return routerOSVersion{}, false
	}

	n := func(s string) int {
		i, _ := strconv.Atoi(s)
		return i
	}
	rv := routerOSVersion{major: n(m[1]), minor: n(m[2]), patch: n(m[3]), preRank: 2}
	switch m[4] {
	case "beta":
		rv.preRank, rv.preNumber = 0, n(m[5])
	case "rc":
		rv.preRank, rv.preNumber = 1, n(m[5])
	}
	return rv, true
}

// routerOSVersionBelow reports whether installed is older than required. A beta or rc counts as older than the final release of the same number. The second result is false when either version cannot be parsed.
func routerOSVersionBelow(installed, required string) (below, ok bool) {
	iv, ok1 := parseRouterOSVersion(installed)
	rv, ok2 := parseRouterOSVersion(required)
	if !ok1 || !ok2 {
		return false, false
	}

	for _, c := range []int{
		compareInts(iv.major, rv.major),
		compareInts(iv.minor, rv.minor),
		compareInts(iv.patch, rv.patch),
		compareInts(iv.preRank, rv.preRank),
		compareInts(iv.preNumber, rv.preNumber),
	} {
		if c != 0 {
			return c < 0, true
		}
	}
	return false, true
}

func releaseChannel(tag string) string {
	switch {
	case stableTagPattern.MatchString(tag):
		return releaseChannelStable
	case strings.Contains(tag, "-rc."):
		return releaseChannelRC
	case strings.Contains(tag, "-dev."):
		return releaseChannelDev
	}
	return ""
}

func releaseChanges(body string) []string {
	changes := []string{}
	inSection := false
	for _, line := range strings.Split(body, "\n") {
		line = strings.TrimSpace(line)
		if releaseChangesHeading.MatchString(line) {
			inSection = true
			continue
		}
		if !inSection {
			continue
		}
		if strings.HasPrefix(line, "#") || strings.HasPrefix(line, "**") {
			break
		}
		if !strings.HasPrefix(line, "* ") && !strings.HasPrefix(line, "- ") {
			continue
		}
		change := strings.TrimSpace(line[2:])
		change = changeSuffixPattern.ReplaceAllString(change, "")
		change = strings.TrimSpace(changePrefixPattern.ReplaceAllString(change, ""))
		if change != "" {
			first, size := utf8.DecodeRuneInString(change)
			changes = append(changes, string(unicode.ToUpper(first))+change[size:])
		}
	}
	return changes
}

func parseReleaseMeta(body string) (releaseMeta, bool) {
	var meta releaseMeta
	match := releaseMetaPattern.FindStringSubmatch(body)
	if match == nil {
		return meta, false
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal([]byte(match[1]), &fields); err != nil {
		return meta, false
	}
	if raw, ok := fields["minAppVersion"]; ok {
		_ = json.Unmarshal(raw, &meta.MinAppVersion)
	}
	if raw, ok := fields["routeros"]; ok {
		_ = json.Unmarshal(raw, &meta.RouterOS)
	}
	return meta, true
}

func releaseMinRouterOSVersion(body string) string {
	meta, ok := parseReleaseMeta(body)
	if !ok {
		return defaultMinRouterOSVersion
	}
	if _, ok := parseRouterOSVersion(meta.RouterOS.MinVersion); !ok {
		return defaultMinRouterOSVersion
	}
	return meta.RouterOS.MinVersion
}

func compareForInstall(target, current releaseVersion) int {
	cmp := compareReleaseVersions(target, current)
	if cmp < 0 && target.channel == releaseChannelDev && current.channel != releaseChannelDev && compareBase(target, current) == 0 {
		return 1
	}
	return cmp
}

func releaseInstallable(tag, minAppVersion string) bool {
	if buildinfo.Version == localDevVersion {
		_, ok := parseReleaseVersion(tag)
		return ok
	}
	current, ok := parseReleaseVersion(buildinfo.Version)
	if !ok {
		return false
	}
	target, ok := parseReleaseVersion(tag)
	if !ok || compareForInstall(target, current) <= 0 {
		return false
	}
	minimum, ok := parseReleaseVersion(minAppVersion)
	return ok && compareReleaseVersions(current, minimum) >= 0
}

func releaseMinAppVersion(tag, body string) string {
	if version, ok := parseReleaseVersion(tag); ok {
		if version.channel == releaseChannelDev {
			return "1.0.0"
		}
		oldest, _ := parseReleaseVersion("1.1.0")
		if compareBase(version, oldest) <= 0 {
			return "0.0.0"
		}
		for _, line := range []string{"1.2.0", "1.3.0"} {
			if known, _ := parseReleaseVersion(line); compareBase(version, known) == 0 {
				return "1.0.0"
			}
		}
	}

	meta, ok := parseReleaseMeta(body)
	if !ok || !minAppVersionPattern.MatchString(meta.MinAppVersion) {
		return defaultMinAppVersion
	}
	return meta.MinAppVersion
}

// appUpdatePhase enumerates the stages of a self-update, tracked in-process so
// /api/app/update-status has something to report while the background watch
// goroutine runs independently of the request that started it.
type appUpdatePhase string

const (
	updatePhaseIdle       appUpdatePhase = "idle"
	updatePhasePreparing  appUpdatePhase = "preparing"
	updatePhasePulling    appUpdatePhase = "pulling"
	updatePhaseRestarting appUpdatePhase = "restarting"
	updatePhaseDone       appUpdatePhase = "done"
	updatePhaseError      appUpdatePhase = "error"
)

type appUpdateState struct {
	mu        sync.RWMutex
	phase     appUpdatePhase
	message   string
	version   string
	startedAt time.Time
}

func (s *appUpdateState) set(phase appUpdatePhase, version, message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.phase = phase
	s.version = version
	s.message = message
	if phase == updatePhasePreparing {
		s.startedAt = time.Now()
	}
}

func (s *appUpdateState) busyLocked() bool {
	return s.phase == updatePhasePreparing || s.phase == updatePhasePulling || s.phase == updatePhaseRestarting
}

// tryBegin claims the update slot when no prepare, pull, or restart is running. Two requests
// therefore cannot both start an update. Call rollback to restore the state from before the claim when
// the handler returns without starting the update. When the claim fails, phase is the one holding the slot.
func (s *appUpdateState) tryBegin() (rollback func(), phase appUpdatePhase, ok bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.busyLocked() {
		return nil, s.phase, false
	}

	prevPhase, prevMessage, prevVersion, prevStartedAt := s.phase, s.message, s.version, s.startedAt
	s.phase = updatePhasePreparing
	s.message = "checking the update"
	s.version = ""
	s.startedAt = time.Now()

	return func() {
		s.mu.Lock()
		defer s.mu.Unlock()
		s.phase, s.message, s.version, s.startedAt = prevPhase, prevMessage, prevVersion, prevStartedAt
	}, s.phase, true
}

func (s *appUpdateState) snapshot() UpdateStatusResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	resp := UpdateStatusResponse{
		Phase:   string(s.phase),
		Message: s.message,
		Version: s.version,
	}
	if !s.startedAt.IsZero() {
		resp.StartedAt = s.startedAt.Format(time.RFC3339)
	}
	return resp
}

var (
	appUpdate        = &appUpdateState{phase: updatePhaseIdle}
	releaseListCache = &releaseCache{}
)

// HandleAppInstallUpdate godoc
// @Summary Install the latest nasnet-panel release
// @Description Checks the latest GitHub release and, if newer than the running
// @Description version, pulls it into a fresh nasnet-panel-update container alongside
// @Description the running one. Once the pull finishes, nasnet-panel-update is promoted
// @Description into nasnet-panel's place and started; poll /api/app/update-status for
// @Description progress.
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=InstallUpdateResponse}
// @Failure 502 {object} Response
// @Router /api/app/install-update [post].
func HandleAppInstallUpdate(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rollback, phase, claimed := appUpdate.tryBegin()
	if !claimed {
		return ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}
	started := false
	defer func() {
		if !started {
			rollback()
		}
	}()

	sysUpdate, err := client.CheckForUpdates()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check RouterOS system updates", err)
	}
	if sysUpdate.UpdateAvailable {
		return ErrorResponse(c, http.StatusPreconditionFailed, "RouterOS system update available; install it before updating the panel",
			fmt.Errorf("installed %s, latest %s (%s)", sysUpdate.InstalledVersion, sysUpdate.LatestVersion, sysUpdate.Status))
	}

	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	if !utils.IsNewerVersion(release.TagName, buildinfo.Version) {
		return SuccessResponse(c, http.StatusOK, "Already up to date", InstallUpdateResponse{
			UpdateAvailable: false,
			FromVersion:     buildinfo.Version,
			ToVersion:       release.TagName,
		})
	}

	resources, err := client.GetResourceInfo()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check available storage", err)
	}
	if err := updateStorageError(resources.HDDFree); err != nil {
		return ErrorResponse(c, http.StatusInsufficientStorage, "Not enough storage to update", err)
	}

	appUpdate.set(updatePhasePreparing, release.TagName, "starting update")
	started = true

	go watchNewContainerAndPromote(client, release.TagName)

	return SuccessResponse(c, http.StatusOK, "Update started", InstallUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     buildinfo.Version,
		ToVersion:       release.TagName,
	})
}

// HandleAppUpdate godoc
// @Summary Update nasnet-panel to a chosen release
// @Description Looks the version up among the GitHub releases and reads its minimum RouterOS version
// @Description from the metadata embedded in the release body, 7.24 when the release has none. When the
// @Description router runs an older RouterOS, answers 412 asking to update RouterOS first. A version equal
// @Description to the running one answers 200 with updateAvailable false, a lower one answers 400. Otherwise
// @Description pulls the release into a fresh nasnet-panel-update container and promotes it in the
// @Description background; poll /api/app/update/status for progress.
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body StartUpdateRequest true "Release to update to"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=InstallUpdateResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 412 {object} Response
// @Failure 502 {object} Response
// @Failure 507 {object} Response
// @Router /api/app/update [post].
func HandleAppUpdate(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req StartUpdateRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	target, ok := parseReleaseVersion(req.Version)
	if !ok {
		return ErrorResponse(c, http.StatusBadRequest, "version must be a release tag such as v1.3.0, v1.3.0-rc.1 or v1.3.0-dev.20261026.1", nil)
	}

	rollback, phase, claimed := appUpdate.tryBegin()
	if !claimed {
		return ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}
	started := false
	defer func() {
		if !started {
			rollback()
		}
	}()

	if current, ok := parseReleaseVersion(buildinfo.Version); ok {
		switch compareForInstall(target, current) {
		case 0:
			return SuccessResponse(c, http.StatusOK, "Already up to date", InstallUpdateResponse{
				UpdateAvailable: false,
				FromVersion:     buildinfo.Version,
				ToVersion:       req.Version,
			})
		case -1:
			return ErrorResponse(c, http.StatusBadRequest, "Target version is lower than the running version; only newer versions can be installed",
				fmt.Errorf("running %s, requested %s", buildinfo.Version, req.Version))
		}
	}

	releases, err := fetchGitHubReleases(c.Request().Context(), func(releases []githubReleaseEntry) bool {
		return findRelease(releases, req.Version) != nil
	})
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch releases from GitHub", err)
	}
	release := findRelease(releases, req.Version)
	if release == nil {
		return ErrorResponse(c, http.StatusNotFound, "Release not found", fmt.Errorf("no release tagged %s", req.Version))
	}

	resources, err := client.GetResourceInfo()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the RouterOS version and storage", err)
	}

	required := releaseMinRouterOSVersion(release.Body)
	below, ok := routerOSVersionBelow(resources.Version, required)
	if !ok {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to compare RouterOS versions",
			fmt.Errorf("installed %q, required %q", resources.Version, required))
	}
	if below {
		return ErrorResponse(c, http.StatusPreconditionFailed, "RouterOS update required; update RouterOS before updating the panel",
			fmt.Errorf("RouterOS %s installed, %s or newer required by %s", resources.Version, required, release.TagName))
	}

	if err := updateStorageError(resources.HDDFree); err != nil {
		return ErrorResponse(c, http.StatusInsufficientStorage, "Not enough storage to update", err)
	}

	appUpdate.set(updatePhasePreparing, release.TagName, "starting update")
	started = true

	go watchNewContainerAndPromote(client, release.TagName)

	return SuccessResponse(c, http.StatusOK, "Update started", InstallUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     buildinfo.Version,
		ToVersion:       release.TagName,
	})
}

// HandleAppUpdateProgress godoc
// @Summary Get the progress of POST /api/app/update
// @Description Returns the current phase of an in-progress or completed self-update, the same state /api/app/update-status reports
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=UpdateStatusResponse}
// @Router /api/app/update/status [get].
func HandleAppUpdateProgress(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "Update status retrieved", appUpdate.snapshot())
}

func findRelease(releases []githubReleaseEntry, tag string) *githubReleaseEntry {
	for i := range releases {
		if !releases[i].Draft && releases[i].TagName == tag {
			return &releases[i]
		}
	}
	return nil
}

func updateStorageError(freeBytes int64) error {
	if freeBytes >= minUpdateFreeStorageBytes {
		return nil
	}
	return fmt.Errorf("%s free, %s required", utils.BytesToSizeString(freeBytes), utils.BytesToSizeString(minUpdateFreeStorageBytes))
}

// removeStaleRootDir deletes dir and everything in it when it exists, so a
// pull never extracts on top of files left by an earlier failed attempt.
func removeStaleRootDir(client *routeros.Client, dir string) error {
	exists, err := client.FileExists(dir)
	if err != nil || !exists {
		return err
	}
	return client.DeleteFile(dir)
}

// watchNewContainerAndPromote removes any leftover nasnet-panel-update container,
// creates a fresh one pulling the target release, polls its download/extract
// state, and once the pull finishes promotes it into the running nasnet-panel
// container's place. Runs detached from the HTTP request that triggered it,
// so it uses its own timeout rather than a request context.
func watchNewContainerAndPromote(client *routeros.Client, releaseTag string) {
	// A leftover nasnet-panel-update from a previous failed run would otherwise collide
	// with AddContainer below. Safe to delete here since the in-progress guard
	// in HandleAppInstallUpdate already ruled out a live update.
	if _, err := client.GetContainer(appUpdateContainerName); err == nil {
		appUpdate.set(updatePhasePreparing, releaseTag, "removing leftover "+appUpdateContainerName)
		if err := client.RemoveContainer(appUpdateContainerName); err != nil {
			appUpdate.set(updatePhaseError, releaseTag, "failed to remove leftover update container: "+err.Error())
			log.Printf("[app-update] failed to remove leftover container %s: %v", appUpdateContainerName, err)
			return
		}
	}

	running, err := client.GetContainer(appContainerName)
	if err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to inspect running container: "+err.Error())
		log.Printf("[app-update] failed to inspect container %s: %v", appContainerName, err)
		return
	}

	version := strings.TrimPrefix(releaseTag, "v")
	remoteImage := appContainerImage + ":" + version

	rootDir, err := preparePluginRootDir(client, appContainerName+"-"+version)
	if err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to prepare the container directory: "+err.Error())
		log.Printf("[app-update] failed to prepare the container directory: %v", err)
		return
	}

	if strings.TrimPrefix(running.RootDir, "/") == rootDir {
		appUpdate.set(updatePhaseError, releaseTag, "target directory "+rootDir+" is used by the running container")
		log.Printf("[app-update] target directory %s is used by the running container", rootDir)
		return
	}
	if err := removeStaleRootDir(client, rootDir); err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to clear leftover files in "+rootDir+": "+err.Error())
		log.Printf("[app-update] failed to clear %s: %v", rootDir, err)
		return
	}

	mountLists, err := ensureDatabaseMount(client, running.MountLists)
	if err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to prepare the database mount: "+err.Error())
		log.Printf("[app-update] failed to prepare the database mount: %v", err)
		return
	}

	appUpdate.set(updatePhasePreparing, releaseTag, "creating "+appUpdateContainerName)
	if _, err := client.AddContainer(routeros.ContainerConfig{
		Name:        appUpdateContainerName,
		Interface:   running.Interface,
		RootDir:     rootDir,
		RemoteImage: remoteImage,
		MountLists:  mountLists,
		Logging:     true,
		StartOnBoot: false,
	}); err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to create update container: "+err.Error())
		log.Printf("[app-update] failed to create container %s: %v", appUpdateContainerName, err)
		return
	}

	appUpdate.set(updatePhasePulling, releaseTag, "pulling "+remoteImage+" into "+appUpdateContainerName)

	deadline := time.Now().Add(updateWatchTimeout)

	for time.Now().Before(deadline) {
		time.Sleep(updateWatchInterval)

		info, err := client.GetContainer(appUpdateContainerName)
		if err != nil {
			appUpdate.set(updatePhaseError, releaseTag, "lost track of update container during pull: "+err.Error())
			log.Printf("[app-update] failed to poll container %s: %v", appUpdateContainerName, err)
			return
		}

		if info.DownloadExtractFailed {
			msg := info.About
			if msg == "" {
				msg = "image pull failed"
			}
			log.Printf("[app-update] pull failed for container %s: %s", appUpdateContainerName, msg)
			if rmErr := client.RemoveContainer(appUpdateContainerName); rmErr != nil {
				log.Printf("[app-update] failed to clean up failed update container %s: %v", appUpdateContainerName, rmErr)
			}
			if rmErr := removeStaleRootDir(client, rootDir); rmErr != nil {
				log.Printf("[app-update] failed to clean up %s: %v", rootDir, rmErr)
			}
			appUpdate.set(updatePhaseError, releaseTag, msg)
			return
		}

		if info.DownloadingExtracting {
			appUpdate.set(updatePhasePulling, releaseTag, "pulling "+info.RemoteImage)
			continue
		}

		appUpdate.set(updatePhaseRestarting, releaseTag, "promoting "+appUpdateContainerName+" to "+appContainerName)
		if err := client.PromoteContainer(appContainerName, appUpdateContainerName, restartScheduleDelaySeconds); err != nil {
			appUpdate.set(updatePhaseError, releaseTag, "pull finished but promotion failed: "+err.Error())
			log.Printf("[app-update] failed to promote container %s: %v", appUpdateContainerName, err)
			return
		}

		appUpdate.set(updatePhaseDone, releaseTag,
			fmt.Sprintf("update complete; version %s will be applied in a few seconds", releaseTag))
		return
	}

	appUpdate.set(updatePhaseError, releaseTag, "timed out waiting for image pull to finish")
}

// ensureDatabaseMount makes sure the database mount list exists on the router and is part of
// mountLists, the comma separated mount lists of the running container, and returns the lists
// the update container must be created with. A container installed before the database mount
// existed gets the list added here, so its database survives the update.
func ensureDatabaseMount(client *routeros.Client, mountLists string) (string, error) {
	var lists []string
	for _, list := range strings.Split(mountLists, ",") {
		list = strings.TrimSpace(list)
		if list == appDatabaseMountList {
			return mountLists, nil
		}
		if list != "" {
			lists = append(lists, list)
		}
	}

	if err := client.EnsureNasnetPanelDir(); err != nil {
		return "", err
	}
	if err := client.EnsureDir(appDatabaseDir); err != nil {
		return "", err
	}

	exists, err := client.ContainerMountExists(appDatabaseMountList)
	if err != nil {
		return "", err
	}
	if !exists {
		if _, err := client.AddContainerMount(appDatabaseMountList, "/"+appDatabaseDir, "/"+appDatabaseDir); err != nil {
			return "", err
		}
	}

	return strings.Join(append(lists, appDatabaseMountList), ","), nil
}

// HandleAppUpdateStatus godoc
// @Summary Get self-update status
// @Description Returns the current phase of an in-progress or completed self-update
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=UpdateStatusResponse}
// @Router /api/app/update-status [get].
func HandleAppUpdateStatus(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "Update status retrieved", appUpdate.snapshot())
}

func fetchLatestGitHubRelease(ctx context.Context) (*githubRelease, error) {
	var release githubRelease
	if err := fetchGitHubJSON(ctx, githubLatestReleaseURL, &release); err != nil {
		return nil, err
	}
	return &release, nil
}

// fetchGitHubReleases reads the releases page by page, following GitHub's Link rel="next", and
// stops once done accepts the releases collected so far, there is no next page, or
// maxGitHubReleasePages pages were read.
func fetchGitHubReleases(ctx context.Context, done func([]githubReleaseEntry) bool) ([]githubReleaseEntry, error) {
	var releases []githubReleaseEntry
	url := githubReleasesURL
	for page := 0; page < maxGitHubReleasePages && url != ""; page++ {
		var batch []githubReleaseEntry
		next, err := fetchGitHubPage(ctx, url, &batch)
		if err != nil {
			return nil, err
		}
		releases = append(releases, batch...)
		if done(releases) {
			break
		}
		url = next
	}
	return releases, nil
}

func allGitHubReleases(ctx context.Context) ([]githubReleaseEntry, error) {
	releaseListCache.mu.Lock()
	defer releaseListCache.mu.Unlock()

	if releaseListCache.releases != nil && time.Since(releaseListCache.fetchedAt) < releaseListCacheTTL {
		return releaseListCache.releases, nil
	}

	fetchCtx, cancel := context.WithTimeout(ctx, releaseFetchTimeout)
	defer cancel()

	releases, err := fetchGitHubReleases(fetchCtx, func([]githubReleaseEntry) bool { return false })
	if err != nil {
		return nil, err
	}
	releaseListCache.releases, releaseListCache.fetchedAt = releases, time.Now()
	return releases, nil
}

func fetchGitHubJSON(ctx context.Context, url string, out any) error {
	_, err := fetchGitHubPage(ctx, url, out)
	return err
}

func fetchGitHubPage(ctx context.Context, url string, out any) (next string, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "nasnet-panel/"+buildinfo.Version)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	if resp == nil {
		return "", fmt.Errorf("empty response from GitHub API")
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode == http.StatusNotFound {
		return "", errGitHubNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return "", err
	}

	if m := githubNextLinkPattern.FindStringSubmatch(resp.Header.Get("Link")); len(m) > 1 && strings.HasPrefix(m[1], githubAPIPrefix) {
		return m[1], nil
	}
	return "", nil
}

func routerSettingsDB(c echo.Context) (conn *sqlx.DB, ok bool, handled error) {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return nil, false, err
	}

	systemID, err := client.GetSystemID()
	if err != nil {
		if IsCredentialError(err) {
			return nil, false, ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return nil, false, ErrorResponse(c, http.StatusBadGateway, "Failed to read the router system ID", err)
	}

	registry := appDatabases
	if registry == nil {
		return nil, false, ErrorResponse(c, http.StatusInternalServerError, "The router database is not available", nil)
	}

	conn, err = registry.ForRouter(c.Request().Context(), systemID)
	if err != nil {
		return nil, false, ErrorResponse(c, http.StatusInternalServerError, "Failed to open the router database", err)
	}
	ensureInitialSync(c.Request().Context(), client, systemID, conn)

	return conn, true, nil
}

func databaseForClient(ctx context.Context, client *routeros.Client) (*sqlx.DB, error) {
	systemID, err := client.GetSystemID()
	if err != nil {
		return nil, fmt.Errorf("failed to read the router system ID: %w", err)
	}

	registry := appDatabases
	if registry == nil {
		return nil, errors.New("the router database is not available")
	}

	conn, err := registry.ForRouter(ctx, systemID)
	if err != nil {
		return nil, err
	}
	ensureInitialSync(ctx, client, systemID, conn)

	return conn, nil
}

func validateSettingKey(key string) error {
	if key == "" {
		return errors.New("key is required")
	}
	if len(key) > maxSettingKeyLength || !settingKeyPattern.MatchString(key) {
		return fmt.Errorf("key must be 1-%d characters of letters, digits and _ . : -", maxSettingKeyLength)
	}
	return nil
}

func validateSettingValue(value string) error {
	if len(value) > maxSettingValueLength {
		return fmt.Errorf("value must be at most %d bytes", maxSettingValueLength)
	}
	return nil
}

func settingError(c echo.Context, err error, message string) error {
	switch {
	case errors.Is(err, db.ErrSettingNotFound):
		return ErrorResponse(c, http.StatusNotFound, "Setting not found", err)
	case errors.Is(err, db.ErrSettingExists):
		return ErrorResponse(c, http.StatusConflict, "Setting already exists", err)
	default:
		return ErrorResponse(c, http.StatusInternalServerError, message, err)
	}
}

// HandleListSettings godoc
// @Summary List app settings
// @Description Returns every setting stored in the database of the router named by X-RouterOS-Host, ordered by key
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]SettingResponse}
// @Failure 500 {object} Response
// @Router /api/app/settings [get].
func HandleListSettings(c echo.Context) error {
	conn, ok, err := routerSettingsDB(c)
	if !ok {
		return err
	}

	settings, err := db.ListSettings(c.Request().Context(), conn)
	if err != nil {
		return settingError(c, err, "Failed to list settings")
	}

	response := make([]SettingResponse, 0, len(settings))
	for i := range settings {
		response = append(response, ToSettingResponse(&settings[i]))
	}

	return SuccessResponse(c, http.StatusOK, "Settings retrieved", response)
}

// HandleGetSetting godoc
// @Summary Get an app setting
// @Description Returns one setting by key
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param key path string true "Setting key"
// @Produce json
// @Success 200 {object} Response{data=SettingResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/app/settings/{key} [get].
func HandleGetSetting(c echo.Context) error {
	key := c.Param("key")
	if err := validateSettingKey(key); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}

	conn, ok, err := routerSettingsDB(c)
	if !ok {
		return err
	}

	setting, err := db.GetSetting(c.Request().Context(), conn, key)
	if err != nil {
		return settingError(c, err, "Failed to get setting")
	}

	return SuccessResponse(c, http.StatusOK, "Setting retrieved", ToSettingResponse(setting))
}

// HandleCreateSetting godoc
// @Summary Create an app setting
// @Description Stores a new setting. Returns 409 if the key already exists
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateSettingRequest true "Setting to create"
// @Accept json
// @Produce json
// @Success 201 {object} Response{data=SettingResponse}
// @Failure 400 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/app/settings [post].
func HandleCreateSetting(c echo.Context) error {
	var req CreateSettingRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if err := validateSettingKey(req.Key); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}
	if err := validateSettingValue(req.Value); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid value", err)
	}

	conn, ok, err := routerSettingsDB(c)
	if !ok {
		return err
	}

	setting, err := db.CreateSetting(c.Request().Context(), conn, req.Key, req.Value)
	if err != nil {
		return settingError(c, err, "Failed to create setting")
	}

	return SuccessResponse(c, http.StatusCreated, "Setting created", ToSettingResponse(setting))
}

// HandleUpdateSetting godoc
// @Summary Update an app setting
// @Description Changes the value of an existing setting
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param key path string true "Setting key"
// @Param body body UpdateSettingRequest true "New value"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=SettingResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/app/settings/{key} [put].
func HandleUpdateSetting(c echo.Context) error {
	key := c.Param("key")
	if err := validateSettingKey(key); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}

	var req UpdateSettingRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if req.Value == nil {
		return ErrorResponse(c, http.StatusBadRequest, "value is required", nil)
	}
	if err := validateSettingValue(*req.Value); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid value", err)
	}

	conn, ok, err := routerSettingsDB(c)
	if !ok {
		return err
	}

	setting, err := db.UpdateSetting(c.Request().Context(), conn, key, *req.Value)
	if err != nil {
		return settingError(c, err, "Failed to update setting")
	}

	return SuccessResponse(c, http.StatusOK, "Setting updated", ToSettingResponse(setting))
}

// HandleDeleteSetting godoc
// @Summary Delete an app setting
// @Description Removes a setting by key
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param key path string true "Setting key"
// @Produce json
// @Success 204
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/app/settings/{key} [delete].
func HandleDeleteSetting(c echo.Context) error {
	key := c.Param("key")
	if err := validateSettingKey(key); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}

	conn, ok, err := routerSettingsDB(c)
	if !ok {
		return err
	}

	if err := db.DeleteSetting(c.Request().Context(), conn, key); err != nil {
		return settingError(c, err, "Failed to delete setting")
	}

	return c.NoContent(http.StatusNoContent)
}
