package handler

import (
	"context"
	"errors"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
)

const (
	databaseInitTimeout = 2 * time.Minute

	wanForeignComment  = "WAN - Foreign Link"
	wanDomesticComment = "WAN - Domestic Link"
	managementWifiName = "wifi-management"
)

var (
	initialSyncLocks sync.Map
	initialSynced    sync.Map
	initStarted      sync.Map
)

// startDatabaseInit creates the router's database and fills it from the router's existing
// configuration. It is called after every successful RouterOS connection but acts only the
// first time for a router, running in the background so the request that triggered it is not
// delayed. If it fails, the next successful connection tries again.
func startDatabaseInit(host string, client *routeros.Client) {
	if appDatabases == nil {
		return
	}
	if _, loaded := initStarted.LoadOrStore(host, struct{}{}); loaded {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), databaseInitTimeout)
		defer cancel()

		if _, err := databaseForClient(ctx, client); err != nil {
			log.Printf("Failed to initialise the database of router %s: %v", host, err)
			initStarted.Delete(host)
		}
	}()
}

// ensureInitialSync copies the router's existing configuration into its database the first
// time that database is used, so records created before the database existed are not missing.
// It is best effort: a part that fails to sync is logged and skipped, never blocks the request.
func ensureInitialSync(ctx context.Context, client *routeros.Client, systemID string, conn *sqlx.DB) {
	if _, ok := initialSynced.Load(systemID); ok {
		return
	}

	lock, _ := initialSyncLocks.LoadOrStore(systemID, &sync.Mutex{})
	mu, ok := lock.(*sync.Mutex)
	if !ok {
		return
	}
	mu.Lock()
	defer mu.Unlock()
	if _, ok := initialSynced.Load(systemID); ok {
		return
	}

	done, err := db.InitialSyncDone(ctx, conn)
	if err != nil {
		log.Printf("Failed to check the initial database sync: %v", err)
		return
	}
	if !done {
		syncExistingConfig(ctx, client, conn)
		if err := db.MarkInitialSyncDone(ctx, conn); err != nil {
			log.Printf("Failed to record the initial database sync: %v", err)
			return
		}
	}

	initialSynced.Store(systemID, struct{}{})
}

func syncExistingConfig(ctx context.Context, client *routeros.Client, conn *sqlx.DB) {
	steps := []struct {
		name string
		run  func(context.Context, *routeros.Client, *sqlx.DB) error
	}{
		{"WANs, WiFi interfaces and bridge ports", syncExistingNetwork},
		{"VPN clients", syncExistingVPNClients},
		{"WireGuard interfaces", syncExistingWireGuardInterfaces},
		{"OpenVPN servers", syncExistingOvpnServers},
		{"VPN users", syncExistingVPNUsers},
		{"SSTP and L2TP servers", syncExistingVPNServers},
		{"DNS servers", syncExistingDNSServers},
		{"static DNS entries", syncExistingStaticDNS},
		{"settings", syncExistingSettings},
	}
	for _, step := range steps {
		if err := step.run(ctx, client, conn); err != nil {
			log.Printf("Initial database sync of the %s failed: %v", step.name, err)
		}
	}
}

func syncExistingVPNClients(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	clients, err := client.ListVPNClients()
	if err != nil {
		return err
	}

	var errs []error
	for i := range clients {
		switch clients[i].Type {
		case routeros.VPNTypeL2TPOut:
			info, err := client.GetL2TPClientInfo(clients[i].Name)
			if err == nil {
				err = db.UpsertL2TPClient(ctx, conn, l2tpClientRecord(info))
			}
			errs = append(errs, err)
		case routeros.VPNTypeSSTPOut:
			info, err := client.GetSSTPClientInfo(clients[i].Name)
			if err == nil {
				err = db.UpsertSSTPClient(ctx, conn, sstpClientRecord(info))
			}
			errs = append(errs, err)
		}
	}

	return errors.Join(errs...)
}

func syncExistingWireGuardInterfaces(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	interfaces, err := client.ListWireGuards()
	if err != nil {
		return err
	}

	var errs []error
	for i := range interfaces {
		record, err := wireGuardInterfaceRecord(client, interfaces[i].Name)
		if err == nil && record != nil {
			err = db.PersistWireGuardInterface(ctx, conn, record)
		}
		errs = append(errs, err)
	}

	return errors.Join(errs...)
}

func syncExistingOvpnServers(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	servers, err := client.ListOvpnServers()
	if err != nil {
		return err
	}

	var errs []error
	for i := range servers {
		errs = append(errs, db.UpsertOvpnServer(ctx, conn, ovpnServerRecord(&servers[i])))
	}

	return errors.Join(errs...)
}

func syncExistingVPNUsers(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	secrets, err := client.ListPPPSecrets()
	if err != nil {
		return err
	}

	var errs []error
	for i := range secrets {
		errs = append(errs, db.UpsertVPNUser(ctx, conn, &db.VPNUser{
			Username: secrets[i].Name,
			Password: secrets[i].Password,
			Profile:  secrets[i].Profile,
		}))
	}

	return errors.Join(errs...)
}

func syncExistingVPNServers(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	var errs []error

	l2tpServer, err := client.GetL2tpServer()
	switch {
	case err != nil:
		errs = append(errs, err)
	case l2tpServer.Enabled:
		errs = append(errs, db.UpsertVPNServer(ctx, conn, l2tpServerRecord(l2tpServer)))
	}

	sstpServer, err := client.GetSstpServer()
	switch {
	case err != nil:
		errs = append(errs, err)
	case sstpServer.Enabled:
		errs = append(errs, db.UpsertVPNServer(ctx, conn, sstpServerRecord(sstpServer)))
	}

	return errors.Join(errs...)
}

func syncExistingDNSServers(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	info, err := client.GetDNSInfo()
	if err != nil {
		return err
	}
	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return err
	}

	return db.SaveDNSServers(ctx, conn, dnsServerRecords(info, forwarders))
}

func syncExistingStaticDNS(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	entries, err := client.ListUserStaticDNS()
	if err != nil {
		return err
	}

	var errs []error
	for i := range entries {
		errs = append(errs, db.UpsertDNSStaticEntry(ctx, conn, dnsStaticEntryRecord(&entries[i])))
	}

	return errors.Join(errs...)
}

func syncExistingSettings(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	var errs []error

	adLists, err := client.ListDNSAdLists()
	if err != nil {
		errs = append(errs, err)
	} else {
		adBlockEnabled := false
		for i := range adLists {
			if adLists[i].URL == dnsAdBlockURL {
				adBlockEnabled = !adLists[i].Disabled
			}
		}
		errs = append(errs, db.UpsertSetting(ctx, conn, settingKeyAdBlockEnabled, strconv.FormatBool(adBlockEnabled)))
	}

	rules, err := client.ListFirewallFilterRulesByComment(domesticBlockRuleComment)
	switch {
	case err != nil:
		errs = append(errs, err)
	case len(rules) > 0:
		errs = append(errs, db.UpsertSetting(ctx, conn, settingKeyDomesticBlockEnabled, strconv.FormatBool(domesticBlockRulesMatch(rules, true))))
	}

	mangleRules, err := client.ListMangleRules()
	if err != nil {
		errs = append(errs, err)
	} else {
		directRules := make([]routeros.MangleRule, 0, len(directForeignRules))
		for i := range mangleRules {
			if strings.HasPrefix(mangleRules[i].Comment, directForeignRulePrefix) {
				directRules = append(directRules, mangleRules[i])
			}
		}
		if len(directRules) > 0 {
			errs = append(errs, db.UpsertSetting(ctx, conn, settingKeyDirectForeignEnabled, strconv.FormatBool(directForeignRulesMatch(directRules, true))))
		}
	}

	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Comment: "Route-to-VPN-Client", RoutingTable: "main"})
	switch {
	case err != nil:
		errs = append(errs, err)
	case len(routes) > 0:
		errs = append(errs, db.UpsertSetting(ctx, conn, settingKeyForeignGateway, routes[0].Gateway))
	}

	return errors.Join(errs...)
}

func wanTypeFromComment(comment *string) (string, bool) {
	if comment == nil {
		return "", false
	}
	switch *comment {
	case wanForeignComment:
		return "foreign", true
	case wanDomesticComment:
		return "domestic", true
	}
	return "", false
}

func routerNetworkConfig(client *routeros.Client) (*db.NetworkConfig, error) {
	cfg := &db.NetworkConfig{}

	ethernets, err := client.GetEthernetInterfaces()
	if err != nil {
		return nil, err
	}
	for i := range ethernets {
		wanType, ok := wanTypeFromComment(ethernets[i].Comment)
		if !ok {
			continue
		}
		name := ethernets[i].Name
		if ethernets[i].DefaultName != nil && *ethernets[i].DefaultName != "" {
			name = *ethernets[i].DefaultName
		}
		cfg.WANs = append(cfg.WANs, db.WAN{Type: wanType, InterfaceType: string(routeros.InterfaceTypeEther), Interface: name})
	}

	wifis, err := client.ListWifiInterfaces()
	if err != nil && !strings.Contains(err.Error(), "no WiFi package") {
		return nil, err
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		return nil, err
	}
	defaultNames, err := interfaceDefaultNames(client)
	if err != nil {
		return nil, err
	}
	bridges := make(map[string]string)
	for i := range ports {
		if !strings.HasPrefix(ports[i].Bridge, lanBridgeNamePrefix) {
			continue
		}
		cfg.BridgePorts = append(cfg.BridgePorts, *bridgePortRecord(&ports[i], defaultNames))
		bridges[ports[i].Interface] = ports[i].Bridge
	}

	masters := make(map[string]string, len(wifis))
	for i := range wifis {
		masters[wifis[i].Name] = wifis[i].DefaultName
	}

	for i := range wifis {
		w := &wifis[i]
		comment := w.Comment
		if wanType, ok := wanTypeFromComment(&comment); ok {
			cfg.WANs = append(cfg.WANs, db.WAN{Type: wanType, InterfaceType: string(routeros.InterfaceTypeWiFi), Interface: w.DefaultName})
		}
		if !storableWiFi(w) {
			continue
		}

		cfg.WiFis = append(cfg.WiFis, *wifiRecord(w, masters[w.Interface], bridges[w.Name]))
	}

	return cfg, nil
}

func syncExistingNetwork(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	cfg, err := routerNetworkConfig(client)
	if err != nil {
		return err
	}

	return db.SaveNetworkConfig(ctx, conn, cfg)
}

func validWifiMode(mode string) bool {
	switch mode {
	case "ap", "station", "station-bridge", "station-pseudobridge":
		return true
	}
	return false
}
