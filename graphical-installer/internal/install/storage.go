package install

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
)

const minStorageMB = 128

type storageInfo struct {
	name   string
	freeMB int64
}

const diskProbeScript = `:foreach i in=[/disk/find] do={:local n ""; :do {:set n [:tostr [/disk/get $i slot]]} on-error={}; :if ([:len $n] = 0) do={:do {:set n [:tostr [/disk/get $i name]]} on-error={}}; :local f ""; :do {:set f [:tostr [/disk/get $i free]]} on-error={}; :if ([:len $f] = 0) do={:do {:set f [:tostr [/disk/get $i free-space]]} on-error={}}; :if ([:len $n] > 0) do={:put ("S=" . $n . " " . $f)}}`

const fileProbeScript = `:foreach i in=[/file/find where type="disk"] do={:put ("S=" . [/file/get $i name] . " ")}`

func (e *Engine) detectStorage() (storageInfo, error) {
	found := e.listStorage()
	if len(found) == 0 {
		return storageInfo{}, errors.New("no usable storage found on the router. The container needs a disk (USB, NVMe or an internal drive) that is formatted and listed under /disk")
	}
	sort.SliceStable(found, func(i, j int) bool { return found[i].freeMB > found[j].freeMB })
	for _, s := range found {
		if s.freeMB < 0 || s.freeMB >= minStorageMB {
			return s, nil
		}
	}
	seen := make([]string, 0, len(found))
	for _, s := range found {
		seen = append(seen, fmt.Sprintf("%s (%d MB free)", s.name, s.freeMB))
	}
	return storageInfo{}, fmt.Errorf("no router storage has the %d MB of free space the container image needs, found %s. Free up space or attach a larger disk", minStorageMB, strings.Join(seen, ", "))
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
		fields := strings.Fields(strings.TrimPrefix(line, "S="))
		if len(fields) == 0 || seen[fields[0]] {
			continue
		}
		item := storageInfo{name: fields[0], freeMB: -1}
		if len(fields) > 1 {
			if bytes, perr := strconv.ParseInt(fields[1], 10, 64); perr == nil {
				item.freeMB = bytes / 1024 / 1024
			}
		}
		seen[item.name] = true
		list = append(list, item)
	}
	return list
}
