package plugin

import (
	"fmt"
	"regexp"

	"nasnet-panel/pkg/routeros"
)

// What install keeps on the router for the wizard: the plugin's post-wizard
// script with its settings already filled in, so the wizard needs no registry.
// The plugin's data folder is no place for it: its container can write there,
// and a kept folder outlives the plugin.

// pluginStatePostWizard is kept in <storage>/nasnet-panel/plugins/<id>/.
const pluginStatePostWizard = "post-wizard.rsc"

// A plugin id ends up in queries and paths, so it must be a plain slug.
var pluginIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)

func pluginStateDir(client *routeros.Client, pluginID string) string {
	return pluginStoragePrefix(client) + routeros.NasnetPanelDir + "/plugins/" + pluginID
}

// savePluginPostWizard writes the post-wizard script for pluginID, or removes
// the one an earlier install left when there is none.
func savePluginPostWizard(client *routeros.Client, pluginID, script string) error {
	if !pluginIDPattern.MatchString(pluginID) {
		if script == "" {
			return nil // nothing can have been kept for it
		}
		return fmt.Errorf("%q is not a plugin id", pluginID)
	}

	dir := pluginStateDir(client, pluginID)
	if script != "" {
		panelDir := pluginStoragePrefix(client) + routeros.NasnetPanelDir
		for _, d := range []string{panelDir, panelDir + "/plugins", dir} {
			if err := client.EnsureDir(d); err != nil {
				return err
			}
		}
	}
	return syncStateFile(client, dir+"/"+pluginStatePostWizard, script)
}

// syncStateFile makes the file hold contents, or not exist when contents is
// empty, and writes nothing when it is right already, to spare the flash.
func syncStateFile(client *routeros.Client, name, contents string) error {
	exists, err := client.FileExists(name)
	if err != nil {
		return err
	}
	if contents == "" {
		if exists {
			return client.DeleteFile(name)
		}
		return nil
	}
	if exists {
		current, err := client.GetFileContents(name, 0)
		if err != nil {
			return err
		}
		if current == contents {
			return nil
		}
	}
	return client.AddFile(name, contents)
}

// removePluginState deletes the plugin's folder, if it has one.
func removePluginState(client *routeros.Client, pluginID string) error {
	if !pluginIDPattern.MatchString(pluginID) {
		return fmt.Errorf("%q is not a plugin id", pluginID)
	}
	dir := pluginStateDir(client, pluginID)
	exists, err := client.FileExists(dir)
	if err != nil || !exists {
		return err
	}
	return client.DeleteFile(dir)
}
