package routeros

import "fmt"

// ContainerConfig represents the configuration used to add a new container.
// RemoteImage and File are both optional, but at most one may be set:
// RemoteImage pulls an image from a registry (see /container/config
// registry-url), File extracts a local tar/tar.gz tarball already uploaded to
// the router.
type ContainerConfig struct {
	Name        string // referenced afterward by RouterOS start/stop/print/remove
	Interface   string // veth interface backing the container
	RootDir     string // storage location for the container filesystem
	RemoteImage string // e.g. "pihole/pihole:latest"
	File        string // local tarball path, e.g. "disk1/pihole.tar"
	Hostname    string
	EnvLists    string // comma-separated names of /container/envs lists
	MountLists  string // comma-separated names of /container/mounts lists
	Cmd         string
	Entrypoint  string
	Workdir     string
	DNS         string
	DomainName  string
	StopSignal  string
	Devices     string
	CPUList     string
	User        string
	MemoryHigh  int64
	MemoryMax   int64
	Logging     bool
	StartOnBoot bool
	Comment     string
}

// ContainerInfo represents a container as reported by RouterOS, including the
// read-only fields shown by `/container/print detail`.
type ContainerInfo struct {
	ID                              string
	Name                            string
	Tag                             string
	OS                              string
	Arch                            string
	Interface                       string
	RootDir                         string
	RemoteImage                     string
	IgnoreRemoteImageChange         bool
	CheckCertificate                bool
	File                            string
	Hostname                        string
	DomainName                      string
	Env                             string
	EnvCurrent                      string
	EnvLists                        string
	MountLists                      string
	Mount                           string
	Tmpfs                           string
	LayerDir                        string
	ShmSize                         string
	DefaultDNS                      string
	Hosts                           string
	DefaultEntrypoint               string
	DefaultCmd                      string
	DefaultShell                    string
	DefaultWorkdir                  string
	DefaultUser                     string
	DefaultStopSignal               string
	StopTime                        string
	Logging                         bool
	StartOnBoot                     bool
	StopOnUnhealthy                 bool
	RestartPolicy                   string // no/always/on-failure
	RestartCount                    string
	RestartMaxCount                 string
	RestartInterval                 string
	CPUList                         string
	CPUUsage                        string
	MemoryHigh                      string // may be "unlimited"
	MemoryMax                       string // may be "unlimited"
	MemoryCurrent                   string // current RAM usage in bytes
	Devices                         string
	ImageID                         string
	ConfigJSON                      string // OCI image config blob (architecture, entrypoint, env, healthcheck, rootfs digests, ...)
	Layers                          string
	DefaultHealthcheckCmd           string
	DefaultHealthcheckInterval      string
	DefaultHealthcheckTimeout       string
	DefaultHealthcheckStartPeriod   string
	DefaultHealthcheckStartInterval string
	DefaultHealthcheckRetries       string
	HealthcheckStatus               string
	// RouterOS has no stable "status" property for containers; it instead adds
	// transient boolean flags matching the current print flag (S/N/R/T/E/D/F).
	// Only the ones observed in practice are modeled; all are absent (false)
	// outside their respective states.
	Healthy               bool   // present while running with a passing healthcheck
	DownloadingExtracting bool   // present while pulling/extracting the image (flag E)
	DownloadExtractFailed bool   // present when the pull/extract failed (flag F)
	About                 string // error detail set alongside DownloadExtractFailed
	Comment               string
}

func parseContainerInfo(result map[string]string) ContainerInfo {
	return ContainerInfo{
		ID:                              result[".id"],
		Name:                            result["name"],
		Tag:                             result["tag"],
		OS:                              result["os"],
		Arch:                            result["arch"],
		Interface:                       result["interface"],
		RootDir:                         result["root-dir"],
		RemoteImage:                     result["remote-image"],
		IgnoreRemoteImageChange:         result["ignore-remote-image-change"] == "yes" || result["ignore-remote-image-change"] == "true",
		CheckCertificate:                result["check-certificate"] == "yes" || result["check-certificate"] == "true",
		File:                            result["file"],
		Hostname:                        result["hostname"],
		DomainName:                      result["domain-name"],
		Env:                             result["env"],
		EnvCurrent:                      result["env-current"],
		EnvLists:                        result["envlists"],
		MountLists:                      result["mountlists"],
		Mount:                           result["mount"],
		Tmpfs:                           result["tmpfs"],
		LayerDir:                        result["layer-dir"],
		ShmSize:                         result["shm-size"],
		DefaultDNS:                      result["default-dns"],
		Hosts:                           result["hosts"],
		DefaultEntrypoint:               result["default-entrypoint"],
		DefaultCmd:                      result["default-cmd"],
		DefaultShell:                    result["default-shell"],
		DefaultWorkdir:                  result["default-workdir"],
		DefaultUser:                     result["default-user"],
		DefaultStopSignal:               result["default-stop-signal"],
		StopTime:                        result["stop-time"],
		Logging:                         result["logging"] == "yes" || result["logging"] == "true",
		StartOnBoot:                     result["start-on-boot"] == "yes" || result["start-on-boot"] == "true",
		StopOnUnhealthy:                 result["stop-on-unhealthy"] == "yes" || result["stop-on-unhealthy"] == "true",
		RestartPolicy:                   result["restart-policy"],
		RestartCount:                    result["restart-count"],
		RestartMaxCount:                 result["restart-max-count"],
		RestartInterval:                 result["restart-interval"],
		CPUList:                         result["cpu-list"],
		CPUUsage:                        result["cpu-usage"],
		MemoryHigh:                      result["memory-high"],
		MemoryMax:                       result["memory-max"],
		MemoryCurrent:                   result["memory-current"],
		Devices:                         result["devices"],
		ImageID:                         result["image-id"],
		ConfigJSON:                      result["config-json"],
		Layers:                          result["layers"],
		DefaultHealthcheckCmd:           result["default-healthcheck-cmd"],
		DefaultHealthcheckInterval:      result["default-healthcheck-interval"],
		DefaultHealthcheckTimeout:       result["default-healthcheck-timeout"],
		DefaultHealthcheckStartPeriod:   result["default-healthcheck-start-period"],
		DefaultHealthcheckStartInterval: result["default-healthcheck-start-interval"],
		DefaultHealthcheckRetries:       result["default-healthcheck-retries"],
		HealthcheckStatus:               result["healthcheck-status"],
		Healthy:                         result["healthy"] == "true",
		DownloadingExtracting:           result["downloading/extracting"] == "true",
		DownloadExtractFailed:           result["download/extract failed"] == "true",
		About:                           result[".about"],
		Comment:                         result["comment"],
	}
}

// AddContainer creates a new container from the given configuration and
// returns its RouterOS .id.
func (c *Client) AddContainer(config ContainerConfig) (string, error) {
	if config.Name == "" {
		return "", fmt.Errorf("container name is required")
	}
	if config.Interface == "" {
		return "", fmt.Errorf("container interface is required")
	}
	if config.RemoteImage != "" && config.File != "" {
		return "", fmt.Errorf("at most one of remote-image or file may be set")
	}

	args := []string{
		"=name=" + config.Name,
		"=interface=" + config.Interface,
	}

	if config.RemoteImage != "" {
		args = append(args, "=remote-image="+config.RemoteImage)
	}
	if config.File != "" {
		args = append(args, "=file="+config.File)
	}
	if config.RootDir != "" {
		args = append(args, "=root-dir="+config.RootDir)
	}
	if config.Hostname != "" {
		args = append(args, "=hostname="+config.Hostname)
	}
	if config.EnvLists != "" {
		args = append(args, "=envlists="+config.EnvLists)
	}
	if config.MountLists != "" {
		args = append(args, "=mountlists="+config.MountLists)
	}
	if config.Cmd != "" {
		args = append(args, "=cmd="+config.Cmd)
	}
	if config.Entrypoint != "" {
		args = append(args, "=entrypoint="+config.Entrypoint)
	}
	if config.Workdir != "" {
		args = append(args, "=workdir="+config.Workdir)
	}
	if config.DNS != "" {
		args = append(args, "=dns="+config.DNS)
	}
	if config.DomainName != "" {
		args = append(args, "=domain-name="+config.DomainName)
	}
	if config.StopSignal != "" {
		args = append(args, "=stop-signal="+config.StopSignal)
	}
	if config.Devices != "" {
		args = append(args, "=devices="+config.Devices)
	}
	if config.CPUList != "" {
		args = append(args, "=cpu-list="+config.CPUList)
	}
	if config.User != "" {
		args = append(args, "=user="+config.User)
	}
	if config.MemoryHigh > 0 {
		args = append(args, fmt.Sprintf("=memory-high=%d", config.MemoryHigh))
	}
	if config.MemoryMax > 0 {
		args = append(args, fmt.Sprintf("=memory-max=%d", config.MemoryMax))
	}
	if config.Logging {
		args = append(args, "=logging=yes")
	}
	if config.StartOnBoot {
		args = append(args, "=start-on-boot=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/container", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add container %s: %w", config.Name, err)
	}

	return id, nil
}

// EditContainer applies the given property updates to an existing container,
// identified by name or .id (e.g. "*1"). Keys must be bare RouterOS property
// names (e.g. "start-on-boot"), values as RouterOS expects them (e.g. "yes"/"no").
func (c *Client) EditContainer(nameOrID string, updates map[string]string) error {
	if nameOrID == "" {
		return fmt.Errorf("container name or ID is required")
	}
	if len(updates) == 0 {
		return nil
	}

	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	args := []string{"=.id=" + container.ID}
	for key, value := range updates {
		args = append(args, "="+key+"="+value)
	}

	_, err = c.Set("/container", args...)
	if err != nil {
		return fmt.Errorf("failed to update container %s: %w", nameOrID, err)
	}

	return nil
}

// RemoveContainer deletes the container identified by name or .id.
func (c *Client) RemoveContainer(nameOrID string) error {
	if nameOrID == "" {
		return fmt.Errorf("container name or ID is required")
	}

	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	_, err = c.Remove("/container", "=.id="+container.ID)
	if err != nil {
		return fmt.Errorf("failed to remove container %s: %w", nameOrID, err)
	}

	return nil
}

// GetContainer retrieves a single container by name or .id (e.g. "*1").
func (c *Client) GetContainer(nameOrID string) (*ContainerInfo, error) {
	if nameOrID == "" {
		return nil, fmt.Errorf("container name or ID is required")
	}

	result, err := c.GetFirst("/container", nameOrIDFilterArg(nameOrID))
	if err != nil {
		return nil, fmt.Errorf("failed to get container %s: %w", nameOrID, err)
	}

	info := parseContainerInfo(result)
	return &info, nil
}

// StartContainer starts the container identified by name or .id.
func (c *Client) StartContainer(nameOrID string) error {
	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	if _, err := c.Execute("/container/start", "=.id="+container.ID); err != nil {
		return fmt.Errorf("failed to start container %s: %w", nameOrID, err)
	}

	return nil
}

// StopContainer stops the container identified by name or .id.
func (c *Client) StopContainer(nameOrID string) error {
	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	if _, err := c.Execute("/container/stop", "=.id="+container.ID); err != nil {
		return fmt.Errorf("failed to stop container %s: %w", nameOrID, err)
	}

	return nil
}

// RestartContainer restarts the container identified by name or .id. Requires
// RouterOS 7.23beta5 or later, which added /container/restart.
func (c *Client) RestartContainer(nameOrID string) error {
	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	if _, err := c.Execute("/container/restart", "=.id="+container.ID); err != nil {
		return fmt.Errorf("failed to restart container %s: %w", nameOrID, err)
	}

	return nil
}

// RestartContainerWithTimeout stops and starts the named container after
// waiting timeoutSeconds, running as a background RouterOS script via
// ExecuteScriptString rather than acting synchronously. Useful when the
// container being restarted is the one running the caller itself: the
// timeout gives the current request/connection time to complete before
// RouterOS stops the container out from under it.
func (c *Client) RestartContainerWithTimeout(name string, timeoutSeconds int) error {
	if name == "" {
		return fmt.Errorf("container name is required")
	}
	if timeoutSeconds < 0 {
		return fmt.Errorf("timeout must be zero or positive")
	}

	if _, err := c.GetContainer(name); err != nil {
		return err
	}

	script := fmt.Sprintf(`:local c [/container/find where name="%s"]
:delay %ds
/container/stop $c
/container/start $c`, name, timeoutSeconds)

	if err := c.ExecuteScriptString(script); err != nil {
		return fmt.Errorf("failed to schedule restart for container %s: %w", name, err)
	}

	return nil
}

// PromoteContainer replaces the container named runningName with the one
// named stagedName: it stops runningName, waits 2s for it to fully tear down,
// removes it, renames stagedName to runningName, marks it to start on boot,
// and starts it. Runs as a single background RouterOS script via
// ExecuteScriptString after waiting delaySeconds up front, rather than acting
// synchronously — needed when runningName is the container the caller itself
// is running in, so the caller gets time to finish before RouterOS stops it
// out from under it.
func (c *Client) PromoteContainer(runningName, stagedName string, delaySeconds int) error {
	if runningName == "" || stagedName == "" {
		return fmt.Errorf("both running and staged container names are required")
	}
	if delaySeconds < 0 {
		return fmt.Errorf("delay must be zero or positive")
	}

	if _, err := c.GetContainer(runningName); err != nil {
		return fmt.Errorf("running container %s: %w", runningName, err)
	}
	if _, err := c.GetContainer(stagedName); err != nil {
		return fmt.Errorf("staged container %s: %w", stagedName, err)
	}

	script := fmt.Sprintf(`:local old [/container/find where name="%s"]
:local new [/container/find where name="%s"]
:delay %ds
/container/stop $old
:delay 2s
/container/remove $old
/container/set $new name="%s" start-on-boot=yes
/container/start $new`, runningName, stagedName, delaySeconds, runningName)

	if err := c.ExecuteScriptString(script); err != nil {
		return fmt.Errorf("failed to schedule promotion of %s to %s: %w", stagedName, runningName, err)
	}

	return nil
}

// RepullContainer re-pulls and re-extracts the container image, identified by
// name or .id. Pass remoteImage or file to override the image source used for
// this pull; leave both empty to repull using the container's currently
// configured source. At most one of remoteImage/file may be set.
func (c *Client) RepullContainer(nameOrID, remoteImage, file string) error {
	if remoteImage != "" && file != "" {
		return fmt.Errorf("at most one of remote-image or file may be set")
	}

	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	args := []string{"=.id=" + container.ID}
	if remoteImage != "" {
		args = append(args, "=remote-image="+remoteImage)
	}
	if file != "" {
		args = append(args, "=file="+file)
	}

	if _, err := c.Execute("/container/repull", args...); err != nil {
		return fmt.Errorf("failed to repull container %s: %w", nameOrID, err)
	}

	return nil
}

// UpdateContainer pulls the latest image from the container's repository and
// replaces the original image, identified by name or .id.
func (c *Client) UpdateContainer(nameOrID string) error {
	container, err := c.GetContainer(nameOrID)
	if err != nil {
		return err
	}

	if _, err := c.Execute("/container/update", "=.id="+container.ID); err != nil {
		return fmt.Errorf("failed to update container %s: %w", nameOrID, err)
	}

	return nil
}

// ListContainers retrieves all containers.
func (c *Client) ListContainers() ([]ContainerInfo, error) {
	results, err := c.GetAll("/container")
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	containers := make([]ContainerInfo, 0, len(results))
	for _, result := range results {
		containers = append(containers, parseContainerInfo(result))
	}

	return containers, nil
}
