package env

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"nasnet-panel/test-lab/internal/sh"
)

var (
	sessionOnce     sync.Once
	sessionPass     string
	goldenDirOnce   sync.Once
	goldenDirectory string
)

func sessionPassword() string {
	sessionOnce.Do(func() { sessionPass = randomHex(8) })
	return sessionPass
}

func goldenDir(e *Env) string {
	goldenDirOnce.Do(func() {
		root := filepath.Join(e.assets.cache, "goldens")
		_ = os.RemoveAll(root)
		goldenDirectory = filepath.Join(root, randomHex(4))
		_ = os.MkdirAll(goldenDirectory, 0o755)
	})
	return goldenDirectory
}

func goldenPath(e *Env, start string) string {
	return filepath.Join(goldenDir(e), fmt.Sprintf("%s-%s-%s.qcow2", e.Profile.Name, e.liveArch, start))
}

func findGolden(e *Env, start string) (string, bool) {
	path := goldenPath(e, start)
	if _, err := os.Stat(path); err != nil {
		return "", false
	}
	return path, true
}

func saveGolden(e *Env, start string) error {
	e.shutdown()
	path := goldenPath(e, start)
	tmp := path + ".tmp"
	if err := sh.Run("qemu-img", "convert", "-O", "qcow2", e.disk, tmp); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		return err
	}
	if err := e.bootVM(); err != nil {
		return err
	}
	if e.find("l2tp") != nil {
		if err := e.restartProcess("l2tp"); err != nil {
			return err
		}
	}
	return e.waitAPI(5 * time.Minute)
}
