package drive

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type Panel struct {
	BaseURL    string
	RouterHost string
	User       string
	Password   string
	HTTP       *http.Client
}

type WizardLink struct {
	Interface string `json:"interface"`
}

type WizardL2TP struct {
	ConnectTo   string `json:"connectTo"`
	User        string `json:"user"`
	Password    string `json:"password"`
	IPsecSecret string `json:"ipsecSecret,omitempty"`
}

type WizardWireGuard struct {
	Config string `json:"config"`
}

type WizardWiFi struct {
	SSID     string `json:"ssid"`
	Password string `json:"password"`
	Split    bool   `json:"split"`
}

type WizardOvpnUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type WizardOvpnServer struct {
	ClientCertificatePassword string           `json:"clientCertificatePassword"`
	Users                     []WizardOvpnUser `json:"users"`
}

type WizardRequest struct {
	Foreign         *WizardLink       `json:"foreign"`
	Domestic        *WizardLink       `json:"domestic,omitempty"`
	L2tpClient      *WizardL2TP       `json:"l2tpClient,omitempty"`
	WireGuardClient *WizardWireGuard  `json:"wireguardClient,omitempty"`
	WiFiAP          *WizardWiFi       `json:"wifiAp,omitempty"`
	OvpnServer      *WizardOvpnServer `json:"ovpnServer,omitempty"`
}

type WizardStatus struct {
	Completed bool `json:"completed"`
	Progress  int  `json:"progress"`
}

type Response struct {
	Status  int
	Body    []byte
	Message string
	Error   string
	Data    json.RawMessage
}

type envelope struct {
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
	Error   string          `json:"error"`
}

func (p *Panel) WaitReady(ctx context.Context) error {
	for {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.BaseURL+"/health", http.NoBody)
		if err != nil {
			return err
		}
		resp, err := p.HTTP.Do(req)
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode < http.StatusInternalServerError {
				return nil
			}
			err = fmt.Errorf("health returned %d", resp.StatusCode)
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("panel not reachable: %w", err)
		case <-time.After(time.Second):
		}
	}
}

func (p *Panel) Call(ctx context.Context, method, path string, query map[string]string, body any) (*Response, error) {
	var reader io.Reader = http.NoBody
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(data)
	}

	target := p.BaseURL + path
	if len(query) > 0 {
		values := url.Values{}
		for k, v := range query {
			values.Set(k, v)
		}
		target += "?" + values.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, method, target, reader)
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(p.User, p.Password)
	req.Header.Set("X-RouterOS-Host", p.RouterHost)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := p.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	out := &Response{Status: resp.StatusCode, Body: raw}
	var env envelope
	if json.Unmarshal(raw, &env) == nil {
		out.Message, out.Error, out.Data = env.Message, env.Error, env.Data
	}
	return out, nil
}

func (p *Panel) call(ctx context.Context, method, path string, body, out any) error {
	resp, err := p.Call(ctx, method, path, nil, body)
	if err != nil {
		return err
	}
	if resp.Status >= http.StatusMultipleChoices {
		return fmt.Errorf("%s %s: status %d: %s %s", method, path, resp.Status, resp.Message, resp.Error)
	}
	if out != nil && len(resp.Data) > 0 {
		return json.Unmarshal(resp.Data, out)
	}
	return nil
}

func (p *Panel) StartWizard(ctx context.Context, req WizardRequest) error {
	return p.call(ctx, http.MethodPost, "/api/wizard/finalize", req, nil)
}

func (p *Panel) WaitWizard(ctx context.Context) error {
	var status WizardStatus
	var lastErr error
	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("wizard stopped at %d%% (last status error: %v): %w", status.Progress, lastErr, ctx.Err())
		case <-time.After(3 * time.Second):
		}

		var current WizardStatus
		if err := p.call(ctx, http.MethodGet, "/api/wizard/status", nil, &current); err != nil {
			lastErr = err
			continue
		}
		status = current
		if status.Completed {
			return nil
		}
	}
}

func (p *Panel) ApplyWizard(ctx context.Context, req WizardRequest) error {
	if err := p.StartWizard(ctx, req); err != nil {
		return err
	}
	return p.WaitWizard(ctx)
}

func (p *Panel) WizardStatus(ctx context.Context) (WizardStatus, error) {
	var status WizardStatus
	err := p.call(ctx, http.MethodGet, "/api/wizard/status", nil, &status)
	return status, err
}

type PluginStatus struct {
	PluginID string `json:"pluginId"`
	Phase    string `json:"phase"`
	Message  string `json:"message"`
}

func (p *Panel) InstallPlugin(ctx context.Context, id string) (PluginStatus, error) {
	if err := p.call(ctx, http.MethodPost, "/api/plugin/install", map[string]string{"id": id}, nil); err != nil {
		return PluginStatus{}, err
	}
	var status PluginStatus
	for {
		select {
		case <-ctx.Done():
			return status, fmt.Errorf("plugin %s stuck in phase %q: %w", id, status.Phase, ctx.Err())
		case <-time.After(3 * time.Second):
		}
		var current PluginStatus
		if err := p.call(ctx, http.MethodGet, "/api/plugin/install/status/"+url.PathEscape(id), nil, &current); err != nil {
			continue
		}
		status = current
		if status.Phase == "done" || status.Phase == "error" {
			return status, nil
		}
	}
}

type PluginInfo struct {
	ID         string `json:"id"`
	Installed  bool   `json:"installed"`
	Running    bool   `json:"running"`
	Installing bool   `json:"installing"`
	Failed     bool   `json:"failed"`
	Note       string `json:"note"`
}

func (p *Panel) Plugins(ctx context.Context) ([]PluginInfo, error) {
	var plugins []PluginInfo
	err := p.call(ctx, http.MethodGet, "/api/plugin/plugins", nil, &plugins)
	return plugins, err
}

func (p *Panel) UninstallPlugin(ctx context.Context, id string) (*Response, error) {
	return p.Call(ctx, http.MethodDelete, "/api/plugin/plugin/"+url.PathEscape(id), nil, nil)
}

func (p *Panel) ExportOvpn(ctx context.Context, name, publicAddress string) (string, error) {
	resp, err := p.Call(ctx, http.MethodGet, "/api/vpn/ovpn/server/export", map[string]string{"name": name, "publicAddress": publicAddress}, nil)
	if err != nil {
		return "", err
	}
	if resp.Status != http.StatusOK {
		return "", fmt.Errorf("ovpn export: status %d: %s %s", resp.Status, resp.Message, resp.Error)
	}
	return string(resp.Body), nil
}
