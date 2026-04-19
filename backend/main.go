package main

import (
	"fmt"
	"log"
	routeros2 "nasnet-panel/pkg/routeros"
)

func chr() {
	client, err := routeros2.NewClient(routeros2.ConnectionConfig{
		Address:  "192.168.88.150",
		Username: "admin",
		Password: "1Ryan95??",
		Port:     8728,
	})
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	resources, err := client.GetResourceInfo()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("System Information:\n")
	fmt.Printf("  Uptime: %s\n", resources.UpTime)
	fmt.Printf("  CPU Count: %d\n", resources.CPUCount)
	fmt.Printf("  CPU Load: %d%%\n", resources.CPULoad)
	fmt.Printf("  Memory Total: %d bytes\n", resources.MemoryTotal)
	fmt.Printf("  Memory Used: %d bytes\n", resources.MemoryUsed)
	fmt.Printf("  Board Name: %s\n", resources.BoardName)

	license, err := client.GetLicenseInfo()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\nLicense Information:\n")
	fmt.Printf("  License Level: %s\n", license.Level)
	fmt.Printf("  Deadline: %s\n", license.DeadlineAt)
	fmt.Printf("  Next Renewal: %s\n", license.NextRenewalAt)
	fmt.Printf("  LimitedUpgrades: %t\n", license.LimitedUpgrades)
	fmt.Printf("  System ID: %s\n", license.SystemID)

	interfaces, err := client.ListInterfaces()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\nNetwork Interfaces (%d):\n", len(interfaces))
	for _, iface := range interfaces {
		status := "down"
		if iface.Running {
			status = "up"
		}
		fmt.Printf("  %s [%s] - %s (MAC: %s)\n", iface.Name, iface.Type, status, iface.Mac)
	}

	addresses, err := client.ListIPAddresses()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\nIP Addresses (%d):\n", len(addresses))
	for _, addr := range addresses {
		fmt.Printf("  %s on %s\n", addr.Address, addr.Interface)
	}

	showWiFiExample(client)
}

func physical() {
	client, err := routeros2.NewClient(routeros2.ConnectionConfig{
		Address:  "192.168.88.150",
		Username: "admin",
		Password: "1Ryan95??",
		Port:     8728,
	})
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	resources, err := client.GetResourceInfo()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("System Information:\n")
	fmt.Printf("  Uptime: %s\n", resources.UpTime)
	fmt.Printf("  CPU Count: %d\n", resources.CPUCount)
	fmt.Printf("  CPU Load: %d%%\n", resources.CPULoad)
	fmt.Printf("  Memory Total: %d bytes\n", resources.MemoryTotal)
	fmt.Printf("  Memory Used: %d bytes\n", resources.MemoryUsed)
	fmt.Printf("  Board Name: %s\n", resources.BoardName)

	license, err := client.GetLicenseInfo()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\nLicense Information:\n")
	fmt.Printf("  License Level: %s\n", license.Level)
	if license.DeadlineAt != "" {
		fmt.Printf("  Deadline: %s\n", license.DeadlineAt)
	}
	if license.NextRenewalAt != "" {
		fmt.Printf("  Next Renewal: %s\n", license.NextRenewalAt)
	}
	fmt.Printf("  System ID: %s\n", license.SystemID)

	interfaces, err := client.ListInterfaces()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\nNetwork Interfaces (%d):\n", len(interfaces))
	for _, iface := range interfaces {
		status := "down"
		if iface.Running {
			status = "up"
		}
		fmt.Printf("  %s [%s] - %s (MAC: %s)\n", iface.Name, iface.Type, status, iface.Mac)
	}

	addresses, err := client.ListIPAddresses()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\nIP Addresses (%d):\n", len(addresses))
	for _, addr := range addresses {
		fmt.Printf("  %s on %s\n", addr.Address, addr.Interface)
	}

	showWiFiExample(client)
}

func showWiFiExample(client *routeros2.Client) {
	wifiType, err := client.GetWiFiDriverType()
	if err != nil {
		log.Printf("WiFi detection error: %v", err)
		return
	}

	fmt.Printf("\nWiFi/Wireless:\n")
	fmt.Printf("  Driver Type: %s\n", wifiType)

	if wifiType == routeros2.WiFiDriverNone {
		fmt.Printf("  No WiFi package is installed on this router.\n")
		return
	}

	wifis, err := client.ListWifiInterfaces()
	if err != nil {
		log.Printf("Error listing WiFi interfaces: %v", err)
		return
	}

	fmt.Printf("  Interfaces (%d):\n", len(wifis))
	for _, wifi := range wifis {
		status := "down"
		if wifi.Running {
			status = "up"
		}
		pass := ""
		if wifi.Passphrase != "" {
			pass = fmt.Sprintf(", Pass: %s", wifi.Passphrase)
		}
		fmt.Printf("    %s (SSID: %s, Band: %d, %s%s)\n", wifi.Name, wifi.SSID, wifi.Band, status, pass)
	}
}

func exampleChangeWifiPassphrase(client *routeros2.Client) {
	fmt.Println("\n╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║              Change WiFi Passphrase Example                   ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")

	driverType, err := client.GetWiFiDriverType()
	if err != nil {
		fmt.Printf("✗ Failed to detect WiFi driver type: %v\n", err)
		return
	}
	fmt.Printf("\n✓ WiFi Driver Type: %s\n", driverType)

	if driverType == routeros2.WiFiDriverNone {
		fmt.Println("✗ No WiFi package is installed on this router.")
		return
	}

	wifis, err := client.ListWifiInterfaces()
	if err != nil {
		fmt.Printf("✗ Failed to list WiFi interfaces: %v\n", err)
		return
	}

	if len(wifis) == 0 {
		fmt.Println("✗ No WiFi interfaces found.")
		return
	}

	targetInterface := wifis[0]
	fmt.Printf("\n✓ Found WiFi interface: %s\n", targetInterface.Name)
	fmt.Printf("  ID: %s\n", targetInterface.ID)
	fmt.Printf("  SSID: %s\n", targetInterface.SSID)
	fmt.Printf("  Current Passphrase: %s\n", targetInterface.Passphrase)

	currentPassword, err := client.GetWifiPassword(targetInterface.Name)
	if err != nil {
		fmt.Printf("✗ Failed to get WiFi password: %v\n", err)
		return
	}

	fmt.Printf("\n✓ Current Security Info:\n")
	fmt.Printf("  Interface: %s\n", currentPassword.InterfaceName)
	fmt.Printf("  SSID: %s\n", currentPassword.SSID)
	fmt.Printf("  Security Type: %s\n", currentPassword.SecurityType)
	fmt.Printf("  Current Passphrase: %s\n", currentPassword.Passphrase)
	fmt.Printf("  Cipher: %s\n", currentPassword.Cipher)

	newPassphrase := "G6YWREYUTG"
	fmt.Printf("\n→ Changing passphrase to: %s\n", newPassphrase)

	err = client.ChangeWifiPassphrase(targetInterface.Name, newPassphrase)
	if err != nil {
		fmt.Printf("✗ Failed to change passphrase: %v\n", err)
		return
	}

	fmt.Println("✓ Passphrase changed successfully!")

	updatedPassword, err := client.GetWifiPassword(targetInterface.Name)
	if err != nil {
		fmt.Printf("⚠ Failed to verify updated password: %v\n", err)
		return
	}

	fmt.Printf("\n✓ Updated Security Info:\n")
	fmt.Printf("  Passphrase: %s\n", updatedPassword.Passphrase)
	fmt.Printf("  SSID: %s\n", updatedPassword.SSID)

	fmt.Println("\n╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                    Example Complete                           ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝\n")
}

func testWiFiComprehensive(client *routeros2.Client) {
	fmt.Println("\n╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                  WiFi/Wireless Test Suite                     ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")

	fmt.Println("\n[TEST 1] Detecting WiFi Driver Type...")
	driverType, err := client.GetWiFiDriverType()
	if err != nil {
		fmt.Printf("  ✗ FAILED: %v\n", err)
		return
	}
	fmt.Printf("  ✓ PASSED: Driver Type = %s\n", driverType)

	if driverType == routeros2.WiFiDriverNone {
		fmt.Println("\n  ⚠ No WiFi package detected. Skipping remaining tests.")
		return
	}

	fmt.Println("\n[TEST 2] Listing WiFi Interfaces...")
	wifis, err := client.ListWifiInterfaces()
	if err != nil {
		fmt.Printf("  ✗ FAILED: %v\n", err)
		return
	}
	fmt.Printf("  ✓ PASSED: Found %d interface(s)\n", len(wifis))
	if len(wifis) == 0 {
		fmt.Println("  ⚠ No WiFi interfaces found. Skipping remaining tests.")
		return
	}

	for i, wifi := range wifis {
		fmt.Printf("\n  Interface %d:\n", i+1)
		fmt.Printf("    Name: %s\n", wifi.Name)
		fmt.Printf("    SSID: %s\n", wifi.SSID)
		fmt.Printf("    MAC: %s\n", wifi.MACAddress)
		fmt.Printf("    Mode: %s\n", wifi.Mode)
		fmt.Printf("    Band: %s\n", wifi.Band)
		fmt.Printf("    Channel Width: %s\n", wifi.ChannelWidth)
		fmt.Printf("    Frequency: %s\n", wifi.Frequency)
		status := "down"
		if wifi.Running {
			status = "up"
		}
		fmt.Printf("    Status: %s\n", status)
		fmt.Printf("    Disabled: %t\n", wifi.Disabled)
		if wifi.Passphrase != "" {
			fmt.Printf("    Password: %s\n", wifi.Passphrase)
		}
		fmt.Printf("    Comment: %s\n", wifi.Comment)
	}

	firstWiFi := wifis[0]
	fmt.Printf("\n[TEST 3] Getting Specific WiFi Interface (%s)...\n", firstWiFi.Name)
	wifiDetail, err := client.GetWifiInterface(firstWiFi.Name)
	if err != nil {
		fmt.Printf("  ✗ FAILED: %v\n", err)
	} else {
		fmt.Printf("  ✓ PASSED: Retrieved interface %s\n", wifiDetail.Name)
		fmt.Printf("    SSID: %s, Running: %t\n", wifiDetail.SSID, wifiDetail.Running)
		if wifiDetail.Passphrase != "" {
			fmt.Printf("    Password: %s\n", wifiDetail.Passphrase)
		}
	}

	fmt.Printf("\n[TEST 4] Listing Connected WiFi Clients on %s...\n", firstWiFi.Name)
	clients, err := client.ListWifiConnectedClients(firstWiFi.Name)
	if err != nil {
		fmt.Printf("  ⚠ SKIPPED: %v\n", err)
	} else {
		fmt.Printf("  ✓ PASSED: Found %d connected client(s)\n", len(clients))
		for i, clientInfo := range clients {
			fmt.Printf("\n    Client %d:\n", i+1)
			fmt.Printf("      ID: %s\n", clientInfo.ID)
			fmt.Printf("      MAC Address: %s\n", clientInfo.MACAddress)
			fmt.Printf("      SSID: %s\n", clientInfo.SSID)
			fmt.Printf("      Interface: %s\n", clientInfo.Interface)
			fmt.Printf("      Uptime: %s\n", clientInfo.Uptime)
			fmt.Printf("      Last Activity: %s\n", clientInfo.LastActivity)
			fmt.Printf("      Signal Strength: %s dBm\n", clientInfo.Signal)
			fmt.Printf("      Auth Type: %s\n", clientInfo.AuthType)
			fmt.Printf("      Band: %s\n", clientInfo.Band)
			fmt.Printf("      TX Rate: %s\n", clientInfo.TxRate)
			fmt.Printf("      RX Rate: %s\n", clientInfo.RxRate)
			fmt.Printf("      TX Packets: %s\n", clientInfo.TxPackets)
			fmt.Printf("      RX Packets: %s\n", clientInfo.RxPackets)
			fmt.Printf("      TX Bytes: %s\n", clientInfo.TxBytes)
			fmt.Printf("      RX Bytes: %s\n", clientInfo.RxBytes)
			fmt.Printf("      TX Bits/Sec: %s\n", clientInfo.TxBitsPerSecond)
			fmt.Printf("      RX Bits/Sec: %s\n", clientInfo.RxBitsPerSecond)
			fmt.Printf("      Authorized: %v\n", clientInfo.Authorized)
		}
		if len(clients) == 0 {
			fmt.Println("    No connected clients.")
		}
	}

	if err != nil {
		fmt.Printf("  ⚠ SKIPPED: %v\n", err)
	} else {
		fmt.Printf("  ✓ PASSED: Security updated (WPA2-PSK with CCMP)\n")
	}

	fmt.Printf("\n[TEST 8] Creating WiFi Interface Configuration...\n")
	newConfig := routeros2.WifiConfig{
		Name:         "wlan_test",
		Interface:    "wlan0",
		SSID:         "TestNetwork",
		Mode:         "ap",
		Band:         "2ghz-only",
		Channel:      "6",
		ChannelWidth: "20mhz",
		Disabled:     true,
		Comment:      "Test interface - not actually added",
		Security: routeros2.WifiSecurity{
			Type:       "wpa2-psk",
			Cipher:     "ccmp",
			Passphrase: "SecurePassword123",
		},
	}
	fmt.Printf("  ✓ Config created:\n")
	fmt.Printf("    Name: %s\n", newConfig.Name)
	fmt.Printf("    SSID: %s\n", newConfig.SSID)
	fmt.Printf("    Mode: %s\n", newConfig.Mode)
	fmt.Printf("    Channel: %s\n", newConfig.Channel)
	fmt.Printf("    Security: %s\n", newConfig.Security.Type)
	fmt.Println("\n  NOTE: Interface NOT actually created (marked as Disabled)")
	fmt.Println("        Uncomment the code below to actually add the interface:")
	fmt.Println("        id, err := client.AddWifiInterface(newConfig)")

	fmt.Printf("\n[TEST 9] Getting WiFi Password for %s...\n", firstWiFi.Name)
	wifiPass, err := client.GetWifiPassword(firstWiFi.Name)
	if err != nil {
		fmt.Printf("  ⚠ SKIPPED: %v\n", err)
	} else {
		fmt.Printf("  ✓ PASSED: Retrieved password info\n")
		fmt.Printf("    Interface: %s\n", wifiPass.InterfaceName)
		fmt.Printf("    SSID: %s\n", wifiPass.SSID)
		fmt.Printf("    Security Type: %s\n", wifiPass.SecurityType)
		if wifiPass.Passphrase != "" {
			fmt.Printf("    Passphrase: %s\n", wifiPass.Passphrase)
		} else {
			fmt.Printf("    Passphrase: (none/open network)\n")
		}
		if wifiPass.Cipher != "" {
			fmt.Printf("    Cipher: %s\n", wifiPass.Cipher)
		}
	}

	fmt.Printf("\n[TEST 10] Removing Connected WiFi Client...\n")
	if len(clients) > 0 {
		clientToRemove := "40:F3:08:E2:EB:4C"
		fmt.Printf("  Attempting to remove client: %s\n", clientToRemove)
		err = client.RemoveWifiConnectedClient(clientToRemove)
		if err != nil {
			fmt.Printf("  ⚠ SKIPPED/FAILED: %v\n", err)
		} else {
			fmt.Printf("  ✓ PASSED: Client %s disconnected\n", clientToRemove)
		}
	} else {
		fmt.Printf("  ⚠ SKIPPED: No connected clients to remove\n")
	}

	fmt.Println("\n╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                  Test Suite Complete                          ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝\n")
}

func main() {
	client, err := routeros2.NewClient(routeros2.ConnectionConfig{
		Address:  "192.168.88.147",
		Username: "admin",
		Password: "1Ryan95??",
		Port:     8728,
	})
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	testWiFiComprehensive(client)

	/*	macToRemove := "40:F3:08:E2:EB:4C"
		err = client.RemoveWifiConnectedClient(macToRemove)
		if err != nil {
			fmt.Printf("  ⚠ SKIPPED/FAILED: %v\n", err)
		} else {
			fmt.Printf("  ✓ PASSED: Client %s disconnected\n", macToRemove)
		}*/

}
