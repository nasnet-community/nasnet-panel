// Package web embeds the built frontend SPA into the backend binary.
package web

import "embed"

// Dist holds the embedded SPA assets.
//
//go:embed all:dist
var Dist embed.FS
