package handler

import (
	"strings"
	"testing"
)

func TestParseContainerOptionsLeftOut(t *testing.T) {
	got, err := parseContainerOptions(PluginManifestContainer{Image: "x", Env: map[string]string{"A": "b"}})
	if err != nil {
		t.Fatal(err)
	}
	if got != (containerOptions{}) {
		t.Fatalf("a manifest without settings gave %+v, want none", got)
	}
}

func TestParseContainerOptionsAccepted(t *testing.T) {
	for name, tc := range map[string]struct {
		in   PluginManifestContainer
		want containerOptions
	}{
		"everything": {
			PluginManifestContainer{
				MemoryHigh: "128M", MemoryMax: "256M", CPUList: "cpu0,cpu1", User: "1000:1000",
				Devices: []string{"serial0", "0000:00:03.0"}, AutoRestartInterval: "30s",
			},
			containerOptions{
				MemoryHigh: 128 << 20, MemoryMax: 256 << 20, CPUList: "cpu0,cpu1", User: "1000:1000",
				Devices: "serial0,0000:00:03.0", AutoRestartInterval: "30s",
			},
		},
		"plain bytes":                {PluginManifestContainer{MemoryHigh: "1024"}, containerOptions{MemoryHigh: 1024}},
		"kilobytes":                  {PluginManifestContainer{MemoryHigh: "4k"}, containerOptions{MemoryHigh: 4096}},
		"lower case megabytes":       {PluginManifestContainer{MemoryHigh: "2m"}, containerOptions{MemoryHigh: 2 << 20}},
		"gigabytes":                  {PluginManifestContainer{MemoryHigh: "1G"}, containerOptions{MemoryHigh: 1 << 30}},
		"memoryMax at the floor":     {PluginManifestContainer{MemoryMax: "1M"}, containerOptions{MemoryMax: 1 << 20}},
		"high equal to max":          {PluginManifestContainer{MemoryHigh: "64M", MemoryMax: "64M"}, containerOptions{MemoryHigh: 64 << 20, MemoryMax: 64 << 20}},
		"spaces are trimmed":         {PluginManifestContainer{MemoryHigh: " 64M ", User: " nobody "}, containerOptions{MemoryHigh: 64 << 20, User: "nobody"}},
		"one core":                   {PluginManifestContainer{CPUList: "cpu0"}, containerOptions{CPUList: "cpu0"}},
		"numeric user":               {PluginManifestContainer{User: "1000"}, containerOptions{User: "1000"}},
		"user and group names":       {PluginManifestContainer{User: "app:app"}, containerOptions{User: "app:app"}},
		"user name with a hyphen":    {PluginManifestContainer{User: "Debian-exim"}, containerOptions{User: "Debian-exim"}},
		"minutes":                    {PluginManifestContainer{AutoRestartInterval: "5m"}, containerOptions{AutoRestartInterval: "5m"}},
		"hours and minutes":          {PluginManifestContainer{AutoRestartInterval: "1h30m"}, containerOptions{AutoRestartInterval: "1h30m"}},
		"a week":                     {PluginManifestContainer{AutoRestartInterval: "1w"}, containerOptions{AutoRestartInterval: "1w"}},
		"minutes and seconds":        {PluginManifestContainer{AutoRestartInterval: "1m30s"}, containerOptions{AutoRestartInterval: "1m30s"}},
		"interval with a zero digit": {PluginManifestContainer{AutoRestartInterval: "10s"}, containerOptions{AutoRestartInterval: "10s"}},
		"no devices is not a value":  {PluginManifestContainer{Devices: []string{}}, containerOptions{}},
	} {
		t.Run(name, func(t *testing.T) {
			got, err := parseContainerOptions(tc.in)
			if err != nil {
				t.Fatal(err)
			}
			if got != tc.want {
				t.Fatalf("got %+v, want %+v", got, tc.want)
			}
		})
	}
}

func TestParseContainerOptionsRejected(t *testing.T) {
	for name, tc := range map[string]struct {
		in      PluginManifestContainer
		wantErr string // must be in the message, which names the field
	}{
		"size in words":                  {PluginManifestContainer{MemoryHigh: "lots"}, "memoryHigh"},
		"negative size":                  {PluginManifestContainer{MemoryHigh: "-1M"}, "memoryHigh"},
		"fractional size":                {PluginManifestContainer{MemoryHigh: "1.5G"}, "memoryHigh"},
		"size with a B":                  {PluginManifestContainer{MemoryMax: "256MB"}, "memoryMax"},
		"zero size":                      {PluginManifestContainer{MemoryHigh: "0"}, "memoryHigh"},
		"zero megabytes":                 {PluginManifestContainer{MemoryMax: "0M"}, "memoryMax"},
		"size overflowing as bytes":      {PluginManifestContainer{MemoryHigh: "99999999999999999999"}, "too large"},
		"size overflowing with a suffix": {PluginManifestContainer{MemoryHigh: "9223372036854775807G"}, "too large"},
		"settings placeholder":           {PluginManifestContainer{MemoryMax: "{{settings.memory}}"}, "memoryMax"},
		"memoryMax under 1M":             {PluginManifestContainer{MemoryMax: "1023k"}, "1M"},
		"high above max":                 {PluginManifestContainer{MemoryHigh: "512M", MemoryMax: "256M"}, "memoryHigh must not be larger than memoryMax"},
		"cores as numbers":               {PluginManifestContainer{CPUList: "0,1"}, "cpuList"},
		"cores as a range":               {PluginManifestContainer{CPUList: "cpu0-1"}, "cpuList"},
		"cores with a trailing comma":    {PluginManifestContainer{CPUList: "cpu0,"}, "cpuList"},
		"all cores":                      {PluginManifestContainer{CPUList: "all"}, "cpuList"},
		"user with a space":              {PluginManifestContainer{User: "root user"}, "user"},
		"user with an empty group":       {PluginManifestContainer{User: "1000:"}, "user"},
		"group without a user":           {PluginManifestContainer{User: ":1000"}, "user"},
		"user with two colons":           {PluginManifestContainer{User: "a:b:c"}, "user"},
		"negative user id":               {PluginManifestContainer{User: "-1"}, "user"},
		"user id past 32 bits":           {PluginManifestContainer{User: "4294967296"}, "user"},
		"user with a semicolon":          {PluginManifestContainer{User: "bad;name"}, "user"},
		"empty device":                   {PluginManifestContainer{Devices: []string{""}}, "devices"},
		"device with a space":            {PluginManifestContainer{Devices: []string{"serial 0"}}, "devices"},
		"two devices in one entry":       {PluginManifestContainer{Devices: []string{"serial0,serial1"}}, "devices"},
		"device as a host path":          {PluginManifestContainer{Devices: []string{"/dev/net/tun"}}, "devices"},
		"interval in seconds only":       {PluginManifestContainer{AutoRestartInterval: "30"}, "autoRestartInterval"},
		"zero interval":                  {PluginManifestContainer{AutoRestartInterval: "0s"}, "more than zero"},
		"zero interval in two units":     {PluginManifestContainer{AutoRestartInterval: "00m00s"}, "more than zero"},
		"milliseconds":                   {PluginManifestContainer{AutoRestartInterval: "5ms"}, "autoRestartInterval"},
		"units out of order":             {PluginManifestContainer{AutoRestartInterval: "1m1h"}, "autoRestartInterval"},
		"interval in words":              {PluginManifestContainer{AutoRestartInterval: "soon"}, "autoRestartInterval"},
		"interval with a space":          {PluginManifestContainer{AutoRestartInterval: "5 m"}, "autoRestartInterval"},
		"negative interval":              {PluginManifestContainer{AutoRestartInterval: "-5s"}, "autoRestartInterval"},
	} {
		t.Run(name, func(t *testing.T) {
			_, err := parseContainerOptions(tc.in)
			if err == nil {
				t.Fatal("want an error, got none")
			}
			if !strings.Contains(err.Error(), tc.wantErr) {
				t.Fatalf("error %q does not mention %q", err, tc.wantErr)
			}
		})
	}
}
