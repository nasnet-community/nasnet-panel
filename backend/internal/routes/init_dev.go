//go:build !production
// +build !production

// Package routes development initialization includes swagger and debugging features.
package routes

import (
	echoSwagger "github.com/swaggo/echo-swagger"

	"github.com/labstack/echo/v4"

	//nolint:godot // docs import needed for swagger initialization
	_ "nasnet-panel/docs"
)

func initSwagger(e *echo.Echo) {
	e.GET("/swagger/*", echoSwagger.WrapHandler)
}
