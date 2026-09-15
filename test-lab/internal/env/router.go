package env

import (
	"context"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/test-lab/internal/profile"
	"nasnet-panel/test-lab/internal/sh"
)

var consoleErrors = []string{"failure:", "syntax error", "bad command name", "expected end of command", "input does not match"}

func (e *Env) startRouter() error {
	if e.setup.Start == StartFresh {
		if err := e.newDisk(e.baseImage()); err != nil {
			return err
		}
		if err := e.bootVM(); err != nil {
			return err
		}
		cmds, err := freshCommands(e.Profile)
		if err != nil {
			return err
		}
		if err := e.consoleSetup(cmds); err != nil {
			return err
		}
		e.Router.Address = FreshRouterAddress
		return e.waitAPI(3 * time.Minute)
	}
	return e.reachStart(e.setup.Start)
}

func (e *Env) reachStart(start string) error {
	if golden, ok := findGolden(e, start); ok {
		if err := e.newDisk(golden); err != nil {
			return err
		}
		if err := e.bootVM(); err != nil {
			return err
		}
		return e.waitAPI(5 * time.Minute)
	}

	switch start {
	case StartBootstrapped:
		if err := e.newDisk(e.baseImage()); err != nil {
			return err
		}
		if err := e.bootVM(); err != nil {
			return err
		}
		cmds, err := bootstrapCommands(e.Profile)
		if err != nil {
			return err
		}
		if err := e.consoleSetup(cmds); err != nil {
			return err
		}
		if err := e.waitAPI(3 * time.Minute); err != nil {
			return err
		}
	case StartContainerReady:
		if err := e.reachStart(StartBootstrapped); err != nil {
			return err
		}
		if err := e.prepareContainer(); err != nil {
			return err
		}
	case StartInstalled:
		if e.opts.ImageTar == "" {
			return fmt.Errorf("start %q needs -image-tar", start)
		}
		if err := e.reachStart(StartContainerReady); err != nil {
			return err
		}
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
		defer cancel()
		if _, err := e.Install(ctx, "cli", e.opts.ImageTar); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unknown start %q", start)
	}
	return saveGolden(e, start)
}

func (e *Env) baseImage() string {
	if e.liveArch == "arm64" {
		return e.assets.arm64Image
	}
	return e.assets.baseImage
}

func (e *Env) newDisk(base string) error {
	e.stopProcess("router")
	e.disk = filepath.Join(e.Dir, "router.qcow2")
	_ = os.Remove(e.disk)
	return sh.Run("qemu-img", "create", "-q", "-f", "qcow2", "-F", "qcow2", "-b", base, e.disk)
}

func (e *Env) bootVM() error {
	memory, cpus := e.Profile.MemoryMB, e.Profile.CPUs
	if memory < 256 {
		memory = 256
	}
	if memory > 2048 {
		memory = 2048
	}
	if cpus == 0 {
		cpus = 1
	}

	e.console = filepath.Join(e.Dir, "console.sock")
	e.monitor = filepath.Join(e.Dir, "monitor.sock")

	var args []string
	if e.liveArch == "arm64" {
		args = []string{
			"qemu-system-aarch64", "-machine", "virt,accel=kvm", "-cpu", "host", "-bios", e.opts.EFI,
			"-drive", "file=" + e.disk + ",if=none,id=disk0,format=qcow2", "-device", "virtio-blk-pci,drive=disk0",
		}
	} else {
		args = []string{
			"qemu-system-x86_64", "-machine", "pc,accel=kvm", "-cpu", "host",
			"-drive", "file=" + e.disk + ",if=virtio,format=qcow2",
		}
	}
	args = append(args,
		"-name", "tl"+e.ID,
		"-m", strconv.Itoa(memory),
		"-smp", strconv.Itoa(cpus),
		"-display", "none",
		"-serial", "unix:"+e.console+",server=on,wait=off",
		"-monitor", "unix:"+e.monitor+",server=on,wait=off",
	)
	for i := range e.Profile.Ports {
		idx := i + 1
		args = append(args,
			"-netdev", fmt.Sprintf("tap,id=net%d,ifname=%s,script=no,downscript=no", idx, e.net.link("t", idx)),
			"-device", fmt.Sprintf("virtio-net-pci,netdev=net%d,mac=52:54:%s:%s:%02x:%02x", idx, e.ID[:2], e.ID[2:4], e.net.hostIdx, idx),
		)
	}
	return e.start("router", args...)
}

func (e *Env) monitorCommand(cmd string) error {
	conn, err := net.DialTimeout("unix", e.monitor, 5*time.Second)
	if err != nil {
		return err
	}
	defer func() { _ = conn.Close() }()
	_ = conn.SetDeadline(time.Now().Add(5 * time.Second))
	if _, err := conn.Write([]byte(cmd + "\n")); err != nil {
		return err
	}
	buf := make([]byte, 4096)
	_, _ = conn.Read(buf)
	return nil
}

func (e *Env) consoleSetup(cmds []string) error {
	c, err := dialConsole(e.console, filepath.Join(e.Dir, "console.log"), 30*time.Second)
	if err != nil {
		return err
	}
	defer c.close()

	if _, _, err := c.expect(5*time.Minute, true, "login:"); err != nil {
		return fmt.Errorf("router did not reach the login prompt: %w", err)
	}
	passwordSet, err := c.login(RouterUser, e.password)
	if err != nil {
		return err
	}
	if !passwordSet {
		cmds = append([]string{fmt.Sprintf("/user set [find name=%s] password=%s", RouterUser, e.password)}, cmds...)
	}
	return c.runAll(cmds)
}

func (c *console) runAll(cmds []string) error {
	for _, cmd := range cmds {
		if err := c.send(cmd); err != nil {
			return err
		}
		_, before, err := c.expect(60*time.Second, false, "] >")
		if err != nil {
			return fmt.Errorf("run %q: %w", cmd, err)
		}
		for _, marker := range consoleErrors {
			if strings.Contains(before, marker) {
				return fmt.Errorf("run %q: %s", cmd, strings.TrimSpace(before))
			}
		}
	}
	return nil
}

func (e *Env) waitAPI(timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	for {
		_, err := e.Router.Print(ctx, "/system/identity")
		if err == nil {
			return nil
		}
		if p := e.find("router"); p != nil && !p.running() {
			return fmt.Errorf("router VM exited, see router.log")
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("router API not reachable at %s: %w", e.Router.Address, err)
		case <-time.After(3 * time.Second):
		}
	}
}

func (e *Env) waitAPIDown(timeout time.Duration) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, err := e.Router.Print(ctx, "/system/identity")
		cancel()
		if err != nil {
			return
		}
		time.Sleep(2 * time.Second)
	}
}

func (e *Env) Reboot(ctx context.Context) error {
	_, _ = e.Router.Run(ctx, "/system/reboot")
	e.waitAPIDown(90 * time.Second)
	return e.waitAPI(5 * time.Minute)
}

func (e *Env) PowerCycle(ctx context.Context) error {
	if err := e.restartProcess("router"); err != nil {
		return err
	}
	return e.waitAPI(5 * time.Minute)
}

func (e *Env) shutdown() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	_, _ = e.Router.Run(ctx, "/system/shutdown")
	cancel()
	if !e.waitExit("router", 90*time.Second) {
		e.stopProcess("router")
	}
}

func freshCommands(p *profile.Profile) ([]string, error) {
	starlink, _ := p.Interface("starlink")
	if _, err := routerPortName(p, "split"); err != nil {
		return nil, err
	}
	cmds := []string{
		"/ip dhcp-client remove [find]",
		"/interface bridge add name=bridge comment=defconf",
	}
	for i := range p.Ports {
		name := profile.LabInterface(i + 1)
		if name == starlink {
			continue
		}
		cmds = append(cmds, "/interface bridge port add bridge=bridge interface="+name+" comment=defconf")
	}
	cmds = append(cmds, "/ip address add address="+FreshRouterAddress+"/24 interface=bridge network=192.168.88.0 comment=defconf")
	if starlink != "" {
		cmds = append(cmds, "/ip dhcp-client add interface="+starlink+" disabled=no comment=defconf")
	}
	return append(cmds,
		"/ip service set api disabled=no",
		"/ip service set ssh disabled=no",
		"/ip service set winbox disabled=no",
	), nil
}

func bootstrapCommands(p *profile.Profile) ([]string, error) {
	split, err := routerPortName(p, "split")
	if err != nil {
		return nil, err
	}
	return []string{
		"/ip dhcp-client remove [find]",
		"/interface bridge add name=LANBridgeSplit comment=Split",
		"/interface bridge port add bridge=LANBridgeSplit interface=" + split + " comment=Split",
		"/ip address add address=" + RouterAddress + "/24 interface=LANBridgeSplit network=192.168.10.0 comment=Split",
		"/ip pool add name=DHCP-pool-Split ranges=192.168.10.2-192.168.10.254 comment=Split",
		"/ip dhcp-server add name=DHCP-Split interface=LANBridgeSplit address-pool=DHCP-pool-Split comment=Split",
		"/ip dhcp-server network add address=192.168.10.0/24 gateway=" + RouterAddress + " dns-server=" + RouterAddress + " comment=Split",
		"/ip service set api disabled=no",
		"/ip service set ssh disabled=no",
		"/ip service set winbox disabled=no",
	}, nil
}
