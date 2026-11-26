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
	"nasnet-panel/internal/handler/plugin"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
)

// saveWizardConfigWhenDone calls release once the wizard's script has ended,
// however it ended.
func saveWizardConfigWhenDone(client *routeros.Client, release func(), data *WizardSaveData) {
	defer release()
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
			release()
			// The save first, so it doesn't share what's left of ctx with the scripts.
			saveWizardConfig(ctx, client, data)
			for _, err := range plugin.RunPostWizard(client) {
				log.Printf("[plugin-post-wizard] %v", err)
			}
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

	for i := range data.VPNClients {
		client := &data.VPNClients[i]
		cfg.FailoverInterfaces = append(cfg.FailoverInterfaces, db.FailoverInterface{
			Interface: client.Name, ProbeIP: client.ProbeIP, Distance: client.Index,
		})
		if client.L2tp != nil {
			cfg.L2TPs = append(cfg.L2TPs, db.L2TPClient{
				Name:        client.Name,
				Comment:     client.Name,
				ConnectTo:   client.L2tp.ConnectTo,
				User:        client.L2tp.User,
				Password:    client.L2tp.Password,
				IPsecSecret: client.L2tp.IPsecSecret,
				Enabled:     true,
			})
		}
		if client.WireGuard != nil {
			cfg.WireGuards = append(cfg.WireGuards, wizardWireGuardClient(client))
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

func wizardWireGuardClient(client *VPNClient) db.WireGuardInterface {
	wg := db.WireGuardInterface{
		Name:       client.Name,
		Comment:    client.Name,
		Type:       db.WireGuardTypeClient,
		PrivateKey: client.WireGuard.InterfacePrivateKey,
		Address:    client.WireGuard.InterfaceAddress,
		Enabled:    true,
	}
	for i := range client.WireGuard.Peers {
		peer := &client.WireGuard.Peers[i]
		port, _ := strconv.Atoi(peer.EndpointPort)
		keepalive, _ := strconv.Atoi(peer.PersistentKeepalive)
		wg.Peers = append(wg.Peers, db.WireGuardPeer{
			Name:                client.Name + failoverPeerSuffix,
			Comment:             client.Name + failoverPeerSuffix,
			Enabled:             true,
			PublicKey:           peer.PublicKey,
			PresharedKey:        peer.PreSharedKey,
			EndpointAddress:     peer.EndpointAddress,
			EndpointPort:        port,
			AllowedAddress:      peer.AllowedAddress,
			PersistentKeepalive: keepalive,
		})
	}
	return wg
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
		wifis = append(wifis, wizardWANWiFi(data.Foreign, "Foreign", data.Foreign.AuthType))
	}
	if data.DomesticEnabled && data.Domestic.Type == string(routeros.InterfaceTypeWiFi) {
		wifis = append(wifis, wizardWANWiFi(data.Domestic, "Domestic", data.Domestic.AuthType))
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
