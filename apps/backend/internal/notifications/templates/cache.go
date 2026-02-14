package templates

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
func (c *TemplateCache) cacheKey(channel, eventType, subjectTemplate, bodyTemplate string) string {
	content := fmt.Sprintf("%s|||%s", subjectTemplate, bodyTemplate)
	hash := sha256.Sum256([]byte(content))
	hashStr := fmt.Sprintf("%x", hash[:8])
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
func (c *TemplateCache) Invalidate(channel, eventType, subjectTemplate, bodyTemplate string) {
	key := c.cacheKey(channel, eventType, subjectTemplate, bodyTemplate)
	c.cache.Delete(key)
}

// InvalidateAll removes all templates for a specific channel and event type.
func (c *TemplateCache) InvalidateAll(channel, eventType string) {
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

	for _, key := range keysToDelete {
		c.cache.Delete(key)
	}
}

// Clear removes all cached templates.
func (c *TemplateCache) Clear() {
	c.cache = sync.Map{}
}

// Size returns the approximate number of cached templates.
func (c *TemplateCache) Size() int {
	count := 0
	c.cache.Range(func(key, value interface{}) bool {
		count++
		return true
	})
	return count
}
