// Package buildinfo exposes build-time metadata about the running binary.
package buildinfo

// Version identifies the running build. CI overwrites it at link time with the
// release tag or dev SHA:
//
//	go build -ldflags "-X nasnet-panel/internal/buildinfo.Version=v1.2.3"
//
// The value below is a DUMMY placeholder for local development only — it is not
// a real release and never corresponds to a published version. Any binary built
// through the Dockerfile or a workflow has it replaced (see APP_VERSION), so a
// deployed instance reporting this string means the ldflags wiring is broken.
var Version = "v0.0.0-dev"
