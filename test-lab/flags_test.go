//go:build lab

package testlab

import "flag"

var (
	flagScenario         = flag.String("scenario", "", "run only scenarios whose id starts with this prefix")
	flagProfile          = flag.String("profile", "", "run only this device profile")
	flagKeep             = flag.Bool("keep", false, "leave the lab running when a test fails")
	flagCHR              = flag.String("chr", "", "path to a raw CHR x86 image instead of downloading one")
	flagCHRSHA256        = flag.String("chr-sha256", "", "expected sha256 of the downloaded CHR zip")
	flagCHRArm64         = flag.String("chr-arm64", "", "path to a CHR arm64 image, enables arm64 profiles on an arm64 KVM host")
	flagEFI              = flag.String("efi", "", "UEFI firmware for the arm64 CHR, for example QEMU_EFI.fd")
	flagCache            = flag.String("cache", "", "cache directory for images, packages and built binaries")
	flagArtifacts        = flag.String("artifacts", "artifacts", "directory for logs of failed tests")
	flagImageTar         = flag.String("image-tar", "", "panel container image tar built from this checkout")
	flagPreviousImageTar = flag.String("previous-image-tar", "", "panel container image tar of the previous release, for update scenarios")
	flagInternet         = flag.Bool("internet", false, "give the lab real internet access for scenarios that pull real plugin images")
	flagShard            = flag.String("shard", "", "run only shard i of n, for example 1/2")
)
