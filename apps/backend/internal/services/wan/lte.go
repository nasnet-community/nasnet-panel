package wan

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// ConfigureLTE configures LTE modem on a WAN interface.
//
//nolint:gocyclo,nestif,maintidx // LTE configuration complexity
func (s *WANService) ConfigureLTE(ctx context.Context, routerID string, input LteModemInput) (*WANInterfaceData, error) {
	s.logger.Infow("configuring LTE modem",
		zap.String("routerID", routerID),
		zap.String("interface", input.Interface))

	// Step 1: Configure LTE interface settings
	setArgs := map[string]string{
		"apn": input.APN,
	}

	if input.Pin != "" {
		setArgs["pin"] = input.Pin
	}

	if input.AuthProtocol != "" && input.AuthProtocol != "none" {
		setArgs["auth-protocol"] = input.AuthProtocol
		if input.Username != "" {
			setArgs["user"] = input.Username
		}
		if input.Password != "" {
			setArgs["password"] = input.Password
		}
	}

	if input.ProfileNumber > 0 {
		setArgs["profile"] = fmt.Sprintf("%d", input.ProfileNumber)
	}
	if input.MTU > 0 {
		setArgs["mtu"] = fmt.Sprintf("%d", input.MTU)
	}
	if input.Comment != "" {
		setArgs["comment"] = input.Comment
	}

	// Find the LTE interface ID first
	findCmd := router.Command{
		Path:   "/interface/lte/print",
		Action: "print",
		Args:   map[string]string{"name": input.Interface},
	}

	findResult, err := s.routerPort.ExecuteCommand(ctx, findCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to find LTE interface: %w", err)
	}

	if !findResult.Success || len(findResult.Data) == 0 {
		return nil, fmt.Errorf("LTE interface %s not found", input.Interface)
	}

	lteID := findResult.Data[0][".id"]
	setArgs[".id"] = lteID

	setCmd := router.Command{
		Path:   "/interface/lte/set",
		Action: "set",
		Args:   setArgs,
	}

	setResult, err := s.routerPort.ExecuteCommand(ctx, setCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to configure LTE modem: %w", err)
	}
	if !setResult.Success {
		return nil, fmt.Errorf("LTE modem configuration failed: %w", setResult.Error)
	}

	s.logger.Infow("LTE modem configured successfully",
		zap.String("interface", input.Interface))

	// Step 2: Enable/disable interface
	enableCmd := router.Command{
		Path:   "/interface/lte/set",
		Action: "set",
		Args: map[string]string{
			".id":      lteID,
			"disabled": boolToString(!input.Enabled),
		},
	}

	if _, enableErr := s.routerPort.ExecuteCommand(ctx, enableCmd); enableErr != nil {
		s.logger.Warnw("failed to enable/disable LTE interface", zap.Error(enableErr))
	}

	// Step 3: Configure default route if requested
	if input.IsDefaultRoute && input.Enabled {
		s.removeDefaultRoutes(ctx)

		addRouteCmd := router.Command{
			Path:   "/ip/route/add",
			Action: "add",
			Args: map[string]string{
				"gateway":     input.Interface,
				"dst-address": "0.0.0.0/0",
			},
		}

		if _, routeErr := s.routerPort.ExecuteCommand(ctx, addRouteCmd); routeErr != nil {
			s.logger.Warnw("failed to add default route", zap.Error(routeErr))
		}
	}

	// Step 4: Wait briefly for LTE to connect
	time.Sleep(2 * time.Second)

	// Step 5: Fetch LTE status
	statusCmd := router.Command{
		Path:   "/interface/lte/monitor",
		Action: "print",
		Args: map[string]string{
			"interface": input.Interface,
			"once":      "yes",
		},
	}

	statusResult, err := s.routerPort.ExecuteCommand(ctx, statusCmd)
	if err != nil {
		s.logger.Warnw("failed to fetch LTE status", zap.Error(err))
	}

	wanData := &WANInterfaceData{
		ID:             fmt.Sprintf("wan-lte-%s", input.Interface),
		InterfaceName:  input.Interface,
		ConnectionType: "LTE",
		Status:         "CONNECTING",
		IsDefaultRoute: input.IsDefaultRoute,
		HealthStatus:   "UNKNOWN",
		HealthEnabled:  false,
		LastConnected:  time.Now(),
	}

	lteData := &LteModemData{
		ID:            lteID,
		Name:          input.Interface,
		APN:           input.APN,
		Running:       input.Enabled,
		PinConfigured: input.Pin != "",
		Comment:       input.Comment,
	}

	if statusResult != nil && statusResult.Success && len(statusResult.Data) > 0 {
		lteStatus := statusResult.Data[0]

		if rssiStr, ok := lteStatus["rssi"]; ok {
			if rssi, err := parseSignalStrength(rssiStr); err == nil {
				lteData.SignalStrength = rssi
			}
		}
		if operator, ok := lteStatus["current-operator"]; ok {
			lteData.Operator = operator
		}
		if netType, ok := lteStatus["access-technology"]; ok {
			lteData.NetworkType = netType
		}
		if sessionStatus, ok := lteStatus["session-status"]; ok {
			switch sessionStatus {
			case "established":
				wanData.Status = "CONNECTED"
			case "connecting":
				wanData.Status = "CONNECTING"
			default:
				wanData.Status = "DISCONNECTED"
			}
		}
		if ipStr, ok := lteStatus["ip-address"]; ok {
			wanData.PublicIP = ipStr
		}
	}

	wanData.LteModem = lteData

	s.cache.Invalidate(routerID)

	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		PublicIP:       wanData.PublicIP,
		Reason:         "LTE modem configured",
	}
	s.history.Add(routerID, historyEvent)

	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "LTE", "wan-service", input.IsDefaultRoute)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		s.logger.Warnw("failed to publish WAN configured event", zap.Error(err))
	}

	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "LTE", "wan-service")
	statusEvent.PublicIP = wanData.PublicIP
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		s.logger.Warnw("failed to publish WAN status changed event", zap.Error(err))
	}

	return wanData, nil
}
