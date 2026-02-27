// Package certificate provisions TLS certificates on MikroTik routers.
package certificate

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// Service provisions TLS certificates on MikroTik routers.
type Service struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	logger     *zap.SugaredLogger
}

// ServiceConfig holds configuration for Service.
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewService creates a new certificate provisioning Service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// SelfSignedConfig holds parameters for self-signed certificate generation.
type SelfSignedConfig struct {
	Name       string
	CommonName string
	KeySize    int    // default 2048
	DaysValid  int    // default 3650
	Country    string // optional
	State      string // optional
	Org        string // optional
	Unit       string // optional
}

// ProvisionResult holds IDs of created certificate resources.
type ProvisionResult struct {
	CertificateID string
	ImportedIDs   []string
}

// ProvisionSelfSigned generates and signs a self-signed certificate on the router.
func (s *Service) ProvisionSelfSigned(ctx context.Context, sessionID string, cfg SelfSignedConfig) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	keySize := 2048
	if cfg.KeySize > 0 {
		keySize = cfg.KeySize
	}
	daysValid := 3650
	if cfg.DaysValid > 0 {
		daysValid = cfg.DaysValid
	}

	// Step 1: Create certificate
	args := map[string]string{
		"name":        cfg.Name,
		"common-name": cfg.CommonName,
		"key-size":    fmt.Sprintf("%d", keySize),
		"days-valid":  fmt.Sprintf("%d", daysValid),
		"comment":     comment,
	}
	if cfg.Country != "" {
		args["country"] = cfg.Country
	}
	if cfg.State != "" {
		args["state"] = cfg.State
	}
	if cfg.Org != "" {
		args["organization"] = cfg.Org
	}
	if cfg.Unit != "" {
		args["unit"] = cfg.Unit
	}

	addCmd := router.Command{Path: "/certificate", Action: "add", Args: args}
	addResult, err := s.routerPort.ExecuteCommand(ctx, addCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add certificate: %w", err)
	}
	if !addResult.Success {
		return nil, fmt.Errorf("certificate add failed: %w", addResult.Error)
	}
	result.CertificateID = addResult.ID

	// Step 2: Sign the certificate
	signCmd := router.Command{
		Path:   "/certificate",
		Action: "sign",
		Args:   map[string]string{"ca-crl-host": "127.0.0.1", ".id": addResult.ID},
	}
	signResult, err := s.routerPort.ExecuteCommand(ctx, signCmd)
	if err != nil {
		s.logger.Warnw("failed to sign certificate", "error", err)
	} else if !signResult.Success {
		s.logger.Warnw("certificate signing failed", "error", signResult.Error)
	}

	s.logger.Infow("self-signed certificate provisioned", "name", cfg.Name, "id", result.CertificateID)
	return result, nil
}

// ProvisionLetsEncrypt enables RouterOS cloud DDNS-based certificate provisioning.
func (s *Service) ProvisionLetsEncrypt(ctx context.Context, sessionID string) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	_ = comment // Cloud cert doesn't support comment field

	cmd := router.Command{
		Path:   "/ip/cloud/advanced",
		Action: "set",
		Args:   map[string]string{"ddns-ssl-enabled": "yes"},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to enable cloud SSL: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("cloud SSL enable failed: %w", result.Error)
	}

	s.logger.Infow("Let's Encrypt cloud certificate enabled")
	return &ProvisionResult{}, nil
}

// ProvisionImportCert imports a PEM certificate by name (best-effort; logs warning if file upload not supported).
func (s *Service) ProvisionImportCert(ctx context.Context, sessionID, certName, certData string) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	// Note: Full file upload requires RouterPort.UploadFile() which may not be available.
	// For now, attempt import via the certificate/import command.
	_ = certData // certData would be uploaded via a file upload mechanism when available

	cmd := router.Command{
		Path:   "/certificate",
		Action: "import",
		Args: map[string]string{
			"file-name": certName,
			"comment":   comment,
		},
	}
	importResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Warnw("certificate import failed (file upload may not be supported)", "name", certName, "error", err)
		return result, nil // best-effort
	}
	if importResult.Success {
		result.ImportedIDs = append(result.ImportedIDs, importResult.ID)
	}

	return result, nil
}

// ProvisionExportCert exports a certificate from the router in PKCS12 format.
func (s *Service) ProvisionExportCert(ctx context.Context, certName, exportPassphrase string) error {
	args := map[string]string{".id": certName, "type": "pkcs12"}
	if exportPassphrase != "" {
		args["export-passphrase"] = exportPassphrase
	}
	cmd := router.Command{
		Path:   "/certificate",
		Action: "export-certificate",
		Args:   args,
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to export certificate: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("certificate export failed: %w", result.Error)
	}
	return nil
}

// Remove deletes all certificates tagged with the given session ID.
func (s *Service) Remove(ctx context.Context, sessionID string) error {
	comment := "nnc-provisioned-" + sessionID

	// Query all certificates with matching comment
	queryCmd := router.Command{
		Path:        "/certificate",
		Action:      "print",
		QueryFilter: map[string]string{"comment": comment},
	}
	queryResult, err := s.routerPort.ExecuteCommand(ctx, queryCmd)
	if err != nil {
		return fmt.Errorf("failed to query certificates: %w", err)
	}

	for _, item := range queryResult.Data {
		id, ok := item[".id"]
		if !ok {
			continue
		}
		removeCmd := router.Command{
			Path:   "/certificate",
			Action: "remove",
			Args:   map[string]string{".id": id},
		}
		removeResult, removeErr := s.routerPort.ExecuteCommand(ctx, removeCmd)
		if removeErr != nil {
			s.logger.Warnw("failed to remove certificate", "id", id, "error", removeErr)
			continue
		}
		if !removeResult.Success {
			s.logger.Warnw("certificate removal failed", "id", id, "error", removeResult.Error)
		}
	}

	s.logger.Infow("certificates removed", "sessionID", sessionID)
	return nil
}
