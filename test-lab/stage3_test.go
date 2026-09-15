//go:build lab

package testlab

import (
	"testing"

	"nasnet-panel/test-lab/internal/runner"
)

func TestStage3(t *testing.T) {
	runner.Stage(t, "resilience", config())
}
