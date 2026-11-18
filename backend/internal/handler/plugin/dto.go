package plugin

import (
	"sync"
	"time"
)

// pluginViewTarget is the host/port HandleViewPlugin resolves from a plugin's
// manifest, cached in pluginViewTargets so it doesn't have to be re-fetched
// on every proxied request.
type pluginViewTarget struct {
	Host string
	Port int
}

// pluginInstallPhase enumerates the stages of an async plugin installation,
// tracked in-process so GET /api/plugin/install/status/{pluginId} has something to
// report while the background goroutine runs independently of the request
// that started it.
type pluginInstallPhase string

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

// pluginInstallPool tracks every plugin installation task, keyed by plugin id.
// At most one install per plugin may be in flight, so a plugin id is enough to
// identify its task. Different plugins may install concurrently, and
// re-installing a plugin replaces its previous, finished task.
type pluginInstallPool struct {
	mu    sync.RWMutex
	tasks map[string]*pluginInstallTask
}

// pluginUpdatePhase enumerates the stages of an async plugin update, tracked
// in-process so GET /api/plugin/update/status/{pluginId} has something to
// report while the background goroutine runs independently of the request
// that started it.
type pluginUpdatePhase string

// pluginUpdateTask tracks one in-flight (or completed) async update,
// identified by the id of the plugin being updated.
type pluginUpdateTask struct {
	mu        sync.RWMutex
	pluginID  string
	phase     pluginUpdatePhase
	message   string
	startedAt time.Time
	version   string
}

// pluginUpdatePool tracks every plugin update task, keyed by plugin id. Kept
// separate from pluginInstalls so an in-flight install and an in-flight
// update for the same plugin id are never conflated with one another.
type pluginUpdatePool struct {
	mu    sync.RWMutex
	tasks map[string]*pluginUpdateTask
}

// pluginLifecycleOp names one of the three operations pluginLifecycles
// serializes: an install, update or uninstall in progress for a plugin id.
type pluginLifecycleOp string

// pluginLifecycle serializes install/update/uninstall operations per plugin
// id: at most one of the three may be in flight for a given plugin at a
// time. The pluginInstalls and pluginUpdates pools each guard against a
// second instance of their own operation, but that alone leaves install,
// update and uninstall free to run concurrently against each other, since
// each is tracked by a different pool (or, for uninstall, not tracked at
// all). A single reservation, acquired before any of the three does its
// real work and released only once that operation reaches a terminal state
// (or, for uninstall, completes), closes that gap.
type pluginLifecycle struct {
	mu   sync.Mutex
	busy map[string]pluginLifecycleOp
}

// Info represents a single plugin entry from the community plugin registry.
type Info struct {
	ID               string `json:"id"`
	Version          string `json:"version"`
	Name             string `json:"name"`
	Author           string `json:"author"`
	Category         string `json:"category"`
	Tagline          string `json:"tagline"`
	URL              string `json:"url"`
	CanInstall       bool   `json:"canInstall"`
	Visible          bool   `json:"visible"`
	Icon             string `json:"icon"`
	Installed        bool   `json:"installed"`
	InstalledVersion string `json:"installedVersion,omitempty"`
	UpdateAvailable  bool   `json:"updateAvailable"`
	Running          bool   `json:"running"`
	Installing       bool   `json:"installing"`
	Failed           bool   `json:"failed"`
	Note             string `json:"note,omitempty"`
}

// ListResponse is the response for GET /api/plugin/plugins.
type ListResponse struct {
	ContainerSupport bool   `json:"containerSupport"`
	Plugins          []Info `json:"plugins"`
}

// InstalledPluginInfo is one entry in the GET /api/plugin/installed response.
type InstalledPluginInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Registry is the top-level structure of plugins.json fetched from the
// community plugin registry repository.
type Registry struct {
	RegistryVersion int    `json:"registryVersion"`
	Plugins         []Info `json:"plugins"`
}

// ManifestInterface describes the veth interface a plugin's container
// is attached to.
type ManifestInterface struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Gateway string `json:"gateway"`
}

// ManifestMount describes one directory a plugin's container mounts.
// Name groups this entry under a /container/mounts list of the same name.
type ManifestMount struct {
	Name string `json:"name"`
	Src  string `json:"src"`
	Dst  string `json:"dst"`
}

// ManifestPort describes one port a plugin's container publishes.
// HostPort may be given in the manifest as either a fixed JSON number (e.g.
// 443) or a string, often a "{{settings.<key>}}" placeholder resolved against
// the plugin's settings at install time; both forms decode to a string here.
type ManifestPort struct {
	Protocol      string `json:"protocol"`
	ContainerPort int    `json:"containerPort"`
	HostPort      string `json:"hostPort"`
	Description   string `json:"description"`
}

// ManifestContainer describes the container a plugin installs.
type ManifestContainer struct {
	Image     string            `json:"image"`
	Interface ManifestInterface `json:"interface"`
	Env       map[string]string `json:"env"`
	Mounts    []ManifestMount   `json:"mounts"`
	Ports     []ManifestPort    `json:"ports"`
}

// ManifestScripts names RouterOS scripts run at various install and
// uninstall stages. Paths are relative to the plugin's directory in the
// registry repository.
type ManifestScripts struct {
	PreInstall   string `json:"preInstall"`
	PostInstall  string `json:"postInstall"`
	PreUninstall string `json:"preUninstall"`
}

// Manifest is the per-plugin manifest.json fetched from the community
// plugin registry.
type Manifest struct {
	ID             string            `json:"id"`
	Name           string            `json:"name"`
	Version        string            `json:"version"`
	Author         string            `json:"author"`
	License        string            `json:"license"`
	Website        string            `json:"website"`
	Category       string            `json:"category"`
	Tagline        string            `json:"tagline"`
	Description    string            `json:"description"`
	Icon           string            `json:"icon"`
	Architectures  []string          `json:"architectures"`
	Container      ManifestContainer `json:"container"`
	Scripts        ManifestScripts   `json:"scripts"`
	SettingsSchema string            `json:"settingsSchema"`
}

// SettingField describes one configurable setting for a plugin. Default
// may be a string or a number depending on Type, hence the untyped value.
type SettingField struct {
	Key         string   `json:"key"`
	Label       string   `json:"label"`
	Type        string   `json:"type"`
	Options     []string `json:"options,omitempty"`
	Default     any      `json:"default,omitempty"`
	Required    bool     `json:"required"`
	Description string   `json:"description"`
	Generate    string   `json:"generate,omitempty"`
}

// SettingsSchema is the per-plugin settings.json fetched from the
// community plugin registry.
type SettingsSchema struct {
	Settings []SettingField `json:"settings"`
}

// InstallPluginRequest is the request body for POST /api/plugin/install.
type InstallPluginRequest struct {
	ID string `json:"id"`
}

// InstallPluginResponse is the response for POST /api/plugin/install.
// Installation runs asynchronously; poll GET /api/plugin/install/status/{pluginId} for
// progress and the resulting container details.
type InstallPluginResponse struct {
	ID       string `json:"id"`
	PluginID string `json:"pluginId"`
}

// UninstallPluginResponse is the response for DELETE /api/plugin/plugin/{name}.
// Warnings collects cleanup steps that failed after the plugin's container was
// already removed: the plugin is gone either way, but its mount lists or veth
// interface may have been left behind.
type UninstallPluginResponse struct {
	ID         string   `json:"id"`
	MountLists []string `json:"mountLists,omitempty"`
	VolumeDir  string   `json:"volumeDir,omitempty"`
	Interface  string   `json:"interface,omitempty"`
	Warnings   []string `json:"warnings,omitempty"`
}

// InstallStatusResponse is the response for GET /api/plugin/install/status/{pluginId}.
type InstallStatusResponse struct {
	PluginID    string `json:"pluginId"`
	Phase       string `json:"phase"` // preparing, creating_interface, creating_mounts, running_pre_install_script, creating_container, pulling, starting_container, running_post_install_script, done, error
	Message     string `json:"message,omitempty"`
	StartedAt   string `json:"startedAt,omitempty"`
	ContainerID string `json:"containerId,omitempty"`
	Interface   string `json:"interface,omitempty"`
}

// UpdatePluginResponse is the response for POST /api/plugin/update/{pluginId}.
// Updating runs asynchronously; poll GET /api/plugin/update/status/{pluginId}
// for progress and the resulting version.
type UpdatePluginResponse struct {
	PluginID string `json:"pluginId"`
}

// UpdateStatusResponse is the response for GET /api/plugin/update/status/{pluginId}.
type UpdateStatusResponse struct {
	PluginID  string `json:"pluginId"`
	Phase     string `json:"phase"` // checking_version, stopping_container, repulling, starting_container, updating_comment, done, unconfirmed, error
	Message   string `json:"message,omitempty"`
	StartedAt string `json:"startedAt,omitempty"`
	Version   string `json:"version,omitempty"`
}

// EnvVar is one entry in the GET /api/plugin/envs/{pluginId} response.
// Changeable reports whether Key can be edited: env-current reports every
// variable actually in effect, including ones pulled in from resolved
// /container/envs lists, but only a variable set directly on the container's
// own env property can be changed (e.g. via EditContainer).
type EnvVar struct {
	Key        string `json:"key"`
	Value      string `json:"value"`
	Changeable bool   `json:"changeable"`
}

// SetPluginEnvVarRequest is the request body for PUT /api/plugin/env/{pluginId}.
type SetPluginEnvVarRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}
