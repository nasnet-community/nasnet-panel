package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// Base URL hosting per-plugin assets (such as the icon and manifest) in the
// community plugin registry repository, keyed by plugin id.
const pluginAssetsBaseURL = "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/refs/heads/main/plugins"

// PluginInfo represents a single plugin entry from the community plugin registry.
type PluginInfo struct {
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
	// KeepDataOnUninstall is read from the manifest of installed plugins only,
	// so the uninstall dialog knows whether to offer deleting the data.
	KeepDataOnUninstall bool `json:"keepDataOnUninstall,omitempty"`
}

// PluginListResponse is the response for GET /api/plugin/plugins.
type PluginListResponse struct {
	ContainerSupport bool         `json:"containerSupport"`
	Plugins          []PluginInfo `json:"plugins"`
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

	// The rest are optional container settings. They apply when the container
	// is created (updating a plugin leaves them alone) and are taken literally,
	// "{{settings.<key>}}" is not expanded. A bad value fails the install before
	// the router is touched; leave them out and the container is created as it
	// always was.
	MemoryHigh          string   `json:"memoryHigh"`          // size: bytes, or a number with a K, M or G suffix ("128M")
	MemoryMax           string   `json:"memoryMax"`           // size like memoryHigh, at least 1M and not below memoryHigh
	CPUList             string   `json:"cpuList"`             // cores to run on, named as RouterOS does: "cpu0" or "cpu0,cpu1"
	User                string   `json:"user"`                // user[:group], each a name or a numeric id: "1000:1000"
	Devices             []string `json:"devices"`             // devices to hand through, as RouterOS names them: ["serial0"]
	AutoRestartInterval string   `json:"autoRestartInterval"` // RouterOS time ("30s", "5m", "1h30m"): restart the container this long after it exits
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
	// KeepDataOnUninstall is for plugins whose data folder holds something that
	// is hard to recreate (a certificate authority, say): uninstalling leaves the
	// folder in place unless the request asks for it to be deleted.
	KeepDataOnUninstall bool `json:"keepDataOnUninstall"`
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

// PluginInstallStatusResponse is the response for GET /api/plugin/install/status/{pluginId}.
type PluginInstallStatusResponse struct {
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

// PluginUpdateStatusResponse is the response for GET /api/plugin/update/status/{pluginId}.
type PluginUpdateStatusResponse struct {
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

func filterVisiblePlugins(plugins []PluginInfo) []PluginInfo {
	if strings.Contains(buildinfo.Version, "dev") {
		return plugins
	}
	visible := make([]PluginInfo, 0, len(plugins))
	for i := range plugins {
		if plugins[i].Visible {
			visible = append(visible, plugins[i])
		}
	}
	return visible
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
func parseContainerOptions(c PluginManifestContainer) (containerOptions, error) {
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
