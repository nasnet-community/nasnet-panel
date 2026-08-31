package install

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"nasnet-panel-installer/assets"
	"nasnet-panel-installer/internal/ros"
)

func (e *Engine) stepConnect() error {
	e.log("connecting to %s@%s:%d", e.opts.User, e.opts.Host, e.opts.SSHPort)
	cl, err := ros.Dial(e.opts.Host, e.opts.SSHPort, e.opts.User, e.opts.Password)
	if err != nil {
		return fmt.Errorf("SSH login failed, check user/password or SSH service policies: %w", err)
	}
	e.cl = cl
	if _, err := e.cl.Run(":put ok"); err != nil {
		return fmt.Errorf("SSH command test failed: %w", err)
	}
	e.note = fmt.Sprintf("%s@%s:%d", e.opts.User, e.opts.Host, e.opts.SSHPort)
	return nil
}

func (e *Engine) stepCheck() error {
	out, err := e.cl.Run(`:put ("V=" . [/system/resource/get version]); :put ("A=" . [/system/resource/get architecture-name]); :put ("B=" . [/system/resource/get board-name]); :put ("F=" . [/system/resource/get free-memory])`)
	if err != nil {
		return fmt.Errorf("reading /system/resource failed: %w", err)
	}
	var freeBytes int64
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(line, "V="):
			e.sys.Version = strings.TrimPrefix(line, "V=")
		case strings.HasPrefix(line, "A="):
			e.sys.Arch = strings.TrimPrefix(line, "A=")
		case strings.HasPrefix(line, "B="):
			e.sys.Board = strings.TrimPrefix(line, "B=")
		case strings.HasPrefix(line, "F="):
			freeBytes, _ = strconv.ParseInt(strings.TrimPrefix(line, "F="), 10, 64)
		}
	}
	e.sys.FreeMB = freeBytes / 1024 / 1024
	e.ev.SysInfo(e.sys)
	e.log("board %s, arch %s, RouterOS %s, %d MB free", e.sys.Board, e.sys.Arch, e.sys.Version, e.sys.FreeMB)

	if _, err := assetSuffix(e.sys.Arch); err != nil {
		return err
	}
	if versionBelow(e.sys.Version, minROSMajor, minROSMinor) {
		return fmt.Errorf("RouterOS %s is too old, %d.%d or newer is required. Update the router (System > Packages > Check For Updates), then run the installer again", e.sys.Version, minROSMajor, minROSMinor)
	}
	if e.sys.FreeMB < minFreeMB {
		return fmt.Errorf("free memory %d MB below threshold %d MB", e.sys.FreeMB, minFreeMB)
	}

	e.inspectContainerPackage()

	st, err := e.detectStorage()
	if err != nil {
		return err
	}
	e.storage = st
	e.sys.Storage = st.label()
	e.sys.StorageFreeMB = st.freeMB
	e.ev.SysInfo(e.sys)
	if st.freeMB >= 0 {
		e.log("using router storage %s (%d MB free)", st.label(), st.freeMB)
	} else {
		e.log("using router storage %s", st.label())
	}
	if err := e.verifyStorageWritable(st); err != nil {
		return err
	}

	e.note = fmt.Sprintf("%s, RouterOS %s, %d MB free, storage %s", e.sys.Arch, e.sys.Version, e.sys.FreeMB, st.label())
	return nil
}

func (e *Engine) installContainerPackage() error {
	name, url, err := containerPackageURL(e.sys.Version, e.sys.Arch)
	if err != nil {
		return err
	}
	e.log("container package is missing, installing %s", name)
	if e.opts.DryRun {
		e.log("[dry-run] download %s, upload it to the router, then restart", url)
		return nil
	}

	outDir := filepath.Join(os.TempDir(), "nasnet-panel-installer")
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return err
	}
	local := filepath.Join(outDir, name)
	e.log("downloading %s", url)
	if _, err := e.download(url, local, "check"); err != nil {
		return fmt.Errorf("could not download the container package for RouterOS %s (%s): %w. Install it via WebFig/Winbox (System > Packages) instead", e.sys.Version, e.sys.Arch, err)
	}

	e.log("uploading %s to the router", name)
	if err := e.cl.Upload(local, name, func(done, total int64) {
		e.ev.Progress("check", float64(done)*100/float64(total),
			fmt.Sprintf("%s / %s", humanBytes(done), humanBytes(total)))
	}); err != nil {
		return fmt.Errorf("could not upload the container package: %w", err)
	}

	if err := e.restartRouter("The container package has been uploaded to the router, and the router has to restart to install it.",
		"/system/reboot"); err != nil {
		return err
	}

	pkg := e.containerPackage()
	if !pkg.present {
		_, _ = e.cl.RunRaw(fmt.Sprintf("/file/remove [find name=%q]", name), 15*time.Second)
		return fmt.Errorf("the container package is still not installed after the restart, %s may not match RouterOS %s on %s", name, e.sys.Version, e.sys.Arch)
	}
	if !pkg.installed || pkg.disabled {
		return e.enableContainerPackage()
	}
	e.pkgInstalled = true
	e.log("container package installed")
	return nil
}

func containerPackageURL(version, arch string) (string, string, error) {
	v := strings.TrimSpace(version)
	if i := strings.IndexAny(v, " \t("); i > 0 {
		v = v[:i]
	}
	if v == "" {
		return "", "", errors.New("could not read the RouterOS version to pick a container package")
	}
	var name string
	switch arch {
	case "x86_64":
		name = fmt.Sprintf("container-%s.npk", v)
	case "arm", "arm64":
		name = fmt.Sprintf("container-%s-%s.npk", v, arch)
	default:
		return "", "", fmt.Errorf("no container package for architecture %s", arch)
	}
	return name, fmt.Sprintf("https://download.mikrotik.com/routeros/%s/%s", v, name), nil
}

func (e *Engine) inspectContainerPackage() {
	pkg := e.containerPackage()
	if pkg.active() {
		e.log("container package is installed")
		return
	}
	if !pkg.present {
		e.log("container package is not listed, asking the router for the available packages")
		if e.opts.DryRun {
			e.log("[dry-run] /system/package/update/check-for-updates")
		} else {
			_, _ = e.cl.RunRaw("/system/package/update/check-for-updates", 60*time.Second)
		}
	}
	e.log("container package is not active yet, installing it once device-mode is set")
}

func (e *Engine) ensureContainerPackage() error {
	pkg := e.containerPackage()
	if pkg.active() {
		return nil
	}
	if !pkg.present && !e.opts.DryRun {
		_, _ = e.cl.RunRaw("/system/package/update/check-for-updates", 60*time.Second)
		pkg = e.containerPackage()
	}
	if pkg.present {
		return e.enableContainerPackage()
	}
	return e.installContainerPackage()
}

type containerPkg struct {
	present   bool
	installed bool
	disabled  bool
}

func (p containerPkg) active() bool {
	return p.present && p.installed && !p.disabled
}

func (e *Engine) containerPackage() containerPkg {
	out, err := e.cl.RunRaw(`:put ("P=" . [:len [/system/package/find name=container]]); :do {:put ("I=" . [/system/package/get [find name=container] installed])} on-error={}; :do {:put ("D=" . [/system/package/get [find name=container] disabled])} on-error={}`, 20*time.Second)
	if err != nil {
		return containerPkg{}
	}
	pkg := containerPkg{installed: true}
	for _, line := range strings.Split(out, "\n") {
		key, value, ok := strings.Cut(strings.TrimSpace(line), "=")
		if !ok {
			continue
		}
		switch key {
		case "P":
			pkg.present = value != "" && value != "0"
		case "I":
			pkg.installed = value == "true" || value == "yes"
		case "D":
			pkg.disabled = value == "true"
		}
	}
	return pkg
}

func (e *Engine) enableContainerPackage() error {
	e.log("container package is on the router but not active, enabling it")
	if e.opts.DryRun {
		e.log("[dry-run] /system/package/enable container, then /system/package/apply-changes")
		return nil
	}
	if out, err := e.cl.Run("/system/package/enable container"); err != nil {
		return fmt.Errorf("failed to enable the container package: %w (%s)", err, strings.TrimSpace(out))
	}
	if err := e.restartRouter("The container package is now enabled, and the router has to restart to install it.",
		"/system/package/apply-changes", "/system/reboot"); err != nil {
		return err
	}
	pkg := e.containerPackage()
	if !pkg.present || !pkg.installed || pkg.disabled {
		return errors.New("the container package is still not active after the restart. Install it from System > Packages in WebFig or Winbox, then run the installer again")
	}
	e.pkgInstalled = true
	e.log("container package installed")
	return nil
}

func (e *Engine) restartRouter(reason string, cmds ...string) error {
	for _, cmd := range cmds {
		if _, err := e.cl.RunChecked(fmt.Sprintf(":execute {:delay 2s; %s}", cmd), 15*time.Second); err != nil {
			e.log("could not run %s over SSH (%v)", cmd, err)
			continue
		}
		e.log("restarting the router with %s", cmd)
		e.ev.RebootNotice(reason)
		return e.waitForReboot()
	}
	e.log("asking for a manual restart")
	if !e.ev.RebootPrompt(reason) {
		return errors.New("router restart declined by user")
	}
	return e.waitForReboot()
}

func (e *Engine) waitForReboot() error {
	e.log("waiting for the router to restart")
	e.cl.Close()
	if err := e.sleep(rebootSettle); err != nil {
		return err
	}
	start := time.Now()
	tick := time.NewTicker(3 * time.Second)
	defer tick.Stop()
	for time.Since(start) < rebootTimeout {
		e.ev.RebootTick(int(time.Since(start)/time.Second)+int(rebootSettle/time.Second), "restarting")
		if err := e.cl.Reconnect(); err == nil {
			if _, rerr := e.cl.RunRaw(":put ok", 8*time.Second); rerr == nil {
				e.ev.RebootTick(int(time.Since(start)/time.Second)+int(rebootSettle/time.Second), "online")
				e.log("router is back online")
				return nil
			}
		}
		select {
		case <-e.ctx.Done():
			return e.ctx.Err()
		case <-tick.C:
		}
	}
	return fmt.Errorf("router did not come back within %s after the restart", rebootTimeout)
}

func (e *Engine) stepDeviceMode() error {
	if err := e.enableDeviceMode(); err != nil {
		return err
	}
	if err := e.ensureContainerPackage(); err != nil {
		return err
	}
	if e.pkgInstalled {
		e.note = strings.TrimSpace(e.note + ", container package installed")
	}
	return nil
}

var deviceModeFlags = [][2]string{
	{"mode", "advanced"},
	{"flagging-enabled", "no"},
	{"scheduler", "yes"},
	{"socks", "yes"},
	{"fetch", "yes"},
	{"bandwidth-test", "yes"},
	{"traffic-gen", "yes"},
	{"sniffer", "yes"},
	{"romon", "yes"},
	{"proxy", "yes"},
	{"hotspot", "yes"},
	{"email", "yes"},
	{"zerotier", "yes"},
	{"container", "yes"},
	{"install-any-version", "yes"},
	{"partitions", "yes"},
	{"routerboard", "yes"},
}

func normalizeDeviceModeValue(v string) string {
	switch strings.TrimSpace(v) {
	case "true":
		return "yes"
	case "false":
		return "no"
	default:
		return strings.TrimSpace(v)
	}
}

func parseDeviceMode(out string) map[string]string {
	current := map[string]string{}
	for _, field := range strings.Split(strings.TrimSpace(out), ";") {
		key, value, ok := strings.Cut(strings.TrimSpace(field), "=")
		if !ok {
			continue
		}
		current[strings.TrimSpace(key)] = normalizeDeviceModeValue(value)
	}
	return current
}

func supportedDeviceModeFlags(current map[string]string) (all []string, pending []string) {
	for _, flag := range deviceModeFlags {
		want, ok := current[flag[0]]
		if !ok {
			continue
		}
		all = append(all, flag[0]+"="+flag[1])
		if want != flag[1] {
			pending = append(pending, flag[0]+"="+flag[1])
		}
	}
	return all, pending
}

func (e *Engine) readDeviceMode(timeout time.Duration) (map[string]string, error) {
	out, err := e.cl.RunRaw(":put [/system/device-mode/get]", timeout)
	if err != nil {
		return nil, err
	}
	current := parseDeviceMode(out)
	if _, ok := current["container"]; !ok {
		return nil, fmt.Errorf("could not read device-mode container (got %q), run '/system device-mode print' on the router to inspect", strings.TrimSpace(out))
	}
	return current, nil
}

func (e *Engine) enableDeviceMode() error {
	current, err := e.readDeviceMode(15 * time.Second)
	if err != nil {
		return fmt.Errorf("could not read /system/device-mode: %w", err)
	}
	all, pending := supportedDeviceModeFlags(current)
	if len(pending) == 0 {
		e.note = "already enabled"
		return nil
	}

	e.log("device-mode needs %s, physical confirmation required", strings.Join(pending, " "))
	if !e.ev.DeviceModePrompt() {
		return errors.New("device-mode enable declined by user")
	}
	update := "/system/device-mode/update " + strings.Join(all, " ")
	if e.opts.DryRun {
		e.log("[dry-run] %s", update)
		e.note = "dry-run, not changed"
		return nil
	}

	go func() {
		_, _ = e.cl.RunRaw(update, deviceModeTimeout+30*time.Second)
	}()

	total := int(deviceModeTimeout / time.Second)
	state := "online"
	for elapsed := 0; elapsed < total; elapsed += 2 {
		if err := e.sleep(2 * time.Second); err != nil {
			return err
		}
		current, err := e.readDeviceMode(8 * time.Second)
		if err != nil {
			state = "offline"
			_ = e.cl.Reconnect()
		} else {
			state = "online"
			if _, pending := supportedDeviceModeFlags(current); len(pending) == 0 {
				e.note = "confirmed and enabled"
				return nil
			}
		}
		e.ev.DeviceModeTick(total-elapsed-2, state)
	}
	return fmt.Errorf("device-mode change not confirmed within %s", deviceModeTimeout)
}

func (e *Engine) stepDownload() error {
	if e.opts.ImageTar != "" {
		if _, err := os.Stat(e.opts.ImageTar); err != nil {
			return fmt.Errorf("image tar not readable: %w", err)
		}
		e.localTar = e.opts.ImageTar
		e.assetName = filepath.Base(e.opts.ImageTar)
		e.note = "using local tar " + e.assetName
		return nil
	}

	release, channel := snapshotRelease, snapshotChannel
	if e.opts.Version != "" {
		release = e.opts.Version
		channel = strings.TrimPrefix(e.opts.Version, "v")
	}
	suffix, err := assetSuffix(e.sys.Arch)
	if err != nil {
		return err
	}
	asset := fmt.Sprintf("%s-%s-%s.tar", assetPrefix, channel, suffix)
	url := fmt.Sprintf("https://github.com/%s/%s/releases/download/%s/%s", ghOwner, ghRepo, release, asset)

	outDir := filepath.Join(os.TempDir(), "nasnet-panel-installer")
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return err
	}
	outPath := filepath.Join(outDir, asset)

	e.log("downloading %s", url)
	actual, err := e.download(url, outPath, "download")
	if err != nil {
		return err
	}
	expected, err := e.fetchChecksum(url + ".sha256")
	if err != nil {
		return err
	}
	if !strings.EqualFold(expected, actual) {
		return fmt.Errorf("checksum mismatch for %s: got %s, expected %s", asset, actual, expected)
	}
	e.log("checksum OK")
	e.assetName = asset
	e.localTar = outPath
	e.note = asset
	return nil
}

func (e *Engine) download(url, dest, stepID string) (string, error) {
	req, err := http.NewRequestWithContext(e.ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download failed: %s (%s)", resp.Status, url)
	}

	f, err := os.Create(dest)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	total := resp.ContentLength
	buf := make([]byte, 256*1024)
	var done int64
	for {
		n, rerr := resp.Body.Read(buf)
		if n > 0 {
			if _, werr := f.Write(buf[:n]); werr != nil {
				return "", werr
			}
			_, _ = h.Write(buf[:n])
			done += int64(n)
			if total > 0 {
				e.ev.Progress(stepID, float64(done)*100/float64(total),
					fmt.Sprintf("%s / %s", humanBytes(done), humanBytes(total)))
			}
		}
		if errors.Is(rerr, io.EOF) {
			break
		}
		if rerr != nil {
			return "", rerr
		}
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func (e *Engine) fetchChecksum(url string) (string, error) {
	req, err := http.NewRequestWithContext(e.ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("checksum download failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("checksum download failed: %s (%s)", resp.Status, url)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if err != nil {
		return "", err
	}
	fields := strings.Fields(string(body))
	if len(fields) == 0 {
		return "", errors.New("empty checksum file")
	}
	return fields[0], nil
}

func (e *Engine) stepUpload() error {
	remote := e.storage.path(e.assetName)
	e.remoteTar = remote

	info, err := os.Stat(e.localTar)
	if err != nil {
		return err
	}
	localSize := info.Size()

	if e.exists("/file", fmt.Sprintf("name=%q", remote)) {
		out, _ := e.cl.RunRaw(fmt.Sprintf(":put [/file/get [find name=%q] size]", remote), 15*time.Second)
		remoteSize, perr := strconv.ParseInt(strings.TrimSpace(out), 10, 64)
		if perr == nil && remoteSize == localSize {
			e.note = fmt.Sprintf("already on router (%s), skipped", humanBytes(remoteSize))
			e.log("tar already on router (%d bytes match), skipping upload", remoteSize)
			return nil
		}
		e.log("tar on router differs (local=%d, remote=%s), replacing", localSize, strings.TrimSpace(out))
		if !e.opts.DryRun {
			_, _ = e.cl.RunRaw(fmt.Sprintf("/file/remove [find name=%q]", remote), 15*time.Second)
		}
	}

	e.log("uploading %s to %s", filepath.Base(e.localTar), remote)
	if e.opts.DryRun {
		e.log("[dry-run] sftp upload")
		return nil
	}
	e.ensureDir(e.storage.name)
	err = e.cl.Upload(e.localTar, remote, func(done, total int64) {
		e.ev.Progress("upload", float64(done)*100/float64(total),
			fmt.Sprintf("%s / %s", humanBytes(done), humanBytes(total)))
	})
	if err != nil {
		return err
	}
	e.pushRollback(func() {
		e.removeRemoteFile(remote)
	})
	e.note = humanBytes(localSize)
	return nil
}

func (e *Engine) checkVethMenu() error {
	if _, err := e.cl.RunChecked(":put [:len [/interface/veth/find]]", 15*time.Second); err == nil {
		return nil
	}
	state := "unknown"
	if out, err := e.cl.RunRaw(":put [/system/device-mode/get container]", 15*time.Second); err == nil {
		if v := strings.TrimSpace(out); v != "" {
			state = v
		}
	}
	if state == "no" || state == "false" {
		return errors.New("the router has no /interface/veth menu because device-mode container is off. Enable it with /system/device-mode/update container=yes, confirm it with the reset button or a cold power-cycle, then run the installer again")
	}
	return fmt.Errorf("the router has no /interface/veth menu, so the container package is not active (device-mode container is %s). Check the container package under System > Packages, restart the router, then run the installer again", state)
}

func (e *Engine) stepNetwork() error {
	if err := e.checkVethMenu(); err != nil {
		return err
	}
	if err := e.ensure(fmt.Sprintf("veth %s (%s)", vethName, vethAddrCIDR),
		"/interface/veth", "name="+vethName,
		fmt.Sprintf("name=%s address=%s gateway=%s", vethName, vethAddrCIDR, vethGW)); err != nil {
		return err
	}
	if err := e.ensure("bridge "+bridgeName,
		"/interface/bridge", "name="+bridgeName,
		"name="+bridgeName); err != nil {
		return err
	}
	if err := e.ensure(fmt.Sprintf("ip %s on %s", bridgeIPCIDR, bridgeName),
		"/ip/address", fmt.Sprintf("address=%q", bridgeIPCIDR),
		fmt.Sprintf("address=%s interface=%s", bridgeIPCIDR, bridgeName)); err != nil {
		return err
	}
	if err := e.ensure(fmt.Sprintf("%s port on bridge %s", vethName, bridgeName),
		"/interface/bridge/port", "interface="+vethName,
		fmt.Sprintf("bridge=%s interface=%s", bridgeName, vethName)); err != nil {
		return err
	}
	if err := e.ensure("srcnat masquerade for "+bridgeNet,
		"/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-srcnat"),
		fmt.Sprintf("chain=srcnat action=masquerade src-address=%s comment=%q", bridgeNet, commentTag+"-srcnat")); err != nil {
		return err
	}
	if err := e.ensure(fmt.Sprintf("dstnat tcp/%d to %s:80", e.opts.LANPort, vethIP),
		"/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-dstnat"),
		fmt.Sprintf("chain=dstnat action=dst-nat protocol=tcp dst-port=%d to-addresses=%s to-ports=80 comment=%q", e.opts.LANPort, vethIP, commentTag+"-dstnat")); err != nil {
		return err
	}
	e.moveToTop("/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-dstnat"))

	if err := e.ensure(fmt.Sprintf("dstnat tcp/%d to %s:443", e.opts.HTTPSLANPort, vethIP),
		"/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-dstnat-https"),
		fmt.Sprintf("chain=dstnat action=dst-nat protocol=tcp dst-port=%d to-addresses=%s to-ports=443 comment=%q", e.opts.HTTPSLANPort, vethIP, commentTag+"-dstnat-https")); err != nil {
		return err
	}
	e.moveToTop("/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-dstnat-https"))

	if err := e.ensure(fmt.Sprintf("forward accept tcp/80 to %s", vethIP),
		"/ip/firewall/filter", fmt.Sprintf("comment=%q", commentTag+"-forward"),
		fmt.Sprintf("chain=forward action=accept protocol=tcp dst-address=%s dst-port=80 comment=%q", vethIP, commentTag+"-forward")); err != nil {
		return err
	}
	e.moveToTop("/ip/firewall/filter", fmt.Sprintf("comment=%q", commentTag+"-forward"))

	if err := e.ensure(fmt.Sprintf("forward accept tcp/443 to %s", vethIP),
		"/ip/firewall/filter", fmt.Sprintf("comment=%q", commentTag+"-forward-https"),
		fmt.Sprintf("chain=forward action=accept protocol=tcp dst-address=%s dst-port=443 comment=%q", vethIP, commentTag+"-forward-https")); err != nil {
		return err
	}
	e.moveToTop("/ip/firewall/filter", fmt.Sprintf("comment=%q", commentTag+"-forward-https"))
	return nil
}

func (e *Engine) stepContainer() error {
	if e.exists("/container", "name="+containerName) {
		e.note = "container " + containerName + " already exists"
		e.removeRemoteFile(e.remoteTar)
		return nil
	}
	if e.opts.DryRun {
		e.log("[dry-run] would add container %s from %s", containerName, e.remoteTar)
		return nil
	}
	e.log("extracting tar and adding container %s (this can take a few minutes)", containerName)
	if out, err := e.cl.RunChecked(fmt.Sprintf("/container/add file=%q interface=%s root-dir=%q name=%s start-on-boot=yes logging=yes",
		e.remoteTar, vethName, e.storage.path(containerImagesDir), containerName), 5*time.Minute); err != nil {
		return fmt.Errorf("failed to add container: %w (%s)", err, strings.TrimSpace(out))
	}
	e.pushRollback(func() {
		_, _ = e.cl.RunRaw(fmt.Sprintf("/container/stop [find name=%s]", containerName), 15*time.Second)
		_, _ = e.cl.RunRaw(fmt.Sprintf("/container/remove [find name=%s]", containerName), 30*time.Second)
	})
	e.removeRemoteFile(e.remoteTar)
	e.note = containerName + " created"
	return nil
}

var dstPortRe = regexp.MustCompile(`dst-port=(\d+)`)

func (e *Engine) natPort() int {
	out, err := e.cl.RunRaw(fmt.Sprintf("/ip/firewall/nat/print detail where comment=%q", commentTag+"-dstnat"), 15*time.Second)
	if err == nil {
		if m := dstPortRe.FindStringSubmatch(out); m != nil {
			if p, perr := strconv.Atoi(m[1]); perr == nil {
				return p
			}
		}
	}
	return e.opts.LANPort
}

func (e *Engine) stepHealth() error {
	if e.opts.DryRun {
		e.log("[dry-run] /container/start, then poll /health until 200")
		return nil
	}
	if out, err := e.cl.Run(fmt.Sprintf("/container/start [find name=%s]", containerName)); err != nil {
		return fmt.Errorf("/container/start failed: %w (%s)", err, strings.TrimSpace(out))
	}

	e.finalPort = e.natPort()
	healthURL := fmt.Sprintf("http://%s:%d/health", e.opts.Host, e.finalPort)
	e.log("polling %s", healthURL)

	client := &http.Client{Timeout: 4 * time.Second}
	start := time.Now()
	last := "--"
	for time.Since(start) < startTimeout {
		if err := e.sleep(2 * time.Second); err != nil {
			return err
		}
		req, err := http.NewRequestWithContext(e.ctx, http.MethodGet, healthURL, nil)
		if err != nil {
			return err
		}
		resp, err := client.Do(req)
		if err == nil {
			last = resp.Status
			_ = resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				e.note = "healthy at " + healthURL
				return nil
			}
		} else {
			last = "unreachable"
		}
		elapsed := int(time.Since(start) / time.Second)
		e.ev.Progress("health", float64(elapsed)*100/float64(startTimeout/time.Second),
			fmt.Sprintf("last: %s, %ds elapsed", last, elapsed))
	}

	status, _ := e.cl.RunRaw(fmt.Sprintf("/container/print detail where name=%s", containerName), 15*time.Second)
	if s := strings.TrimSpace(status); s != "" {
		e.log("container detail: %s", s)
	}
	logs, _ := e.cl.RunRaw(`/log/print without-paging where topics~"container"`, 15*time.Second)
	lines := strings.Split(strings.TrimSpace(logs), "\n")
	if len(lines) > 10 {
		lines = lines[len(lines)-10:]
	}
	for _, line := range lines {
		if strings.TrimSpace(line) != "" {
			e.log("router log: %s", strings.TrimSpace(line))
		}
	}
	return fmt.Errorf("/health did not return 200 within %s (last: %s)", startTimeout, last)
}

func (e *Engine) stepBaseline() error {
	if e.opts.SkipLANBaseline {
		e.note = "skipped by option"
		return errSkipped
	}
	if e.exists("/interface/bridge", "name="+lanBridge) {
		e.note = lanBridge + " already exists, skipped"
		return nil
	}
	if e.opts.DryRun {
		e.log("[dry-run] would move LAN to %s/24 via detached RouterOS job", lanBridgeIP)
		return nil
	}

	e.log("uploading LAN baseline script")
	err := e.cl.UploadReader(bytes.NewReader(assets.LANBaseline), int64(len(assets.LANBaseline)), lanBaselineRsc, nil)
	if err != nil {
		e.log("LAN baseline upload failed: %v", err)
		e.note = "upload failed, run the wizard from a wired connection or re-run the installer"
		return nil
	}
	if out, err := e.cl.Run(fmt.Sprintf(":execute script={/import file-name=%s; /file/remove [find name=%q]}", lanBaselineRsc, lanBaselineRsc)); err != nil {
		e.log("LAN baseline job failed to start: %v (%s)", err, strings.TrimSpace(out))
		e.note = "job failed to start, run the wizard from a wired connection or re-run the installer"
		e.removeRemoteFile(lanBaselineRsc)
		return nil
	}
	if !e.baselineTookEffect() {
		e.log("LAN baseline did not bring up %s, the panel stays on %s", lanBridgeIP, e.opts.Host)
		e.note = "not applied, panel stays on the router address"
		return nil
	}
	e.baselineApplied = true
	e.note = fmt.Sprintf("%s %s/24 applied", lanBridge, lanBridgeIP)
	return nil
}

func (e *Engine) baselineTookEffect() bool {
	probe := fmt.Sprintf(`:put [:len [/ip/address/find address~"^%s"]]`, lanBridgeIP)
	deadline := time.Now().Add(baselineTimeout)
	for time.Now().Before(deadline) {
		if err := e.sleep(3 * time.Second); err != nil {
			return true
		}
		out, err := e.cl.RunRaw(probe, 8*time.Second)
		if err != nil {
			if rerr := e.cl.Reconnect(); rerr != nil {
				e.log("router no longer answers on %s, the new LAN is taking over", e.opts.Host)
				return true
			}
			continue
		}
		if v := strings.TrimSpace(out); v != "" && v != "0" {
			return true
		}
	}
	return false
}
