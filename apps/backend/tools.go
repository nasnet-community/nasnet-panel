//go:build tools
// +build tools

// Package tools records tool dependencies for go generate.
// This file ensures gqlgen and other code generation tools are tracked as dependencies.
package main

import (
	// Tools used by 'go generate'
	_ "github.com/99designs/gqlgen"
	_ "github.com/99designs/gqlgen/graphql/introspection"
)
