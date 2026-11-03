package preinit

import (
	"context"
	"fmt"
	"log"

	"nasnet-panel/pkg/routeros"
)

func moveCertificateFiles(_ context.Context, client *routeros.Client) error {
	moved, err := client.MigrateCertificateFiles()
	if len(moved) > 0 {
		log.Printf("Moved %d certificate files to %s", len(moved), routeros.NasnetCertificatesDir)
	}
	if err != nil {
		return fmt.Errorf("failed to move the certificate files: %w", err)
	}
	return nil
}
