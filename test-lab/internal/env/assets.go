package env

import (
	"archive/zip"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"nasnet-panel/test-lab/internal/sh"
)

const CHRVersion = "7.24.2"

type assets struct {
	cache      string
	repo       string
	baseImage  string
	arm64Image string
	panel      string
	labsvc     string
	caDir      string
	pluginsDir string

	mu sync.Mutex
}

var (
	assetsOnce   sync.Once
	cachedAssets *assets
	assetsErr    error
)

func loadAssets(opts Options) (*assets, error) {
	assetsOnce.Do(func() { cachedAssets, assetsErr = prepareAssets(opts) })
	return cachedAssets, assetsErr
}

func prepareAssets(opts Options) (*assets, error) {
	cache := opts.CacheDir
	if cache == "" {
		base, err := os.UserCacheDir()
		if err != nil {
			base = os.TempDir()
		}
		cache = filepath.Join(base, "nasnet-test-lab")
	}
	bin := filepath.Join(cache, "bin")
	if err := os.MkdirAll(bin, 0o755); err != nil {
		return nil, err
	}
	repo, err := filepath.Abs("..")
	if err != nil {
		return nil, err
	}
	pluginsDir, err := filepath.Abs(filepath.Join("fixtures", "plugins"))
	if err != nil {
		return nil, err
	}

	a := &assets{
		cache:      cache,
		repo:       repo,
		panel:      filepath.Join(bin, "panel"),
		labsvc:     filepath.Join(bin, "labsvc"),
		caDir:      filepath.Join(cache, "ca"),
		pluginsDir: pluginsDir,
	}

	raw := opts.CHRImage
	if raw == "" {
		if raw, err = downloadCHR(cache, "x86", opts.CHRSHA256); err != nil {
			return nil, err
		}
	}
	if a.baseImage, err = toQcow2(cache, raw); err != nil {
		return nil, err
	}
	if opts.CHRArm64Image != "" {
		if a.arm64Image, err = toQcow2(cache, opts.CHRArm64Image); err != nil {
			return nil, err
		}
	}

	if err := goBuild(".", a.labsvc, nil, "./cmd/labsvc"); err != nil {
		return nil, err
	}
	for _, arch := range []string{"amd64", "arm64"} {
		env := []string{"CGO_ENABLED=0", "GOOS=linux", "GOARCH=" + arch}
		if err := goBuild(".", a.staticLabsvc(archName(arch)), env, "./cmd/labsvc"); err != nil {
			return nil, err
		}
	}
	if err := goBuild(filepath.Join(repo, "backend"), a.panel, nil, "-tags", "production", "./cmd/api"); err != nil {
		return nil, err
	}
	if err := sh.Run(a.labsvc, "ca", "-dir", a.caDir); err != nil {
		return nil, err
	}
	return a, nil
}

func archName(goarch string) string {
	if goarch == "arm64" {
		return "arm64"
	}
	return "x86_64"
}

func (a *assets) staticLabsvc(liveArch string) string {
	return filepath.Join(a.cache, "bin", "labsvc-static-"+liveArch)
}

func (a *assets) caFile() string {
	return filepath.Join(a.caDir, "ca.pem")
}

func toQcow2(cache, raw string) (string, error) {
	base := filepath.Join(cache, strings.TrimSuffix(filepath.Base(raw), filepath.Ext(raw))+".qcow2")
	if _, err := os.Stat(base); err == nil {
		return base, nil
	}
	format := "raw"
	if strings.HasSuffix(raw, ".qcow2") {
		format = "qcow2"
	}
	tmp := base + ".tmp"
	if err := sh.Run("qemu-img", "convert", "-f", format, "-O", "qcow2", raw, tmp); err != nil {
		return "", err
	}
	return base, os.Rename(tmp, base)
}

func goBuild(dir, out string, env []string, args ...string) error {
	cmd := exec.Command("go", append([]string{"build", "-o", out}, args...)...)
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), env...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("go build %s in %s: %w: %s", strings.Join(args, " "), dir, err, strings.TrimSpace(string(output)))
	}
	return nil
}

func (a *assets) containerPackage(liveArch string) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	arch := "x86"
	if liveArch == "arm64" {
		arch = "arm64"
	}
	npk := filepath.Join(a.cache, fmt.Sprintf("container-%s-%s.npk", CHRVersion, arch))
	if _, err := os.Stat(npk); err == nil {
		return npk, nil
	}

	archive := filepath.Join(a.cache, fmt.Sprintf("all_packages-%s-%s.zip", arch, CHRVersion))
	if _, err := os.Stat(archive); err != nil {
		url := fmt.Sprintf("https://download.mikrotik.com/routeros/%s/all_packages-%s-%s.zip", CHRVersion, arch, CHRVersion)
		if err := download(url, archive); err != nil {
			return "", err
		}
	}
	if err := extractFile(archive, func(name string) bool {
		return strings.HasPrefix(filepath.Base(name), "container-") && strings.HasSuffix(name, ".npk")
	}, npk); err != nil {
		return "", err
	}
	return npk, nil
}

func (a *assets) headlessInstaller() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	out := filepath.Join(a.cache, "bin", "installer-headless")
	installer := filepath.Join(a.repo, "graphical-installer")
	baseline, err := os.ReadFile(filepath.Join(a.repo, "scripts", "nasnet-lan-baseline.rsc"))
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(filepath.Join(installer, "assets", "nasnet-lan-baseline.rsc"), baseline, 0o644); err != nil {
		return "", err
	}
	if err := goBuild(installer, out, nil, "./headless"); err != nil {
		return "", err
	}
	return out, nil
}

func (a *assets) patchedPanel(p Patch) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	sum := sha256.Sum256([]byte(p.File + "\x00" + p.Find + "\x00" + p.Replace))
	key := hex.EncodeToString(sum[:8])
	root := filepath.Join(a.cache, "patched", key)
	out := filepath.Join(a.cache, "bin", "panel-"+key)
	if _, err := os.Stat(out); err == nil {
		return out, nil
	}

	_ = os.RemoveAll(root)
	src := filepath.Join(a.repo, "backend")
	if err := copyTree(src, root); err != nil {
		return "", err
	}
	target := filepath.Join(root, filepath.FromSlash(p.File))
	data, err := os.ReadFile(target)
	if err != nil {
		return "", err
	}
	if !strings.Contains(string(data), p.Find) {
		return "", fmt.Errorf("patch: %q not found in %s", p.Find, p.File)
	}
	if err := os.WriteFile(target, []byte(strings.Replace(string(data), p.Find, p.Replace, 1)), 0o644); err != nil {
		return "", err
	}
	if err := goBuild(root, out, nil, "-tags", "production", "./cmd/api"); err != nil {
		return "", err
	}
	return out, nil
}

func copyTree(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		if d.IsDir() && (rel == "tmp" || rel == "bin") {
			return filepath.SkipDir
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if !d.Type().IsRegular() {
			return nil
		}
		return copyFile(path, target)
	})
}

func downloadCHR(cache, arch, wantSHA256 string) (string, error) {
	name := "chr-" + CHRVersion
	if arch == "arm64" {
		name += "-arm64"
	}
	img := filepath.Join(cache, name+".img")
	if _, err := os.Stat(img); err == nil {
		return img, nil
	}

	archive := img + ".zip"
	if _, err := os.Stat(archive); err != nil {
		url := fmt.Sprintf("https://download.mikrotik.com/routeros/%s/%s.img.zip", CHRVersion, name)
		if err := download(url, archive); err != nil {
			return "", err
		}
	}
	if wantSHA256 != "" {
		if err := verifySHA256(archive, wantSHA256); err != nil {
			return "", err
		}
	}
	if err := extractFile(archive, func(n string) bool { return strings.HasSuffix(n, ".img") }, img); err != nil {
		return "", err
	}
	return img, nil
}

func download(url, dst string) error {
	client := &http.Client{Timeout: 15 * time.Minute}
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("download %s: %w", url, err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download %s: status %d", url, resp.StatusCode)
	}
	return writeAtomic(dst, resp.Body)
}

func writeAtomic(dst string, r io.Reader) error {
	tmp := dst + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	if _, err := io.Copy(f, r); err != nil {
		_ = f.Close()
		_ = os.Remove(tmp)
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(tmp, dst)
}

func verifySHA256(path, want string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return err
	}
	if got := hex.EncodeToString(h.Sum(nil)); !strings.EqualFold(got, want) {
		return fmt.Errorf("%s: sha256 is %s, want %s", path, got, want)
	}
	return nil
}

func extractFile(archive string, match func(string) bool, dst string) error {
	zr, err := zip.OpenReader(archive)
	if err != nil {
		return err
	}
	defer func() { _ = zr.Close() }()

	for _, f := range zr.File {
		if !match(f.Name) {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		err = writeAtomic(dst, rc)
		_ = rc.Close()
		return err
	}
	return fmt.Errorf("%s: no matching file inside", archive)
}
