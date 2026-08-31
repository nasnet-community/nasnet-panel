package install

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
)

const minStorageMB = 32

const internalStorageLabel = "internal flash"

type storageInfo struct {
	name   string
	freeMB int64
}

func (s storageInfo) label() string {
	if s.name == "" {
		return internalStorageLabel
	}
	return s.name
}

func (s storageInfo) path(rel string) string {
	if s.name == "" {
		return rel
	}
	return s.name + "/" + rel
}

const diskProbeScript = `:foreach i in=[/disk/find] do={:local n ""; :do {:set n [:tostr [/disk/get $i slot]]} on-error={}; :if ([:len $n] = 0) do={:do {:set n [:tostr [/disk/get $i name]]} on-error={}}; :local f ""; :do {:set f [:tostr [/disk/get $i free]]} on-error={}; :if ([:len $f] = 0) do={:do {:set f [:tostr [/disk/get $i free-space]]} on-error={}}; :if ([:len $f] = 0) do={:set f "-"}; :if ([:len $n] > 0) do={:put ("S=" . $f . " " . $n)}}`

const fileProbeScript = `:foreach i in=[/file/find where type="disk"] do={:put ("S=- " . [/file/get $i name])}`

func (e *Engine) detectStorage() (storageInfo, error) {
	internal := e.internalStorage()
	if internal.freeMB < 0 || internal.freeMB >= minStorageMB {
		return internal, nil
	}
	e.log("internal flash has %d MB free, less than the %d MB the container image needs", internal.freeMB, minStorageMB)

	disks := e.listStorage()
	sort.SliceStable(disks, func(i, j int) bool { return disks[i].freeMB > disks[j].freeMB })
	var usable []storageInfo
	for _, d := range disks {
		if d.freeMB < 0 || d.freeMB >= minStorageMB {
			usable = append(usable, d)
		}
	}
	if len(usable) == 0 {
		seen := []string{fmt.Sprintf("%s (%d MB free)", internalStorageLabel, internal.freeMB)}
		for _, d := range disks {
			seen = append(seen, fmt.Sprintf("%s (%d MB free)", d.name, d.freeMB))
		}
		return storageInfo{}, fmt.Errorf("no router storage has the %d MB of free space the container image needs, found %s. Free up space or attach a disk (USB, NVMe or an internal drive) that is formatted and listed under /disk", minStorageMB, strings.Join(seen, ", "))
	}

	choices := make([]StorageChoice, 0, len(usable))
	for _, d := range usable {
		choices = append(choices, StorageChoice{Name: d.name, Label: d.label(), FreeMB: d.freeMB})
	}
	picked := e.ev.StoragePrompt(choices)
	if picked == "" {
		return storageInfo{}, fmt.Errorf("no storage picked, the internal flash has only %d MB free", internal.freeMB)
	}
	for _, d := range usable {
		if d.name == picked {
			return d, nil
		}
	}
	return storageInfo{}, fmt.Errorf("storage %s is not one of the disks found on the router", picked)
}

func (e *Engine) internalStorage() storageInfo {
	out, err := e.cl.RunRaw(`:put ("H=" . [/system/resource/get free-hdd-space])`, 15*time.Second)
	info := storageInfo{freeMB: -1}
	if err != nil {
		return info
	}
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "H=") {
			continue
		}
		if bytes, perr := strconv.ParseInt(strings.TrimPrefix(line, "H="), 10, 64); perr == nil {
			info.freeMB = bytes / 1024 / 1024
		}
	}
	return info
}

func (e *Engine) listStorage() []storageInfo {
	out, err := e.cl.RunRaw(diskProbeScript, 20*time.Second)
	if list := parseStorage(out, err); len(list) > 0 {
		return list
	}
	out, err = e.cl.RunRaw(fileProbeScript, 20*time.Second)
	return parseStorage(out, err)
}

func parseStorage(out string, err error) []storageInfo {
	if err != nil {
		return nil
	}
	var list []storageInfo
	seen := make(map[string]bool)
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "S=") {
			continue
		}
		free, name, ok := strings.Cut(strings.TrimSpace(strings.TrimPrefix(line, "S=")), " ")
		name = strings.TrimSpace(name)
		if !ok || name == "" || seen[name] {
			continue
		}
		item := storageInfo{name: name, freeMB: -1}
		if bytes, perr := strconv.ParseInt(free, 10, 64); perr == nil {
			item.freeMB = bytes / 1024 / 1024
		}
		seen[name] = true
		list = append(list, item)
	}
	return list
}

func (e *Engine) verifyStorageWritable(s storageInfo) error {
	probe := s.path("nasnet-panel-write-test")
	if e.opts.DryRun {
		e.log("[dry-run] would write %s to check the storage is writable", probe)
		return nil
	}
	payload := "nasnet-panel\n"
	if err := e.cl.UploadReader(strings.NewReader(payload), int64(len(payload)), probe, nil); err != nil {
		return fmt.Errorf("router storage %s is not writable (%v). Make sure the disk is formatted and mounted, then re-run the installer", s.label(), err)
	}
	e.removeRemoteFile(probe)
	return nil
}
