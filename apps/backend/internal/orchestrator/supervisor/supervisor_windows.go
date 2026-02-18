//go:build windows

package supervisor

import (
	"os/exec"
	"syscall"
)

// setupProcessGroup sets up the process group for Windows systems
func setupProcessGroup(cmd *exec.Cmd) {
	// On Windows, we create a new process group
	// This allows us to send Ctrl+C events to the group
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}
}

// killProcessGroup kills a process on Windows
// Note: Windows doesn't have SIGTERM/SIGKILL, so we use TerminateProcess
func killProcessGroup(pid int, signal syscall.Signal) error { //nolint:unused // called from platform-specific code via build tags on Unix
	// On Windows, we use TerminateProcess to forcefully kill the process
	// This is roughly equivalent to SIGKILL
	proc, err := syscall.OpenProcess(syscall.PROCESS_TERMINATE, false, uint32(pid)) //nolint:gosec // int-to-uint32 conversion is safe for valid process IDs
	if err != nil {
		return err
	}
	defer syscall.CloseHandle(proc) //nolint:errcheck // best-effort handle close

	// TerminateProcess forcefully terminates the process
	return syscall.TerminateProcess(proc, 1)
}
