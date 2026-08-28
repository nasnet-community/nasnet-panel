package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"nasnet-panel/pkg/proxy"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

const pluginRegistryURL = "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/main/plugins.json"

// pluginContainersBridge is the bridge every plugin's veth interface is
// attached to, protected from removal by the wizard's cleanup script, and
// assumed to already exist on the router by the time a plugin is installed.
const pluginContainersBridge = "containers"

const (
	pluginInstallPollInterval = 3 * time.Second
	pluginInstallTimeout      = 5 * time.Minute

	// Grace period between stopping a plugin's container and removing it, so
	// RouterOS has finished the stop before the remove is issued.
	pluginUninstallStopDelay = 2 * time.Second

	// Ceiling on a single registry fetch. Manifests, settings schemas and
	// scripts are a few KB each, so this is generous; it exists because an
	// install runs detached from any request, and a registry host that accepts
	// the connection then never finishes the response would otherwise leave the
	// install goroutine blocked forever. Its task would never reach a terminal
	// phase, and the plugin could not be installed again until the panel
	// restarts.
	pluginFetchTimeout = 30 * time.Second
)

// pluginHTTPClient fetches from the plugin registry. Deliberately not
// http.DefaultClient, whose Timeout is zero, meaning no bound at all on the
// whole exchange — dial, TLS, headers and body read included.
var pluginHTTPClient = &http.Client{Timeout: pluginFetchTimeout}

// pluginInstallPhase enumerates the stages of an async plugin installation,
// tracked in-process so GET /api/plugin/status/{pluginId} has something to
// report while the background goroutine runs independently of the request
// that started it.
type pluginInstallPhase string

const (
	pluginInstallPhasePreparing          pluginInstallPhase = "preparing"
	pluginInstallPhaseCreatingInterface  pluginInstallPhase = "creating_interface"
	pluginInstallPhaseCreatingMounts     pluginInstallPhase = "creating_mounts"
	pluginInstallPhaseRunningPreInstall  pluginInstallPhase = "running_pre_install_script"
	pluginInstallPhaseCreatingContainer  pluginInstallPhase = "creating_container"
	pluginInstallPhasePulling            pluginInstallPhase = "pulling"
	pluginInstallPhaseStartingContainer  pluginInstallPhase = "starting_container"
	pluginInstallPhaseRunningPostInstall pluginInstallPhase = "running_post_install_script"
	pluginInstallPhaseDone               pluginInstallPhase = "done"
	pluginInstallPhaseError              pluginInstallPhase = "error"
)

// pluginInstallTask tracks one in-flight (or completed) async installation,
// identified by the id of the plugin being installed.
type pluginInstallTask struct {
	mu          sync.RWMutex
	pluginID    string
	phase       pluginInstallPhase
	message     string
	startedAt   time.Time
	containerID string
	iface       string
}

func (t *pluginInstallTask) set(phase pluginInstallPhase, message string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.phase = phase
	t.message = message
}

func (t *pluginInstallTask) setContainer(containerID, iface string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.containerID = containerID
	t.iface = iface
}

// terminal reports whether the task has finished, one way or another.
func (t *pluginInstallTask) terminal() bool {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.phase == pluginInstallPhaseDone || t.phase == pluginInstallPhaseError
}

func (t *pluginInstallTask) snapshot() PluginInstallStatusResponse {
	t.mu.RLock()
	defer t.mu.RUnlock()

	return PluginInstallStatusResponse{
		PluginID:    t.pluginID,
		Phase:       string(t.phase),
		Message:     t.message,
		StartedAt:   t.startedAt.Format(time.RFC3339),
		ContainerID: t.containerID,
		Interface:   t.iface,
	}
}

// pluginInstallPool tracks every plugin installation task, keyed by plugin id.
// At most one install per plugin may be in flight, so a plugin id is enough to
// identify its task. Different plugins may install concurrently, and
// re-installing a plugin replaces its previous, finished task.
type pluginInstallPool struct {
	mu    sync.RWMutex
	tasks map[string]*pluginInstallTask
}

var pluginInstalls = &pluginInstallPool{tasks: make(map[string]*pluginInstallTask)}

// activeLocked reports whether pluginID has a non-terminal task in flight.
// Callers must already hold p.mu, since sync.RWMutex is not reentrant.
func (p *pluginInstallPool) activeLocked(pluginID string) bool {
	// A missing key yields a nil pointer, so the nil check doubles as the
	// "no such task" check.
	task := p.tasks[pluginID]
	return task != nil && !task.terminal()
}

// active reports whether pluginID is currently being installed.
func (p *pluginInstallPool) active(pluginID string) bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.activeLocked(pluginID)
}

// start registers a new task for pluginID, rejecting it if pluginID already
// has a non-terminal task in flight.
func (p *pluginInstallPool) start(pluginID string) (*pluginInstallTask, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.activeLocked(pluginID) {
		return nil, fmt.Errorf("plugin %s is already being installed", pluginID)
	}

	task := &pluginInstallTask{
		pluginID:  pluginID,
		phase:     pluginInstallPhasePreparing,
		message:   "starting install",
		startedAt: time.Now(),
	}
	p.tasks[pluginID] = task
	return task, nil
}

// HandleListPlugins godoc
// @Summary List available plugins
// @Description Fetches the community plugin registry and returns the list of available
// @Description plugins, each annotated with installed/running status from the router's
// @Description own containers (a plugin is installed as a container named after its id).
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]PluginInfo}
// @Failure 502 {object} Response
// @Router /api/plugin/plugins [get].
func HandleListPlugins(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	registry, err := fetchPluginRegistry(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}

	containers, err := client.ListContainers()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list containers", err)
	}

	return SuccessResponse(c, http.StatusOK, "Plugins retrieved", finalizePlugins(registry.Plugins, containers))
}

// HandleViewPlugin godoc
// @Summary Proxy a plugin's web UI (test mode: base-tag injection only)
// @Description Proxies a plugin's own web UI, resolving its target from the plugin's manifest:
// @Description the container interface's address (its IP, without the subnet) as host, and the
// @Description containerPort of the first entry in container.ports whose description starts
// @Description with "web" (case-insensitive) as port.
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

	manifest, err := fetchPluginManifest(c.Request().Context(), pluginID)
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin manifest", err)
	}

	host, _, _ := strings.Cut(manifest.Container.Interface.Address, "/")
	if host == "" {
		return ErrorResponse(c, http.StatusInternalServerError, "Plugin manifest has no interface address", nil)
	}

	var webPort *PluginManifestPort
	for i := range manifest.Container.Ports {
		if strings.HasPrefix(strings.ToLower(manifest.Container.Ports[i].Description), "web") {
			webPort = &manifest.Container.Ports[i]
			break
		}
	}
	if webPort == nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Plugin manifest has no web port", nil)
	}

	target, err := url.Parse(fmt.Sprintf("http://%s:%d", host, webPort.ContainerPort))
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Invalid plugin target URL", err)
	}

	baseURL := strings.TrimSuffix(c.Request().URL.Path, c.Param("*"))
	baseURL = strings.TrimSuffix(baseURL, "/")

	proxyHandler, err := proxy.NewSubpathProxy(baseURL, target)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to set up plugin proxy", err)
	}

	return proxyHandler(c)
}

// HandleInstallPlugin godoc
// @Summary Install a plugin
// @Description Starts an async install of a plugin from the community registry:
// @Description creates the veth interface its manifest specifies (if not already
// @Description present), creates its mounts, and adds its container, then waits for
// @Description the image to finish pulling. Poll GET /api/plugin/status/{pluginId} for
// @Description progress. At most one install per plugin id may run at a time;
// @Description different plugins may install concurrently.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Param request body InstallPluginRequest true "Plugin to install"
// @Success 200 {object} Response{data=InstallPluginResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 502 {object} Response
// @Router /api/plugin/install [post].
func HandleInstallPlugin(c echo.Context) error {
	var req InstallPluginRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.ID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "plugin id is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if _, err := client.GetContainer(req.ID); err == nil {
		return ErrorResponse(c, http.StatusConflict, "Plugin is already installed",
			fmt.Errorf("a container named %s already exists", req.ID))
	}

	registry, err := fetchPluginRegistry(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}
	if !registryHasPlugin(registry, req.ID) {
		return ErrorResponse(c, http.StatusNotFound, "Plugin not found in registry",
			fmt.Errorf("no plugin with id %s in the registry", req.ID))
	}

	task, err := pluginInstalls.start(req.ID)
	if err != nil {
		return ErrorResponse(c, http.StatusConflict, "Plugin installation already in progress", err)
	}

	go installPluginAsync(client, task)

	return SuccessResponse(c, http.StatusOK, "Plugin installation started", InstallPluginResponse{
		ID:       req.ID,
		PluginID: task.pluginID,
	})
}

// installPluginAsync performs the actual install steps for task, updating its
// phase/message as it progresses. Runs detached from the HTTP request that
// triggered it, so it takes a background context rather than the request's,
// which would be cancelled the moment that request returned. Registry fetches
// are bounded by pluginHTTPClient's own timeout instead of by this context.
func installPluginAsync(client *routeros.Client, task *pluginInstallTask) {
	pluginID := task.pluginID
	ctx := context.Background()

	manifest, err := fetchPluginManifest(ctx, pluginID)
	if err != nil {
		task.set(pluginInstallPhaseError, "failed to fetch plugin manifest: "+err.Error())
		log.Printf("[plugin-install %s] failed to fetch manifest: %v", pluginID, err)
		return
	}

	resources, err := client.GetResourceInfo()
	if err != nil {
		task.set(pluginInstallPhaseError, "failed to check router architecture: "+err.Error())
		log.Printf("[plugin-install %s] failed to get resource info: %v", pluginID, err)
		return
	}
	if !supportsArchitecture(manifest.Architectures, resources.Architecture) {
		task.set(pluginInstallPhaseError, fmt.Sprintf("router architecture %s not supported (plugin supports %s)",
			resources.Architecture, strings.Join(manifest.Architectures, ", ")))
		return
	}

	iface := manifest.Container.Interface
	if iface.Name == "" {
		task.set(pluginInstallPhaseError, "plugin manifest is missing a container interface name")
		return
	}

	// Settings defaults resolve "{{settings.<key>}}" placeholders (e.g. in env
	// values); a manifest with no settings schema simply has none to resolve.
	settingsValues := map[string]string{}
	if manifest.SettingsSchema != "" {
		settingsSchema, err := fetchPluginSettings(ctx, pluginID, manifest.SettingsSchema)
		if err != nil {
			task.set(pluginInstallPhaseError, "failed to fetch plugin settings schema: "+err.Error())
			log.Printf("[plugin-install %s] failed to fetch settings: %v", pluginID, err)
			return
		}
		settingsValues, err = settingsDefaults(settingsSchema)
		if err != nil {
			task.set(pluginInstallPhaseError, "failed to resolve plugin settings defaults: "+err.Error())
			log.Printf("[plugin-install %s] failed to resolve settings defaults: %v", pluginID, err)
			return
		}
	}

	task.set(pluginInstallPhaseCreatingInterface, "creating veth interface "+iface.Name)
	if _, err := client.GetInterface(iface.Name); err != nil {
		if _, err := client.AddVethInterface(routeros.VethConfig{
			Name:    iface.Name,
			Address: iface.Address,
			Gateway: iface.Gateway,
		}); err != nil {
			task.set(pluginInstallPhaseError, "failed to create veth interface: "+err.Error())
			log.Printf("[plugin-install %s] failed to create veth interface: %v", pluginID, err)
			return
		}
	}

	onBridge, err := client.BridgeMemberExists(pluginContainersBridge, iface.Name)
	if err != nil {
		task.set(pluginInstallPhaseError, "failed to check "+pluginContainersBridge+" bridge membership: "+err.Error())
		log.Printf("[plugin-install %s] failed to check bridge membership: %v", pluginID, err)
		return
	}
	if !onBridge {
		if err := client.AddBridgeMember(pluginContainersBridge, iface.Name, pluginID); err != nil {
			task.set(pluginInstallPhaseError, "failed to add veth interface to "+pluginContainersBridge+" bridge: "+err.Error())
			log.Printf("[plugin-install %s] failed to add veth interface to bridge: %v", pluginID, err)
			return
		}
	}

	task.set(pluginInstallPhaseCreatingMounts, "creating container mounts")
	mountListNames := make([]string, 0, len(manifest.Container.Mounts))
	for _, mount := range manifest.Container.Mounts {
		name := strings.TrimSpace(mount.Name)
		if name == "" {
			continue // nothing to reference from MountLists without a list name
		}
		exists, err := client.ContainerMountExists(name)
		if err != nil {
			task.set(pluginInstallPhaseError, "failed to check container mount "+name+": "+err.Error())
			log.Printf("[plugin-install %s] failed to check mount %s: %v", pluginID, name, err)
			return
		}
		if !exists {
			if _, err := client.AddContainerMount(name, mount.Src, mount.Dst); err != nil {
				task.set(pluginInstallPhaseError, "failed to create container mount "+name+": "+err.Error())
				log.Printf("[plugin-install %s] failed to create mount %s: %v", pluginID, name, err)
				return
			}
		}
		mountListNames = append(mountListNames, name)
	}

	if manifest.Scripts.PreInstall != "" {
		task.set(pluginInstallPhaseRunningPreInstall, "running pre-install script")
		if err := runPluginScript(ctx, client, pluginID, manifest.Scripts.PreInstall); err != nil {
			task.set(pluginInstallPhaseError, "pre-install script failed: "+err.Error())
			log.Printf("[plugin-install %s] pre-install script failed: %v", pluginID, err)
			return
		}
	}

	task.set(pluginInstallPhaseCreatingContainer, "creating container "+pluginID)
	containerID, err := client.AddContainer(routeros.ContainerConfig{
		Name:        pluginID,
		Interface:   iface.Name,
		RootDir:     "/" + pluginID,
		RemoteImage: manifest.Container.Image,
		Env:         joinEnvPairs(resolveEnvPlaceholders(manifest.Container.Env, settingsValues)),
		MountLists:  strings.Join(mountListNames, ","),
		Logging:     true,
		StartOnBoot: false,
		Comment:     manifest.Version,
	})
	if err != nil {
		task.set(pluginInstallPhaseError, "failed to create plugin container: "+err.Error())
		log.Printf("[plugin-install %s] failed to create container: %v", pluginID, err)
		return
	}
	task.setContainer(containerID, iface.Name)

	task.set(pluginInstallPhasePulling, "pulling "+manifest.Container.Image)

	deadline := time.Now().Add(pluginInstallTimeout)
	for time.Now().Before(deadline) {
		time.Sleep(pluginInstallPollInterval)

		info, err := client.GetContainer(pluginID)
		if err != nil {
			task.set(pluginInstallPhaseError, "lost track of container during pull: "+err.Error())
			log.Printf("[plugin-install %s] failed to poll container: %v", pluginID, err)
			return
		}

		if info.DownloadExtractFailed {
			msg := info.About
			if msg == "" {
				msg = "image pull failed"
			}
			task.set(pluginInstallPhaseError, msg)
			log.Printf("[plugin-install %s] pull failed: %s", pluginID, msg)
			return
		}

		if info.DownloadingExtracting {
			task.set(pluginInstallPhasePulling, "pulling "+info.RemoteImage)
			continue
		}

		startPluginContainer(ctx, client, task, pluginID, manifest.Scripts.PostInstall)
		return
	}

	task.set(pluginInstallPhaseError, "timed out waiting for image pull to finish")
}

// startPluginContainer starts a freshly pulled plugin container, waits for it
// to report itself running, then runs the plugin's post-install script (if
// any) and marks the task done. Adding a container only downloads/extracts
// its image; RouterOS never starts a container automatically, so this is a
// required step, not an optional nicety.
func startPluginContainer(ctx context.Context, client *routeros.Client, task *pluginInstallTask, pluginID, postInstallScript string) {
	task.set(pluginInstallPhaseStartingContainer, "starting container "+pluginID)
	if err := client.StartContainer(pluginID); err != nil {
		task.set(pluginInstallPhaseError, "failed to start container: "+err.Error())
		log.Printf("[plugin-install %s] failed to start container: %v", pluginID, err)
		return
	}

	deadline := time.Now().Add(pluginInstallTimeout)
	for {
		info, err := client.GetContainer(pluginID)
		if err != nil {
			task.set(pluginInstallPhaseError, "lost track of container while starting: "+err.Error())
			log.Printf("[plugin-install %s] failed to poll container while starting: %v", pluginID, err)
			return
		}
		if info.Running || info.Healthy {
			break
		}
		if !time.Now().Before(deadline) {
			task.set(pluginInstallPhaseError, "timed out waiting for container to start")
			return
		}
		time.Sleep(pluginInstallPollInterval)
	}

	if postInstallScript != "" {
		task.set(pluginInstallPhaseRunningPostInstall, "running post-install script")
		if err := runPluginScript(ctx, client, pluginID, postInstallScript); err != nil {
			task.set(pluginInstallPhaseError, "post-install script failed: "+err.Error())
			log.Printf("[plugin-install %s] post-install script failed: %v", pluginID, err)
			return
		}
	}

	task.set(pluginInstallPhaseDone, "plugin installed")
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
// @Success 200 {object} Response{data=PluginInstallStatusResponse}
// @Failure 404 {object} Response
// @Router /api/plugin/status/{pluginId} [get].
func HandleGetPluginInstallStatus(c echo.Context) error {
	pluginID := c.Param("pluginId")

	pluginInstalls.mu.RLock()
	task, ok := pluginInstalls.tasks[pluginID]
	pluginInstalls.mu.RUnlock()

	if !ok {
		return ErrorResponse(c, http.StatusNotFound, "Unknown installation task",
			fmt.Errorf("no installation task for plugin %s", pluginID))
	}

	return SuccessResponse(c, http.StatusOK, "Installation status retrieved", task.snapshot())
}

// HandleUninstallPlugin godoc
// @Summary Uninstall a plugin
// @Description Removes an installed plugin: runs the preUninstall script from its
// @Description manifest (if it names one), stops and removes its container, then
// @Description removes the mount lists and veth interface the manifest declares.
// @Description Cleanup steps that fail once the container is already gone are
// @Description reported in the response as warnings rather than failing the request.
// @Tags Plugin
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Plugin id, which is also its container name"
// @Produce json
// @Success 200 {object} Response{data=UninstallPluginResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Failure 502 {object} Response
// @Router /api/plugin/plugin/{name} [delete].
func HandleUninstallPlugin(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "plugin name is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()

	registry, err := fetchPluginRegistry(ctx)
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin registry", err)
	}
	if !registryHasPlugin(registry, name) {
		return ErrorResponse(c, http.StatusNotFound, "Plugin not found in registry",
			fmt.Errorf("no plugin with id %s in the registry", name))
	}

	container, err := client.GetContainer(name)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "Plugin is not installed", err)
	}

	// An install goroutine for this plugin is still creating and polling the
	// very container about to be removed, so let it finish first.
	if pluginInstalls.active(name) {
		return ErrorResponse(c, http.StatusConflict, "Plugin installation is still in progress",
			fmt.Errorf("plugin %s is currently being installed", name))
	}

	manifest, err := fetchPluginManifest(ctx, name)
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch plugin manifest", err)
	}

	warnings := []string{}

	if manifest.Scripts.PreUninstall != "" {
		// A failing cleanup script must not block the uninstall, or a plugin
		// with a broken script could never be removed.
		if err := runPluginScript(ctx, client, name, manifest.Scripts.PreUninstall); err != nil {
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
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to remove plugin container", err)
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

	return SuccessResponse(c, http.StatusOK, message, UninstallPluginResponse{
		ID:         name,
		MountLists: removedLists,
		Interface:  removedInterface,
		Warnings:   warnings,
	})
}

// fetchPluginJSON fetches url and decodes its body as JSON into target.
func fetchPluginJSON(ctx context.Context, url string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := pluginHTTPClient.Do(req)
	if err != nil {
		return err
	}
	if resp == nil {
		return fmt.Errorf("empty response fetching %s", url)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s returned %d", url, resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

// runPluginScript fetches one of the RouterOS scripts a plugin's manifest names
// and executes it on the router. An empty or whitespace-only script file is a
// no-op: ExecuteScriptString rejects an empty string, so a plugin shipping a
// placeholder script file would otherwise fail the whole operation.
func runPluginScript(ctx context.Context, client *routeros.Client, pluginID, scriptPath string) error {
	script, err := fetchPluginScript(ctx, pluginID, scriptPath)
	if err != nil {
		return fmt.Errorf("failed to fetch %s: %w", scriptPath, err)
	}

	if strings.TrimSpace(script) == "" {
		return nil
	}

	return client.ExecuteScriptString(script)
}

// fetchPluginScript fetches the raw text of a RouterOS script file (e.g. a
// preInstall/postInstall entry from a plugin's manifest.json), named relative
// to the plugin's directory in the registry repository.
func fetchPluginScript(ctx context.Context, id, scriptPath string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, pluginAssetsBaseURL+"/"+id+"/"+scriptPath, http.NoBody)
	if err != nil {
		return "", err
	}

	resp, err := pluginHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	if resp == nil {
		return "", fmt.Errorf("empty response fetching %s", scriptPath)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s returned %d", scriptPath, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func fetchPluginRegistry(ctx context.Context) (*PluginRegistry, error) {
	var registry PluginRegistry
	if err := fetchPluginJSON(ctx, pluginRegistryURL, &registry); err != nil {
		return nil, err
	}
	return &registry, nil
}

func fetchPluginManifest(ctx context.Context, id string) (*PluginManifest, error) {
	var manifest PluginManifest
	if err := fetchPluginJSON(ctx, pluginAssetsBaseURL+"/"+id+"/manifest.json", &manifest); err != nil {
		return nil, err
	}
	return &manifest, nil
}

// fetchPluginSettings fetches a plugin's settings schema, at the filename the
// plugin's own manifest names via its settingsSchema field (typically
// "settings.json", but not assumed to always be).
func fetchPluginSettings(ctx context.Context, id, settingsSchema string) (*PluginSettingsSchema, error) {
	var schema PluginSettingsSchema
	if err := fetchPluginJSON(ctx, pluginAssetsBaseURL+"/"+id+"/"+settingsSchema, &schema); err != nil {
		return nil, err
	}
	return &schema, nil
}
