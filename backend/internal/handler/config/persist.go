package config

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/dns"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
)

func saveWizardConfigWhenDone(client *routeros.Client, data *WizardSaveData) {
	ctx, cancel := context.WithTimeout(context.Background(), wizardSaveTimeout)
	defer cancel()

	ticker := time.NewTicker(wizardSavePollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("The wizard did not finish in time, its configuration was not saved to the database")
			return
		case <-ticker.C:
		}

		if failed, err := client.GetEnvironmentVariable("BaseConfigFailed"); err == nil && failed == "true" {
			log.Printf("The wizard failed, its configuration was not saved to the database")
			return
		}
		if exists, err := client.FileExists(wizardSuccessFile); err == nil && exists {
			saveWizardConfig(ctx, client, data)
			return
		}
	}
}

func saveWizardConfig(ctx context.Context, client *routeros.Client, data *WizardSaveData) {
	req := data.Request
	cfg := db.Config{
		WANs: []db.WAN{wizardWAN("foreign", data.Foreign)},
	}
	if data.DomesticEnabled {
		cfg.WANs = append(cfg.WANs, wizardWAN("domestic", data.Domestic))
	}

	if data.WireGuard != nil {
		wg := &db.WireGuardInterface{
			Name:       wizardWireGuardName,
			Comment:    wizardWireGuardComment,
			Type:       db.WireGuardTypeClient,
			PrivateKey: data.WireGuard.InterfacePrivateKey,
			Address:    data.WireGuard.InterfaceAddress,
			Enabled:    true,
		}
		for i := range data.WireGuard.Peers {
			peer := &data.WireGuard.Peers[i]
			port, _ := strconv.Atoi(peer.EndpointPort)
			keepalive, _ := strconv.Atoi(peer.PersistentKeepalive)
			wg.Peers = append(wg.Peers, db.WireGuardPeer{
				Name:                wizardWireGuardPeerName,
				Comment:             wizardWireGuardPeerComment,
				Enabled:             true,
				PublicKey:           peer.PublicKey,
				PresharedKey:        peer.PreSharedKey,
				EndpointAddress:     peer.EndpointAddress,
				EndpointPort:        port,
				AllowedAddress:      peer.AllowedAddress,
				PersistentKeepalive: keepalive,
			})
		}
		cfg.WireGuard = wg
		cfg.Settings = map[string]string{dbsync.SettingKeyForeignGateway: wizardWireGuardName}
	}

	if req.L2tpClient != nil {
		cfg.L2TP = &db.L2TPClient{
			Name:        wizardL2TPName,
			Comment:     wizardL2TPComment,
			ConnectTo:   req.L2tpClient.ConnectTo,
			User:        req.L2tpClient.User,
			Password:    req.L2tpClient.Password,
			IPsecSecret: req.L2tpClient.IPsecSecret,
			Enabled:     true,
		}
		if cfg.Settings == nil {
			cfg.Settings = map[string]string{dbsync.SettingKeyForeignGateway: wizardL2TPName}
		}
	}

	cfg.WiFis = wizardWiFis(data)
	cfg.BridgePorts = wizardBridgePorts(data)
	cfg.DNSServers = wizardDNSServers(data.DomesticEnabled)

	if req.OvpnServer != nil && data.DomesticEnabled {
		baseName := fmt.Sprintf("ovpn-server-%d", data.CertificateTimestamp)
		for _, protocol := range []string{"tcp", "udp"} {
			cfg.OvpnServers = append(cfg.OvpnServers, db.OvpnServer{
				Name:                      baseName + "-" + protocol,
				CertificateTimestamp:      data.CertificateTimestamp,
				Protocol:                  protocol,
				Port:                      wizardOvpnPort,
				ClientCertificatePassword: req.OvpnServer.ClientCertificatePassword,
				Enabled:                   true,
			})
		}
		for _, user := range req.OvpnServer.Users {
			cfg.VPNUsers = append(cfg.VPNUsers, db.VPNUser{Username: user.Username, Password: user.Password, Profile: wizardVPNProfile})
		}
	}

	conn, err := common.DatabaseForClient(ctx, client)
	if err == nil {
		err = db.SaveConfig(ctx, conn, &cfg)
	}
	if err != nil {
		log.Printf("Failed to save the wizard configuration: %v", err)
	}
}

func wizardBridgePorts(data *WizardSaveData) []db.BridgePort {
	ports := make([]db.BridgePort, 0, len(data.BridgePorts))

	for i := range data.BridgePorts {
		port := &data.BridgePorts[i]
		name := port.Name
		for j := range data.WifiAPs {
			if data.WifiAPs[j].DefaultName == port.DefaultName {
				name = data.WifiAPs[j].NameToSet
			}
		}
		ports = append(ports, db.BridgePort{Bridge: wizardLANBridge, Interface: name, DefaultName: port.DefaultName, Comment: wizardBridgePortComment, Enabled: true})
	}

	return ports
}

func wizardWiFis(data *WizardSaveData) []db.WiFi {
	wifis := make([]db.WiFi, 0, len(data.WifiAPs)+2)

	for i := range data.WifiAPs {
		ap := &data.WifiAPs[i]
		wifis = append(wifis, db.WiFi{
			Name:        ap.NameToSet,
			DefaultName: ap.DefaultName,
			SSID:        ap.SSID,
			Password:    ap.Password,
			Enabled:     true,
			Mode:        wizardWifiModeAP,
			Bridge:      wizardLANBridge,
			AuthTypes:   wizardWifiAuthTypes,
		})
	}

	if data.Foreign.Type == string(routeros.InterfaceTypeWiFi) {
		wifis = append(wifis, wizardWANWiFi(data.Foreign, "Foreign", ""))
	}
	if data.DomesticEnabled && data.Domestic.Type == string(routeros.InterfaceTypeWiFi) {
		wifis = append(wifis, wizardWANWiFi(data.Domestic, "Domestic", wizardWifiAuthTypes))
	}

	return wifis
}

func replaceStoredStaticDNS(parent context.Context, conn *sqlx.DB, oldID string, entry *db.DNSStaticEntry) error {
	ctx, cancel := context.WithTimeout(parent, reconfigSaveTimeout)
	defer cancel()
	return db.ReplaceDNSStaticEntry(ctx, conn, oldID, entry)
}

func wizardDNSServers(domesticEnabled bool) []db.DNSServer {
	general := []string{dns.DNSDefaultVPNIP}
	if domesticEnabled {
		general = append(general, dns.DNSDefaultDomesticIP)
	}
	general = append(general, dns.DNSDefaultForeignIP)
	generalServers := strings.Join(general, ",")

	servers := []db.DNSServer{
		{Name: dbsync.DNSGlobalServerName, Type: db.DNSServerTypeGlobal, DNSServers: generalServers},
		{Name: "VPN", Type: db.DNSServerTypeForwarder, DNSServers: dns.DNSDefaultVPNIP},
	}
	if domesticEnabled {
		servers = append(servers, db.DNSServer{Name: "Domestic", Type: db.DNSServerTypeForwarder, DNSServers: dns.DNSDefaultDomesticIP})
	}
	servers = append(servers,
		db.DNSServer{Name: "Foreign", Type: db.DNSServerTypeForwarder, DNSServers: dns.DNSDefaultForeignIP},
		db.DNSServer{Name: "General", Type: db.DNSServerTypeForwarder, DNSServers: generalServers},
	)

	return servers
}
