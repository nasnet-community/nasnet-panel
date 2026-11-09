package app

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/internal/db"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/config"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

// HandleAppVersion godoc
// @Summary Get panel version
// @Description Returns the current running version of nasnet-panel
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=AppVersionResponse}
// @Router /api/app/version [get].
func HandleAppVersion(c echo.Context) error {
	return common.SuccessResponse(c, http.StatusOK, "Version retrieved", AppVersionResponse{
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
// @Success 200 {object} common.Response{data=CheckForUpdatesResponse}
// @Failure 502 {object} common.Response
// @Router /api/app/check-for-updates [get].
func HandleAppCheckForUpdates(c echo.Context) error {
	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Update check complete", CheckForUpdatesResponse{
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
// @Success 200 {object} common.Response{data=[]ReleaseUpdateResponse}
// @Failure 400 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/app/updates [get].
func HandleAppUpdates(c echo.Context) error {
	channel := c.QueryParam("channel")
	switch channel {
	case common.ReleaseChannelStable, common.ReleaseChannelRC, common.ReleaseChannelDev:
	default:
		return common.ErrorResponse(c, http.StatusBadRequest, "channel must be one of stable, rc, dev", nil)
	}

	hideLower := false
	switch c.QueryParam("hideLowerVer") {
	case "", "false":
	case "true":
		hideLower = true
	default:
		return common.ErrorResponse(c, http.StatusBadRequest, "hideLowerVer must be true or false", nil)
	}

	releases, err := allGitHubReleases(c.Request().Context())
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch releases from GitHub", err)
	}

	persistUpdateChannelSetting(c, channel)

	current, currentOK := common.ParseReleaseVersion(buildinfo.Version)

	updates := make([]ReleaseUpdateResponse, 0, len(releases))
	for i := range releases {
		release := &releases[i]
		if release.Draft || releaseChannel(release.TagName) != channel {
			continue
		}
		if hideLower && currentOK {
			if version, ok := common.ParseReleaseVersion(release.TagName); ok && compareForInstall(version, current) < 0 {
				continue
			}
		}
		updates = append(updates, toReleaseUpdateResponse(release))
	}

	return common.SuccessResponse(c, http.StatusOK, "Releases retrieved", updates)
}

// HandleAppUpdateRelease godoc
// @Summary Get a single nasnet-panel release
// @Description Returns one GitHub release by tag, in the same format as the entries of GET /api/app/updates
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param tag path string true "Release tag" example(v0.0.2)
// @Produce json
// @Success 200 {object} common.Response{data=ReleaseUpdateResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/app/update/{tag} [get].
func HandleAppUpdateRelease(c echo.Context) error {
	tag := c.Param("tag")
	if _, ok := common.ParseReleaseVersion(tag); !ok {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid release tag", fmt.Errorf("%q is not a release version", tag))
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), releaseFetchTimeout)
	defer cancel()

	var release githubReleaseEntry
	if err := fetchGitHubJSON(ctx, githubReleaseByTagURL+url.PathEscape(tag), &release); err != nil {
		if errors.Is(err, errGitHubNotFound) {
			return common.ErrorResponse(c, http.StatusNotFound, "Release not found", fmt.Errorf("no release tagged %s", tag))
		}
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch the release from GitHub", err)
	}
	if release.Draft {
		return common.ErrorResponse(c, http.StatusNotFound, "Release not found", fmt.Errorf("no release tagged %s", tag))
	}

	return common.SuccessResponse(c, http.StatusOK, "Release retrieved", toReleaseUpdateResponse(&release))
}

// HandleAppUpdateChannel godoc
// @Summary Get the last used update channel
// @Description Returns the channel last requested from GET /api/app/updates for the router named by X-RouterOS-Host, stable when none was requested yet
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=UpdateChannelResponse}
// @Failure 500 {object} common.Response
// @Router /api/app/update/channel [get].
func HandleAppUpdateChannel(c echo.Context) error {
	conn, ok, err := common.RouterSettingsDB(c)
	if !ok {
		return err
	}

	channel := common.ReleaseChannelStable
	setting, err := db.GetSetting(c.Request().Context(), conn, settingKeyUpdateChannel)
	switch {
	case err == nil:
		channel = setting.Value
	case !errors.Is(err, db.ErrSettingNotFound):
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get the update channel", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Update channel retrieved", UpdateChannelResponse{Channel: channel})
}

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
// @Success 200 {object} common.Response{data=common.InstallUpdateResponse}
// @Failure 502 {object} common.Response
// @Router /api/app/install-update [post].
func HandleAppInstallUpdate(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rollback, phase, claimed := appUpdate.tryBegin()
	if !claimed {
		return common.ErrorResponse(c, http.StatusConflict, "An update is already in progress",
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
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check RouterOS system updates", err)
	}
	if sysUpdate.UpdateAvailable {
		return common.ErrorResponse(c, http.StatusPreconditionFailed, "RouterOS system update available; install it before updating the panel",
			fmt.Errorf("installed %s, latest %s (%s)", sysUpdate.InstalledVersion, sysUpdate.LatestVersion, sysUpdate.Status))
	}

	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	if !utils.IsNewerVersion(release.TagName, buildinfo.Version) {
		return common.SuccessResponse(c, http.StatusOK, "Already up to date", common.InstallUpdateResponse{
			UpdateAvailable: false,
			FromVersion:     buildinfo.Version,
			ToVersion:       release.TagName,
		})
	}

	resources, err := client.GetResourceInfo()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check available storage", err)
	}
	if err := updateStorageError(resources.HDDFree); err != nil {
		return common.ErrorResponse(c, http.StatusInsufficientStorage, "Not enough storage to update", err)
	}

	appUpdate.set(updatePhasePreparing, release.TagName, "starting update")
	started = true

	go watchNewContainerAndPromote(client, release.TagName, false)

	return common.SuccessResponse(c, http.StatusOK, "Update started", common.InstallUpdateResponse{
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
// @Description background; poll /api/app/update/status for progress. When the release's autoReconfigable is true,
// @Description the router is reconfigured from its stored configuration after the new version is running, and
// @Description the progress is reported by the same status endpoint.
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body StartUpdateRequest true "Release to update to"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=common.InstallUpdateResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 412 {object} common.Response
// @Failure 502 {object} common.Response
// @Failure 507 {object} common.Response
// @Router /api/app/update [post].
func HandleAppUpdate(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req StartUpdateRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	target, ok := common.ParseReleaseVersion(req.Version)
	if !ok {
		return common.ErrorResponse(c, http.StatusBadRequest, "version must be a release tag such as v1.3.0, v1.3.0-rc.1 or v1.3.0-dev.20261026.1", nil)
	}

	rollback, phase, claimed := appUpdate.tryBegin()
	if !claimed {
		return common.ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}
	started := false
	defer func() {
		if !started {
			rollback()
		}
	}()

	if current, ok := common.ParseReleaseVersion(buildinfo.Version); ok {
		switch compareForInstall(target, current) {
		case 0:
			return common.SuccessResponse(c, http.StatusOK, "Already up to date", common.InstallUpdateResponse{
				UpdateAvailable: false,
				FromVersion:     buildinfo.Version,
				ToVersion:       req.Version,
			})
		case -1:
			return common.ErrorResponse(c, http.StatusBadRequest, "Target version is lower than the running version; only newer versions can be installed",
				fmt.Errorf("running %s, requested %s", buildinfo.Version, req.Version))
		}
	}

	releases, err := fetchGitHubReleases(c.Request().Context(), func(releases []githubReleaseEntry) bool {
		return findRelease(releases, req.Version) != nil
	})
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch releases from GitHub", err)
	}
	release := findRelease(releases, req.Version)
	if release == nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Release not found", fmt.Errorf("no release tagged %s", req.Version))
	}

	resources, err := client.GetResourceInfo()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read the RouterOS version and storage", err)
	}

	required := releaseMinRouterOSVersion(release.Body)
	below, ok := routerOSVersionBelow(resources.Version, required)
	if !ok {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to compare RouterOS versions",
			fmt.Errorf("installed %q, required %q", resources.Version, required))
	}
	if below {
		return common.ErrorResponse(c, http.StatusPreconditionFailed, "RouterOS update required; update RouterOS before updating the panel",
			fmt.Errorf("RouterOS %s installed, %s or newer required by %s", resources.Version, required, release.TagName))
	}

	if err := updateStorageError(resources.HDDFree); err != nil {
		return common.ErrorResponse(c, http.StatusInsufficientStorage, "Not enough storage to update", err)
	}

	appUpdate.set(updatePhasePreparing, release.TagName, "starting update")
	started = true

	reconfigAfter := releaseAutoReconfigable(release.TagName, releaseMinAppVersion(release.TagName, release.Body))
	go watchNewContainerAndPromote(client, release.TagName, reconfigAfter)

	return common.SuccessResponse(c, http.StatusOK, "Update started", common.InstallUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     buildinfo.Version,
		ToVersion:       release.TagName,
	})
}

// HandleAppUpdateProgress godoc
// @Summary Get the progress of POST /api/app/update
// @Description Returns the current phase of an in-progress or completed self-update, the same state /api/app/update-status reports.
// @Description When the update was started for a release whose autoReconfigable is true, the response also carries the
// @Description state, current step and progress of the reconfiguration that runs once the new version is up. The new
// @Description version starts it the first time this endpoint is called after it came up; until then the state is pending.
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=UpdateStatusResponse}
// @Router /api/app/update/status [get].
func HandleAppUpdateProgress(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return err
	}

	status := appUpdate.snapshot()
	status.Reconfig = config.ReconfigStatusAfterUpdate(c.Request().Context(), client, creds)
	return common.SuccessResponse(c, http.StatusOK, "Update status retrieved", status)
}

// HandleAppUpdateStatus godoc
// @Summary Get self-update status
// @Description Returns the current phase of an in-progress or completed self-update
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=UpdateStatusResponse}
// @Router /api/app/update-status [get].
func HandleAppUpdateStatus(c echo.Context) error {
	return common.SuccessResponse(c, http.StatusOK, "Update status retrieved", appUpdate.snapshot())
}

// HandleListSettings godoc
// @Summary List app settings
// @Description Returns every setting stored in the database of the router named by X-RouterOS-Host, ordered by key
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]SettingResponse}
// @Failure 500 {object} common.Response
// @Router /api/app/settings [get].
func HandleListSettings(c echo.Context) error {
	conn, ok, err := common.RouterSettingsDB(c)
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

	return common.SuccessResponse(c, http.StatusOK, "Settings retrieved", response)
}

// HandleGetSetting godoc
// @Summary Get an app setting
// @Description Returns one setting by key
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param key path string true "Setting key"
// @Produce json
// @Success 200 {object} common.Response{data=SettingResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/app/settings/{key} [get].
func HandleGetSetting(c echo.Context) error {
	key := c.Param("key")
	if err := validateSettingKey(key); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}

	conn, ok, err := common.RouterSettingsDB(c)
	if !ok {
		return err
	}

	setting, err := db.GetSetting(c.Request().Context(), conn, key)
	if err != nil {
		return settingError(c, err, "Failed to get setting")
	}

	return common.SuccessResponse(c, http.StatusOK, "Setting retrieved", ToSettingResponse(setting))
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
// @Success 201 {object} common.Response{data=SettingResponse}
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/app/settings [post].
func HandleCreateSetting(c echo.Context) error {
	var req CreateSettingRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if err := validateSettingKey(req.Key); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}
	if err := validateSettingValue(req.Value); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid value", err)
	}

	conn, ok, err := common.RouterSettingsDB(c)
	if !ok {
		return err
	}

	setting, err := db.CreateSetting(c.Request().Context(), conn, req.Key, req.Value)
	if err != nil {
		return settingError(c, err, "Failed to create setting")
	}

	return common.SuccessResponse(c, http.StatusCreated, "Setting created", ToSettingResponse(setting))
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
// @Success 200 {object} common.Response{data=SettingResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/app/settings/{key} [put].
func HandleUpdateSetting(c echo.Context) error {
	key := c.Param("key")
	if err := validateSettingKey(key); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}

	var req UpdateSettingRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if req.Value == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "value is required", nil)
	}
	if err := validateSettingValue(*req.Value); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid value", err)
	}

	conn, ok, err := common.RouterSettingsDB(c)
	if !ok {
		return err
	}

	setting, err := db.UpdateSetting(c.Request().Context(), conn, key, *req.Value)
	if err != nil {
		return settingError(c, err, "Failed to update setting")
	}

	return common.SuccessResponse(c, http.StatusOK, "Setting updated", ToSettingResponse(setting))
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
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/app/settings/{key} [delete].
func HandleDeleteSetting(c echo.Context) error {
	key := c.Param("key")
	if err := validateSettingKey(key); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid key", err)
	}

	conn, ok, err := common.RouterSettingsDB(c)
	if !ok {
		return err
	}

	if err := db.DeleteSetting(c.Request().Context(), conn, key); err != nil {
		return settingError(c, err, "Failed to delete setting")
	}

	return c.NoContent(http.StatusNoContent)
}
