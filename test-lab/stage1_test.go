//go:build lab

package testlab

import (
	"testing"

	"nasnet-panel/test-lab/internal/runner"
)

func TestStage1(t *testing.T) {
	runner.Stage(t, "install", config())
}
