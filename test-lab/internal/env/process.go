package env

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
)

type process struct {
	name string
	args []string
	cmd  *exec.Cmd
	out  *os.File
	done chan struct{}
}

func (e *Env) start(name string, args ...string) error {
	out, err := os.OpenFile(filepath.Join(e.Dir, name+".log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return err
	}

	cmd := exec.Command(args[0], args[1:]...)
	cmd.Dir = e.Dir
	cmd.Stdout = out
	cmd.Stderr = out
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		_ = out.Close()
		return fmt.Errorf("start %s: %w", name, err)
	}

	p := &process{name: name, args: args, cmd: cmd, out: out, done: make(chan struct{})}
	go func() {
		_ = cmd.Wait()
		close(p.done)
	}()
	e.procs = append(e.procs, p)
	return nil
}

func (e *Env) find(name string) *process {
	for i := len(e.procs) - 1; i >= 0; i-- {
		if e.procs[i].name == name {
			return e.procs[i]
		}
	}
	return nil
}

func (e *Env) stopProcess(name string) {
	if p := e.find(name); p != nil {
		p.stop()
	}
}

func (e *Env) restartProcess(name string) error {
	p := e.find(name)
	if p == nil {
		return fmt.Errorf("no process %s", name)
	}
	p.stop()
	return e.start(name, p.args...)
}

func (e *Env) waitExit(name string, timeout time.Duration) bool {
	p := e.find(name)
	if p == nil {
		return true
	}
	select {
	case <-p.done:
		return true
	case <-time.After(timeout):
		return false
	}
}

func (p *process) running() bool {
	select {
	case <-p.done:
		return false
	default:
		return true
	}
}

func (p *process) stop() {
	if p.running() && p.cmd.Process != nil {
		_ = syscall.Kill(-p.cmd.Process.Pid, syscall.SIGTERM)
		select {
		case <-p.done:
		case <-time.After(5 * time.Second):
			_ = syscall.Kill(-p.cmd.Process.Pid, syscall.SIGKILL)
			<-p.done
		}
	}
	_ = p.out.Close()
}
