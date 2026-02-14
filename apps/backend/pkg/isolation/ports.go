package isolation

import "fmt"

// PortConflictChecker provides utilities for detecting port allocation conflicts.
type PortConflictChecker struct {
	reservedPorts map[int]bool
}

// NewPortConflictChecker creates a new port conflict checker with the given reserved ports.
func NewPortConflictChecker(reservedPorts []int) *PortConflictChecker {
	reserved := make(map[int]bool, len(reservedPorts))
	for _, p := range reservedPorts {
		reserved[p] = true
	}
	return &PortConflictChecker{reservedPorts: reserved}
}

// IsReserved returns true if the port is in the reserved ports list.
func (pc *PortConflictChecker) IsReserved(port int) bool {
	return pc.reservedPorts[port]
}

// ValidatePortRange checks that a port is within the valid TCP/UDP port range (1-65535).
func ValidatePortRange(port int) error {
	if port < 1 || port > 65535 {
		return fmt.Errorf("port %d is out of valid range (1-65535)", port)
	}
	return nil
}

// FindConflicts returns ports that appear in both slices (i.e., conflicts).
func FindConflicts(portsA, portsB []int) []int {
	setB := make(map[int]bool, len(portsB))
	for _, p := range portsB {
		setB[p] = true
	}

	var conflicts []int
	for _, p := range portsA {
		if setB[p] {
			conflicts = append(conflicts, p)
		}
	}
	return conflicts
}

// ValidatePortsSubset checks that all ports in subset exist in superset.
// Returns a list of missing ports and an error if any are missing.
func ValidatePortsSubset(subset, superset []int) ([]int, error) {
	supersetMap := make(map[int]bool, len(superset))
	for _, p := range superset {
		supersetMap[p] = true
	}

	var missing []int
	for _, p := range subset {
		if !supersetMap[p] {
			missing = append(missing, p)
		}
	}

	if len(missing) > 0 {
		return missing, fmt.Errorf("ports %v not found in allocated ports", missing)
	}
	return nil, nil
}
