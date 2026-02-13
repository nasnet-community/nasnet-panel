package notifications

import (
	"crypto/sha256"
	"fmt"
	"sync"
	"text/template"
)

// TemplateCache provides thread-safe caching of parsed templates.
// It uses content hashing to ensure cache invalidation when templates change.
type TemplateCache struct {
	cache sync.Map
}

// NewTemplateCache creates a new template cache.
func NewTemplateCache() *TemplateCache {
	return &TemplateCache{}
}

// cacheKey generates a unique cache key for a template.
// Format: "{channel}:{event_type}:{content_hash}"
//
// The content hash ensures that if the template content changes,
// the cache key changes and the old cached template is not used.
func (c *TemplateCache) cacheKey(channel, eventType, subjectTemplate, bodyTemplate string) string {
	// Combine templates for hashing
	content := fmt.Sprintf("%s|||%s", subjectTemplate, bodyTemplate)

	// Generate SHA256 hash
	hash := sha256.Sum256([]byte(content))
	hashStr := fmt.Sprintf("%x", hash[:8]) // Use first 8 bytes for shorter key

	return fmt.Sprintf("%s:%s:%s", channel, eventType, hashStr)
}

// Get retrieves a parsed template from the cache.
// Returns nil if the template is not in the cache.
func (c *TemplateCache) Get(channel, eventType, subjectTemplate, bodyTemplate string) *template.Template {
	key := c.cacheKey(channel, eventType, subjectTemplate, bodyTemplate)

	if val, ok := c.cache.Load(key); ok {
		if tmpl, ok := val.(*template.Template); ok {
			return tmpl
		}
	}

	return nil
}

// Set stores a parsed template in the cache.
func (c *TemplateCache) Set(channel, eventType, subjectTemplate, bodyTemplate string, tmpl *template.Template) {
	key := c.cacheKey(channel, eventType, subjectTemplate, bodyTemplate)
	c.cache.Store(key, tmpl)
}

// Invalidate removes a template from the cache.
// This should be called when a template is updated or deleted.
func (c *TemplateCache) Invalidate(channel, eventType, subjectTemplate, bodyTemplate string) {
	key := c.cacheKey(channel, eventType, subjectTemplate, bodyTemplate)
	c.cache.Delete(key)
}

// InvalidateAll removes all templates for a specific channel and event type.
// This is useful when we're not sure of the exact template content but know
// the channel and event type have been updated.
func (c *TemplateCache) InvalidateAll(channel, eventType string) {
	// Since sync.Map doesn't provide a way to iterate and delete by prefix,
	// we use a simple approach: store a generation counter per (channel, eventType)
	// and check it on Get. For now, we'll just document this limitation.
	//
	// In practice, Invalidate with the exact content is called by SaveTemplate,
	// so this method is rarely needed.

	// Create a temporary map to collect keys to delete
	keysToDelete := make([]string, 0)
	prefix := fmt.Sprintf("%s:%s:", channel, eventType)

	c.cache.Range(func(key, value interface{}) bool {
		if keyStr, ok := key.(string); ok {
			if len(keyStr) >= len(prefix) && keyStr[:len(prefix)] == prefix {
				keysToDelete = append(keysToDelete, keyStr)
			}
		}
		return true
	})

	// Delete collected keys
	for _, key := range keysToDelete {
		c.cache.Delete(key)
	}
}

// Clear removes all cached templates.
// This is mainly useful for testing or when reloading all templates.
func (c *TemplateCache) Clear() {
	c.cache = sync.Map{}
}

// Size returns the approximate number of cached templates.
// This is mainly for monitoring and debugging.
func (c *TemplateCache) Size() int {
	count := 0
	c.cache.Range(func(key, value interface{}) bool {
		count++
		return true
	})
	return count
}
