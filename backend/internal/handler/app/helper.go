package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/internal/db"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/config"
	"nasnet-panel/internal/handler/plugin"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

func toReleaseUpdateResponse(release *githubReleaseEntry) ReleaseUpdateResponse {
	minAppVersion := releaseMinAppVersion(release.TagName, release.Body)
	return ReleaseUpdateResponse{
		Tag:                release.TagName,
		Prerelease:         release.Prerelease,
		ReleaseDate:        release.PublishedAt,
		ReleaseURL:         release.HTMLURL,
		MinRouterosVersion: releaseMinRouterOSVersion(release.Body),
		MinAppVersion:      minAppVersion,
		AutoReconfigable:   releaseAutoReconfigable(release.TagName, minAppVersion),
		Changelog:          releaseChanges(release.Body),
	}
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
		common.CompareInts(iv.major, rv.major),
		common.CompareInts(iv.minor, rv.minor),
		common.CompareInts(iv.patch, rv.patch),
		common.CompareInts(iv.preRank, rv.preRank),
		common.CompareInts(iv.preNumber, rv.preNumber),
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
		return common.ReleaseChannelStable
	case strings.Contains(tag, "-rc."):
		return common.ReleaseChannelRC
	case strings.Contains(tag, "-dev."):
		return common.ReleaseChannelDev
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
	if raw, ok := fields["app"]; ok {
		_ = json.Unmarshal(raw, &meta.App)
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

func compareForInstall(target, current common.ReleaseVersion) int {
	cmp := common.CompareReleaseVersions(target, current)
	if cmp < 0 && target.Channel == common.ReleaseChannelDev && current.Channel != common.ReleaseChannelDev && common.CompareBase(target, current) == 0 {
		return 1
	}
	return cmp
}

func releaseAutoReconfigable(tag, minAppVersion string) bool {
	target, ok := common.ParseReleaseVersion(tag)
	if !ok {
		return false
	}
	if first, _ := common.ParseReleaseVersion(autoReconfigableFromVersion); common.CompareBase(target, first) < 0 {
		return false
	}
	if buildinfo.Version == localDevVersion {
		return true
	}
	current, ok := common.ParseReleaseVersion(buildinfo.Version)
	if !ok {
		return false
	}
	if compareForInstall(target, current) <= 0 {
		return false
	}
	minimum, ok := common.ParseReleaseVersion(minAppVersion)
	return ok && common.CompareReleaseVersions(current, minimum) >= 0
}

func releaseMinAppVersion(tag, body string) string {
	if version, ok := common.ParseReleaseVersion(tag); ok {
		if version.Channel == common.ReleaseChannelDev {
			return "1.0.0"
		}
		oldest, _ := common.ParseReleaseVersion("1.1.0")
		if common.CompareBase(version, oldest) <= 0 {
			return "0.0.0"
		}
		for line, minimum := range map[string]string{"1.2.0": "1.0.0", "1.3.0": "1.2.0"} {
			if known, _ := common.ParseReleaseVersion(line); common.CompareBase(version, known) == 0 {
				return minimum
			}
		}
	}

	meta, ok := parseReleaseMeta(body)
	if !ok || !minAppVersionPattern.MatchString(meta.App.MinVersion) {
		return defaultMinAppVersion
	}
	return meta.App.MinVersion
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
func watchNewContainerAndPromote(client *routeros.Client, releaseTag string, reconfigAfter bool) {
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

	running, err := client.GetContainer(common.AppContainerName)
	if err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to inspect running container: "+err.Error())
		log.Printf("[app-update] failed to inspect container %s: %v", common.AppContainerName, err)
		return
	}

	version := strings.TrimPrefix(releaseTag, "v")
	remoteImage := appContainerImage + ":" + version

	rootDir, err := plugin.PreparePluginRootDir(client, common.AppContainerName+"-"+version)
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

		appUpdate.set(updatePhaseRestarting, releaseTag, "promoting "+appUpdateContainerName+" to "+common.AppContainerName)
		reconfigScheduled := reconfigAfter && config.MarkReconfigPending(client, releaseTag)
		if err := client.PromoteContainer(common.AppContainerName, appUpdateContainerName, restartScheduleDelaySeconds); err != nil {
			if reconfigScheduled {
				config.ClearReconfigPending(client)
			}
			appUpdate.set(updatePhaseError, releaseTag, "pull finished but promotion failed: "+err.Error())
			log.Printf("[app-update] failed to promote container %s: %v", appUpdateContainerName, err)
			return
		}

		message := fmt.Sprintf("update complete; version %s will be applied in a few seconds", releaseTag)
		switch {
		case reconfigScheduled:
			message += ", then the router will be reconfigured"
		case reconfigAfter:
			message += ", but the reconfiguration could not be scheduled"
		}
		appUpdate.set(updatePhaseDone, releaseTag, message)
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
		return common.ErrorResponse(c, http.StatusNotFound, "Setting not found", err)
	case errors.Is(err, db.ErrSettingExists):
		return common.ErrorResponse(c, http.StatusConflict, "Setting already exists", err)
	default:
		return common.ErrorResponse(c, http.StatusInternalServerError, message, err)
	}
}

// ToSettingResponse converts a stored Setting to API SettingResponse.
func ToSettingResponse(setting *db.Setting) SettingResponse {
	return SettingResponse{
		Key:       setting.Key,
		Value:     setting.Value,
		UpdatedAt: setting.UpdatedAt,
	}
}
