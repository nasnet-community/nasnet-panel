package template

import "embed"

//go:embed all:*.tmpl
var Files embed.FS
