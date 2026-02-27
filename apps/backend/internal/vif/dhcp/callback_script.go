package dhcp

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"go.uber.org/zap"
)

// GenerateCallbackScript returns the shell script content for udhcpc -s parameter.
func GenerateCallbackScript(listenAddr string) string {
	return fmt.Sprintf(`#!/bin/sh
# udhcpc callback script - posts lease info to Go backend
# Called with $1 = action (bound/renew/deconfig/leasefail)

CALLBACK_URL="http://%s/dhcp/callback"

# Extract VLAN ID from interface name (e.g., eth0.154 -> 154)
VLAN_ID=$(echo "$interface" | grep -o '[0-9]*$')

case "$1" in
    bound|renew)
        # Set up the interface
        ip addr flush dev "$interface"
        ip addr add "$ip/$mask" dev "$interface"

        # Add default route if provided
        if [ -n "$router" ]; then
            ip route add default via "$router" dev "$interface" table "$VLAN_ID" 2>/dev/null
        fi

        # Format DNS as JSON array
        DNS_JSON="[]"
        if [ -n "$dns" ]; then
            DNS_JSON="["
            first=1
            for d in $dns; do
                if [ "$first" = "1" ]; then
                    DNS_JSON="${DNS_JSON}\"${d}\""
                    first=0
                else
                    DNS_JSON="${DNS_JSON},\"${d}\""
                fi
            done
            DNS_JSON="${DNS_JSON}]"
        fi

        # Notify Go backend
        wget -q -O /dev/null --post-data \
            "{\"action\":\"$1\",\"interface\":\"$interface\",\"ip\":\"$ip\",\"subnet\":\"$mask\",\"router\":\"$router\",\"dns\":${DNS_JSON},\"lease\":${lease:-3600},\"vlan_id\":${VLAN_ID:-0}}" \
            "$CALLBACK_URL" 2>/dev/null
        ;;

    deconfig)
        ip addr flush dev "$interface" 2>/dev/null
        wget -q -O /dev/null --post-data \
            "{\"action\":\"deconfig\",\"interface\":\"$interface\",\"vlan_id\":${VLAN_ID:-0}}" \
            "$CALLBACK_URL" 2>/dev/null
        ;;

    leasefail)
        wget -q -O /dev/null --post-data \
            "{\"action\":\"leasefail\",\"interface\":\"$interface\",\"vlan_id\":${VLAN_ID:-0}}" \
            "$CALLBACK_URL" 2>/dev/null
        ;;
esac
`, listenAddr)
}

// WriteCallbackScript writes the callback script to the given path.
func WriteCallbackScript(path, listenAddr string) error {
	content := GenerateCallbackScript(listenAddr)
	if err := os.WriteFile(path, []byte(content), 0o700); err != nil { //nolint:gosec // G306: script needs execute permission
		return fmt.Errorf("write callback script: %w", err)
	}
	return nil
}

// callbackPayload is the JSON payload from the callback script.
type callbackPayload struct {
	Action    string   `json:"action"`
	Interface string   `json:"interface"`
	IP        string   `json:"ip"`
	Subnet    string   `json:"subnet"`
	Router    string   `json:"router"`
	DNS       []string `json:"dns"`
	Lease     int      `json:"lease"`
	VLANID    int      `json:"vlan_id"`
}

// HandleCallback is the HTTP handler for /dhcp/callback.
func (c *Client) HandleCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload callbackPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		c.logger.Warn("invalid dhcp callback payload", zap.Error(err))
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	c.logger.Debug("dhcp callback received",
		zap.String("action", payload.Action),
		zap.Int("vlan_id", payload.VLANID),
		zap.String("interface", payload.Interface),
		zap.String("ip", payload.IP))

	status := ClientStatus{
		VLANID:     payload.VLANID,
		Interface:  payload.Interface,
		IPAddress:  payload.IP,
		Gateway:    payload.Router,
		SubnetMask: payload.Subnet,
		DNS:        payload.DNS,
		Status:     payload.Action,
	}

	if payload.Lease > 0 {
		status.LeaseExpiry = time.Now().Add(time.Duration(payload.Lease) * time.Second)
	}

	switch payload.Action {
	case "bound", "renew":
		status.Status = "bound"
	case "deconfig":
		status.Status = "deconfigured"
	case "leasefail":
		status.Status = "failed"
	}

	c.OnLeaseObtained(status)
	w.WriteHeader(http.StatusOK)
}
