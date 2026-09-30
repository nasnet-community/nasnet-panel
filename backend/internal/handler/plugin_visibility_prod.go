//go:build production
// +build production

package handler

func filterVisiblePlugins(plugins []PluginInfo) []PluginInfo {
	visible := make([]PluginInfo, 0, len(plugins))
	for i := range plugins {
		if plugins[i].Visible {
			visible = append(visible, plugins[i])
		}
	}
	return visible
}
