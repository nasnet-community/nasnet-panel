// Package template provides embedded template files for RouterOS configuration.
package template

import "embed"

// Files contains all embedded template files for RouterOS configuration generation.
//
//go:embed all:*.tmpl
var Files embed.FS
