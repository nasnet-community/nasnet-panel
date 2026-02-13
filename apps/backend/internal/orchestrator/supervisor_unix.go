//go:build unix

package orchestrator

import (
	"os/exec"
	"syscall"
)

// setupProcessGroup sets up the process group for Unix systems
func setupProcessGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}
}

// killProcessGroup kills a process group on Unix systems
func killProcessGroup(pid int, signal syscall.Signal) error {
	// Negative PID sends signal to process group
	return syscall.Kill(-pid, signal)
}
