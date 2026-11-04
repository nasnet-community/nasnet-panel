package plugin

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/proxy"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

// HandleListPlugins godoc
// @Summary List available plugins
// @Description Fetches the community plugin registry and returns the list of available
// @Description plugins, each annotated with installed/running status from the router's
// @Description own containers (a plugin is installed as a container named after its id).
// @Description Only plugins with visible=true in the registry are included, unless the
// @Description build version contains "dev", in which case every plugin is listed. Hidden plugins can still be installed
// @Description directly and are unaffected by this filter.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=ListResponse}
// @Failure 500 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/plugin/plugins [get].
func HandleListPlugins(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	registry, err := fetchPluginRegistry(c.Request().Context())
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}
	cachePluginRegistry(registry)

	containerModeEnabled, err := client.IsDeviceModeFeatureEnabled("container")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check container mode", err)
	}
	containerPackageInstalled, err := client.IsPackageInstalled("container")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check container package", err)
	}

	containerSupport := containerModeEnabled && containerPackageInstalled

	var containers []routeros.ContainerInfo
	if containerSupport {
		containers, err = client.ListContainers()
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list containers", err)
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "Plugins retrieved", ListResponse{
		ContainerSupport: containerSupport,
		Plugins:          filterVisiblePlugins(finalizePlugins(registry.Plugins, containers)),
	})
}

// HandleListInstalledPlugins godoc
// @Summary List installed plugins
// @Description Fetches the community plugin registry and the router's own containers, then
// @Description returns just the id and name of every registry plugin currently installed (a
// @Description plugin is installed as a container named after its id).
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Description Returns an empty list without touching the registry if container mode isn't
// @Description enabled or the container package isn't installed on the device.
// @Success 200 {object} common.Response{data=[]InstalledPluginInfo}
// @Failure 500 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/plugin/installed [get].
func HandleListInstalledPlugins(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	containerModeEnabled, err := client.IsDeviceModeFeatureEnabled("container")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check container mode", err)
	}
	containerPackageInstalled, err := client.IsPackageInstalled("container")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check container package", err)
	}
	if !containerModeEnabled || !containerPackageInstalled {
		return common.SuccessResponse(c, http.StatusOK, "Installed plugins retrieved", []InstalledPluginInfo{})
	}

	registry, err := getCachedPluginRegistry(c.Request().Context())
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}

	containers, err := client.ListContainers()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list containers", err)
	}

	plugins := finalizePlugins(registry.Plugins, containers)
	installed := make([]InstalledPluginInfo, 0, len(plugins))
	for i := range plugins {
		if plugins[i].Installed {
			installed = append(installed, InstalledPluginInfo{ID: plugins[i].ID, Name: plugins[i].Name})
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "Installed plugins retrieved", installed)
}

// HandleListPluginEnvVars godoc
// @Summary List a plugin's container environment variables
// @Description Returns the effective environment variables of the container installed for
// @Description pluginId (a plugin is installed as a container named after its id): the
// @Description container's resolved env-current when set, falling back to its own env
// @Description otherwise. Each entry's changeable flag is true only if its key is also set
// @Description directly on the container's own env property, since only those can be edited;
// @Description a key present only via a resolved /container/envs list cannot be.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param pluginId path string true "Plugin id"
// @Produce json
// @Success 200 {object} common.Response{data=[]EnvVar}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Router /api/plugin/envs/{pluginId} [get].
func HandleListPluginEnvVars(c echo.Context) error {
	pluginID := c.Param("pluginId")
	if pluginID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "plugin id is required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	container, err := client.GetContainer(pluginID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Plugin is not installed", err)
	}

	envVars := parseEnvPairs(container.EnvCurrent, container.Env)

	return common.SuccessResponse(c, http.StatusOK, "Plugin environment variables retrieved", envVars)
}

// HandleSetPluginEnvVar godoc
// @Summary Set a plugin's container environment variable
// @Description Adds or overwrites one entry in the container's own env property, identified by
// @Description pluginId (a plugin is installed as a container named after its id). Only
// @Description variables set this way (as opposed to ones pulled in from a resolved
// @Description /container/envs list) can be changed; see GET /api/plugin/envs/{pluginId}'s
// @Description changeable field.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param pluginId path string true "Plugin id"
// @Param request body SetPluginEnvVarRequest true "Environment variable to set"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=EnvVar}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/plugin/env/{pluginId} [put].
func HandleSetPluginEnvVar(c echo.Context) error {
	pluginID := c.Param("pluginId")
	if pluginID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "plugin id is required", nil)
	}

	var req SetPluginEnvVarRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.Key == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "key is required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	container, err := client.GetContainer(pluginID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Plugin is not installed", err)
	}

	// A key already in effect only via a resolved /container/envs list isn't
	// settable here: it doesn't exist on the container's own env yet writing
	// it would silently shadow, rather than actually change, the list-derived
	// value the container currently sees.
	if envKeySet(container.EnvCurrent)[req.Key] && !envKeySet(container.Env)[req.Key] {
		return common.ErrorResponse(c, http.StatusConflict,
			fmt.Sprintf("Environment variable %q is not changeable: it is set via a container envs list, not directly", req.Key), nil)
	}

	envMap := envToMap(container.Env)
	envMap[req.Key] = req.Value

	if err := client.EditContainer(pluginID, map[string]string{"env": joinEnvPairs(envMap)}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update plugin environment variable", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Plugin environment variable updated successfully",
		EnvVar{Key: req.Key, Value: req.Value, Changeable: true})
}

// HandleViewPlugin godoc
// @Summary Proxy a plugin's web UI (test mode: base-tag injection only)
// @Description Proxies a plugin's own web UI, resolving its target from the plugin's manifest:
// @Description the container interface's address (its IP, without the subnet) as host, and the
// @Description containerPort of the first entry in container.ports whose description starts
// @Description with "web" (case-insensitive) as port. The resolved target is cached in-memory
// @Description per plugin id, so the manifest is only fetched once per plugin.
// @Description Test mode: no redirect/cookie/CSS/JS rewriting is performed; a <base href>
// @Description tag pointing at this route's own base URL is injected into HTML responses only.
// @Description /api/plugin/view/{pluginID} is the base URL for the plugin's web UI; any path
// @Description appended after it (assets, API calls, etc.) is forwarded to the same target,
// @Description relative to that base.
// @Description Does not require RouterOS auth: it proxies the plugin's own web UI, not RouterOS.
// @Tags Plugin
// @Param pluginID path string true "Plugin id"
// @Router /api/plugin/view/{pluginID} [get].
// @Router /api/plugin/view/{pluginID}/{path} [get].
func HandleViewPlugin(c echo.Context) error {
	pluginID := c.Param("pluginID")

	pluginViewTargetsMu.RLock()
	cached, ok := pluginViewTargets[pluginID]
	pluginViewTargetsMu.RUnlock()

	if !ok {
		manifest, err := fetchPluginManifest(c.Request().Context(), pluginID)
		if err != nil {
			return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin manifest", err)
		}

		host, _, _ := strings.Cut(manifest.Container.Interface.Address, "/")
		if host == "" {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Plugin manifest has no interface address", nil)
		}

		var webPort *ManifestPort
		for i := range manifest.Container.Ports {
			if strings.HasPrefix(strings.ToLower(manifest.Container.Ports[i].Description), "web") {
				webPort = &manifest.Container.Ports[i]
				break
			}
		}
		if webPort == nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Plugin manifest has no web port", nil)
		}

		cached = pluginViewTarget{Host: host, Port: webPort.ContainerPort}

		pluginViewTargetsMu.Lock()
		pluginViewTargets[pluginID] = cached
		pluginViewTargetsMu.Unlock()
	}

	target, err := url.Parse(fmt.Sprintf("http://%s:%d", cached.Host, cached.Port))
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Invalid plugin target URL", err)
	}

	baseURL := strings.TrimSuffix(c.Request().URL.Path, c.Param("*"))
	baseURL = strings.TrimSuffix(baseURL, "/")

	proxyHandler, err := proxy.NewSubpathProxy(baseURL, target)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to set up plugin proxy", err)
	}

	return proxyHandler(c)
}

// HandleInstallPlugin godoc
// @Summary Install a plugin
// @Description Starts an async install of a plugin from the community registry:
// @Description creates the veth interface its manifest specifies (if not already
// @Description present), creates its mounts, and adds its container, then waits for
// @Description the image to finish pulling. Poll GET /api/plugin/install/status/{pluginId} for
// @Description progress. At most one install per plugin id may run at a time;
// @Description different plugins may install concurrently.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Param request body InstallPluginRequest true "Plugin to install"
// @Success 200 {object} common.Response{data=InstallPluginResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 422 {object} common.Response
// @Failure 500 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/plugin/install [post].
func HandleInstallPlugin(c echo.Context) error {
	var req InstallPluginRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.ID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "plugin id is required", nil)
	}

	release, err := pluginLifecycles.acquire(req.ID, pluginLifecycleOpInstall)
	if err != nil {
		return common.ErrorResponse(c, http.StatusConflict, "Plugin installation already in progress", err)
	}
	releaseOnReturn := true
	defer func() {
		if releaseOnReturn {
			release()
		}
	}()

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	containerModeEnabled, err := client.IsDeviceModeFeatureEnabled("container")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check container mode", err)
	}
	if !containerModeEnabled {
		return common.ErrorResponse(c, http.StatusUnprocessableEntity, "Container mode is not enabled on this device", nil)
	}

	containerPackageInstalled, err := client.IsPackageInstalled("container")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check container package", err)
	}
	if !containerPackageInstalled {
		return common.ErrorResponse(c, http.StatusUnprocessableEntity, "Container package is not installed or disabled", nil)
	}

	if _, err := client.GetContainer(req.ID); err == nil {
		return common.ErrorResponse(c, http.StatusConflict, "Plugin is already installed",
			fmt.Errorf("a container named %s already exists", req.ID))
	}

	registry, err := getCachedPluginRegistry(c.Request().Context())
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}
	if !registryHasPlugin(registry, req.ID) {
		return common.ErrorResponse(c, http.StatusNotFound, "Plugin not found in registry",
			fmt.Errorf("no plugin with id %s in the registry", req.ID))
	}

	task, err := pluginInstalls.start(req.ID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusConflict, "Plugin installation already in progress", err)
	}

	releaseOnReturn = false
	go func() {
		installPluginAsync(client, task)
		release()
	}()

	return common.SuccessResponse(c, http.StatusOK, "Plugin installation started", InstallPluginResponse{
		ID:       req.ID,
		PluginID: task.pluginID,
	})
}

// HandleGetPluginInstallStatus godoc
// @Summary Get plugin installation status
// @Description Returns the current phase of an in-progress or completed plugin
// @Description installation task.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param pluginId path string true "Plugin id passed to POST /api/plugin/install"
// @Produce json
// @Success 200 {object} common.Response{data=InstallStatusResponse}
// @Failure 404 {object} common.Response
// @Router /api/plugin/install/status/{pluginId} [get].
func HandleGetPluginInstallStatus(c echo.Context) error {
	pluginID := c.Param("pluginId")

	pluginInstalls.mu.RLock()
	task, ok := pluginInstalls.tasks[pluginID]
	pluginInstalls.mu.RUnlock()

	if !ok {
		return common.ErrorResponse(c, http.StatusNotFound, "Unknown installation task",
			fmt.Errorf("no installation task for plugin %s", pluginID))
	}

	return common.SuccessResponse(c, http.StatusOK, "Installation status retrieved", task.snapshot())
}

// HandleUpdatePlugin godoc
// @Summary Update an installed plugin
// @Description Checks the community registry's version for pluginId against the
// @Description version recorded in its container's comment; if the registry version
// @Description is newer, starts an async update: repulls the container's image from
// @Description the registry-declared image, restarts the container, then records the
// @Description new version in the container's comment. Poll
// @Description GET /api/plugin/update/status/{pluginId} for progress.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param pluginId path string true "Plugin id, which is also its container name"
// @Produce json
// @Success 200 {object} common.Response{data=UpdatePluginResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 422 {object} common.Response
// @Failure 500 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/plugin/update/{pluginId} [post].
func HandleUpdatePlugin(c echo.Context) error {
	pluginID := c.Param("pluginId")
	if pluginID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "plugin id is required", nil)
	}

	release, err := pluginLifecycles.acquire(pluginID, pluginLifecycleOpUpdate)
	if err != nil {
		return common.ErrorResponse(c, http.StatusConflict, "Plugin update already in progress", err)
	}
	releaseOnReturn := true
	defer func() {
		if releaseOnReturn {
			release()
		}
	}()

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()

	container, err := client.GetContainer(pluginID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Plugin is not installed", err)
	}

	manifest, err := fetchPluginManifest(ctx, pluginID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin manifest", err)
	}

	if !utils.IsNewerVersion(manifest.Version, container.Comment) {
		return common.ErrorResponse(c, http.StatusUnprocessableEntity, "Plugin is already up to date",
			fmt.Errorf("installed version %s is not older than registry version %s", container.Comment, manifest.Version))
	}

	task, err := pluginUpdates.start(pluginID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusConflict, "Plugin update already in progress", err)
	}

	releaseOnReturn = false
	go func() {
		updatePluginAsync(client, task, manifest)
		release()
	}()

	return common.SuccessResponse(c, http.StatusOK, "Plugin update started", UpdatePluginResponse{
		PluginID: pluginID,
	})
}

// HandleGetPluginUpdateStatus godoc
// @Summary Get plugin update status
// @Description Returns the current phase of an in-progress or completed plugin
// @Description update task.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param pluginId path string true "Plugin id passed to POST /api/plugin/update/{pluginId}"
// @Produce json
// @Success 200 {object} common.Response{data=UpdateStatusResponse}
// @Failure 404 {object} common.Response
// @Router /api/plugin/update/status/{pluginId} [get].
func HandleGetPluginUpdateStatus(c echo.Context) error {
	pluginID := c.Param("pluginId")

	pluginUpdates.mu.RLock()
	task, ok := pluginUpdates.tasks[pluginID]
	pluginUpdates.mu.RUnlock()

	if !ok {
		return common.ErrorResponse(c, http.StatusNotFound, "Unknown update task",
			fmt.Errorf("no update task for plugin %s", pluginID))
	}

	return common.SuccessResponse(c, http.StatusOK, "Update status retrieved", task.snapshot())
}

// HandleUninstallPlugin godoc
// @Summary Uninstall a plugin
// @Description Removes an installed plugin: runs the preUninstall script from its
// @Description manifest (if it names one), stops and removes its container, then
// @Description removes the mount lists and veth interface the manifest declares, and
// @Description deletes the plugin's volume directory (nasnet-panel/container-volumes/<pluginId>).
// @Description Cleanup steps that fail once the container is already gone are
// @Description reported in the response as warnings rather than failing the request.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Plugin id, which is also its container name"
// @Produce json
// @Success 200 {object} common.Response{data=UninstallPluginResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Failure 502 {object} common.Response
// @Router /api/plugin/plugin/{name} [delete].
func HandleUninstallPlugin(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "plugin name is required", nil)
	}

	// Reserved for the rest of this handler, which runs synchronously: an
	// install or update goroutine still creating/polling or repulling the
	// very container about to be removed (or vice versa, a new install/update
	// starting against a container this handler is mid-removal on) is
	// rejected until this uninstall fully completes and releases it.
	release, err := pluginLifecycles.acquire(name, pluginLifecycleOpUninstall)
	if err != nil {
		return common.ErrorResponse(c, http.StatusConflict, "Plugin uninstall already in progress", err)
	}
	defer release()

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()

	registry, err := getCachedPluginRegistry(ctx)
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}
	if !registryHasPlugin(registry, name) {
		return common.ErrorResponse(c, http.StatusNotFound, "Plugin not found in registry",
			fmt.Errorf("no plugin with id %s in the registry", name))
	}

	container, err := client.GetContainer(name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Plugin is not installed", err)
	}

	manifest, err := fetchPluginManifest(ctx, name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin manifest", err)
	}

	warnings := []string{}

	if manifest.Scripts.PreUninstall != "" {
		// A failing cleanup script must not block the uninstall, or a plugin
		// with a broken script could never be removed.
		settingsValues := map[string]string{}
		var settingsErr error
		if manifest.SettingsSchema != "" {
			var settingsSchema *SettingsSchema
			if settingsSchema, settingsErr = fetchPluginSettings(ctx, name, manifest.SettingsSchema); settingsErr == nil {
				settingsValues, settingsErr = settingsDefaults(settingsSchema)
			}
		}
		if settingsErr != nil {
			warnings = append(warnings, "pre-uninstall script skipped, failed to resolve plugin settings: "+settingsErr.Error())
			log.Printf("[plugin-uninstall %s] failed to resolve settings for pre-uninstall script: %v", name, settingsErr)
		} else if err := runPluginScript(ctx, client, name, manifest.Scripts.PreUninstall, settingsValues); err != nil {
			warnings = append(warnings, "pre-uninstall script failed: "+err.Error())
			log.Printf("[plugin-uninstall %s] pre-uninstall script failed: %v", name, err)
		}
	}

	if err := client.StopContainer(name); err != nil {
		log.Printf("[plugin-uninstall %s] failed to stop container: %v", name, err)
		// RouterOS rejects a stop on an already-stopped container, which is
		// nothing to report; only a container that looked alive is worth a warning.
		if container.Running || container.Healthy {
			warnings = append(warnings, "failed to stop container: "+err.Error())
		}
	}

	// RouterOS refuses to remove a container it hasn't finished stopping.
	time.Sleep(pluginUninstallStopDelay)

	if err := client.RemoveContainer(name); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove plugin container", err)
	}

	removedLists := make([]string, 0, len(manifest.Container.Mounts))
	seen := make(map[string]bool, len(manifest.Container.Mounts))
	for i := range manifest.Container.Mounts {
		listName := strings.TrimSpace(manifest.Container.Mounts[i].Name)
		if listName == "" || seen[listName] {
			continue // several mounts may share one list, which is removed whole
		}
		seen[listName] = true

		if err := client.RemoveContainerMount(listName); err != nil {
			warnings = append(warnings, "failed to remove mount list "+listName+": "+err.Error())
			log.Printf("[plugin-uninstall %s] failed to remove mount list %s: %v", name, listName, err)
			continue
		}
		removedLists = append(removedLists, listName)
	}

	removedVolumeDir, err := removePluginVolumeDir(client, name)
	if err != nil {
		warnings = append(warnings, "failed to remove plugin volume directory: "+err.Error())
		log.Printf("[plugin-uninstall %s] failed to remove volume directory: %v", name, err)
	}

	removedInterface := strings.TrimSpace(manifest.Container.Interface.Name)
	if removedInterface != "" {
		if err := client.RemoveBridgeMember(pluginContainersBridge, removedInterface); err != nil {
			warnings = append(warnings, "failed to remove veth interface from "+pluginContainersBridge+" bridge: "+err.Error())
			log.Printf("[plugin-uninstall %s] failed to remove bridge member: %v", name, err)
		}

		if err := client.RemoveVethInterface(removedInterface); err != nil {
			warnings = append(warnings, "failed to remove veth interface "+removedInterface+": "+err.Error())
			log.Printf("[plugin-uninstall %s] failed to remove veth interface %s: %v", name, removedInterface, err)
			removedInterface = ""
		}
	}

	message := "Plugin uninstalled"
	if len(warnings) > 0 {
		message = "Plugin uninstalled with warnings"
	}

	return common.SuccessResponse(c, http.StatusOK, message, UninstallPluginResponse{
		ID:         name,
		MountLists: removedLists,
		VolumeDir:  removedVolumeDir,
		Interface:  removedInterface,
		Warnings:   warnings,
	})
}
