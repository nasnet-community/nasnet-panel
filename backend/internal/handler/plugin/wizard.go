package plugin

import (
	"fmt"
	"log"
	"sort"
	"strings"

	"nasnet-panel/pkg/routeros"
)

// What follows is for the wizard: it writes the containers' exit classes into
// its script and runs the installed plugins' post-wizard scripts.

// ExitClassesScript is the wizard script's part for the exit classes: the
// containers' gateway address, then the rules. The wizard removes every
// routing rule before it writes its own, and creates to-Foreign,
// to-Foreign-Foreign Link and to-VPN every time, and the two Domestic tables
// only when it is given a Domestic link, which is all it takes to tell which
// classes have a link.
func ExitClassesScript(domesticEnabled bool) string {
	tables := map[string]bool{"main": true, "to-Foreign": true, "to-Foreign-Foreign Link": true, "to-VPN": true}
	if domesticEnabled {
		tables["to-Domestic"] = true
		tables["to-Domestic-Domestic Link"] = true
	}

	var script strings.Builder
	// The wizard leaves the containers bridge's addresses in place, so this one
	// may be there already. A router with no bridge runs no plugins either.
	fmt.Fprintf(&script, ":if ([:len [/interface bridge find where name=%q]] > 0 && [:len [/ip address find where address=%q interface=%q]] = 0) do={ /ip address add address=%q interface=%q comment=%q }\n",
		pluginContainersBridge, exitClassGateway, pluginContainersBridge, exitClassGateway, pluginContainersBridge, exitClassGatewayID)
	script.WriteString("/routing rule\n")
	for _, rule := range exitClassRules(func(table string) bool { return tables[table] }) {
		script.WriteString(rule.rsc() + "\n")
	}
	return script.String()
}

// installedPluginNames lists the containers on the router, a plugin being
// installed as a container named after its id. A router without the container
// package, or with containers switched off, has none.
func installedPluginNames(client *routeros.Client) ([]string, error) {
	installed, err := client.IsPackageInstalled("container")
	if err != nil || !installed {
		return nil, err
	}
	enabled, err := client.IsDeviceModeFeatureEnabled("container")
	if err != nil || !enabled {
		return nil, err
	}
	containers, err := client.ListContainers()
	if err != nil {
		return nil, err
	}

	names := make([]string, 0, len(containers))
	for i := range containers {
		if pluginIDPattern.MatchString(containers[i].Name) {
			names = append(names, containers[i].Name)
		}
	}
	sort.Strings(names)
	return names, nil
}

// RunPostWizard runs the post-wizard script of each installed plugin that
// has one. The wizard has just removed every script and scheduler on the
// router, so this is what brings back the ones a plugin keeps there. The
// scripts run in the background on the router, one after another here, and a
// failing one is logged and does not stop the rest.
func RunPostWizard(client *routeros.Client) {
	names, err := installedPluginNames(client)
	if err != nil {
		log.Printf("[plugin-post-wizard] failed to list the installed plugins: %v", err)
		return
	}

	for _, name := range names {
		file := pluginStateDir(client, name) + "/" + pluginStatePostWizard
		exists, err := client.FileExists(file)
		if err != nil || !exists {
			if err != nil {
				log.Printf("[plugin-post-wizard %s] failed to look for its script: %v", name, err)
			}
			continue
		}
		script, err := client.GetFileContents(file, 0)
		if err != nil {
			log.Printf("[plugin-post-wizard %s] failed to read its script: %v", name, err)
			continue
		}
		if strings.TrimSpace(script) == "" {
			continue
		}
		if err := client.ExecuteScriptString(script); err != nil {
			log.Printf("[plugin-post-wizard %s] its script failed: %v", name, err)
		}
	}
}
