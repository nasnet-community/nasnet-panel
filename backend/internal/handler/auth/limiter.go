package auth

import (
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type limiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type attemptLimiter struct {
	mu      sync.Mutex
	entries map[string]*limiterEntry
}

var loginLimiter = &attemptLimiter{entries: make(map[string]*limiterEntry)}

func (l *attemptLimiter) allow(ip, username string) bool {
	now := time.Now()
	key := ip + "\x00" + username

	l.mu.Lock()
	defer l.mu.Unlock()

	if len(l.entries) >= loginLimiterMaxKey {
		for k, e := range l.entries {
			if now.Sub(e.lastSeen) > loginLimiterIdle {
				delete(l.entries, k)
			}
		}
	}

	e, ok := l.entries[key]
	if !ok {
		e = &limiterEntry{limiter: rate.NewLimiter(rate.Every(loginRefillEvery), loginBurst)}
		l.entries[key] = e
	}
	e.lastSeen = now

	return e.limiter.AllowN(now, 1)
}
