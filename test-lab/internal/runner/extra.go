package runner

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"nasnet-panel/test-lab/internal/expect"
	"nasnet-panel/test-lab/internal/scenario"
)

var volatileKeys = map[string]bool{
	".id": true, "bytes": true, "packets": true, "uptime": true, "creation-time": true,
	"running": true, "status": true, "last-handshake": true, "rx": true, "tx": true,
	"rx-byte": true, "tx-byte": true, "rx-packet": true, "tx-packet": true, "invalid": true,
	"active": true, "dynamic": true, "expires-after": true, "last-seen": true, "time": true,
	"cpu-usage": true, "memory-current": true, "container-size": true, "restart-count": true,
	"debug-info": true, "role": true, "edge-port": true, "forwarding": true, "learning": true,
	"forward-transitions": true, "discard-transitions": true, "designated-bridge-id": true,
	"designated-cost": true, "designated-port-id": true, "root-path-cost": true, "sending-rstp": true,
	"port-number": true, "external-fdb-status": true, "inactive": true, "hw-offload-group": true,
}

func splitPaths(value string) []string {
	var paths []string
	for _, p := range strings.Split(value, ",") {
		if p = strings.TrimSpace(p); p != "" {
			paths = append(paths, p)
		}
	}
	return paths
}

func (r *run) snapshot(ctx context.Context, name string, paths []string) error {
	if name == "" || len(paths) == 0 {
		return fmt.Errorf("config_snapshot needs name and paths")
	}
	snap := map[string][]map[string]string{}
	for _, path := range paths {
		rows, err := r.lab.Router.Print(ctx, path)
		if err != nil {
			return err
		}
		snap[path] = rows
	}
	r.snapshots[name] = snap
	return nil
}

func (r *run) unchanged(e *scenario.Expect, inherited string) {
	r.t.Helper()
	if e == nil {
		return
	}
	for _, u := range e.Unchanged {
		name := "config unchanged since " + u.Since
		before, ok := r.snapshots[u.Since]
		if !ok {
			r.t.Errorf("%s: no snapshot named %q", name, u.Since)
			continue
		}
		paths := u.Paths
		if len(paths) == 0 {
			for path := range before {
				paths = append(paths, path)
			}
			sort.Strings(paths)
		}

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		var problems []string
		for _, path := range paths {
			now, err := r.lab.Router.Print(ctx, path)
			if err != nil {
				problems = append(problems, fmt.Sprintf("%s: %v", path, err))
				continue
			}
			added, removed := diffRows(canonical(before[path], u.Ignore), canonical(now, u.Ignore))
			for _, row := range added {
				problems = append(problems, fmt.Sprintf("%s added {%s}", path, row))
			}
			for _, row := range removed {
				problems = append(problems, fmt.Sprintf("%s removed {%s}", path, row))
			}
		}
		cancel()

		var err error
		if len(problems) > 0 {
			err = fmt.Errorf("%s", strings.Join(problems, "; "))
		}
		expect.Report(r.t, name, bug(u.KnownBug, inherited), err)
	}
}

func canonical(rows []map[string]string, ignore []string) []string {
	var out []string
rows:
	for _, row := range rows {
		if row["dynamic"] == "true" || row["connection"] == "true" {
			continue
		}
		keys := make([]string, 0, len(row))
		for k, v := range row {
			for _, needle := range ignore {
				if needle != "" && strings.Contains(v, needle) {
					continue rows
				}
			}
			if !volatileKeys[k] {
				keys = append(keys, k)
			}
		}
		sort.Strings(keys)
		parts := make([]string, 0, len(keys))
		for _, k := range keys {
			parts = append(parts, k+"="+row[k])
		}
		out = append(out, strings.Join(parts, " "))
	}
	return out
}

func diffRows(before, after []string) ([]string, []string) {
	count := map[string]int{}
	for _, row := range before {
		count[row]++
	}
	var added []string
	for _, row := range after {
		if count[row] > 0 {
			count[row]--
			continue
		}
		added = append(added, row)
	}
	var removed []string
	for row, n := range count {
		for i := 0; i < n; i++ {
			removed = append(removed, row)
		}
	}
	sort.Strings(removed)
	return added, removed
}

func (r *run) restartContainer(ctx context.Context, name string) error {
	rows, err := r.lab.Router.PrintWhere(ctx, "/container", map[string]string{"name": name})
	if err != nil {
		return err
	}
	if len(rows) == 0 {
		return fmt.Errorf("no container %q", name)
	}
	id := rows[0][".id"]

	if _, err := r.lab.Router.Run(ctx, "/container/stop", "=.id="+id); err != nil {
		return err
	}
	if err := expect.Eventually(ctx, 90*time.Second, 3*time.Second, containerState(r, id, false)); err != nil {
		return err
	}
	if _, err := r.lab.Router.Run(ctx, "/container/start", "=.id="+id); err != nil {
		return err
	}
	return expect.Eventually(ctx, 2*time.Minute, 3*time.Second, containerState(r, id, true))
}

func containerState(r *run, id string, wantRunning bool) func(context.Context) error {
	return func(ctx context.Context) error {
		rows, err := r.lab.Router.PrintWhere(ctx, "/container", map[string]string{".id": id})
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			return fmt.Errorf("container %s gone", id)
		}
		if wantRunning && !expect.ContainerRunning(rows[0]) {
			return fmt.Errorf("container %s not running yet", id)
		}
		if !wantRunning && !expect.ContainerStopped(rows[0]) {
			return fmt.Errorf("container %s not stopped yet", id)
		}
		return nil
	}
}

func checkUnique(data any, spec string) error {
	i := strings.LastIndex(spec, ".")
	if i < 0 {
		return fmt.Errorf("unique %q needs array.field", spec)
	}
	list, ok := lookup(data, spec[:i])
	if !ok {
		return fmt.Errorf("%s missing in response", spec[:i])
	}
	items, ok := list.([]any)
	if !ok {
		return fmt.Errorf("%s is not a list", spec[:i])
	}
	seen := map[string]bool{}
	var dups []string
	for _, item := range items {
		v, ok := lookup(item, spec[i+1:])
		if !ok {
			continue
		}
		key := fmt.Sprint(v)
		if seen[key] {
			dups = append(dups, key)
		}
		seen[key] = true
	}
	if len(dups) > 0 {
		return fmt.Errorf("%s repeats %s", spec, strings.Join(dups, ", "))
	}
	return nil
}

var Actions = map[string][]string{
	"wizard":             nil,
	"wizard_start":       nil,
	"wizard_wait":        nil,
	"disconnect_panel":   nil,
	"reboot":             nil,
	"power_cycle":        nil,
	"link_down":          {"link"},
	"link_up":            {"link"},
	"filter":             {"target"},
	"clear_filters":      nil,
	"vpn_server_down":    {"type"},
	"vpn_server_up":      {"type"},
	"api":                nil,
	"restart_panel":      nil,
	"install":            {"installer"},
	"uninstall":          {"installer"},
	"plugin_install":     {"id"},
	"plugin_uninstall":   {"id"},
	"lab_registry":       nil,
	"router":             {"cmd"},
	"segment_client":     {"client", "bridge"},
	"openvpn_connect":    nil,
	"sleep":              nil,
	"reset_counters":     nil,
	"change_wan":         {"role", "type"},
	"container_mode":     {"value"},
	"container_restart":  {"name"},
	"config_snapshot":    {"name", "paths"},
	"wait_domestic_list": nil,
}
