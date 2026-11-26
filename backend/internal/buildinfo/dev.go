//go:build !production

package buildinfo

import (
	"bufio"
	"os"
	"strings"
	"sync"
)

const (
	devUserIDEnv     = "NASNET_DEV_USER_ID"
	devSigningKeyEnv = "NASNET_DEV_SIGNING_KEY"
	devRouterPassEnv = "NASNET_DEV_ROUTER_PASSWORD" //nolint:gosec // environment variable name, not a credential
	devEnvPrefix     = "NASNET_DEV_"
)

var (
	devEnvFiles = []string{".env.local", "backend/.env.local"}
	devEnvOnce  sync.Once
)

// DevRouterUserID returns the user ID to use instead of a generated one, read
// from the NASNET_DEV_USER_ID environment variable or the git-ignored
// .env.local file. It exists only in builds without the production tag.
func DevRouterUserID() string {
	return devEnv(devUserIDEnv)
}

// DevSigningKey returns the JWT signing key to use instead of a random one,
// read from the NASNET_DEV_SIGNING_KEY environment variable or the git-ignored
// .env.local file. It exists only in builds without the production tag.
func DevSigningKey() string {
	return devEnv(devSigningKeyEnv)
}

// DevRouterPassword returns the RouterOS password used to restore a session
// lost on restart, read from the NASNET_DEV_ROUTER_PASSWORD environment
// variable or the git-ignored .env.local file. It exists only in builds without
// the production tag.
func DevRouterPassword() string {
	return devEnv(devRouterPassEnv)
}

func devEnv(name string) string {
	devEnvOnce.Do(loadDevEnvFiles)
	return strings.TrimSpace(os.Getenv(name))
}

func loadDevEnvFiles() {
	for _, path := range devEnvFiles {
		file, err := os.Open(path) //nolint:gosec // fixed development file names
		if err != nil {
			continue
		}
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			key, value, ok := strings.Cut(strings.TrimSpace(scanner.Text()), "=")
			if !ok || !strings.HasPrefix(key, devEnvPrefix) {
				continue
			}
			if _, set := os.LookupEnv(key); !set {
				_ = os.Setenv(key, strings.Trim(strings.TrimSpace(value), `"'`))
			}
		}
		_ = file.Close()
	}
}
