package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/netip"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

// cachePluginRegistry stores registry as the shared plugin registry cache.
func cachePluginRegistry(registry *Registry) {
	pluginRegistryCacheMu.Lock()
	defer pluginRegistryCacheMu.Unlock()
	pluginRegistryCache = registry
}

// cachedPluginRegistry returns the shared plugin registry cache, or nil if
// it hasn't been populated yet.
func cachedPluginRegistry() *Registry {
	pluginRegistryCacheMu.RLock()
	defer pluginRegistryCacheMu.RUnlock()
	return pluginRegistryCache
}

// getCachedPluginRegistry returns the cached plugin registry, fetching and caching
// a fresh one if the cache is empty.
func getCachedPluginRegistry(ctx context.Context) (*Registry, error) {
	if registry := cachedPluginRegistry(); registry != nil {
		return registry, nil
	}

	registry, err := fetchPluginRegistry(ctx)
	if err != nil {
		return nil, err
	}
	cachePluginRegistry(registry)
	return registry, nil
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

func (t *pluginInstallTask) snapshot() InstallStatusResponse {
	t.mu.RLock()
	defer t.mu.RUnlock()

	return InstallStatusResponse{
		PluginID:    t.pluginID,
		Phase:       string(t.phase),
		Message:     t.message,
		StartedAt:   t.startedAt.Format(time.RFC3339),
		ContainerID: t.containerID,
		Interface:   t.iface,
	}
}

// activeLocked reports whether pluginID has a non-terminal task in flight.
// Callers must already hold p.mu, since sync.RWMutex is not reentrant.
func (p *pluginInstallPool) activeLocked(pluginID string) bool {
	// A missing key yields a nil pointer, so the nil check doubles as the
	// "no such task" check.
	task := p.tasks[pluginID]
	return task != nil && !task.terminal()
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

func (t *pluginUpdateTask) set(phase pluginUpdatePhase, message string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.phase = phase
	t.message = message
}

func (t *pluginUpdateTask) setVersion(version string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.version = version
}

// terminal reports whether the task has finished, one way or another.
func (t *pluginUpdateTask) terminal() bool {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.phase == pluginUpdatePhaseDone || t.phase == pluginUpdatePhaseError || t.phase == pluginUpdatePhaseUnconfirmed
}

func (t *pluginUpdateTask) snapshot() UpdateStatusResponse {
	t.mu.RLock()
	defer t.mu.RUnlock()

	return UpdateStatusResponse{
		PluginID:  t.pluginID,
		Phase:     string(t.phase),
		Message:   t.message,
		StartedAt: t.startedAt.Format(time.RFC3339),
		Version:   t.version,
	}
}

// activeLocked reports whether pluginID has a non-terminal task in flight.
// Callers must already hold p.mu, since sync.RWMutex is not reentrant.
func (p *pluginUpdatePool) activeLocked(pluginID string) bool {
	task := p.tasks[pluginID]
	return task != nil && !task.terminal()
}

// start registers a new task for pluginID, rejecting it if pluginID already
// has a non-terminal task in flight.
func (p *pluginUpdatePool) start(pluginID string) (*pluginUpdateTask, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.activeLocked(pluginID) {
		return nil, fmt.Errorf("plugin %s is already being updated", pluginID)
	}

	task := &pluginUpdateTask{
		pluginID:  pluginID,
		phase:     pluginUpdatePhaseCheckingVersion,
		message:   "checking for update",
		startedAt: time.Now(),
	}
	p.tasks[pluginID] = task
	return task, nil
}

// acquire reserves pluginID for op, rejecting the reservation if another
// lifecycle operation already holds it. The returned release func must be
// called exactly once, when op reaches a terminal state, to free pluginID
// for its next lifecycle operation.
func (l *pluginLifecycle) acquire(pluginID string, op pluginLifecycleOp) (func(), error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if existing, ok := l.busy[pluginID]; ok {
		return nil, fmt.Errorf("plugin %s is currently being %s", pluginID, existing)
	}

	l.busy[pluginID] = op
	return func() {
		l.mu.Lock()
		defer l.mu.Unlock()
		delete(l.busy, pluginID)
	}, nil
}

// installPluginAsync performs the actual install steps for task, updating its
// phase/message as it progresses. Runs detached from the HTTP request that
// triggered it, so it takes a background context rather than the request's,
// which would be cancelled the moment that request returned. Registry fetches
// are bounded by pluginHTTPClient's own timeout instead of by this context.
func installPluginAsync(client *routeros.Client, task *pluginInstallTask) {
	pluginID := task.pluginID
	ctx := context.Background()

	manifest, err := fetchInstallManifest(ctx, pluginID)
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
	if err := checkMinRouterOS(manifest.MinRouterOS, resources.Version); err != nil {
		task.set(pluginInstallPhaseError, err.Error())
		log.Printf("[plugin-install %s] %v", pluginID, err)
		return
	}

	// Checked before anything is created on the router, so a bad manifest leaves nothing behind.
	containerOpts, err := parseContainerOptions(manifest.Container)
	if err != nil {
		task.set(pluginInstallPhaseError, "plugin manifest has an invalid container setting: "+err.Error())
		log.Printf("[plugin-install %s] invalid container settings: %v", pluginID, err)
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

	// The wizard runs it later with no registry to ask, so a copy is kept on the router.
	postWizardScript := ""
	if manifest.Scripts.PostWizard != "" {
		script, err := fetchPluginScript(ctx, pluginID, manifest.Scripts.PostWizard)
		if err != nil {
			task.set(pluginInstallPhaseError, "failed to fetch post-wizard script: "+err.Error())
			log.Printf("[plugin-install %s] failed to fetch post-wizard script: %v", pluginID, err)
			return
		}
		postWizardScript = resolveSettingsPlaceholders(script, settingsValues)
	}

	task.set(pluginInstallPhaseCreatingInterface, "creating veth interface "+iface.Name)
	if _, err := client.GetInterface(iface.Name); err != nil {
		if _, err := client.AddVethInterface(routeros.VethConfig{
			Name:    iface.Name,
			Address: iface.Address.RouterOS(),
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

	// Before anything can run from the veth, so its first packet already meets
	// its class's rule. The pre-install script comes after, and sees them.
	if iface.Address.usesExitClasses() {
		task.set(pluginInstallPhaseCreatingInterface, "setting up the containers' exit classes")
		if err := ensureExitClasses(client); err != nil {
			task.set(pluginInstallPhaseError, "failed to set up the containers' exit classes: "+err.Error())
			log.Printf("[plugin-install %s] failed to set up the exit classes: %v", pluginID, err)
			return
		}
	}
	if postWizardScript != "" {
		if err := savePluginPostWizard(client, pluginID, postWizardScript); err != nil {
			task.set(pluginInstallPhaseError, "failed to keep the post-wizard script on the router: "+err.Error())
			log.Printf("[plugin-install %s] failed to save the post-wizard script: %v", pluginID, err)
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
			volumeDir, err := preparePluginVolumeDir(client, pluginID, mount.Src)
			if err != nil {
				task.set(pluginInstallPhaseError, "failed to prepare container volume directory for mount "+name+": "+err.Error())
				log.Printf("[plugin-install %s] failed to prepare volume dir for mount %s: %v", pluginID, name, err)
				return
			}
			if _, err := client.AddContainerMount(name, volumeDir, mount.Dst); err != nil {
				task.set(pluginInstallPhaseError, "failed to create container mount "+name+": "+err.Error())
				log.Printf("[plugin-install %s] failed to create mount %s: %v", pluginID, name, err)
				return
			}
		}
		mountListNames = append(mountListNames, name)
	}

	if manifest.Scripts.PreInstall != "" {
		task.set(pluginInstallPhaseRunningPreInstall, "running pre-install script")
		if err := runPluginScript(ctx, client, pluginID, manifest.Scripts.PreInstall, settingsValues); err != nil {
			task.set(pluginInstallPhaseError, "pre-install script failed: "+err.Error())
			log.Printf("[plugin-install %s] pre-install script failed: %v", pluginID, err)
			return
		}
	}

	task.set(pluginInstallPhaseCreatingContainer, "creating container "+pluginID)
	rootDir, err := PreparePluginRootDir(client, pluginID)
	if err != nil {
		task.set(pluginInstallPhaseError, "failed to prepare plugin container directory: "+err.Error())
		log.Printf("[plugin-install %s] failed to prepare root dir: %v", pluginID, err)
		return
	}
	containerID, err := client.AddContainer(routeros.ContainerConfig{
		Name:        pluginID,
		Interface:   iface.Name,
		RootDir:     rootDir,
		RemoteImage: manifest.Container.Image,
		Env:         joinEnvPairs(resolveEnvPlaceholders(manifest.Container.Env, settingsValues)),
		MountLists:  strings.Join(mountListNames, ","),
		MemoryHigh:  containerOpts.MemoryHigh,
		MemoryMax:   containerOpts.MemoryMax,
		CPUList:     containerOpts.CPUList,
		User:        containerOpts.User,
		Devices:     containerOpts.Devices,
		Logging:     true,
		StartOnBoot: true,
		Comment:     manifest.Version,

		AutoRestartInterval: containerOpts.AutoRestartInterval,
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

		startPluginContainer(ctx, client, task, pluginID, manifest.Scripts.PostInstall, settingsValues)
		return
	}

	task.set(pluginInstallPhaseError, "timed out waiting for image pull to finish")
}

// startPluginContainer starts a freshly pulled plugin container, waits for it
// to report itself running, then runs the plugin's post-install script (if
// any) and marks the task done. Adding a container only downloads/extracts
// its image; RouterOS never starts a container automatically, so this is a
// required step, not an optional nicety.
func startPluginContainer(ctx context.Context, client *routeros.Client, task *pluginInstallTask, pluginID, postInstallScript string, settingsValues map[string]string) {
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
		if err := runPluginScript(ctx, client, pluginID, postInstallScript, settingsValues); err != nil {
			task.set(pluginInstallPhaseError, "post-install script failed: "+err.Error())
			log.Printf("[plugin-install %s] post-install script failed: %v", pluginID, err)
			return
		}
	}

	task.set(pluginInstallPhaseDone, "plugin installed")
}

// updatePluginAsync performs the actual update steps for task, updating its
// phase/message as it progresses. The manifest passed in is the one
// HandleUpdatePlugin already fetched and validated as newer than the
// installed version, reused here rather than re-fetched. Runs detached from
// the HTTP request that triggered it, in its own goroutine.
func updatePluginAsync(client *routeros.Client, task *pluginUpdateTask, manifest *Manifest) {
	pluginID := task.pluginID
	task.setVersion(manifest.Version)

	before, err := client.GetContainer(pluginID)
	if err != nil {
		task.set(pluginUpdatePhaseError, "failed to inspect container before repull: "+err.Error())
		log.Printf("[plugin-update %s] failed to get container: %v", pluginID, err)
		return
	}
	previousImageID := before.ImageID

	if before.Running || before.Healthy {
		task.set(pluginUpdatePhaseStoppingContainer, "stopping container "+pluginID)
		if err := client.StopContainer(pluginID); err != nil {
			task.set(pluginUpdatePhaseError, "failed to stop container: "+err.Error())
			log.Printf("[plugin-update %s] failed to stop container: %v", pluginID, err)
			return
		}

		stopDeadline := time.Now().Add(pluginInstallTimeout)
		for {
			info, err := client.GetContainer(pluginID)
			if err != nil {
				task.set(pluginUpdatePhaseError, "lost track of container while stopping: "+err.Error())
				log.Printf("[plugin-update %s] failed to poll container while stopping: %v", pluginID, err)
				return
			}
			if info.Stopped {
				break
			}
			if !time.Now().Before(stopDeadline) {
				task.set(pluginUpdatePhaseError, "timed out waiting for container to stop")
				return
			}
			time.Sleep(pluginInstallPollInterval)
		}
	}

	task.set(pluginUpdatePhaseRepulling, "repulling "+manifest.Container.Image)
	if err := client.RepullContainer(pluginID, manifest.Container.Image, ""); err != nil {
		task.set(pluginUpdatePhaseError, "failed to repull plugin image: "+err.Error())
		log.Printf("[plugin-update %s] failed to repull image: %v", pluginID, err)
		return
	}

	// Once the pull flags clear and the container has settled into Stopped,
	// ImageID/ConfigJSON would confirm the repull actually replaced the
	// image — but a mutable tag (e.g. ":main") can legitimately repull to a
	// digest RouterOS already has cached, in which case neither ever
	// changes even though the repull genuinely succeeded. So that check is
	// only given a grace window to confirm a change before this proceeds
	// anyway, rather than blocking forever on it.
	var settledAt time.Time

	deadline := time.Now().Add(pluginInstallTimeout)
	for time.Now().Before(deadline) {
		time.Sleep(pluginInstallPollInterval)

		info, err := client.GetContainer(pluginID)
		if err != nil {
			task.set(pluginUpdatePhaseError, "lost track of container during repull: "+err.Error())
			log.Printf("[plugin-update %s] failed to poll container: %v", pluginID, err)
			return
		}

		if info.DownloadExtractFailed {
			msg := info.About
			if msg == "" {
				msg = "image repull failed"
			}
			task.set(pluginUpdatePhaseError, msg)
			log.Printf("[plugin-update %s] repull failed: %s", pluginID, msg)
			return
		}

		if info.DownloadingExtracting {
			task.set(pluginUpdatePhaseRepulling, "repulling "+info.RemoteImage)
			continue
		}

		// RouterOS clears the pulling flag as soon as the transfer finishes but
		// the container settles into Stopped a moment later; without waiting
		// for it too, StartContainer below can race a container RouterOS
		// hasn't finished settling from the repull.
		if !info.Stopped {
			continue
		}

		imageChanged := info.ImageID != previousImageID || info.ConfigJSON != before.ConfigJSON
		if !imageChanged {
			if settledAt.IsZero() {
				settledAt = time.Now()
			}
			if time.Since(settledAt) < pluginUpdateImageChangeGrace {
				continue
			}
		}

		task.set(pluginUpdatePhaseStartingContainer, "starting container "+pluginID)
		if err := client.StartContainer(pluginID); err != nil {
			task.set(pluginUpdatePhaseError, "failed to start container: "+err.Error())
			log.Printf("[plugin-update %s] failed to start container: %v", pluginID, err)
			return
		}

		if !imageChanged {
			// The repull's own pull/failure flags never reported a problem, but
			// RouterOS also never reported a changed ImageID/ConfigJSON, so
			// there is nothing to confirm the container's image actually
			// changed. Recording manifest.Version here would claim a repull
			// this code could not verify, so the container is started again
			// (the plugin must not stay down over an unconfirmed check) but
			// its comment is left untouched.
			task.set(pluginUpdatePhaseUnconfirmed,
				"container restarted but could not confirm the image changed; version not recorded")
			log.Printf("[plugin-update %s] repull settled without a confirmed image change after %s; container restarted, comment left untouched",
				pluginID, pluginUpdateImageChangeGrace)
			return
		}

		task.set(pluginUpdatePhaseUpdatingComment, "recording updated version")
		if err := client.EditContainer(pluginID, map[string]string{"comment": manifest.Version}); err != nil {
			task.set(pluginUpdatePhaseError, "failed to record updated version: "+err.Error())
			log.Printf("[plugin-update %s] failed to update container comment: %v", pluginID, err)
			return
		}

		task.set(pluginUpdatePhaseDone, "plugin updated")
		return
	}

	task.set(pluginUpdatePhaseError, "timed out waiting for image repull to finish")
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

// pluginStoragePrefix returns the storage the panel's own container lives on,
// as a path prefix ("disk1/" or "" for internal storage), read from its
// root-dir. Internal storage is assumed when the panel container isn't found or
// uses a different layout.
func pluginStoragePrefix(client *routeros.Client) string {
	panel, err := client.GetContainer(common.AppContainerName)
	if err != nil {
		return ""
	}
	rootDir := strings.TrimPrefix(panel.RootDir, "/")
	if idx := strings.Index(rootDir, routeros.NasnetPanelDir+"/containers/"); idx >= 0 {
		return rootDir[:idx]
	}
	return ""
}

// preparePluginVolumeDir returns <storage>/nasnet-panel/container-volumes/<pluginID>/<src>,
// the host directory backing a plugin mount whose manifest path is src, creating
// every directory along the way.
func preparePluginVolumeDir(client *routeros.Client, pluginID, src string) (string, error) {
	dir := pluginStoragePrefix(client) + routeros.NasnetPanelDir
	dirs := []string{dir}
	for _, segment := range append([]string{"container-volumes", pluginID}, strings.Split(strings.Trim(src, "/"), "/")...) {
		if segment == "" || segment == "." {
			continue
		}
		if segment == ".." {
			return "", fmt.Errorf("mount path %q must not contain \"..\"", src)
		}
		dir += "/" + segment
		dirs = append(dirs, dir)
	}

	for _, d := range dirs {
		if err := client.EnsureDir(d); err != nil {
			return "", err
		}
	}
	return dir, nil
}

// removePluginVolumeDir deletes <storage>/nasnet-panel/container-volumes/<pluginID>
// along with everything in it, returning its path, or "" when it didn't exist.
func removePluginVolumeDir(client *routeros.Client, pluginID string) (string, error) {
	dir := pluginStoragePrefix(client) + routeros.NasnetPanelDir + "/container-volumes/" + pluginID
	exists, err := client.FileExists(dir)
	if err != nil || !exists {
		return "", err
	}
	if err := client.DeleteFile(dir); err != nil {
		return "", err
	}
	return dir, nil
}

// PreparePluginRootDir returns <storage>/nasnet-panel/containers/<pluginID>,
// creating its parent directories first. <storage> is the one the panel's own
// container lives on (read from its root-dir), or the router's internal
// storage when the panel container isn't found or uses a different layout.
func PreparePluginRootDir(client *routeros.Client, pluginID string) (string, error) {
	panelDir := pluginStoragePrefix(client) + routeros.NasnetPanelDir
	containersDir := panelDir + "/containers"
	for _, dir := range []string{panelDir, containersDir} {
		if err := client.EnsureDir(dir); err != nil {
			return "", err
		}
	}
	return containersDir + "/" + pluginID, nil
}

// runPluginScript fetches one of the RouterOS scripts a plugin's manifest names
// and executes it on the router. An empty or whitespace-only script file is a
// no-op: ExecuteScriptString rejects an empty string, so a plugin shipping a
// placeholder script file would otherwise fail the whole operation. Any
// "{{settings.<key>}}" placeholders are replaced from settingsValues first.
func runPluginScript(ctx context.Context, client *routeros.Client, pluginID, scriptPath string, settingsValues map[string]string) error {
	script, err := fetchPluginScript(ctx, pluginID, scriptPath)
	if err != nil {
		return fmt.Errorf("failed to fetch %s: %w", scriptPath, err)
	}

	if strings.TrimSpace(script) == "" {
		return nil
	}

	return client.ExecuteScriptString(resolveSettingsPlaceholders(script, settingsValues))
}

// fetchPluginScript fetches the raw text of a RouterOS script file (e.g. a
// preInstall/postInstall entry from a plugin's manifest.json), named relative
// to the plugin's directory in the registry repository.
func fetchPluginScript(ctx context.Context, id, scriptPath string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, pluginFilesURL+"/"+id+"/"+scriptPath, http.NoBody)
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

func fetchPluginRegistry(ctx context.Context) (*Registry, error) {
	var registry Registry
	if err := fetchPluginJSON(ctx, pluginRegistryURL, &registry); err != nil {
		return nil, err
	}
	return &registry, nil
}

func fetchPluginManifest(ctx context.Context, id string) (*Manifest, error) {
	var manifest Manifest
	if err := fetchPluginJSON(ctx, pluginFilesURL+"/"+id+"/manifest.json", &manifest); err != nil {
		return nil, err
	}
	return &manifest, nil
}

// fetchInstallManifest is fetchPluginManifest for an install or an update,
// which apply the manifest and so refuse one the panel can't apply. An
// uninstall, or the plugin list, still works whatever the manifest says.
func fetchInstallManifest(ctx context.Context, id string) (*Manifest, error) {
	manifest, err := fetchPluginManifest(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := manifest.validate(); err != nil {
		return nil, fmt.Errorf("manifest of %s: %w", id, err)
	}
	return manifest, nil
}

// fetchPluginSettings fetches a plugin's settings schema, at the filename the
// plugin's own manifest names via its settingsSchema field (typically
// "settings.json", but not assumed to always be).
func fetchPluginSettings(ctx context.Context, id, settingsSchema string) (*SettingsSchema, error) {
	var schema SettingsSchema
	if err := fetchPluginJSON(ctx, pluginFilesURL+"/"+id+"/"+settingsSchema, &schema); err != nil {
		return nil, err
	}
	return &schema, nil
}

// UnmarshalJSON allows HostPort to be given as either a JSON string or a bare
// JSON number, normalizing either form to a string.
func (p *ManifestPort) UnmarshalJSON(data []byte) error {
	type alias ManifestPort
	aux := &struct {
		HostPort json.RawMessage `json:"hostPort"`
		*alias
	}{alias: (*alias)(p)}

	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}

	if len(aux.HostPort) == 0 {
		return nil
	}

	var asString string
	if err := json.Unmarshal(aux.HostPort, &asString); err == nil {
		p.HostPort = asString
		return nil
	}

	var asNumber json.Number
	if err := json.Unmarshal(aux.HostPort, &asNumber); err != nil {
		return fmt.Errorf("hostPort must be a string or number: %w", err)
	}
	p.HostPort = asNumber.String()
	return nil
}

// finalizePlugins fills in fields plugins.json itself doesn't carry before a
// plugin list is returned to the client: Icon (derived from each entry's id),
// and Installed/Running/Installing/Failed/Note by matching each plugin's id
// against the name of a container currently on the router (a plugin is
// installed as a container named after its id). Running is true if the
// container reports itself as running or as healthy — RouterOS surfaces these
// as independent flags, and a container can be healthy-checked without ever
// setting the plain running flag depending on firmware version, so either is
// treated as "running" here. Installing/Failed mirror the container's
// DownloadingExtracting/DownloadExtractFailed flags directly. Note carries
// the container's .about text (e.g. a pull error, or in-progress
// status) whenever RouterOS has one to report.
func finalizePlugins(plugins []Info, containers []routeros.ContainerInfo) []Info {
	byName := make(map[string]*routeros.ContainerInfo, len(containers))
	for i := range containers {
		byName[containers[i].Name] = &containers[i]
	}

	result := make([]Info, len(plugins))
	for i := range plugins {
		result[i] = plugins[i]
		result[i].Icon = pluginAssetsBaseURL + "/" + result[i].ID + "/icon.svg"

		if container, ok := byName[result[i].ID]; ok {
			result[i].Installed = true
			result[i].InstalledVersion = container.Comment
			result[i].UpdateAvailable = utils.IsNewerVersion(result[i].Version, container.Comment)
			result[i].Running = container.Running || container.Healthy
			result[i].Installing = container.DownloadingExtracting
			result[i].Failed = container.DownloadExtractFailed
			if container.About != "" {
				result[i].Note = container.About
			}
		}
	}
	return result
}

func filterVisiblePlugins(plugins []Info) []Info {
	if strings.Contains(buildinfo.Version, "dev") {
		return plugins
	}
	visible := make([]Info, 0, len(plugins))
	for i := range plugins {
		if plugins[i].Visible {
			visible = append(visible, plugins[i])
		}
	}
	return visible
}

// registryHasPlugin reports whether id is a plugin known to the registry.
func registryHasPlugin(registry *Registry, id string) bool {
	for i := range registry.Plugins {
		if registry.Plugins[i].ID == id {
			return true
		}
	}
	return false
}

// joinEnvPairs renders a plugin manifest's env map as bare `KEY=VALUE,KEY2=VALUE2`
// pairs, sorted by key for deterministic output (Go map iteration order is
// otherwise randomized). A key with an empty value is written as just the
// bare key, with no trailing "=".
func joinEnvPairs(env map[string]string) string {
	if len(env) == 0 {
		return ""
	}

	keys := make([]string, 0, len(env))
	for k := range env {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(env))
	for _, k := range keys {
		if v := env[k]; v != "" {
			pairs = append(pairs, k+"="+v)
		} else {
			pairs = append(pairs, k)
		}
	}
	return strings.Join(pairs, ",")
}

// parseEnvPairs parses envCurrent, a RouterOS container's `KEY=VALUE,KEY2=VALUE2`
// env-current string (falling back to env if envCurrent is empty), into an
// ordered list of EnvVar, one per comma-separated entry, with Changeable set
// for each key also present in env. A bare entry with no "=" (a key written
// with no value) becomes an EnvVar with an empty Value. Order is preserved
// from the source string rather than sorted, since it reflects however
// RouterOS itself reports it.
func parseEnvPairs(envCurrent, env string) []EnvVar {
	changeable := envKeySet(env)

	source := envCurrent
	if source == "" {
		source = env
	}
	if source == "" {
		return []EnvVar{}
	}

	entries := strings.Split(source, ",")
	vars := make([]EnvVar, 0, len(entries))
	for _, entry := range entries {
		key, value, _ := strings.Cut(entry, "=")
		vars = append(vars, EnvVar{Key: key, Value: value, Changeable: changeable[key]})
	}
	return vars
}

// envKeySet parses a RouterOS container's env `KEY=VALUE,KEY2=VALUE2` string
// into a set of just its keys, for membership checks.
func envKeySet(env string) map[string]bool {
	keys := map[string]bool{}
	if env == "" {
		return keys
	}
	for _, entry := range strings.Split(env, ",") {
		key, _, _ := strings.Cut(entry, "=")
		keys[key] = true
	}
	return keys
}

// envToMap parses a RouterOS container's env `KEY=VALUE,KEY2=VALUE2` string
// into a map keyed by key, so PUT /api/plugin/env/{pluginId} can add or
// overwrite one entry and re-render the whole string with joinEnvPairs.
func envToMap(env string) map[string]string {
	values := map[string]string{}
	if env == "" {
		return values
	}
	for _, entry := range strings.Split(env, ",") {
		key, value, _ := strings.Cut(entry, "=")
		values[key] = value
	}
	return values
}

// settingsDefaults renders each setting's default value as a string, keyed by
// its key, for substituting "{{settings.<key>}}" placeholders found elsewhere
// in a plugin's manifest. A field with no default but "generate":"uuid" gets
// a freshly generated UUID v4 instead; any other field with neither resolves
// to an empty string, leaving unresolved-looking placeholders as a visible
// signal of a manifest/settings mismatch rather than silently failing.
func settingsDefaults(schema *SettingsSchema) (map[string]string, error) {
	defaults := make(map[string]string, len(schema.Settings))
	for i := range schema.Settings {
		field := &schema.Settings[i]
		switch {
		case field.Default != nil:
			defaults[field.Key] = fmt.Sprintf("%v", field.Default)
		case field.Generate == "uuid":
			id, err := utils.GenerateUUIDv4()
			if err != nil {
				return nil, fmt.Errorf("failed to generate value for setting %s: %w", field.Key, err)
			}
			defaults[field.Key] = id
		default:
			defaults[field.Key] = ""
		}
	}
	return defaults, nil
}

// resolveSettingsPlaceholders replaces every "{{settings.<key>}}" placeholder
// in value with defaults[key], leaving placeholders for unknown keys as-is.
func resolveSettingsPlaceholders(value string, defaults map[string]string) string {
	for key, val := range defaults {
		value = strings.ReplaceAll(value, "{{settings."+key+"}}", val)
	}
	return value
}

// resolveEnvPlaceholders returns a copy of env with every value passed through
// resolveSettingsPlaceholders.
func resolveEnvPlaceholders(env, defaults map[string]string) map[string]string {
	resolved := make(map[string]string, len(env))
	for k, v := range env {
		resolved[k] = resolveSettingsPlaceholders(v, defaults)
	}
	return resolved
}

// supportsArchitecture reports whether a plugin manifest's architectures list
// includes the router's CPU architecture. RouterOS's own architecture-name
// (from GetResourceInfo) uses "x86" for Intel/AMD devices where manifests use
// the OCI-style "amd64" for the same platform; "arm"/"arm64" already match
// between the two, so only that one name needs normalizing before comparing.
func supportsArchitecture(manifestArchitectures []string, routerArch string) bool {
	normalized := routerArch
	if routerArch == "x86" {
		normalized = "amd64"
	}

	for _, arch := range manifestArchitectures {
		if arch == normalized {
			return true
		}
	}
	return false
}

// pluginKeepData caches each plugin's manifest keepDataOnUninstall flag, keyed
// by plugin id and registry version, so the plugin list (polled every few
// seconds) only fetches a manifest again after the plugin has been updated.
var (
	pluginKeepData   = map[string]bool{}
	pluginKeepDataMu sync.Mutex
)

// fillKeepDataOnUninstall sets KeepDataOnUninstall on every installed plugin
// from its manifest, which the registry entry doesn't carry. A manifest that
// can't be fetched leaves the flag as is and is tried again on the next list.
func fillKeepDataOnUninstall(ctx context.Context, plugins []Info) {
	for i := range plugins {
		if !plugins[i].Installed {
			continue
		}

		key := plugins[i].ID + "@" + plugins[i].Version
		pluginKeepDataMu.Lock()
		keep, cached := pluginKeepData[key]
		pluginKeepDataMu.Unlock()

		if !cached {
			manifest, err := fetchPluginManifest(ctx, plugins[i].ID)
			if err != nil {
				log.Printf("[plugin-list %s] failed to fetch manifest for keepDataOnUninstall: %v", plugins[i].ID, err)
				continue
			}
			keep = manifest.KeepDataOnUninstall

			pluginKeepDataMu.Lock()
			pluginKeepData[key] = keep
			pluginKeepDataMu.Unlock()
		}
		plugins[i].KeepDataOnUninstall = keep
	}
}

// keepDataParam reads the optional keepData query parameter: nil when it's
// absent, its value otherwise. Anything but true or false is an error, so a
// typo can't end up deleting data.
func keepDataParam(c echo.Context) (*bool, error) {
	var keep bool
	switch c.QueryParam("keepData") {
	case "":
		return nil, nil
	case "true":
		keep = true
	case "false":
	default:
		return nil, errors.New("keepData must be true or false")
	}
	return &keep, nil
}

// keepPluginData reports whether uninstalling leaves the plugin's data folder in
// place. A keepData from the request wins; without one the manifest decides, so
// a plugin that asks to keep its data is safe from a client that never sends it.
func keepPluginData(manifest *Manifest, keepData *bool) bool {
	if keepData != nil {
		return *keepData
	}
	return manifest.KeepDataOnUninstall
}

// containerOptions is a manifest container's optional settings once checked,
// in the form routeros.ContainerConfig takes them. A zero value means the
// manifest left that setting out.
type containerOptions struct {
	MemoryHigh          int64
	MemoryMax           int64
	CPUList             string
	User                string
	Devices             string
	AutoRestartInterval string
}

// minContainerMemoryMax is the least RouterOS accepts for memory-max.
const minContainerMemoryMax = 1 << 20

var (
	memorySizePattern      = regexp.MustCompile(`^(\d+)([kKmMgG]?)$`)
	cpuListPattern         = regexp.MustCompile(`^cpu\d{1,3}(,cpu\d{1,3})*$`)
	userNamePattern        = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_.-]{0,31}$`)
	deviceNamePattern      = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:/+-]*$`)
	restartIntervalPattern = regexp.MustCompile(`^(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?$`)
)

// parseContainerOptions checks the optional settings of a manifest's container
// and converts them for routeros.ContainerConfig. Doing it up front means a
// typo is reported by field name, where RouterOS would only refuse the whole
// container.
func parseContainerOptions(c ManifestContainer) (containerOptions, error) {
	var opts containerOptions
	var err error

	if opts.MemoryHigh, err = parseMemorySize(c.MemoryHigh); err != nil {
		return opts, fmt.Errorf("memoryHigh: %w", err)
	}
	if opts.MemoryMax, err = parseMemorySize(c.MemoryMax); err != nil {
		return opts, fmt.Errorf("memoryMax: %w", err)
	}
	if opts.MemoryMax > 0 && opts.MemoryMax < minContainerMemoryMax {
		return opts, fmt.Errorf("memoryMax: %q is below the 1M RouterOS accepts", c.MemoryMax)
	}
	if opts.MemoryHigh > 0 && opts.MemoryMax > 0 && opts.MemoryHigh > opts.MemoryMax {
		return opts, errors.New("memoryHigh must not be larger than memoryMax")
	}
	if opts.CPUList, err = parseCPUList(c.CPUList); err != nil {
		return opts, fmt.Errorf("cpuList: %w", err)
	}
	if opts.User, err = parseContainerUser(c.User); err != nil {
		return opts, fmt.Errorf("user: %w", err)
	}
	if opts.Devices, err = parseDevices(c.Devices); err != nil {
		return opts, fmt.Errorf("devices: %w", err)
	}
	if opts.AutoRestartInterval, err = parseRestartInterval(c.AutoRestartInterval); err != nil {
		return opts, fmt.Errorf("autoRestartInterval: %w", err)
	}
	return opts, nil
}

// parseMemorySize turns "256M", "1G", "512k" or a plain byte count into bytes,
// with 1024-based units. An empty value is not set and gives 0.
func parseMemorySize(value string) (int64, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, nil
	}

	m := memorySizePattern.FindStringSubmatch(value)
	if m == nil {
		return 0, fmt.Errorf("%q is not a size, use bytes or a number with a K, M or G suffix such as 256M", value)
	}
	multiplier := map[string]int64{"": 1, "K": 1 << 10, "M": 1 << 20, "G": 1 << 30}[strings.ToUpper(m[2])]

	n, err := strconv.ParseInt(m[1], 10, 64)
	if err != nil || n > math.MaxInt64/multiplier {
		return 0, fmt.Errorf("%q is too large", value)
	}
	if n == 0 {
		return 0, fmt.Errorf("%q must be more than zero, leave the field out for no limit", value)
	}
	return n * multiplier, nil
}

// parseCPUList checks a RouterOS cpu-list, which names its cores "cpu0",
// "cpu1" and so on rather than numbering them.
func parseCPUList(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value != "" && !cpuListPattern.MatchString(value) {
		return "", fmt.Errorf("%q is not a CPU list, use core names such as cpu0 or cpu0,cpu1", value)
	}
	return value, nil
}

// parseContainerUser checks user[:group], where each part is a name or a
// numeric id.
func parseContainerUser(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", nil
	}

	user, group, hasGroup := strings.Cut(value, ":")
	if !validUserPart(user) || (hasGroup && !validUserPart(group)) {
		return "", fmt.Errorf("%q is not a user, use user[:group] with names or numeric ids such as 1000:1000", value)
	}
	return value, nil
}

func validUserPart(part string) bool {
	if part != "" && part[0] >= '0' && part[0] <= '9' {
		_, err := strconv.ParseUint(part, 10, 32)
		return err == nil
	}
	return userNamePattern.MatchString(part)
}

// parseDevices joins the manifest's device names into the comma-separated
// list RouterOS takes. Which names exist depends on the router, so only their
// shape is checked here.
func parseDevices(devices []string) (string, error) {
	names := make([]string, 0, len(devices))
	for _, device := range devices {
		device = strings.TrimSpace(device)
		if !deviceNamePattern.MatchString(device) {
			return "", fmt.Errorf("%q is not a device name, use one RouterOS lists such as serial0", device)
		}
		names = append(names, device)
	}
	return strings.Join(names, ","), nil
}

// parseRestartInterval checks a RouterOS time such as "30s", "5m" or "1h30m".
func parseRestartInterval(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", nil
	}

	if !restartIntervalPattern.MatchString(value) {
		return "", fmt.Errorf("%q is not a time, use a number with a unit such as 30s, 5m or 1h30m", value)
	}
	// Nothing left once the zeros and unit letters are gone means a zero time.
	if strings.Trim(value, "0wdhms") == "" {
		return "", fmt.Errorf("%q must be more than zero, leave the field out for no restart", value)
	}
	return value, nil
}

// UnmarshalJSON accepts a string or a list of strings.
func (a *Addresses) UnmarshalJSON(data []byte) error {
	var one string
	if err := json.Unmarshal(data, &one); err == nil {
		if strings.TrimSpace(one) == "" {
			*a = nil // the same as leaving the field out
			return nil
		}
		*a = splitAddresses([]string{one})
		return nil
	}

	var many []string
	if err := json.Unmarshal(data, &many); err != nil {
		return errors.New("must be an address string or a list of address strings")
	}
	*a = splitAddresses(many)
	return nil
}

// splitAddresses flattens comma-separated entries and trims each address. A
// blank one is kept so that validation can name it.
func splitAddresses(entries []string) Addresses {
	var addresses Addresses
	for _, entry := range entries {
		for _, address := range strings.Split(entry, ",") {
			addresses = append(addresses, strings.TrimSpace(address))
		}
	}
	return addresses
}

// Primary is the container's own address, with its prefix length.
func (a Addresses) Primary() string {
	if len(a) == 0 {
		return ""
	}
	return a[0]
}

// RouterOS renders the list as /interface/veth takes it.
func (a Addresses) RouterOS() string {
	return strings.Join(a, ",")
}

// validate checks what a manifest says about the router: the veth's addresses
// and the RouterOS floor. It runs as the manifest is fetched, so a bad one is
// refused before anything is built from it.
func (m *Manifest) validate() error {
	if err := validateVethAddresses(m.Container.Interface.Address); err != nil {
		return fmt.Errorf("container.interface.address: %w", err)
	}
	if m.MinRouterOS != "" {
		if _, err := routeros.ParseVersion(m.MinRouterOS); err != nil {
			return fmt.Errorf("minRouterOS: %w", err)
		}
	}
	return nil
}

// validateVethAddresses checks that each address is an IP with its prefix
// length, which RouterOS insists on, and that none is listed twice.
func validateVethAddresses(addresses Addresses) error {
	seen := make(map[netip.Addr]bool, len(addresses))
	for _, address := range addresses {
		if address == "" {
			return errors.New("the list has an empty entry, a stray comma perhaps")
		}
		prefix, err := netip.ParsePrefix(address)
		if err != nil {
			return fmt.Errorf("%q is not an address with its prefix length, such as 192.168.50.16/24", address)
		}
		if seen[prefix.Addr()] {
			return fmt.Errorf("%s is listed twice", prefix.Addr())
		}
		seen[prefix.Addr()] = true
		if err := validateExitClassAddress(prefix); err != nil {
			return err
		}
	}
	return nil
}

// checkMinRouterOS refuses a router older than the manifest's minRouterOS. A
// version it can't read is refused too: letting it through would hand the plugin
// to a router it may not work on.
func checkMinRouterOS(minVersion, routerVersion string) error {
	if minVersion == "" {
		return nil
	}
	need, err := routeros.ParseVersion(minVersion)
	if err != nil {
		return fmt.Errorf("minRouterOS: %w", err)
	}
	have, err := routeros.ParseVersion(routerVersion)
	if err != nil {
		return fmt.Errorf("can't tell which RouterOS the router runs: %w", err)
	}
	if have.Compare(need) < 0 {
		return fmt.Errorf("this plugin needs RouterOS %s or newer and the router runs %s: update RouterOS, then install it again", need, have)
	}
	return nil
}
