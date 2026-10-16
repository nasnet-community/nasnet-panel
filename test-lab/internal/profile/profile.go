package profile

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

type Port struct {
	Name string `yaml:"name"`
	Kind string `yaml:"kind"`
	Role string `yaml:"role"`
}

type Profile struct {
	Name         string   `yaml:"name"`
	Model        string   `yaml:"model"`
	Arch         string   `yaml:"arch"`
	MemoryMB     int      `yaml:"memory_mb"`
	StorageMB    int      `yaml:"storage_mb"`
	CPUs         int      `yaml:"cpus"`
	Capabilities []string `yaml:"capabilities"`
	Ports        []Port   `yaml:"ports"`
}

func Load(dir, name string) (*Profile, error) {
	f, err := os.Open(filepath.Join(dir, name+".yaml"))
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	dec := yaml.NewDecoder(f)
	dec.KnownFields(true)

	var p Profile
	if err := dec.Decode(&p); err != nil {
		return nil, fmt.Errorf("profile %s: %w", name, err)
	}
	if p.Name != name {
		return nil, fmt.Errorf("profile %s: name field is %q", name, p.Name)
	}
	return &p, nil
}

func All(dir string) ([]string, error) {
	paths, err := filepath.Glob(filepath.Join(dir, "*.yaml"))
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(paths))
	for _, path := range paths {
		names = append(names, strings.TrimSuffix(filepath.Base(path), ".yaml"))
	}
	sort.Strings(names)
	return names, nil
}

func (p *Profile) PortByRole(role string) (int, Port, bool) {
	for i, port := range p.Ports {
		if port.Role == role {
			return i, port, true
		}
	}
	return 0, Port{}, false
}

func (p *Profile) Interface(role string) (string, bool) {
	i, _, ok := p.PortByRole(role)
	if !ok {
		return "", false
	}
	return LabInterface(i + 1), true
}

func LabInterface(idx int) string {
	return fmt.Sprintf("ether%d", idx)
}

func (p *Profile) MissingRoles(roles []string) []string {
	var missing []string
	for _, role := range roles {
		if _, _, ok := p.PortByRole(role); !ok {
			missing = append(missing, role)
		}
	}
	return missing
}

func (p *Profile) Has(capability string) bool {
	for _, c := range p.Capabilities {
		if c == capability {
			return true
		}
	}
	return false
}

func (p *Profile) MissingCapabilities(caps []string) []string {
	var missing []string
	for _, c := range caps {
		if !p.Has(c) {
			missing = append(missing, c)
		}
	}
	return missing
}

func (p *Profile) LiveArch() string {
	if p.Arch == "arm64" || p.Arch == "x86_64" {
		return p.Arch
	}
	return "x86_64"
}
