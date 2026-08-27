package install

import (
	"fmt"
	"time"
)

func (e *Engine) RunUninstall() error {
	steps := []step{
		{"connect", e.stepConnect},
		{"un-container", e.stepRemoveContainer},
		{"un-network", e.stepRemoveNetwork},
		{"un-files", e.stepRemoveFiles},
	}
	err := e.runSteps(steps)
	if e.cl != nil {
		e.cl.Close()
	}
	if err == nil {
		note := "Uninstall complete."
		if e.opts.DryRun {
			note = "Dry run complete, no changes were made."
		}
		e.ev.Done(nil, note)
	}
	return err
}

func (e *Engine) stepRemoveContainer() error {
	if !e.exists("/container", "name="+containerName) {
		e.note = "no container named " + containerName
		return nil
	}
	e.log("stopping container %s", containerName)
	if !e.opts.DryRun {
		_, _ = e.cl.RunRaw(fmt.Sprintf("/container/stop [find name=%s]", containerName), 30*time.Second)
		if err := e.sleep(2 * time.Second); err != nil {
			return err
		}
	}
	e.removeObj("container "+containerName, "/container", "name="+containerName)
	e.note = containerName + " removed"
	return nil
}

func (e *Engine) stepRemoveNetwork() error {
	e.removeObj("nat "+commentTag+"-srcnat", "/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-srcnat"))
	e.removeObj("nat "+commentTag+"-dstnat", "/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-dstnat"))
	e.removeObj("nat "+commentTag+"-dstnat-https", "/ip/firewall/nat", fmt.Sprintf("comment=%q", commentTag+"-dstnat-https"))
	e.removeObj("filter forward", "/ip/firewall/filter", fmt.Sprintf("comment=%q", commentTag+"-forward"))
	e.removeObj("filter forward-https", "/ip/firewall/filter", fmt.Sprintf("comment=%q", commentTag+"-forward-https"))
	e.removeObj("bridge port "+vethName, "/interface/bridge/port", "interface="+vethName)
	e.removeObj("bridge port "+legacyVethName, "/interface/bridge/port", "interface="+legacyVethName)
	e.removeObj("ip "+bridgeIPCIDR, "/ip/address", fmt.Sprintf("address=%q", bridgeIPCIDR))
	e.removeObj("bridge "+bridgeName, "/interface/bridge", "name="+bridgeName)
	e.removeObj("veth "+vethName, "/interface/veth", "name="+vethName)
	e.removeObj("veth "+legacyVethName, "/interface/veth", "name="+legacyVethName)
	return nil
}

func (e *Engine) stepRemoveFiles() error {
	e.log("removing tar(s) under %s/%s-*.tar", tarRemoteDir, assetPrefix)
	if e.opts.DryRun {
		return nil
	}
	_, _ = e.cl.RunRaw(fmt.Sprintf(`/file/remove [find where (name~"^%s/%s-") and (name~"\.tar$")]`, tarRemoteDir, assetPrefix), 30*time.Second)
	_, _ = e.cl.RunRaw(fmt.Sprintf("/file/remove [find name=%q]", lanBaselineRsc), 15*time.Second)
	e.note = "uploaded files removed"
	return nil
}
