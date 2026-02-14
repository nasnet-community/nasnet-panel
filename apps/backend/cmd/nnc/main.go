// Package main is the entry point for the NasNetConnect backend.
// Build with -tags=dev for development mode (CORS, playground, larger buffers).
// Build without tags for production mode (embedded frontend, minimal resources).
package main

import (
	"flag"
	"log"
)

func main() {
	healthCheck := flag.Bool("healthcheck", false, "Perform health check and exit")
	flag.Parse()

	if *healthCheck {
		performHealthCheck()
		return
	}

	log.Printf("Starting NasNetConnect server (version: %s)", ServerVersion)
	run()
}
