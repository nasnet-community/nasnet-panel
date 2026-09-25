package env

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"nasnet-panel/test-lab/internal/sh"
)

func (e *Env) prepareContainer() error {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
	defer cancel()

	installed, err := e.hasContainerPackage(ctx)
	if err != nil {
		return err
	}
	if !installed {
		npk, err := e.assets.containerPackage(e.liveArch)
		if err != nil {
			return err
		}
		if err := e.Upload(ctx, npk, filepath.Base(npk)); err != nil {
			return err
		}
		if err := e.Reboot(ctx); err != nil {
			return err
		}
		if installed, err = e.hasContainerPackage(ctx); err != nil {
			return err
		}
		if !installed {
			return fmt.Errorf("container package still missing after reboot")
		}
	}

	enabled, err := e.ContainerModeEnabled(ctx)
	if err != nil {
		return err
	}
	if enabled {
		return nil
	}
	if err := e.RequestContainerMode(); err != nil {
		return err
	}
	if err := e.PowerCycle(ctx); err != nil {
		return err
	}
	if enabled, err = e.ContainerModeEnabled(ctx); err != nil {
		return err
	}
	if !enabled {
		return fmt.Errorf("device-mode container is still off after the power cycle")
	}
	return nil
}

func (e *Env) hasContainerPackage(ctx context.Context) (bool, error) {
	rows, err := e.Router.Print(ctx, "/system/package", "?name=container")
	if err != nil {
		return false, err
	}
	return len(rows) > 0, nil
}

func (e *Env) ContainerModeEnabled(ctx context.Context) (bool, error) {
	rows, err := e.Router.Print(ctx, "/system/device-mode")
	if err != nil {
		return false, err
	}
	for _, row := range rows {
		if v := row["container"]; v == "yes" || v == "true" {
			return true, nil
		}
	}
	return false, nil
}

func (e *Env) SetContainerMode(ctx context.Context, on bool) error {
	value := "no"
	if on {
		value = "yes"
	}
	if err := e.consoleCommand("/system/device-mode/update container=" + value); err != nil {
		return err
	}
	return e.PowerCycle(ctx)
}

func (e *Env) RequestContainerMode() error {
	return e.consoleCommand("/system/device-mode/update container=yes")
}

func (e *Env) consoleCommand(cmd string) error {
	c, err := dialConsole(e.console, filepath.Join(e.Dir, "console.log"), 30*time.Second)
	if err != nil {
		return err
	}
	defer c.close()
	match, _, err := c.expect(2*time.Minute, true, "login:", "] >")
	if err != nil {
		return err
	}
	if match == "login:" {
		if _, err := c.login(RouterUser, e.password); err != nil {
			return err
		}
	}
	if err := c.send(cmd); err != nil {
		return err
	}
	time.Sleep(10 * time.Second)
	return nil
}

func (e *Env) Upload(ctx context.Context, local, remote string) error {
	return sh.RunAll(sh.InNS(e.net.ns("mgmt"), e.assets.labsvc, "upload",
		"-addr", e.Router.Address, "-user", RouterUser, "-pass", e.password,
		"-local", local, "-remote", remote))
}
