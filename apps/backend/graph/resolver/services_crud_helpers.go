package resolver

// This file contains helper/conversion functions for the service CRUD query resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/routingchain"
	"backend/generated/ent/serviceinstance"
	"backend/generated/ent/virtualinterface"
	graphql1 "backend/graph/model"
	"backend/internal/features"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/vif/routing"
	"encoding/json"
)

// convertManifestToAvailableService converts a features.Manifest to graphql1.AvailableService.
func convertManifestToAvailableService(m *features.Manifest) *graphql1.AvailableService {
	var homepage *string
	if m.Homepage != "" {
		h := m.Homepage
		homepage = &h
	}
	var icon *string
	if m.Icon != "" {
		ic := m.Icon
		icon = &ic
	}
	var minRouterOS *string
	if m.MinRouterOSVersion != "" {
		v := m.MinRouterOSVersion
		minRouterOS = &v
	}

	tags := m.Tags
	if tags == nil {
		tags = []string{}
	}
	archs := m.Architectures
	if archs == nil {
		archs = []string{}
	}
	requiredPkgs := m.RequiredPackages
	if requiredPkgs == nil {
		requiredPkgs = []string{}
	}
	requiredPorts := m.RequiredPorts
	if requiredPorts == nil {
		requiredPorts = []int{}
	}

	var configSchema map[string]any
	if len(m.ConfigSchema) > 0 {
		_ = json.Unmarshal(m.ConfigSchema, &configSchema) //nolint:errcheck // best-effort schema parse
	}

	return &graphql1.AvailableService{
		ID:                 m.ID,
		Name:               m.Name,
		Description:        m.Description,
		Version:            m.Version,
		Category:           m.Category,
		Author:             m.Author,
		License:            m.License,
		Homepage:           homepage,
		Icon:               icon,
		Tags:               tags,
		Architectures:      archs,
		MinRouterOSVersion: minRouterOS,
		RequiredPackages:   requiredPkgs,
		RequiredPorts:      requiredPorts,
		RequiredMemoryMb:   m.RequiredMemoryMB,
		RequiredDiskMb:     m.RequiredDiskMB,
		DockerImage:        m.DockerImage,
		DockerTag:          m.DockerTag,
		DefaultConfig:      m.DefaultConfig,
		ConfigSchema:       configSchema,
	}
}

// convertEntInstanceToGraphQL converts an ent ServiceInstance to graphql1.ServiceInstance.
func convertEntInstanceToGraphQL(inst *ent.ServiceInstance) *graphql1.ServiceInstance {
	var bindIP *string
	if inst.BindIP != "" {
		b := inst.BindIP
		bindIP = &b
	}
	var binaryPath *string
	if inst.BinaryPath != "" {
		bp := inst.BinaryPath
		binaryPath = &bp
	}
	var binaryVersion *string
	if inst.BinaryVersion != "" {
		bv := inst.BinaryVersion
		binaryVersion = &bv
	}
	var binaryChecksum *string
	if inst.BinaryChecksum != "" {
		bc := inst.BinaryChecksum
		binaryChecksum = &bc
	}

	ports := inst.Ports
	if ports == nil {
		ports = []int{}
	}

	var verification *graphql1.BinaryVerification
	if inst.VerificationEnabled {
		verification = convertEntInstanceToBinaryVerification(inst)
	}

	return &graphql1.ServiceInstance{
		ID:             inst.ID,
		FeatureID:      inst.FeatureID,
		InstanceName:   inst.InstanceName,
		RouterID:       inst.RouterID,
		Status:         convertEntStatusToGraphQL(inst.Status),
		VlanID:         inst.VlanID,
		BindIP:         bindIP,
		Ports:          ports,
		Config:         inst.Config,
		BinaryPath:     binaryPath,
		BinaryVersion:  binaryVersion,
		BinaryChecksum: binaryChecksum,
		Verification:   verification,
		CreatedAt:      inst.CreatedAt,
		UpdatedAt:      inst.UpdatedAt,
	}
}

// convertEntInstanceToBinaryVerification creates a BinaryVerification from an ent ServiceInstance.
func convertEntInstanceToBinaryVerification(inst *ent.ServiceInstance) *graphql1.BinaryVerification {
	var archiveHash *string
	if inst.ArchiveHash != "" {
		h := inst.ArchiveHash
		archiveHash = &h
	}
	var binaryHash *string
	if inst.BinaryHash != "" {
		h := inst.BinaryHash
		binaryHash = &h
	}
	var gpgKeyID *string
	if inst.GpgKeyID != "" {
		k := inst.GpgKeyID
		gpgKeyID = &k
	}
	var checksumsURL *string
	if inst.ChecksumsURL != "" {
		u := inst.ChecksumsURL
		checksumsURL = &u
	}

	var verStatus graphql1.VerificationStatus
	switch {
	case !inst.VerificationEnabled:
		verStatus = graphql1.VerificationStatusNotVerified
	case inst.VerifiedAt == nil:
		verStatus = graphql1.VerificationStatusPending
	case inst.GpgVerified || inst.BinaryHash != "":
		verStatus = graphql1.VerificationStatusValid
	default:
		verStatus = graphql1.VerificationStatusPending
	}

	return &graphql1.BinaryVerification{
		Enabled:      inst.VerificationEnabled,
		ArchiveHash:  archiveHash,
		BinaryHash:   binaryHash,
		GpgVerified:  inst.GpgVerified,
		GpgKeyID:     gpgKeyID,
		ChecksumsURL: checksumsURL,
		VerifiedAt:   inst.VerifiedAt,
		Status:       verStatus,
	}
}

// convertEntVIFToGraphQL converts an ent VirtualInterface to graphql1.VirtualInterface.
func convertEntVIFToGraphQL(vif *ent.VirtualInterface) *graphql1.VirtualInterface {
	var tunName *string
	if vif.TunName != "" {
		t := vif.TunName
		tunName = &t
	}

	return &graphql1.VirtualInterface{
		ID:            vif.ID,
		InstanceID:    vif.InstanceID,
		Name:          vif.InterfaceName,
		VlanID:        vif.VlanID,
		IPAddress:     vif.IPAddress,
		GatewayType:   convertEntGatewayTypeToGraphQL(vif.GatewayType),
		GatewayStatus: convertEntGatewayStatusToGraphQL(vif.GatewayStatus),
		TunName:       tunName,
		RoutingMark:   vif.RoutingMark,
		Status:        convertEntVIFStatusToGraphQL(vif.Status),
		CreatedAt:     vif.CreatedAt,
		UpdatedAt:     vif.UpdatedAt,
	}
}

// convertGatewayStatusToGraphQL converts a lifecycle.GatewayStatus to graphql1.GatewayInfo.
func convertGatewayStatusToGraphQL(status *lifecycle.GatewayStatus) *graphql1.GatewayInfo {
	if status == nil {
		return &graphql1.GatewayInfo{State: graphql1.GatewayStateStopped}
	}

	var gqlState graphql1.GatewayState
	switch status.State {
	case lifecycle.GatewayRunning:
		gqlState = graphql1.GatewayStateRunning
	case lifecycle.GatewayStopped:
		gqlState = graphql1.GatewayStateStopped
	case lifecycle.GatewayError:
		gqlState = graphql1.GatewayStateError
	case lifecycle.GatewayNotNeeded:
		gqlState = graphql1.GatewayStateNotNeeded
	default:
		gqlState = graphql1.GatewayStateStopped
	}

	var tunName *string
	if status.TunName != "" {
		t := status.TunName
		tunName = &t
	}
	var pid *int
	if status.PID > 0 {
		p := status.PID
		pid = &p
	}
	var uptime *int
	if secs := int(status.Uptime.Seconds()); secs > 0 {
		uptime = &secs
	}
	lastCheck := status.LastHealthCheck
	var errMsg *string
	if status.ErrorMessage != "" {
		e := status.ErrorMessage
		errMsg = &e
	}

	return &graphql1.GatewayInfo{
		State:           gqlState,
		TunName:         tunName,
		Pid:             pid,
		Uptime:          uptime,
		LastHealthCheck: &lastCheck,
		ErrorMessage:    errMsg,
	}
}

// convertEntStatusToGraphQL maps ent serviceinstance.Status to graphql1.ServiceInstanceStatus.
func convertEntStatusToGraphQL(s serviceinstance.Status) graphql1.ServiceInstanceStatus {
	switch s {
	case serviceinstance.StatusInstalling:
		return graphql1.ServiceInstanceStatusInstalling
	case serviceinstance.StatusInstalled:
		return graphql1.ServiceInstanceStatusInstalled
	case serviceinstance.StatusStarting:
		return graphql1.ServiceInstanceStatusStarting
	case serviceinstance.StatusRunning:
		return graphql1.ServiceInstanceStatusRunning
	case serviceinstance.StatusStopping:
		return graphql1.ServiceInstanceStatusStopping
	case serviceinstance.StatusStopped:
		return graphql1.ServiceInstanceStatusStopped
	case serviceinstance.StatusFailed:
		return graphql1.ServiceInstanceStatusFailed
	case serviceinstance.StatusDeleting:
		return graphql1.ServiceInstanceStatusDeleting
	default:
		return graphql1.ServiceInstanceStatusStopped
	}
}

// convertGraphQLStatusToEnt maps graphql1.ServiceInstanceStatus to ent serviceinstance.Status.
func convertGraphQLStatusToEnt(s graphql1.ServiceInstanceStatus) serviceinstance.Status {
	switch s {
	case graphql1.ServiceInstanceStatusInstalling:
		return serviceinstance.StatusInstalling
	case graphql1.ServiceInstanceStatusInstalled:
		return serviceinstance.StatusInstalled
	case graphql1.ServiceInstanceStatusStarting:
		return serviceinstance.StatusStarting
	case graphql1.ServiceInstanceStatusRunning:
		return serviceinstance.StatusRunning
	case graphql1.ServiceInstanceStatusStopping:
		return serviceinstance.StatusStopping
	case graphql1.ServiceInstanceStatusStopped:
		return serviceinstance.StatusStopped
	case graphql1.ServiceInstanceStatusFailed:
		return serviceinstance.StatusFailed
	case graphql1.ServiceInstanceStatusDeleting:
		return serviceinstance.StatusDeleting
	default:
		return serviceinstance.StatusStopped
	}
}

// convertEntGatewayTypeToGraphQL maps ent GatewayType to graphql1.GatewayType.
func convertEntGatewayTypeToGraphQL(gt virtualinterface.GatewayType) graphql1.GatewayType {
	if gt == virtualinterface.GatewayTypeHevSocks5Tunnel {
		return graphql1.GatewayTypeHevSocks5Tunnel
	}
	return graphql1.GatewayTypeNone
}

// convertEntGatewayStatusToGraphQL maps ent GatewayStatus to graphql1.GatewayStatus.
func convertEntGatewayStatusToGraphQL(gs virtualinterface.GatewayStatus) graphql1.GatewayStatus {
	//nolint:exhaustive // default handles remaining cases
	switch gs {
	case virtualinterface.GatewayStatusRunning:
		return graphql1.GatewayStatusRunning
	case virtualinterface.GatewayStatusStarting:
		return graphql1.GatewayStatusStarting
	case virtualinterface.GatewayStatusFailed:
		return graphql1.GatewayStatusFailed
	default:
		return graphql1.GatewayStatusStopped
	}
}

// convertEntVIFStatusToGraphQL maps ent virtualinterface.Status to graphql1.VirtualInterfaceStatus.
func convertEntVIFStatusToGraphQL(s virtualinterface.Status) graphql1.VirtualInterfaceStatus {
	switch s {
	case virtualinterface.StatusCreating:
		return graphql1.VirtualInterfaceStatusCreating
	case virtualinterface.StatusActive:
		return graphql1.VirtualInterfaceStatusActive
	case virtualinterface.StatusError:
		return graphql1.VirtualInterfaceStatusError
	case virtualinterface.StatusRemoving:
		return graphql1.VirtualInterfaceStatusRemoving
	default:
		return graphql1.VirtualInterfaceStatusCreating
	}
}

// convertCreateRoutingChainInput converts graphql CreateRoutingChainInput to routing domain input.
//
//nolint:gocyclo // complex input conversion with multiple switch cases
func convertCreateRoutingChainInput(input graphql1.CreateRoutingChainInput) routing.CreateRoutingChainInput {
	var routingMode routingchain.RoutingMode
	switch input.RoutingMode {
	case graphql1.RoutingModeIP:
		routingMode = routingchain.RoutingModeIP
	case graphql1.RoutingModeMac:
		routingMode = routingchain.RoutingModeMAC
	default:
		routingMode = routingchain.RoutingModeMAC
	}

	var killSwitchEnabled bool
	if input.KillSwitchEnabled.IsSet() {
		if v := input.KillSwitchEnabled.Value(); v != nil {
			killSwitchEnabled = *v
		}
	}

	killSwitchMode := routingchain.KillSwitchModeBLOCK_ALL
	if input.KillSwitchMode.IsSet() {
		if v := input.KillSwitchMode.Value(); v != nil {
			switch *v {
			case graphql1.KillSwitchModeFallbackService:
				killSwitchMode = routingchain.KillSwitchModeFALLBACK_SERVICE
			case graphql1.KillSwitchModeAllowDirect:
				killSwitchMode = routingchain.KillSwitchModeALLOW_DIRECT
			case graphql1.KillSwitchModeBlockAll:
				killSwitchMode = routingchain.KillSwitchModeBLOCK_ALL
			default:
				killSwitchMode = routingchain.KillSwitchModeBLOCK_ALL
			}
		}
	}

	var deviceMAC, deviceIP, deviceName string
	if input.DeviceMac.IsSet() {
		if v := input.DeviceMac.Value(); v != nil {
			deviceMAC = *v
		}
	}
	if input.DeviceIP.IsSet() {
		if v := input.DeviceIP.Value(); v != nil {
			deviceIP = *v
		}
	}
	if input.DeviceName.IsSet() {
		if v := input.DeviceName.Value(); v != nil {
			deviceName = *v
		}
	}

	hops := make([]routing.ChainHopInput, len(input.Hops))
	for i, h := range input.Hops {
		hops[i] = routing.ChainHopInput{
			InterfaceID: h.InterfaceID,
			Order:       h.Order,
		}
	}

	return routing.CreateRoutingChainInput{
		DeviceID:          input.DeviceID,
		DeviceMAC:         deviceMAC,
		DeviceIP:          deviceIP,
		DeviceName:        deviceName,
		RoutingMode:       routingMode,
		KillSwitchEnabled: killSwitchEnabled,
		KillSwitchMode:    killSwitchMode,
		Hops:              hops,
	}
}

// convertEntRoutingChainToGraphQL converts an ent RoutingChain to graphql1.RoutingChain.
func convertEntRoutingChainToGraphQL(chain *ent.RoutingChain) *graphql1.RoutingChain {
	if chain == nil {
		return nil
	}

	var routingMode graphql1.RoutingMode
	switch chain.RoutingMode {
	case routingchain.RoutingModeIP:
		routingMode = graphql1.RoutingModeIP
	case routingchain.RoutingModeMAC:
		routingMode = graphql1.RoutingModeMac
	default:
		routingMode = graphql1.RoutingModeMac
	}

	var killSwitchMode graphql1.KillSwitchMode
	switch chain.KillSwitchMode {
	case routingchain.KillSwitchModeFALLBACK_SERVICE:
		killSwitchMode = graphql1.KillSwitchModeFallbackService
	case routingchain.KillSwitchModeALLOW_DIRECT:
		killSwitchMode = graphql1.KillSwitchModeAllowDirect
	case routingchain.KillSwitchModeBLOCK_ALL:
		killSwitchMode = graphql1.KillSwitchModeBlockAll
	default:
		killSwitchMode = graphql1.KillSwitchModeBlockAll
	}

	gqlChain := &graphql1.RoutingChain{
		ID:                    chain.ID,
		DeviceID:              chain.DeviceID,
		Active:                chain.Active,
		RoutingMode:           routingMode,
		KillSwitchEnabled:     chain.KillSwitchEnabled,
		KillSwitchMode:        killSwitchMode,
		KillSwitchActive:      chain.KillSwitchActive,
		KillSwitchActivatedAt: chain.KillSwitchActivatedAt,
		CreatedAt:             chain.CreatedAt,
		UpdatedAt:             chain.UpdatedAt,
	}

	if chain.DeviceMAC != "" {
		mac := chain.DeviceMAC
		gqlChain.DeviceMac = &mac
	}
	if chain.DeviceIP != "" {
		ip := chain.DeviceIP
		gqlChain.DeviceIP = &ip
	}
	if chain.DeviceName != "" {
		name := chain.DeviceName
		gqlChain.DeviceName = &name
	}

	hops := chain.Edges.Hops
	if len(hops) > 0 {
		gqlHops := make([]*graphql1.ChainHop, 0, len(hops))
		for _, hop := range hops {
			gqlHop := &graphql1.ChainHop{
				ID:               hop.ID,
				Order:            hop.HopOrder,
				RoutingMark:      hop.RoutingMark,
				KillSwitchActive: hop.KillSwitchActive,
				Healthy:          true, // default; latency checker can update this
			}
			if hop.Edges.Interface != nil {
				gqlHop.Interface = convertEntVIFToGraphQL(hop.Edges.Interface)
			}
			gqlHops = append(gqlHops, gqlHop)
		}
		gqlChain.Hops = gqlHops
	}

	return gqlChain
}

// mapConfigFieldType maps a string field type to a graphql ConfigFieldType.
func mapConfigFieldType(fieldType string) graphql1.ConfigFieldType {
	switch fieldType {
	case "string":
		return graphql1.ConfigFieldTypeText
	case "int":
		return graphql1.ConfigFieldTypeNumber
	case "bool":
		return graphql1.ConfigFieldTypeToggle
	case "ip":
		return graphql1.ConfigFieldTypeIP
	case "port":
		return graphql1.ConfigFieldTypePort
	case "enum":
		return graphql1.ConfigFieldTypeSelect
	default:
		return graphql1.ConfigFieldTypeText
	}
}
