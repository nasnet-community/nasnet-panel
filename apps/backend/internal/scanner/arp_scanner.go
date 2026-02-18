package scanner

import (
	"backend/internal/scanner/arp"
)

// Re-export types and functions from arp package for backward compatibility
type (
	// ARPScannerService provides ARP-based device discovery.
	ARPScannerService = arp.ARPScannerService

	// ARPServiceConfig holds configuration for the ARP scanner service.
	ARPServiceConfig = arp.ServiceConfig

	// ARPScanSession tracks the state of an active scan.
	ARPScanSession = arp.ScanSession
)

// NewARPScannerService creates a new ARP scanner service.
var NewARPScannerService = arp.NewARPScannerService
