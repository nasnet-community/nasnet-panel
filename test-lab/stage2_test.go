//go:build lab

package testlab

import (
	"testing"

	"nasnet-panel/test-lab/internal/runner"
)

func TestStage2(t *testing.T) {
	runner.Stage(t, "wizard", config())
}
