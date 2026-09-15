package sh

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
)

func Run(args ...string) error {
	out, err := exec.Command(args[0], args[1:]...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %w: %s", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return nil
}

func RunAll(cmds ...[]string) error {
	for _, cmd := range cmds {
		if err := Run(cmd...); err != nil {
			return err
		}
	}
	return nil
}

func Output(ctx context.Context, args ...string) ([]byte, error) {
	out, err := exec.CommandContext(ctx, args[0], args[1:]...).Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return nil, fmt.Errorf("%w: %s", err, strings.TrimSpace(string(exitErr.Stderr)))
		}
		return nil, err
	}
	return out, nil
}

func InNS(ns string, args ...string) []string {
	return append([]string{"ip", "netns", "exec", ns}, args...)
}
