package handler

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// Base URL hosting per-plugin assets (such as the icon and manifest) in the
// community plugin registry repository, keyed by plugin id.
const pluginAssetsBaseURL = "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/refs/heads/main/plugins"

// PluginInfo represents a single plugin entry from the community plugin registry.
type PluginInfo struct {
	ID         string `json:"id"`
	Version    string `json:"version"`
	Name       string `json:"name"`
	Author     string `json:"author"`
	Category   string `json:"category"`
	Tagline    string `json:"tagline"`
	URL        string `json:"url"`
	CanInstall bool   `json:"canInstall"`
	Icon       string `json:"icon"`
	Installed  bool   `json:"installed"`
	Running    bool   `json:"running"`
	Installing bool   `json:"installing"`
	Failed     bool   `json:"failed"`
	Note       string `json:"note,omitempty"`
}

// InstalledPluginInfo is one entry in the GET /api/plugin/installed response.
type InstalledPluginInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// PluginRegistry is the top-level structure of plugins.json fetched from the
// community plugin registry repository.
type PluginRegistry struct {
	RegistryVersion int          `json:"registryVersion"`
	Plugins         []PluginInfo `json:"plugins"`
}

// PluginManifestInterface describes the veth interface a plugin's container
// is attached to.
type PluginManifestInterface struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Gateway string `json:"gateway"`
}

// PluginManifestMount describes one directory a plugin's container mounts.
// Name groups this entry under a /container/mounts list of the same name.
type PluginManifestMount struct {
	Name string `json:"name"`
	Src  string `json:"src"`
	Dst  string `json:"dst"`
}

// PluginManifestPort describes one port a plugin's container publishes.
// HostPort may be given in the manifest as either a fixed JSON number (e.g.
// 443) or a string, often a "{{settings.<key>}}" placeholder resolved against
// the plugin's settings at install time; both forms decode to a string here.
type PluginManifestPort struct {
	Protocol      string `json:"protocol"`
	ContainerPort int    `json:"containerPort"`
	HostPort      string `json:"hostPort"`
	Description   string `json:"description"`
}

// UnmarshalJSON allows HostPort to be given as either a JSON string or a bare
// JSON number, normalizing either form to a string.
func (p *PluginManifestPort) UnmarshalJSON(data []byte) error {
	type alias PluginManifestPort
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

// PluginManifestContainer describes the container a plugin installs.
type PluginManifestContainer struct {
	Image     string                  `json:"image"`
	Interface PluginManifestInterface `json:"interface"`
	Env       map[string]string       `json:"env"`
	Mounts    []PluginManifestMount   `json:"mounts"`
	Ports     []PluginManifestPort    `json:"ports"`
}

// PluginManifestScripts names RouterOS scripts run at various install and
// uninstall stages. Paths are relative to the plugin's directory in the
// registry repository.
type PluginManifestScripts struct {
	PreInstall   string `json:"preInstall"`
	PostInstall  string `json:"postInstall"`
	PreUninstall string `json:"preUninstall"`
}

// PluginManifest is the per-plugin manifest.json fetched from the community
// plugin registry.
type PluginManifest struct {
	ID             string                  `json:"id"`
	Name           string                  `json:"name"`
	Version        string                  `json:"version"`
	Author         string                  `json:"author"`
	License        string                  `json:"license"`
	Website        string                  `json:"website"`
	Category       string                  `json:"category"`
	Tagline        string                  `json:"tagline"`
	Description    string                  `json:"description"`
	Icon           string                  `json:"icon"`
	Architectures  []string                `json:"architectures"`
	Container      PluginManifestContainer `json:"container"`
	Scripts        PluginManifestScripts   `json:"scripts"`
	SettingsSchema string                  `json:"settingsSchema"`
}

// PluginSettingField describes one configurable setting for a plugin. Default
// may be a string or a number depending on Type, hence the untyped value.
type PluginSettingField struct {
	Key         string   `json:"key"`
	Label       string   `json:"label"`
	Type        string   `json:"type"`
	Options     []string `json:"options,omitempty"`
	Default     any      `json:"default,omitempty"`
	Required    bool     `json:"required"`
	Description string   `json:"description"`
	Generate    string   `json:"generate,omitempty"`
}

// PluginSettingsSchema is the per-plugin settings.json fetched from the
// community plugin registry.
type PluginSettingsSchema struct {
	Settings []PluginSettingField `json:"settings"`
}

// InstallPluginRequest is the request body for POST /api/plugin/install.
type InstallPluginRequest struct {
	ID string `json:"id"`
}

// InstallPluginResponse is the response for POST /api/plugin/install.
// Installation runs asynchronously; poll GET /api/plugin/status/{pluginId} for
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
	Interface  string   `json:"interface,omitempty"`
	Warnings   []string `json:"warnings,omitempty"`
}

// PluginInstallStatusResponse is the response for GET /api/plugin/status/{pluginId}.
type PluginInstallStatusResponse struct {
	PluginID    string `json:"pluginId"`
	Phase       string `json:"phase"` // preparing, creating_interface, creating_mounts, running_pre_install_script, creating_container, pulling, starting_container, running_post_install_script, done, error
	Message     string `json:"message,omitempty"`
	StartedAt   string `json:"startedAt,omitempty"`
	ContainerID string `json:"containerId,omitempty"`
	Interface   string `json:"interface,omitempty"`
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
func finalizePlugins(plugins []PluginInfo, containers []routeros.ContainerInfo) []PluginInfo {
	byName := make(map[string]*routeros.ContainerInfo, len(containers))
	for i := range containers {
		byName[containers[i].Name] = &containers[i]
	}

	result := make([]PluginInfo, len(plugins))
	for i := range plugins {
		result[i] = plugins[i]
		result[i].Icon = pluginAssetsBaseURL + "/" + result[i].ID + "/icon.svg"

		if container, ok := byName[result[i].ID]; ok {
			result[i].Installed = true
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

// registryHasPlugin reports whether id is a plugin known to the registry.
func registryHasPlugin(registry *PluginRegistry, id string) bool {
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
func settingsDefaults(schema *PluginSettingsSchema) (map[string]string, error) {
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
