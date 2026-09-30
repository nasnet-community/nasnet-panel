//go:build !production
// +build !production

package handler

func filterVisiblePlugins(plugins []PluginInfo) []PluginInfo {
	return plugins
}
