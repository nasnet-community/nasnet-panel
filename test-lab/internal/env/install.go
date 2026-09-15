package env

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"nasnet-panel/test-lab/internal/sh"
)

var deviceModeMarkers = []string{"cold power-cycle", "DEVICE_MODE_CONFIRM"}

func (e *Env) Install(ctx context.Context, installer, tar string) (string, error) {
	return e.runInstaller(ctx, installer, tar, false)
}

func (e *Env) Uninstall(ctx context.Context, installer string) (string, error) {
	return e.runInstaller(ctx, installer, "", true)
}

func (e *Env) runInstaller(ctx context.Context, installer, tar string, uninstall bool) (string, error) {
	var args []string
	switch installer {
	case "cli":
		if missing := MissingFeatureTools("cli-install"); len(missing) > 0 {
			return "", fmt.Errorf("missing tools: %s", strings.Join(missing, ", "))
		}
		cfg := filepath.Join(e.Dir, "install.env")
		content := fmt.Sprintf("ROUTER_IP=%s\nROUTER_USER=%s\nROUTER_PASS=%s\n", e.Router.Address, RouterUser, e.password)
		if err := os.WriteFile(cfg, []byte(content), 0o600); err != nil {
			return "", err
		}
		args = []string{"env", "HOME=" + e.Dir, "bash", filepath.Join(e.assets.repo, "scripts", "install.sh"), "--config", cfg, "-v"}
		if uninstall {
			args = append(args, "--uninstall")
		} else if tar != "" {
			args = append(args, "--image-tar", tar)
		}
	case "gui":
		bin, err := e.assets.headlessInstaller()
		if err != nil {
			return "", err
		}
		args = []string{bin, "-host", e.Router.Address, "-user", RouterUser, "-password", e.password}
		if uninstall {
			args = append(args, "-uninstall")
		} else if tar != "" {
			args = append(args, "-image-tar", tar)
		}
	default:
		return "", fmt.Errorf("unknown installer %q", installer)
	}

	logPath := filepath.Join(e.Dir, "install-"+installer+".log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return "", err
	}
	defer func() { _ = logFile.Close() }()

	cmd := exec.CommandContext(ctx, "ip", sh.InNS(e.net.ns("mgmt"), args...)[1:]...)
	cmd.Dir = e.assets.repo
	cmd.Stdin = strings.NewReader(strings.Repeat("y\n", 20))
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}
	cmd.Stderr = cmd.Stdout

	var mu sync.Mutex
	var output strings.Builder
	var cycled bool
	if err := cmd.Start(); err != nil {
		return "", err
	}

	scanner := bufio.NewScanner(io.TeeReader(stdout, logFile))
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		mu.Lock()
		output.WriteString(line + "\n")
		mu.Unlock()
		if !cycled && containsAny(line, deviceModeMarkers) {
			cycled = true
			go func() {
				time.Sleep(5 * time.Second)
				_ = e.restartProcess("router")
			}()
		}
	}
	err = cmd.Wait()

	mu.Lock()
	text := output.String()
	mu.Unlock()
	if err != nil {
		return text, fmt.Errorf("%s installer failed: %w, see install-%s.log", installer, err, installer)
	}

	if !uninstall {
		e.Router.Address = RouterAddress
	}
	return text, e.waitAPI(5 * time.Minute)
}

func containsAny(s string, needles []string) bool {
	for _, n := range needles {
		if strings.Contains(s, n) {
			return true
		}
	}
	return false
}
