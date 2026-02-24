package lifecycle

import (
	"context"
	"errors"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"

	"backend/internal/network"

	"github.com/oklog/ulid/v2"
	"go.uber.org/zap"
)

// CreateInstance creates a new service instance and installs the binary
func (im *InstanceManager) CreateInstance(ctx context.Context, req CreateInstanceRequest) (*ent.ServiceInstance, error) {
	// Validate feature exists
	manifest, err := im.config.Registry.GetManifest(req.FeatureID)
	if err != nil {
		return nil, fmt.Errorf("invalid feature ID: %w", err)
	}

	// Check compatibility
	compatible, issues := manifest.IsCompatibleWith(
		req.RouterOSVersion,
		req.Architecture,
		req.AvailableMemoryMB,
		req.AvailableDiskMB,
	)
	if !compatible {
		return nil, fmt.Errorf("feature not compatible: %v", issues)
	}

	// Generate instance ID upfront (needed for port allocation)
	instanceID := ulid.Make().String()

	// Determine required port count from manifest
	requiredPortCount := len(manifest.RequiredPorts)
	if requiredPortCount == 0 {
		requiredPortCount = 1 // Default to 1 port if not specified
	}

	// Allocate resources (ports)
	allocatedPorts, err := im.allocatePorts(ctx, req.RouterID, instanceID, req.FeatureID, requiredPortCount)
	if err != nil {
		return nil, fmt.Errorf("failed to allocate ports: %w", err)
	}

	// Allocate VLAN if required by feature (NAS-8.18 Virtual Interface Factory)
	requiresVLAN := im.requiresVLAN(req.FeatureID)
	var vlanID *int
	if requiresVLAN {
		vlanID, err = im.allocateVLAN(ctx, req.RouterID, instanceID, req.FeatureID)
		if err != nil {
			// Rollback: Release allocated ports on VLAN allocation failure
			im.releasePortsByInstance(ctx, instanceID)
			return nil, fmt.Errorf("failed to allocate VLAN: %w", err)
		}
	}

	// Create database record
	instanceBuilder := im.config.Store.ServiceInstance.Create().
		SetID(instanceID).
		SetFeatureID(req.FeatureID).
		SetInstanceName(req.InstanceName).
		SetRouterID(req.RouterID).
		SetStatus(serviceinstance.StatusInstalling).
		SetPorts(allocatedPorts).
		SetConfig(req.Config)

	// Set VLAN ID if allocated
	if vlanID != nil {
		instanceBuilder = instanceBuilder.SetVlanID(*vlanID)
	}

	instance, err := instanceBuilder.Save(ctx)

	if err != nil {
		// Rollback: Release allocated ports and VLANs on failure
		im.releasePortsByInstance(ctx, instanceID)
		im.releaseVLANsByInstance(ctx, instanceID)
		return nil, fmt.Errorf("failed to create instance record: %w", err)
	}

	// Emit creation event
	im.emitStateChangeEvent(ctx, instance.ID, "", string(StatusInstalling))

	// Start binary download in background
	go func() { //nolint:contextcheck // installer closure captures context
		downloadCtx, cancel := context.WithCancel(context.Background())
		defer cancel()

		// Determine binary URL and checksum from manifest
		binaryURL := fmt.Sprintf("https://github.com/nasnetconnect/%s/releases/latest/download/%s", req.FeatureID, req.FeatureID)
		checksum := manifest.DockerTag // Placeholder - should be actual checksum

		// Download binary
		if err := im.config.DownloadMgr.Download(downloadCtx, req.FeatureID, binaryURL, checksum); err != nil {
			im.logger.Error("Binary download failed", zap.Error(err), zap.String("instance_id", instance.ID))
			_ = im.updateInstanceStatus(downloadCtx, instance.ID, StatusFailed) //nolint:errcheck // best-effort status update, download failure is already being handled
			im.emitStateChangeEvent(downloadCtx, instance.ID, string(StatusInstalling), string(StatusFailed))
			return
		}

		// Update binary info using PathResolver
		binaryPath := im.config.PathResolver.BinaryPath(req.FeatureID)
		_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
			SetBinaryPath(binaryPath).
			SetBinaryVersion(manifest.Version).
			SetBinaryChecksum(checksum).
			SetStatus(serviceinstance.StatusInstalled).
			Save(downloadCtx)

		if err != nil {
			im.logger.Error("Failed to update instance after download", zap.Error(err), zap.String("instance_id", instance.ID))
			return
		}

		// Emit installed event
		im.emitStateChangeEvent(downloadCtx, instance.ID, string(StatusInstalling), string(StatusInstalled))
		im.logger.Info("Instance installed successfully", zap.String("instance_id", instance.ID))
	}()

	return instance, nil
}

// allocatePorts allocates the required number of ports for a service instance
func (im *InstanceManager) allocatePorts(ctx context.Context, routerID, instanceID, serviceType string, requiredCount int) ([]int, error) {
	if im.config.PortRegistry == nil {
		return nil, fmt.Errorf("port registry not configured")
	}

	var allocatedPorts []int
	var allocations []*network.AllocatePortResponse

	for i := 0; i < requiredCount; i++ {
		resp, err := im.config.PortRegistry.AllocatePort(ctx, network.AllocatePortRequest{
			RouterID:    routerID,
			InstanceID:  instanceID,
			ServiceType: serviceType,
			Protocol:    "TCP",
			Notes:       fmt.Sprintf("Port %d of %d for %s instance", i+1, requiredCount, serviceType),
		})

		if err != nil {
			// Rollback: Release all previously allocated ports
			im.logger.Error("port allocation failed, rolling back",
				zap.Error(err),
				zap.String("router_id", routerID),
				zap.String("instance_id", instanceID),
				zap.String("service_type", serviceType),
				zap.Int("allocated_count", len(allocations)),
			)

			for _, prevAlloc := range allocations {
				if releaseErr := im.config.PortRegistry.ReleasePort(ctx, routerID, prevAlloc.Port, prevAlloc.Protocol); releaseErr != nil {
					im.logger.Error("failed to release port during rollback",
						zap.Error(releaseErr),
						zap.Int("port", prevAlloc.Port),
					)
				}
			}

			return nil, fmt.Errorf("failed to allocate port %d of %d: %w", i+1, requiredCount, err)
		}

		allocatedPorts = append(allocatedPorts, resp.Port)
		allocations = append(allocations, resp)

		im.logger.Debug("port allocated",
			zap.String("router_id", routerID),
			zap.String("instance_id", instanceID),
			zap.Int("port", resp.Port),
			zap.String("protocol", resp.Protocol),
		)
	}

	im.logger.Info("successfully allocated ports",
		zap.String("router_id", routerID),
		zap.String("instance_id", instanceID),
		zap.String("service_type", serviceType),
		zap.Any("ports", allocatedPorts),
	)

	return allocatedPorts, nil
}

// releasePortsByInstance releases all port allocations for a service instance
func (im *InstanceManager) releasePortsByInstance(ctx context.Context, instanceID string) {
	if im.config.PortRegistry == nil {
		im.logger.Warn("port registry not configured, cannot release ports")
		return
	}

	allocations, err := im.config.PortRegistry.GetAllocationsByInstance(ctx, instanceID)
	if err != nil {
		im.logger.Error("failed to query port allocations for instance", zap.Error(err), zap.String("instance_id", instanceID))
		return
	}

	for _, alloc := range allocations {
		protocol := alloc.GetProtocol()
		if err := im.config.PortRegistry.ReleasePort(ctx, alloc.GetRouterID(), alloc.GetPort(), protocol); err != nil {
			im.logger.Error("failed to release port",
				zap.Error(err),
				zap.String("instance_id", instanceID),
				zap.String("router_id", alloc.GetRouterID()),
				zap.Int("port", alloc.GetPort()),
				zap.String("protocol", protocol),
			)
		}
	}

	im.logger.Info("released all ports for instance",
		zap.String("instance_id", instanceID),
		zap.Int("released_count", len(allocations)),
	)
}

// allocateVLAN allocates a VLAN for a service instance (NAS-8.18)
func (im *InstanceManager) allocateVLAN(ctx context.Context, routerID, instanceID, serviceType string) (*int, error) {
	if im.config.VLANAllocator == nil {
		im.logger.Warn("vlan allocator not configured, skipping vlan allocation")
		return nil, fmt.Errorf("instance not found")
	}

	resp, err := im.config.VLANAllocator.AllocateVLAN(ctx, network.AllocateVLANRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: serviceType,
	})

	if err != nil {
		if errors.Is(err, network.ErrPoolExhausted) {
			return nil, fmt.Errorf("VLAN pool exhausted (100-199). Release unused instances or expand pool: %w", err)
		}
		return nil, fmt.Errorf("failed to allocate VLAN: %w", err)
	}

	im.logger.Info("vlan allocated for instance",
		zap.String("router_id", routerID),
		zap.String("instance_id", instanceID),
		zap.String("service_type", serviceType),
		zap.Int("vlan_id", resp.VlanID),
		zap.String("subnet", resp.Subnet),
	)

	return &resp.VlanID, nil
}

// releaseVLANsByInstance releases all VLAN allocations for a service instance
func (im *InstanceManager) releaseVLANsByInstance(ctx context.Context, instanceID string) {
	if im.config.VLANAllocator == nil {
		im.logger.Warn("vlan allocator not configured, cannot release vlans")
		return
	}

	allocations, err := im.config.VLANAllocator.GetAllocationsByInstance(ctx, instanceID)
	if err != nil {
		im.logger.Error("failed to query vlan allocations for instance", zap.Error(err), zap.String("instance_id", instanceID))
		return
	}

	for _, alloc := range allocations {
		if err := im.config.VLANAllocator.ReleaseVLAN(ctx, alloc.GetRouterID(), alloc.GetVlanID()); err != nil {
			im.logger.Error("failed to release vlan",
				zap.Error(err),
				zap.String("instance_id", instanceID),
				zap.String("router_id", alloc.GetRouterID()),
				zap.Int("vlan_id", alloc.GetVlanID()),
			)
		}
	}

	im.logger.Info("released all vlans for instance",
		zap.String("instance_id", instanceID),
		zap.Int("released_count", len(allocations)),
	)
}

// requiresVLAN determines if a service feature requires VLAN allocation for network isolation.
func (im *InstanceManager) requiresVLAN(featureID string) bool {
	vlanRequiredServices := map[string]bool{
		"tor":          true,
		"xray":         true,
		"xray-core":    true,
		"singbox":      true,
		"sing-box":     true,
		"mtproxy":      true,
		"psiphon":      true,
		"adguard":      false,
		"adguard-home": false,
	}

	required, exists := vlanRequiredServices[featureID]
	if !exists {
		im.logger.Debug("unknown service for vlan requirement, defaulting to no vlan",
			zap.String("feature_id", featureID),
		)
		return false
	}

	return required
}
