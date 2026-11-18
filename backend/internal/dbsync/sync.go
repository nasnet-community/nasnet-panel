package dbsync

import (
	"context"
	"errors"
	"log"
	"strconv"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
)

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
				err = db.UpsertL2TPClient(ctx, conn, L2TPClientRecord(info))
			}
			errs = append(errs, err)
		case routeros.VPNTypeSSTPOut:
			info, err := client.GetSSTPClientInfo(clients[i].Name)
			if err == nil {
				err = db.UpsertSSTPClient(ctx, conn, SSTPClientRecord(info))
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
		record, err := WireGuardInterfaceRecord(client, interfaces[i].Name)
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
		errs = append(errs, db.UpsertOvpnServer(ctx, conn, OvpnServerRecord(&servers[i])))
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
		errs = append(errs, db.UpsertVPNServer(ctx, conn, L2TPServerRecord(l2tpServer)))
	}

	sstpServer, err := client.GetSstpServer()
	switch {
	case err != nil:
		errs = append(errs, err)
	case sstpServer.Enabled:
		errs = append(errs, db.UpsertVPNServer(ctx, conn, SSTPServerRecord(sstpServer)))
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

	return db.SaveDNSServers(ctx, conn, DNSServerRecords(info, forwarders))
}

func syncExistingStaticDNS(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	entries, err := client.ListUserStaticDNS()
	if err != nil {
		return err
	}

	var errs []error
	for i := range entries {
		errs = append(errs, db.UpsertDNSStaticEntry(ctx, conn, DNSStaticEntryRecord(&entries[i])))
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
			if adLists[i].URL == DNSAdBlockURL {
				adBlockEnabled = !adLists[i].Disabled
			}
		}
		errs = append(errs, db.UpsertSetting(ctx, conn, SettingKeyAdBlockEnabled, strconv.FormatBool(adBlockEnabled)))
	}

	rules, err := client.ListFirewallFilterRulesByComment(DomesticBlockRuleComment)
	switch {
	case err != nil:
		errs = append(errs, err)
	case len(rules) > 0:
		errs = append(errs, db.UpsertSetting(ctx, conn, SettingKeyDomesticBlockEnabled, strconv.FormatBool(DomesticBlockRulesMatch(rules, true))))
	}

	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Comment: "Route-to-VPN-Client", RoutingTable: "main"})
	switch {
	case err != nil:
		errs = append(errs, err)
	case len(routes) > 0:
		errs = append(errs, db.UpsertSetting(ctx, conn, SettingKeyForeignGateway, routes[0].Gateway))
	}

	return errors.Join(errs...)
}

func syncExistingNetwork(ctx context.Context, client *routeros.Client, conn *sqlx.DB) error {
	cfg, err := RouterNetworkConfig(client)
	if err != nil {
		return err
	}

	return db.SaveNetworkConfig(ctx, conn, cfg)
}
