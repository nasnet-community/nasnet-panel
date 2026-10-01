package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

var pluginPathPrefixes = []string{
	"/nasnet-community/nasnet-panel-plugins/refs/heads/main/",
	"/nasnet-community/nasnet-panel-plugins/main/",
}

type ociImage struct {
	manifest []byte
	digest   string
	blobs    map[string][]byte
}

func registryHandler(pluginsDir string, images map[string]*ociImage) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v2/") {
			serveOCI(w, r, images)
			return
		}
		for _, prefix := range pluginPathPrefixes {
			if rel, ok := strings.CutPrefix(r.URL.Path, prefix); ok && pluginsDir != "" {
				clean := filepath.Join(pluginsDir, filepath.FromSlash(path.Clean("/"+rel)))
				http.ServeFile(w, r, clean)
				return
			}
		}
		http.NotFound(w, r)
	})
}

func serveOCI(w http.ResponseWriter, r *http.Request, images map[string]*ociImage) {
	rest := strings.TrimPrefix(r.URL.Path, "/v2/")
	if rest == "" {
		w.Header().Set("Docker-Distribution-API-Version", "registry/2.0")
		_, _ = w.Write([]byte("{}"))
		return
	}

	if repo, ref, ok := cutLast(rest, "/manifests/"); ok {
		img, found := images[repo]
		if !found || (ref != "latest" && ref != "1" && ref != img.digest) {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/vnd.docker.distribution.manifest.v2+json")
		w.Header().Set("Docker-Content-Digest", img.digest)
		if r.Method != http.MethodHead {
			_, _ = w.Write(img.manifest)
		}
		return
	}

	if repo, digest, ok := cutLast(rest, "/blobs/"); ok {
		img, found := images[repo]
		if !found {
			http.NotFound(w, r)
			return
		}
		blob, found := img.blobs[digest]
		if !found {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Docker-Content-Digest", digest)
		if r.Method != http.MethodHead {
			_, _ = w.Write(blob)
		}
		return
	}
	http.NotFound(w, r)
}

func cutLast(s, sep string) (string, string, bool) {
	i := strings.LastIndex(s, sep)
	if i < 0 {
		return "", "", false
	}
	return s[:i], s[i+len(sep):], true
}

func buildImage(binaryPath, arch string, entrypoint []string) (*ociImage, error) {
	binary, err := os.ReadFile(binaryPath)
	if err != nil {
		return nil, err
	}

	var layerTar bytes.Buffer
	tw := tar.NewWriter(&layerTar)
	name := path.Base(entrypoint[0])
	if err := tw.WriteHeader(&tar.Header{Name: name, Mode: 0o755, Size: int64(len(binary)), ModTime: time.Unix(0, 0)}); err != nil {
		return nil, err
	}
	if _, err := tw.Write(binary); err != nil {
		return nil, err
	}
	if err := tw.Close(); err != nil {
		return nil, err
	}

	var layerGz bytes.Buffer
	gz := gzip.NewWriter(&layerGz)
	if _, err := gz.Write(layerTar.Bytes()); err != nil {
		return nil, err
	}
	if err := gz.Close(); err != nil {
		return nil, err
	}

	config, err := json.Marshal(map[string]any{
		"architecture": arch,
		"os":           "linux",
		"config":       map[string]any{"Entrypoint": entrypoint},
		"rootfs":       map[string]any{"type": "layers", "diff_ids": []string{digestOf(layerTar.Bytes())}},
	})
	if err != nil {
		return nil, err
	}

	layerDigest, configDigest := digestOf(layerGz.Bytes()), digestOf(config)
	manifest, err := json.Marshal(map[string]any{
		"schemaVersion": 2,
		"mediaType":     "application/vnd.docker.distribution.manifest.v2+json",
		"config": map[string]any{
			"mediaType": "application/vnd.docker.container.image.v1+json",
			"size":      len(config),
			"digest":    configDigest,
		},
		"layers": []map[string]any{{
			"mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
			"size":      layerGz.Len(),
			"digest":    layerDigest,
		}},
	})
	if err != nil {
		return nil, err
	}

	return &ociImage{
		manifest: manifest,
		digest:   digestOf(manifest),
		blobs:    map[string][]byte{layerDigest: layerGz.Bytes(), configDigest: config},
	}, nil
}

func digestOf(data []byte) string {
	sum := sha256.Sum256(data)
	return fmt.Sprintf("sha256:%s", hex.EncodeToString(sum[:]))
}
