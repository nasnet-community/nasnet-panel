package preinit

import (
	"context"
	"fmt"

	"nasnet-panel/pkg/routeros"
)

func renameSuccessFile(_ context.Context, client *routeros.Client) error {
	oldPath := routeros.NasnetPanelPath("nasnet-panel-wizard-success.txt")
	newPath := routeros.NasnetPanelPath("nasnet-panel-base-config-success.txt")

	oldExists, err := client.FileExists(oldPath)
	if err != nil || !oldExists {
		return err
	}
	newExists, err := client.FileExists(newPath)
	if err != nil {
		return err
	}
	if newExists {
		if err := client.DeleteFile(oldPath); err != nil {
			return fmt.Errorf("failed to remove the old success file: %w", err)
		}
		return nil
	}
	if err := client.RenameFile(oldPath, newPath); err != nil {
		return fmt.Errorf("failed to rename the success file: %w", err)
	}
	return nil
}
