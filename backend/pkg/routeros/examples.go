package routeros

import (
	"fmt"
	"log"
)

func ExampleUsage() {
	client, err := NewClient(ConnectionConfig{
		Address:  "192.168.88.1",
		Username: "admin",
		Password: "password",
		Port:     8728,
	})
	if err != nil {
		log.Fatalf("Connection failed: %v", err)
	}
	defer client.Close()

	exampleSystemInfo(client)

	exampleInterfaces(client)

	exampleIPConfig(client)

	exampleFirewallRules(client)

	exampleDHCPSetup(client)

	exampleWiFiConfig(client)

	exampleQueueManagement(client)
}

func exampleSystemInfo(client *Client) {
	fmt.Println("\n=== System Information ===")

	identity, err := client.GetSystemIdentity()
	if err != nil {
		log.Printf("Error getting identity: %v", err)
		return
	}
	fmt.Printf("Router Identity: %s\n", identity.Name)

	resources, err := client.GetResourceInfo()
	if err != nil {
		log.Printf("Error getting resources: %v", err)
		return
	}
	fmt.Printf("CPU Count: %d, CPU Load: %d%%\n", resources.CPUCount, resources.CPULoad)
	fmt.Printf("Memory: %d/%d bytes\n", resources.MemoryUsed, resources.MemoryTotal)
	fmt.Printf("Uptime: %s\n", resources.UpTime)

	clock, err := client.GetClockInfo()
	if err != nil {
		log.Printf("Error getting clock info: %v", err)
	} else {
		fmt.Printf("System Time: %s %s (Timezone: %s)\n", clock.Date, clock.Time, clock.TimeZone)
	}

	license, err := client.GetLicenseInfo()
	if err != nil {
		log.Printf("Error getting license: %v", err)
	} else {
		fmt.Printf("License Level: %s (Expires: %s)\n", license.Level, license.DeadlineAt)
		fmt.Printf("System ID: %s\n", license.SystemID)
	}

	packages, err := client.ListPackages()
	if err != nil {
		log.Printf("Error listing packages: %v", err)
	} else {
		fmt.Printf("Available Packages: %d\n", len(packages))
		for _, pkg := range packages {
			if pkg.Available {
				fmt.Printf("  - %s (v%s)\n", pkg.Name, pkg.Version)
			}
		}
	}

	updates, err := client.GetSystemUpdates()
	if err != nil {
		log.Printf("Error checking updates: %v", err)
	} else {
		fmt.Printf("Update Available: v%s (Channel: %s)\n", updates.Version, updates.Channel)
	}

	storages, err := client.GetHDD()
	if err != nil {
		log.Printf("Error getting storage: %v", err)
	} else {
		fmt.Printf("Storage Devices: %d\n", len(storages))
		for _, storage := range storages {
			fmt.Printf("  - %s: %d MB total, %d MB free\n", storage.Name, storage.Size/1024/1024, storage.Free/1024/1024)
		}
	}

	logSettings, err := client.ListLogSettings()
	if err != nil {
		log.Printf("Error listing log settings: %v", err)
	} else {
		fmt.Printf("Logging Rules: %d configured\n", len(logSettings))
		for _, logRule := range logSettings {
			fmt.Printf("  - %s (Topics: %s, Action: %s)\n", logRule.ID, logRule.Topics, logRule.Action)
		}
	}
}

func exampleInterfaces(client *Client) {
	fmt.Println("\n=== Interface Management ===")

	interfaces, err := client.ListInterfaces()
	if err != nil {
		log.Printf("Error listing interfaces: %v", err)
		return
	}

	fmt.Printf("Found %d interfaces:\n", len(interfaces))
	for _, iface := range interfaces {
		status := "down"
		if iface.Running {
			status = "up"
		}
		fmt.Printf("  %s (%s) - %s\n", iface.Name, iface.Type, status)
	}
}

func exampleIPConfig(client *Client) {
	fmt.Println("\n=== IP Configuration ===")

	addresses, err := client.ListIPAddresses()
	if err != nil {
		log.Printf("Error listing IP addresses: %v", err)
		return
	}

	fmt.Printf("IP Addresses (%d):\n", len(addresses))
	for _, addr := range addresses {
		fmt.Printf("  %s on %s\n", addr.Address, addr.Interface)
	}
}

func exampleFirewallRules(client *Client) {
	fmt.Println("\n=== Firewall Rules ===")

	rules, err := client.ListFirewallRules()
	if err != nil {
		log.Printf("Error listing firewall rules: %v", err)
		return
	}

	fmt.Printf("Total Firewall Rules: %d\n", len(rules))
	for i, rule := range rules {
		if i >= 3 {
			break
		}
		fmt.Printf("  Rule %d: %s (chain: %s)\n", i+1, rule.Action, rule.Chain)
	}
}

func exampleDHCPSetup(client *Client) {
	fmt.Println("\n=== DHCP Configuration ===")

	servers, err := client.ListDHCPServers()
	if err != nil {
		log.Printf("Error listing DHCP servers: %v", err)
		return
	}

	fmt.Printf("DHCP Servers: %d\n", len(servers))
}

func exampleWiFiConfig(client *Client) {
	fmt.Println("\n=== WiFi Configuration ===")

	wifiType, err := client.GetWiFiDriverType()
	if err != nil {
		log.Printf("Error detecting WiFi stack: %v", err)
		return
	}
	fmt.Printf("WiFi Stack: %s\n", wifiType)

	wifis, err := client.ListWifiInterfaces()
	if err != nil {
		log.Printf("Error listing WiFi interfaces: %v", err)
		return
	}

	fmt.Printf("WiFi Interfaces: %d\n", len(wifis))
	for _, wifi := range wifis {
		status := "down"
		if wifi.Running {
			status = "up"
		}
		fmt.Printf("  %s (SSID: %s, Band: %s, %s)\n",
			wifi.Name, wifi.SSID, wifi.Band, status)
	}
}

func exampleQueueManagement(client *Client) {
	fmt.Println("\n=== Queue Management ===")

	queues, err := client.ListQueues()
	if err != nil {
		log.Printf("Error listing queues: %v", err)
		return
	}

	fmt.Printf("General Queues: %d\n", len(queues))
}
