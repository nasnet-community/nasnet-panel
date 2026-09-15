//go:build lab

package testlab

import (
	"nasnet-panel/test-lab/internal/env"
	"nasnet-panel/test-lab/internal/runner"
)

func config() runner.Config {
	return runner.Config{
		Options: env.Options{
			Keep:             *flagKeep,
			CHRImage:         *flagCHR,
			CHRSHA256:        *flagCHRSHA256,
			CHRArm64Image:    *flagCHRArm64,
			EFI:              *flagEFI,
			CacheDir:         *flagCache,
			Artifacts:        *flagArtifacts,
			ImageTar:         *flagImageTar,
			PreviousImageTar: *flagPreviousImageTar,
			Internet:         *flagInternet,
		},
		Scenario:     *flagScenario,
		Profile:      *flagProfile,
		ScenariosDir: "scenarios",
		ProfilesDir:  "profiles",
	}
}
