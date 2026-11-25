package env

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"nasnet-panel/test-lab/internal/drive"
	"nasnet-panel/test-lab/internal/sh"
)

const (
	panelPort      = "8080"
	panelHTTPSPort = "8443"
	proxyPort      = "18080"
)

func (e *Env) startPanel() error {
	e.Panel = &drive.Panel{
		RouterHost: RouterAddress,
		User:       RouterUser,
		Password:   e.password,
		HTTP:       &http.Client{Timeout: 2 * time.Minute},
		Failed:     e.wizardScriptError,
	}

	if e.setup.Panel == PanelRouter {
		if err := e.start("panel-proxy", sh.InNS(e.net.ns("mgmt"), e.assets.labsvc, "proxy",
			"-listen", "0.0.0.0:"+proxyPort, "-to", RouterAddress+":"+panelPort)...); err != nil {
			return err
		}
		e.Panel.BaseURL = "http://" + e.net.hostAddr() + ":" + proxyPort
	} else {
		binary := e.assets.panel
		if e.setup.Patch != nil {
			patched, err := e.assets.patchedPanel(*e.setup.Patch)
			if err != nil {
				return err
			}
			binary = patched
		}
		if err := e.start("panel", sh.InNS(e.net.ns("mgmt"), "env",
			"PORT="+panelPort,
			"HTTPS_PORT="+panelHTTPSPort,
			"SSL_CERT_FILE="+e.assets.caFile(),
			binary)...); err != nil {
			return err
		}
		e.Panel.BaseURL = "http://" + e.net.hostAddr() + ":" + panelPort
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	return e.Panel.WaitReady(ctx)
}

func (e *Env) RestartPanel(ctx context.Context) error {
	name := "panel"
	if e.setup.Panel == PanelRouter {
		name = "panel-proxy"
	}
	if err := e.restartProcess(name); err != nil {
		return err
	}
	return e.Panel.WaitReady(ctx)
}

func (e *Env) wizardScriptError(ctx context.Context) error {
	rows, err := e.Router.Print(ctx, "/log")
	if err != nil {
		return nil
	}
	for _, row := range rows {
		if strings.Contains(row["message"], "script:wizard") && strings.Contains(strings.ToLower(row["message"]), "script error") {
			return fmt.Errorf("router log: %s", row["message"])
		}
	}
	return nil
}
