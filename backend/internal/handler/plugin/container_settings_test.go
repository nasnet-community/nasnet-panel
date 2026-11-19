package plugin

import (
	"strings"
	"testing"
)

func TestParseContainerOptionsLeftOut(t *testing.T) {
	got, err := parseContainerOptions(ManifestContainer{Image: "x", Env: map[string]string{"A": "b"}})
	if err != nil {
		t.Fatal(err)
	}
	if got != (containerOptions{}) {
		t.Fatalf("a manifest without settings gave %+v, want none", got)
	}
}

func TestParseContainerOptionsAccepted(t *testing.T) {
	for name, tc := range map[string]struct {
		in   ManifestContainer
		want containerOptions
	}{
		"everything": {
			ManifestContainer{
				MemoryHigh: "128M", MemoryMax: "256M", CPUList: "cpu0,cpu1", User: "1000:1000",
				Devices: []string{"serial0", "0000:00:03.0"}, AutoRestartInterval: "30s",
			},
			containerOptions{
				MemoryHigh: 128 << 20, MemoryMax: 256 << 20, CPUList: "cpu0,cpu1", User: "1000:1000",
				Devices: "serial0,0000:00:03.0", AutoRestartInterval: "30s",
			},
		},
		"plain bytes":                {ManifestContainer{MemoryHigh: "1024"}, containerOptions{MemoryHigh: 1024}},
		"kilobytes":                  {ManifestContainer{MemoryHigh: "4k"}, containerOptions{MemoryHigh: 4096}},
		"lower case megabytes":       {ManifestContainer{MemoryHigh: "2m"}, containerOptions{MemoryHigh: 2 << 20}},
		"gigabytes":                  {ManifestContainer{MemoryHigh: "1G"}, containerOptions{MemoryHigh: 1 << 30}},
		"memoryMax at the floor":     {ManifestContainer{MemoryMax: "1M"}, containerOptions{MemoryMax: 1 << 20}},
		"high equal to max":          {ManifestContainer{MemoryHigh: "64M", MemoryMax: "64M"}, containerOptions{MemoryHigh: 64 << 20, MemoryMax: 64 << 20}},
		"spaces are trimmed":         {ManifestContainer{MemoryHigh: " 64M ", User: " nobody "}, containerOptions{MemoryHigh: 64 << 20, User: "nobody"}},
		"one core":                   {ManifestContainer{CPUList: "cpu0"}, containerOptions{CPUList: "cpu0"}},
		"numeric user":               {ManifestContainer{User: "1000"}, containerOptions{User: "1000"}},
		"user and group names":       {ManifestContainer{User: "app:app"}, containerOptions{User: "app:app"}},
		"user name with a hyphen":    {ManifestContainer{User: "Debian-exim"}, containerOptions{User: "Debian-exim"}},
		"minutes":                    {ManifestContainer{AutoRestartInterval: "5m"}, containerOptions{AutoRestartInterval: "5m"}},
		"hours and minutes":          {ManifestContainer{AutoRestartInterval: "1h30m"}, containerOptions{AutoRestartInterval: "1h30m"}},
		"a week":                     {ManifestContainer{AutoRestartInterval: "1w"}, containerOptions{AutoRestartInterval: "1w"}},
		"minutes and seconds":        {ManifestContainer{AutoRestartInterval: "1m30s"}, containerOptions{AutoRestartInterval: "1m30s"}},
		"interval with a zero digit": {ManifestContainer{AutoRestartInterval: "10s"}, containerOptions{AutoRestartInterval: "10s"}},
		"no devices is not a value":  {ManifestContainer{Devices: []string{}}, containerOptions{}},
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
		in      ManifestContainer
		wantErr string // must be in the message, which names the field
	}{
		"size in words":                  {ManifestContainer{MemoryHigh: "lots"}, "memoryHigh"},
		"negative size":                  {ManifestContainer{MemoryHigh: "-1M"}, "memoryHigh"},
		"fractional size":                {ManifestContainer{MemoryHigh: "1.5G"}, "memoryHigh"},
		"size with a B":                  {ManifestContainer{MemoryMax: "256MB"}, "memoryMax"},
		"zero size":                      {ManifestContainer{MemoryHigh: "0"}, "memoryHigh"},
		"zero megabytes":                 {ManifestContainer{MemoryMax: "0M"}, "memoryMax"},
		"size overflowing as bytes":      {ManifestContainer{MemoryHigh: "99999999999999999999"}, "too large"},
		"size overflowing with a suffix": {ManifestContainer{MemoryHigh: "9223372036854775807G"}, "too large"},
		"settings placeholder":           {ManifestContainer{MemoryMax: "{{settings.memory}}"}, "memoryMax"},
		"memoryMax under 1M":             {ManifestContainer{MemoryMax: "1023k"}, "1M"},
		"high above max":                 {ManifestContainer{MemoryHigh: "512M", MemoryMax: "256M"}, "memoryHigh must not be larger than memoryMax"},
		"cores as numbers":               {ManifestContainer{CPUList: "0,1"}, "cpuList"},
		"cores as a range":               {ManifestContainer{CPUList: "cpu0-1"}, "cpuList"},
		"cores with a trailing comma":    {ManifestContainer{CPUList: "cpu0,"}, "cpuList"},
		"all cores":                      {ManifestContainer{CPUList: "all"}, "cpuList"},
		"user with a space":              {ManifestContainer{User: "root user"}, "user"},
		"user with an empty group":       {ManifestContainer{User: "1000:"}, "user"},
		"group without a user":           {ManifestContainer{User: ":1000"}, "user"},
		"user with two colons":           {ManifestContainer{User: "a:b:c"}, "user"},
		"negative user id":               {ManifestContainer{User: "-1"}, "user"},
		"user id past 32 bits":           {ManifestContainer{User: "4294967296"}, "user"},
		"user with a semicolon":          {ManifestContainer{User: "bad;name"}, "user"},
		"empty device":                   {ManifestContainer{Devices: []string{""}}, "devices"},
		"device with a space":            {ManifestContainer{Devices: []string{"serial 0"}}, "devices"},
		"two devices in one entry":       {ManifestContainer{Devices: []string{"serial0,serial1"}}, "devices"},
		"device as a host path":          {ManifestContainer{Devices: []string{"/dev/net/tun"}}, "devices"},
		"interval in seconds only":       {ManifestContainer{AutoRestartInterval: "30"}, "autoRestartInterval"},
		"zero interval":                  {ManifestContainer{AutoRestartInterval: "0s"}, "more than zero"},
		"zero interval in two units":     {ManifestContainer{AutoRestartInterval: "00m00s"}, "more than zero"},
		"milliseconds":                   {ManifestContainer{AutoRestartInterval: "5ms"}, "autoRestartInterval"},
		"units out of order":             {ManifestContainer{AutoRestartInterval: "1m1h"}, "autoRestartInterval"},
		"interval in words":              {ManifestContainer{AutoRestartInterval: "soon"}, "autoRestartInterval"},
		"interval with a space":          {ManifestContainer{AutoRestartInterval: "5 m"}, "autoRestartInterval"},
		"negative interval":              {ManifestContainer{AutoRestartInterval: "-5s"}, "autoRestartInterval"},
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
