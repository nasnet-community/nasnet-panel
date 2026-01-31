package parser

import (
	"context"
	"strings"
	"sync"
	"time"
)

// SSHParserService defines the interface for parsing SSH command output.
type SSHParserService interface {
	// ParseResponse parses raw SSH output using the appropriate strategy.
	// Returns parsed resources with GraphQL field names.
	ParseResponse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error)

	// RegisterStrategy adds a new parsing strategy to the chain.
	RegisterStrategy(strategy ParserStrategy)

	// GetStrategies returns the list of registered strategies in priority order.
	GetStrategies() []string
}

// ParserStrategy defines the interface for a pluggable parsing strategy.
type ParserStrategy interface {
	// Name returns the strategy name for logging/debugging.
	Name() string

	// Priority returns the strategy priority (lower = tried first).
	Priority() int

	// CanParse returns true if this strategy can handle the given output.
	CanParse(raw string, hints ParseHints) bool

	// Parse parses the raw output and returns the result.
	Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error)
}

// sshParserService implements SSHParserService with the strategy pattern.
type sshParserService struct {
	strategies []ParserStrategy
	normalizer *Normalizer
	config     ParserConfig
	mu         sync.RWMutex

	// strategyCache caches successful strategy by command signature.
	// Key: "resourcePath:commandType", Value: strategy name
	strategyCache   map[string]string
	strategyCacheMu sync.RWMutex
}

// NewSSHParserService creates a new SSH parser service with default strategies.
func NewSSHParserService(config ParserConfig, normalizer *Normalizer) SSHParserService {
	s := &sshParserService{
		strategies:    make([]ParserStrategy, 0, 5),
		normalizer:    normalizer,
		config:        config,
		strategyCache: make(map[string]string),
	}

	// Register default strategies in priority order
	s.RegisterStrategy(NewTerseParser(normalizer))   // Priority 1: Simplest format
	s.RegisterStrategy(NewTableParser(normalizer))   // Priority 2: Most common format
	s.RegisterStrategy(NewDetailParser(normalizer))  // Priority 3: Detail format
	s.RegisterStrategy(NewExportParser(normalizer))  // Priority 4: Export format
	s.RegisterStrategy(NewKeyValueParser(normalizer)) // Priority 5: System info format

	return s
}

// NewSSHParserServiceWithoutStrategies creates a parser service without default strategies.
// Use this when you want to register custom strategies.
func NewSSHParserServiceWithoutStrategies(config ParserConfig, normalizer *Normalizer) SSHParserService {
	return &sshParserService{
		strategies:    make([]ParserStrategy, 0, 5),
		normalizer:    normalizer,
		config:        config,
		strategyCache: make(map[string]string),
	}
}

// ParseResponse parses raw SSH output using the strategy chain.
func (s *sshParserService) ParseResponse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error) {
	// Validate input
	if err := s.validateInput(raw); err != nil {
		return nil, err
	}

	// Handle empty output
	if strings.TrimSpace(raw) == "" {
		return &ParseResult{
			Resources: []Resource{},
			Metadata: ParseMetadata{
				Format:   FormatUnknown,
				RowCount: 0,
			},
		}, nil
	}

	// Check strategy cache first
	cacheKey := s.buildCacheKey(hints)
	if cachedStrategy := s.getCachedStrategy(cacheKey); cachedStrategy != "" {
		if strategy := s.findStrategy(cachedStrategy); strategy != nil {
			result, err := s.parseWithStrategy(ctx, strategy, raw, hints)
			if err == nil {
				return result, nil
			}
			// Cache miss - strategy no longer works, clear cache
			s.clearCachedStrategy(cacheKey)
		}
	}

	// Try strategies in priority order
	return s.parseWithFallback(ctx, raw, hints, cacheKey)
}

// parseWithFallback tries each strategy until one succeeds.
func (s *sshParserService) parseWithFallback(ctx context.Context, raw string, hints ParseHints, cacheKey string) (*ParseResult, error) {
	s.mu.RLock()
	strategies := make([]ParserStrategy, len(s.strategies))
	copy(strategies, s.strategies)
	s.mu.RUnlock()

	var triedStrategies []string
	var lastError error

	for _, strategy := range strategies {
		// Check if strategy can handle this output
		if !strategy.CanParse(raw, hints) {
			continue
		}

		triedStrategies = append(triedStrategies, strategy.Name())

		result, err := s.parseWithStrategy(ctx, strategy, raw, hints)
		if err == nil {
			// Cache successful strategy
			if cacheKey != "" {
				s.setCachedStrategy(cacheKey, strategy.Name())
			}
			return result, nil
		}

		lastError = err
	}

	// No strategy succeeded
	if len(triedStrategies) == 0 {
		return nil, NewNoMatchingParserError(raw, []string{"none applicable"})
	}

	if lastError != nil {
		return nil, lastError
	}

	return nil, NewNoMatchingParserError(raw, triedStrategies)
}

// parseWithStrategy executes a single strategy with timeout.
func (s *sshParserService) parseWithStrategy(ctx context.Context, strategy ParserStrategy, raw string, hints ParseHints) (*ParseResult, error) {
	// Apply timeout
	parseCtx, cancel := context.WithTimeout(ctx, s.config.ParseTimeout)
	defer cancel()

	start := time.Now()

	// Parse in a goroutine for timeout support
	resultCh := make(chan *ParseResult, 1)
	errCh := make(chan error, 1)

	go func() {
		result, err := strategy.Parse(parseCtx, raw, hints)
		if err != nil {
			errCh <- err
		} else {
			resultCh <- result
		}
	}()

	select {
	case result := <-resultCh:
		result.Metadata.ParseTime = time.Since(start)
		result.Metadata.StrategyUsed = strategy.Name()
		return result, nil

	case err := <-errCh:
		return nil, err

	case <-parseCtx.Done():
		return nil, NewParseTimeoutError("", s.config.ParseTimeout.String())
	}
}

// RegisterStrategy adds a new parsing strategy in priority order.
func (s *sshParserService) RegisterStrategy(strategy ParserStrategy) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Insert in priority order (lower priority = earlier in list)
	inserted := false
	for i, existing := range s.strategies {
		if strategy.Priority() < existing.Priority() {
			// Insert at position i
			s.strategies = append(s.strategies[:i], append([]ParserStrategy{strategy}, s.strategies[i:]...)...)
			inserted = true
			break
		}
	}

	if !inserted {
		s.strategies = append(s.strategies, strategy)
	}
}

// GetStrategies returns the list of registered strategy names.
func (s *sshParserService) GetStrategies() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	names := make([]string, len(s.strategies))
	for i, strategy := range s.strategies {
		names[i] = strategy.Name()
	}
	return names
}

// validateInput checks if the input is valid for parsing.
func (s *sshParserService) validateInput(raw string) error {
	if len(raw) > s.config.MaxOutputSize {
		return NewOutputTooLargeError(len(raw), s.config.MaxOutputSize)
	}
	return nil
}

// buildCacheKey creates a cache key from parse hints.
func (s *sshParserService) buildCacheKey(hints ParseHints) string {
	if hints.ResourcePath == "" {
		return ""
	}
	return hints.ResourcePath + ":" + string(hints.CommandType)
}

// findStrategy finds a strategy by name.
func (s *sshParserService) findStrategy(name string) ParserStrategy {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, strategy := range s.strategies {
		if strategy.Name() == name {
			return strategy
		}
	}
	return nil
}

// getCachedStrategy returns a cached strategy name if available.
func (s *sshParserService) getCachedStrategy(key string) string {
	if key == "" {
		return ""
	}

	s.strategyCacheMu.RLock()
	defer s.strategyCacheMu.RUnlock()

	return s.strategyCache[key]
}

// setCachedStrategy caches a successful strategy.
func (s *sshParserService) setCachedStrategy(key, strategyName string) {
	if key == "" {
		return
	}

	s.strategyCacheMu.Lock()
	defer s.strategyCacheMu.Unlock()

	s.strategyCache[key] = strategyName
}

// clearCachedStrategy removes a cached strategy.
func (s *sshParserService) clearCachedStrategy(key string) {
	if key == "" {
		return
	}

	s.strategyCacheMu.Lock()
	defer s.strategyCacheMu.Unlock()

	delete(s.strategyCache, key)
}

// Compile-time interface verification.
var _ SSHParserService = (*sshParserService)(nil)
