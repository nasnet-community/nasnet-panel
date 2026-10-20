package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"nasnet-panel-installer/internal/install"
)

func main() {
	host := flag.String("host", "", "router address")
	user := flag.String("user", "admin", "router user")
	password := flag.String("password", "", "router password")
	imageTar := flag.String("image-tar", "", "local panel image tar")
	version := flag.String("version", "", "release tag to install")
	uninstall := flag.Bool("uninstall", false, "remove the panel instead of installing it")
	flag.Parse()

	if *host == "" || *password == "" {
		fmt.Fprintln(os.Stderr, "headless installer needs -host and -password")
		os.Exit(2)
	}

	events := install.Events{
		Step:     func(id, status, detail string) { fmt.Printf("step %s %s %s\n", id, status, detail) },
		Log:      func(line string) { fmt.Println(line) },
		Progress: func(string, float64, string) {},
		SysInfo:  func(info install.SystemInfo) { fmt.Printf("system %+v\n", info) },
		DeviceModePrompt: func() bool {
			fmt.Println("DEVICE_MODE_CONFIRM")
			return true
		},
		DeviceModeTick: func(int, string) {},
		DeviceModeDone: func() {},
		RebootNotice:   func(reason string) { fmt.Println("reboot notice:", reason) },
		StoragePrompt: func(choices []install.StorageChoice) string {
			if len(choices) == 0 {
				return ""
			}
			return choices[0].Name
		},
		RebootPrompt: func(reason string) bool {
			fmt.Println("reboot:", reason)
			return true
		},
		RebootTick: func(int, string) {},
		RebootDone: func() {},
		Done:       func(urls []string, note string) { fmt.Println("done", urls, note) },
	}

	engine := install.New(context.Background(), install.Options{
		Host:     *host,
		User:     *user,
		Password: *password,
		ImageTar: *imageTar,
		Version:  *version,
	}, events)

	var err error
	if *uninstall {
		err = engine.RunUninstall()
	} else {
		err = engine.Run()
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "installer failed:", err)
		os.Exit(1)
	}
}
