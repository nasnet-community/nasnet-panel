// Package plugin holds the plugin API group handlers.
package plugin

import (
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// pluginCatalogURL is the community plugin registry: plugins.json at its root and
// each plugin's files under plugins/<id>. PLUGIN_CATALOG_URL points a dev router at
// a local copy instead; PLUGIN_ICON_URL does the same for the icons the browser loads.
var pluginCatalogURL = catalogURL(os.Getenv("PLUGIN_CATALOG_URL"))

func catalogURL(override string) string {
	if u := strings.TrimRight(strings.TrimSpace(override), "/"); u != "" {
		return u
	}
	return "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/main"
}

var (
	pluginRegistryURL = pluginCatalogURL + "/plugins.json"
	pluginFilesURL    = pluginCatalogURL + "/plugins"
)

// pluginContainersBridge is the bridge every plugin's veth interface is
// attached to, protected from removal by the wizard's cleanup script, and
// assumed to already exist on the router by the time a plugin is installed.
const pluginContainersBridge = "containers"

// pluginViewTargets caches each plugin's resolved proxy target, keyed by
// plugin id, across HandleViewPlugin calls. Entries never expire: a plugin's
// container address and web port don't change without a reinstall, and a
// reinstalled plugin is expected to restart the panel or otherwise pick up a
// fresh manifest fetch some other way.
var (
	pluginViewTargets   = map[string]pluginViewTarget{}
	pluginViewTargetsMu sync.RWMutex
)

// pluginRegistryCache holds the most recent plugin registry fetched by
// HandleListPlugins, reused by HandleListInstalledPlugins so it isn't forced
// to fetch the registry itself when a fresh one is already available.
var (
	pluginRegistryCache   *Registry
	pluginRegistryCacheMu sync.RWMutex
)

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

	// How long a plugin update's repull poll waits for ImageID/ConfigJSON to
	// confirm a changed image once the container has settled into Stopped,
	// before giving up on that confirmation and proceeding anyway.
	pluginUpdateImageChangeGrace = 15 * time.Second
)

// pluginHTTPClient fetches from the plugin registry. Deliberately not
// http.DefaultClient, whose Timeout is zero, meaning no bound at all on the
// whole exchange — dial, TLS, headers and body read included.
var pluginHTTPClient = &http.Client{Timeout: pluginFetchTimeout}

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

var pluginInstalls = &pluginInstallPool{tasks: make(map[string]*pluginInstallTask)}

const (
	pluginUpdatePhaseCheckingVersion   pluginUpdatePhase = "checking_version"
	pluginUpdatePhaseStoppingContainer pluginUpdatePhase = "stopping_container"
	pluginUpdatePhaseRepulling         pluginUpdatePhase = "repulling"
	pluginUpdatePhaseStartingContainer pluginUpdatePhase = "starting_container"
	pluginUpdatePhaseUpdatingComment   pluginUpdatePhase = "updating_comment"
	pluginUpdatePhaseDone              pluginUpdatePhase = "done"
	// A terminal phase, like Done and Error: the repull's pull flags cleared
	// and the container settled, but RouterOS never reported a changed
	// ImageID/ConfigJSON to confirm the image actually changed. The
	// container is started again regardless, so the plugin doesn't stay
	// down over an unconfirmed check, but its comment is left untouched
	// rather than recording manifest.Version against a repull that was
	// never confirmed to have replaced anything.
	pluginUpdatePhaseUnconfirmed pluginUpdatePhase = "unconfirmed"
	pluginUpdatePhaseError       pluginUpdatePhase = "error"
)

var pluginUpdates = &pluginUpdatePool{tasks: make(map[string]*pluginUpdateTask)}

const (
	pluginLifecycleOpInstall   pluginLifecycleOp = "installed"
	pluginLifecycleOpUpdate    pluginLifecycleOp = "updated"
	pluginLifecycleOpUninstall pluginLifecycleOp = "uninstalled"
	// Held by the wizard while it runs the plugin's post-wizard script.
	pluginLifecycleOpPostWizard pluginLifecycleOp = "restored after the wizard"
)

var pluginLifecycles = &pluginLifecycle{busy: make(map[string]pluginLifecycleOp)}

// Base URL the browser loads each plugin's icon from, keyed by plugin id: the public
// registry, unless PLUGIN_ICON_URL points a dev browser at a local copy. It is apart
// from PLUGIN_CATALOG_URL because the browser and the router reach that copy differently.
var pluginAssetsBaseURL = iconURL(os.Getenv("PLUGIN_ICON_URL"))

func iconURL(override string) string {
	if u := strings.TrimRight(strings.TrimSpace(override), "/"); u != "" {
		return u
	}
	return "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/refs/heads/main/plugins"
}
