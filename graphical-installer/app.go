package main

import (
	"context"
	"errors"
	"net"
	"strconv"
	"sync"
	"time"

	"nasnet-panel-installer/internal/buildinfo"
	"nasnet-panel-installer/internal/install"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context

	mu        sync.Mutex
	running   bool
	cancel    context.CancelFunc
	deviceCh  chan bool
	rebootCh  chan bool
	storageCh chan string
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) AppVersion() string {
	return buildinfo.Version
}

type ProbeResult struct {
	Winbox bool `json:"winbox"`
	SSH    bool `json:"ssh"`
}

func (a *App) ProbeRouter(host string, winboxPort, sshPort int) ProbeResult {
	return ProbeResult{
		Winbox: portOpen(host, winboxPort),
		SSH:    portOpen(host, sshPort),
	}
}

func portOpen(host string, port int) bool {
	conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, strconv.Itoa(port)), 3*time.Second)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

func (a *App) SelectImageTar() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select container image tar",
		Filters: []runtime.FileFilter{
			{DisplayName: "Container image (*.tar)", Pattern: "*.tar"},
		},
	})
}

func (a *App) InstallSteps() []install.StepInfo {
	return install.InstallStepList()
}

func (a *App) UninstallSteps() []install.StepInfo {
	return install.UninstallStepList()
}

func (a *App) StartInstall(opts install.Options) error {
	return a.start(opts, false)
}

func (a *App) StartUninstall(opts install.Options) error {
	return a.start(opts, true)
}

func (a *App) start(opts install.Options, uninstall bool) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.running {
		return errors.New("an operation is already running")
	}
	if opts.Host == "" {
		return errors.New("router IP is required")
	}
	ctx, cancel := context.WithCancel(a.ctx)
	a.running = true
	a.cancel = cancel
	a.deviceCh = make(chan bool, 1)
	a.rebootCh = make(chan bool, 1)
	a.storageCh = make(chan string, 1)

	eng := install.New(ctx, opts, a.events(ctx))
	go func() {
		var err error
		if uninstall {
			err = eng.RunUninstall()
		} else {
			err = eng.Run()
		}
		if err != nil {
			runtime.EventsEmit(a.ctx, "install:error", err.Error())
		}
		a.mu.Lock()
		a.running = false
		a.cancel = nil
		a.mu.Unlock()
		cancel()
	}()
	return nil
}

func (a *App) events(ctx context.Context) install.Events {
	return install.Events{
		Step: func(id, status, detail string) {
			runtime.EventsEmit(a.ctx, "install:step", map[string]any{"id": id, "status": status, "detail": detail})
		},
		Log: func(line string) {
			runtime.EventsEmit(a.ctx, "install:log", line)
		},
		Progress: func(id string, percent float64, detail string) {
			runtime.EventsEmit(a.ctx, "install:progress", map[string]any{"id": id, "percent": percent, "detail": detail})
		},
		SysInfo: func(info install.SystemInfo) {
			runtime.EventsEmit(a.ctx, "install:sysinfo", info)
		},
		DeviceModePrompt: func() bool {
			runtime.EventsEmit(a.ctx, "install:device-mode", map[string]any{"timeout": 120})
			select {
			case v := <-a.deviceCh:
				return v
			case <-ctx.Done():
				return false
			}
		},
		DeviceModeTick: func(remaining int, routerState string) {
			runtime.EventsEmit(a.ctx, "install:device-mode-tick", map[string]any{"remaining": remaining, "state": routerState})
		},
		DeviceModeDone: func() {
			runtime.EventsEmit(a.ctx, "install:device-mode-done", nil)
		},
		StoragePrompt: func(choices []install.StorageChoice) string {
			runtime.EventsEmit(a.ctx, "install:storage", map[string]any{"choices": choices})
			select {
			case v := <-a.storageCh:
				return v
			case <-ctx.Done():
				return ""
			}
		},
		RebootNotice: func(reason string) {
			runtime.EventsEmit(a.ctx, "install:reboot-auto", map[string]any{"reason": reason})
		},
		RebootPrompt: func(reason string) bool {
			runtime.EventsEmit(a.ctx, "install:reboot", map[string]any{"timeout": 300, "reason": reason})
			select {
			case v := <-a.rebootCh:
				return v
			case <-ctx.Done():
				return false
			}
		},
		RebootTick: func(elapsed int, routerState string) {
			runtime.EventsEmit(a.ctx, "install:reboot-tick", map[string]any{"elapsed": elapsed, "state": routerState})
		},
		RebootDone: func() {
			runtime.EventsEmit(a.ctx, "install:reboot-done", nil)
		},
		Done: func(urls []string, note string) {
			runtime.EventsEmit(a.ctx, "install:done", map[string]any{"urls": urls, "note": note})
		},
	}
}

func (a *App) ConfirmDeviceMode(accept bool) {
	a.mu.Lock()
	ch := a.deviceCh
	a.mu.Unlock()
	if ch != nil {
		select {
		case ch <- accept:
		default:
		}
	}
}

func (a *App) ConfirmStorage(name string) {
	a.mu.Lock()
	ch := a.storageCh
	a.mu.Unlock()
	if ch != nil {
		select {
		case ch <- name:
		default:
		}
	}
}

func (a *App) ConfirmReboot(accept bool) {
	a.mu.Lock()
	ch := a.rebootCh
	a.mu.Unlock()
	if ch != nil {
		select {
		case ch <- accept:
		default:
		}
	}
}

func (a *App) CancelRun() {
	a.mu.Lock()
	cancel := a.cancel
	a.mu.Unlock()
	if cancel != nil {
		cancel()
	}
}

func (a *App) OpenURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}
