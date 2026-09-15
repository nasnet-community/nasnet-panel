package main

import (
	"crypto/tls"
	"errors"
	"flag"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"
)

func serve(args []string) error {
	fs := flag.NewFlagSet("serve", flag.ContinueOnError)
	whoami := fs.String("whoami", "", "comma-separated addresses that answer with the caller's source IP")
	iplist := fs.String("iplist", "", "HTTPS address serving the domestic IP list")
	include := fs.String("include", "", "comma-separated entries the domestic IP list must contain")
	filler := fs.Int("filler", 1500, "filler entries added so the list passes the router's size checks")
	dnsAddrs := fs.String("dns", "", "comma-separated resolver addresses, UDP and TCP")
	dnsStatic := fs.String("dns-static", "", "comma-separated name=ip answers, a name also matches its subdomains")
	dnsFallback := fs.String("dns-fallback", "", "A answer for any other name")
	dnsForward := fs.String("dns-forward", "", "upstream resolver for names without a static answer")
	doh := fs.String("doh", "", "comma-separated DNS over HTTPS addresses")
	dohNames := fs.String("doh-names", "", "comma-separated names and IPs on the DoH certificate")
	registry := fs.String("registry", "", "HTTPS address serving the plugin registry and container images")
	registryNames := fs.String("registry-names", "raw.githubusercontent.com,registry.lab.test", "names on the registry certificate")
	pluginsDir := fs.String("plugins-dir", "", "directory served as the plugin registry")
	ociBinary := fs.String("oci-binary", "", "static binary packed into the lab plugin image")
	ociArch := fs.String("oci-arch", "amd64", "architecture of the lab plugin image")
	ociRepo := fs.String("oci-repo", "lab/echo", "repository name of the lab plugin image")
	caDir := fs.String("ca-dir", "", "directory holding the lab CA")
	if err := fs.Parse(args); err != nil {
		return err
	}

	ca, err := loadOrCreateCA(*caDir)
	if err != nil {
		return err
	}

	servers := 0
	errs := make(chan error, 32)

	for _, addr := range splitList(*whoami) {
		srv := newServer(addr, http.HandlerFunc(whoamiHandler))
		servers++
		go func() { errs <- srv.ListenAndServe() }()
	}

	if *iplist != "" {
		if err := serveTLS(ca, *iplist, []string{"s4i.co"}, listHandler(listEntries(splitList(*include), *filler)), errs); err != nil {
			return err
		}
		servers++
	}

	res, err := newResolver(*dnsStatic, *dnsFallback, *dnsForward)
	if err != nil {
		return err
	}
	for _, addr := range splitList(*dnsAddrs) {
		go res.serveUDP(addr, errs)
		go res.serveTCP(addr, errs)
		servers++
	}
	for _, addr := range splitList(*doh) {
		names := splitList(*dohNames)
		names = append(names, hostOf(addr))
		if err := serveTLS(ca, addr, names, res.dohHandler("doh:"+hostOf(addr)), errs); err != nil {
			return err
		}
		servers++
	}

	if *registry != "" {
		images := map[string]*ociImage{}
		if *ociBinary != "" {
			img, err := buildImage(*ociBinary, *ociArch, []string{"/labsvc", "serve", "-whoami", ":8080"})
			if err != nil {
				return err
			}
			images[*ociRepo] = img
		}
		names := append(splitList(*registryNames), hostOf(*registry))
		if err := serveTLS(ca, *registry, names, registryHandler(*pluginsDir, images), errs); err != nil {
			return err
		}
		servers++
	}

	if servers == 0 {
		return errors.New("nothing to serve")
	}
	return <-errs
}

func serveTLS(ca *authority, addr string, names []string, handler http.Handler, errs chan<- error) error {
	cert, err := ca.leaf(names)
	if err != nil {
		return err
	}
	srv := newServer(addr, handler)
	srv.TLSConfig = &tls.Config{Certificates: []tls.Certificate{cert}, MinVersion: tls.VersionTLS12}
	go func() { errs <- srv.ListenAndServeTLS("", "") }()
	return nil
}

func newServer(addr string, handler http.Handler) *http.Server {
	return &http.Server{Addr: addr, Handler: handler, ReadHeaderTimeout: 5 * time.Second}
}

func whoamiHandler(w http.ResponseWriter, r *http.Request) {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	fmt.Fprintln(w, host)
}

func listEntries(include []string, filler int) []string {
	entries := append([]string{}, include...)
	for i := 0; i < filler; i++ {
		entries = append(entries, fmt.Sprintf("100.100.%d.%d", i/250, i%250+1))
	}
	return entries
}

func listHandler(entries []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		offset := min(queryInt(r, "offset", 0), len(entries))
		end := min(offset+queryInt(r, "limit", 1000), len(entries))
		w.Header().Set("Content-Type", "text/plain")
		for _, entry := range entries[offset:end] {
			fmt.Fprintln(w, entry)
		}
	})
}

func queryInt(r *http.Request, key string, fallback int) int {
	v, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil || v < 0 {
		return fallback
	}
	return v
}
