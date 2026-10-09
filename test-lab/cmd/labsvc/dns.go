package main

import (
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/net/dns/dnsmessage"
)

type resolver struct {
	static   map[string]net.IP
	fallback net.IP
	forward  string
	logMu    sync.Mutex
}

func newResolver(static, fallback, forward string) (*resolver, error) {
	r := &resolver{static: map[string]net.IP{}, forward: forward}
	for _, entry := range splitList(static) {
		name, addr, ok := strings.Cut(entry, "=")
		ip := net.ParseIP(addr).To4()
		if !ok || ip == nil {
			return nil, fmt.Errorf("invalid dns static entry %q", entry)
		}
		r.static[strings.ToLower(name)] = ip
	}
	if fallback != "" {
		if r.fallback = net.ParseIP(fallback).To4(); r.fallback == nil {
			return nil, fmt.Errorf("invalid dns fallback %q", fallback)
		}
	}
	return r, nil
}

func (r *resolver) lookup(name string) (net.IP, bool) {
	for suffix, ip := range r.static {
		if name == suffix || strings.HasSuffix(name, "."+suffix) {
			return ip, true
		}
	}
	return r.fallback, r.fallback != nil
}

func (r *resolver) answer(req []byte, identity, remote string) ([]byte, error) {
	var p dnsmessage.Parser
	hdr, err := p.Start(req)
	if err != nil {
		return nil, err
	}
	q, err := p.Question()
	if err != nil {
		return nil, err
	}
	name := strings.ToLower(strings.TrimSuffix(q.Name.String(), "."))
	r.log(identity, remote, name, q.Type.String())

	ip, known := r.lookup(name)
	if !known && r.forward != "" && q.Type != dnsmessage.TypeTXT {
		return r.forwardQuery(req)
	}

	b := dnsmessage.NewBuilder(nil, dnsmessage.Header{
		ID:                 hdr.ID,
		Response:           true,
		Authoritative:      true,
		RecursionDesired:   hdr.RecursionDesired,
		RecursionAvailable: true,
	})
	b.EnableCompression()
	if err := b.StartQuestions(); err != nil {
		return nil, err
	}
	if err := b.Question(q); err != nil {
		return nil, err
	}
	if err := b.StartAnswers(); err != nil {
		return nil, err
	}

	rh := dnsmessage.ResourceHeader{Name: q.Name, Class: dnsmessage.ClassINET, TTL: 1}
	switch q.Type {
	case dnsmessage.TypeA:
		if known {
			var a [4]byte
			copy(a[:], ip)
			if err := b.AResource(rh, dnsmessage.AResource{A: a}); err != nil {
				return nil, err
			}
		}
	case dnsmessage.TypeTXT:
		txt := dnsmessage.TXTResource{TXT: []string{"resolver=" + identity, "src=" + remote}}
		if err := b.TXTResource(rh, txt); err != nil {
			return nil, err
		}
	}
	return b.Finish()
}

func (r *resolver) forwardQuery(req []byte) ([]byte, error) {
	conn, err := net.DialTimeout("udp", r.forward, 3*time.Second)
	if err != nil {
		return nil, err
	}
	defer func() { _ = conn.Close() }()
	_ = conn.SetDeadline(time.Now().Add(5 * time.Second))
	if _, err := conn.Write(req); err != nil {
		return nil, err
	}
	buf := make([]byte, 4096)
	n, err := conn.Read(buf)
	if err != nil {
		return nil, err
	}
	return buf[:n], nil
}

func (r *resolver) log(identity, remote, name, qtype string) {
	r.logMu.Lock()
	defer r.logMu.Unlock()
	_ = json.NewEncoder(os.Stderr).Encode(map[string]string{
		"at": time.Now().Format(time.RFC3339), "resolver": identity, "src": remote, "name": name, "type": qtype,
	})
}

func (r *resolver) serveUDP(addr string, errs chan<- error) {
	conn, err := net.ListenPacket("udp", addr)
	if err != nil {
		errs <- err
		return
	}
	identity := hostOf(addr)
	buf := make([]byte, 4096)
	for {
		n, from, err := conn.ReadFrom(buf)
		if err != nil {
			errs <- err
			return
		}
		req := append([]byte(nil), buf[:n]...)
		go func() {
			resp, err := r.answer(req, identity, hostOf(from.String()))
			if err == nil {
				_, _ = conn.WriteTo(resp, from)
			}
		}()
	}
}

func (r *resolver) serveTCP(addr string, errs chan<- error) {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		errs <- err
		return
	}
	identity := hostOf(addr)
	for {
		conn, err := ln.Accept()
		if err != nil {
			errs <- err
			return
		}
		go func() {
			defer func() { _ = conn.Close() }()
			_ = conn.SetDeadline(time.Now().Add(10 * time.Second))
			var size uint16
			if err := binary.Read(conn, binary.BigEndian, &size); err != nil {
				return
			}
			req := make([]byte, size)
			if _, err := io.ReadFull(conn, req); err != nil {
				return
			}
			resp, err := r.answer(req, identity, hostOf(conn.RemoteAddr().String()))
			if err != nil {
				return
			}
			_ = binary.Write(conn, binary.BigEndian, uint16(len(resp)))
			_, _ = conn.Write(resp)
		}()
	}
}

func (r *resolver) dohHandler(identity string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		var query []byte
		var err error
		switch req.Method {
		case http.MethodGet:
			query, err = base64.RawURLEncoding.DecodeString(req.URL.Query().Get("dns"))
		case http.MethodPost:
			query, err = io.ReadAll(io.LimitReader(req.Body, 4096))
		default:
			err = errors.New("unsupported method")
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		resp, err := r.answer(query, identity, hostOf(req.RemoteAddr))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/dns-message")
		_, _ = w.Write(resp)
	})
}

func hostOf(addr string) string {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return addr
	}
	return host
}
