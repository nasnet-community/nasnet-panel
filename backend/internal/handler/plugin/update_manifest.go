package plugin

import (
	"context"
	"fmt"

	"nasnet-panel/pkg/routeros"
)

// applyManifestOnUpdate brings what install made from the manifest in line
// with the new one, while the container is stopped: the veth's addresses and
// gateway, the exit classes when one of them is in 192.168.150.0/24, and the
// post-wizard script. That script is kept for the wizard and also run once
// now, since it puts back what the plugin sets up on the router, and the new
// version may set up something else.
func applyManifestOnUpdate(ctx context.Context, client *routeros.Client, pluginID string, manifest *Manifest) error {
	if iface := manifest.Container.Interface; iface.Name != "" {
		if err := syncPluginVeth(client, iface); err != nil {
			return err
		}
		if iface.Address.usesExitClasses() {
			if err := ensureExitClasses(client); err != nil {
				return fmt.Errorf("failed to set up the containers' exit classes: %w", err)
			}
		}
		// The panel opens the plugin's page on the first address, which may have moved.
		pluginViewTargetsMu.Lock()
		delete(pluginViewTargets, pluginID)
		pluginViewTargetsMu.Unlock()
	}

	script := ""
	if manifest.Scripts.PostWizard != "" {
		settings := map[string]string{}
		if manifest.SettingsSchema != "" {
			schema, err := fetchPluginSettings(ctx, pluginID, manifest.SettingsSchema)
			if err != nil {
				return fmt.Errorf("failed to fetch the settings schema: %w", err)
			}
			if settings, err = settingsDefaults(schema); err != nil {
				return fmt.Errorf("failed to resolve the settings defaults: %w", err)
			}
		}
		fetched, err := fetchPluginScript(ctx, pluginID, manifest.Scripts.PostWizard)
		if err != nil {
			return fmt.Errorf("failed to fetch the post-wizard script: %w", err)
		}
		script = resolveSettingsPlaceholders(fetched, settings)
	}
	if err := savePluginPostWizard(client, pluginID, script); err != nil {
		return fmt.Errorf("failed to keep the post-wizard script on the router: %w", err)
	}
	if script != "" {
		if err := client.ExecuteScriptString(script); err != nil {
			return fmt.Errorf("the post-wizard script failed: %w", err)
		}
	}
	return nil
}

// syncPluginVeth gives the plugin's veth the manifest's addresses and gateway,
// and sets nothing when it has them already.
func syncPluginVeth(client *routeros.Client, iface ManifestInterface) error {
	veth, err := client.GetVethInterface(iface.Name)
	if err != nil {
		return fmt.Errorf("the plugin's veth: %w; install the plugin again", err)
	}
	address := iface.Address.RouterOS()
	if veth.Address == address && veth.Gateway == iface.Gateway {
		return nil
	}
	return client.SetVethAddresses(veth.ID, address, iface.Gateway)
}
