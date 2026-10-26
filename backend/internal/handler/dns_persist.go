package handler

import (
	"context"
	"strconv"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const (
	settingKeyAdBlockEnabled = "adblock_enabled"
	dnsGlobalServerName      = "global"
)

func dnsServerRecords(info *routeros.DNSInfo, forwarders []routeros.DNSForwarder) []db.DNSServer {
	servers := make([]db.DNSServer, 0, len(forwarders)+1)
	servers = append(servers, db.DNSServer{
		Name:       dnsGlobalServerName,
		Type:       db.DNSServerTypeGlobal,
		DNSServers: strings.Join(info.Servers, ","),
		DOHServers: info.DOHServer,
	})
	for i := range forwarders {
		forwarder := &forwarders[i]
		servers = append(servers, db.DNSServer{
			Name:          forwarder.Name,
			Type:          db.DNSServerTypeForwarder,
			DNSServers:    strings.Join(forwarder.DNSServers, ","),
			DOHServers:    strings.Join(forwarder.DOHServers, ","),
			VerifyDOHCert: forwarder.VerifyDOHCert,
			Comment:       forwarder.Comment,
		})
	}

	return servers
}

func persistDNSServers(c echo.Context, client *routeros.Client) {
	info, err := client.GetDNSInfo()
	if err != nil {
		c.Logger().Errorf("Failed to read the DNS configuration for the database: %v", err)
		return
	}
	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		c.Logger().Errorf("Failed to read the DNS forwarders for the database: %v", err)
		return
	}

	servers := dnsServerRecords(info, forwarders)
	withRouterDB(c, client, "save the DNS servers", func(ctx context.Context, conn *sqlx.DB) error {
		return db.SaveDNSServers(ctx, conn, servers)
	})
}

func dnsStaticEntryRecord(entry *routeros.StaticDNSEntry) *db.DNSStaticEntry {
	return &db.DNSStaticEntry{
		RouterID: entry.ID,
		Name:     entry.Name,
		Address:  entry.Address,
		Type:     entry.Type,
		TTL:      entry.TTL,
		Comment:  entry.Comment,
		Enabled:  !entry.Disabled,
	}
}

func persistDNSStaticEntry(c echo.Context, client *routeros.Client, entry *routeros.StaticDNSEntry) {
	withRouterDB(c, client, "save static DNS entry "+entry.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertDNSStaticEntry(ctx, conn, dnsStaticEntryRecord(entry))
	})
}

func removeDNSStaticEntryFromDB(c echo.Context, client *routeros.Client, routerID string) {
	withRouterDB(c, client, "delete static DNS entry "+routerID, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteDNSStaticEntry(ctx, conn, routerID)
	})
}

func persistAdBlockSetting(c echo.Context, client *routeros.Client, enabled bool) {
	withRouterDB(c, client, "save the ad-block setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, settingKeyAdBlockEnabled, strconv.FormatBool(enabled))
	})
}

func wizardDNSServers(domesticEnabled bool) []db.DNSServer {
	general := []string{dnsDefaultVPNIP}
	if domesticEnabled {
		general = append(general, dnsDefaultDomesticIP)
	}
	general = append(general, dnsDefaultForeignIP)
	generalServers := strings.Join(general, ",")

	servers := []db.DNSServer{
		{Name: dnsGlobalServerName, Type: db.DNSServerTypeGlobal, DNSServers: generalServers},
		{Name: "VPN", Type: db.DNSServerTypeForwarder, DNSServers: dnsDefaultVPNIP},
	}
	if domesticEnabled {
		servers = append(servers, db.DNSServer{Name: "Domestic", Type: db.DNSServerTypeForwarder, DNSServers: dnsDefaultDomesticIP})
	}
	servers = append(servers,
		db.DNSServer{Name: "Foreign", Type: db.DNSServerTypeForwarder, DNSServers: dnsDefaultForeignIP},
		db.DNSServer{Name: "General", Type: db.DNSServerTypeForwarder, DNSServers: generalServers},
	)

	return servers
}
