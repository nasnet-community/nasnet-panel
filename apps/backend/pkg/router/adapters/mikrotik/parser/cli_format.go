package parser

import (
	"regexp"
	"strings"
	"unicode"
)

// CleanCommandText removes extra whitespace and backslash patterns.
func CleanCommandText(text string) string {
	re := regexp.MustCompile(`\\\s+`)
	text = re.ReplaceAllString(text, " ")

	re = regexp.MustCompile(`\s+`)
	text = re.ReplaceAllString(text, " ")

	return strings.TrimSpace(text)
}

// ExtractPath extracts the path from a command starting with /.
func ExtractPath(text string) (path string, rest string) {
	var pathBuilder strings.Builder
	var i int

	for i = 0; i < len(text); i++ {
		ch := rune(text[i])

		if ch == ' ' {
			remaining := strings.TrimSpace(text[i:])
			if len(remaining) > 0 {
				firstWord := strings.Fields(remaining)[0]
				actions := map[string]bool{
					"add": true, "set": true, "remove": true, "print": true,
					"enable": true, "disable": true, "move": true, "comment": true,
					"export": true, "import": true, "reset": true, "find": true,
				}
				if actions[firstWord] || strings.Contains(firstWord, "=") || firstWord == "[" {
					break
				}
			}
		}

		pathBuilder.WriteRune(ch)
	}

	path = strings.TrimSpace(pathBuilder.String())
	if i < len(text) {
		rest = strings.TrimSpace(text[i:])
	}

	return path, rest
}

// SplitCommandParts splits command text into parts, respecting quotes.
func SplitCommandParts(text string) []string {
	var parts []string
	var current strings.Builder
	inQuote := false
	quoteChar := rune(0)
	inBracket := 0

	for _, ch := range text {
		switch {
		case ch == '"' || ch == '\'':
			if !inQuote {
				inQuote = true
				quoteChar = ch
			} else if ch == quoteChar {
				inQuote = false
				quoteChar = 0
			}
			current.WriteRune(ch)

		case ch == '[':
			inBracket++
			if current.Len() > 0 {
				parts = append(parts, current.String())
				current.Reset()
			}
			parts = append(parts, "[")

		case ch == ']':
			inBracket--
			if current.Len() > 0 {
				parts = append(parts, strings.TrimSpace(current.String()))
				current.Reset()
			}
			parts = append(parts, "]")

		case unicode.IsSpace(ch) && !inQuote:
			if current.Len() > 0 {
				parts = append(parts, strings.TrimSpace(current.String()))
				current.Reset()
			}

		default:
			current.WriteRune(ch)
		}
	}

	if current.Len() > 0 {
		parts = append(parts, strings.TrimSpace(current.String()))
	}

	var filtered []string
	for _, p := range parts {
		if p != "" {
			filtered = append(filtered, p)
		}
	}

	return filtered
}

// ParseFindQuery parses a [ find ... ] query.
func ParseFindQuery(parts []string) (*FindQuery, int) {
	if len(parts) < 4 || parts[0] != "[" {
		return nil, 0
	}

	var query *FindQuery
	var endIdx int
	foundFind := false

	for i := 1; i < len(parts); i++ {
		if parts[i] == "]" {
			endIdx = i
			break
		}

		if parts[i] == "find" {
			foundFind = true
			continue
		}

		if foundFind && strings.Contains(parts[i], "=") {
			key, value := ParseKeyValue(parts[i])
			key = strings.TrimPrefix(key, "find ")
			query = &FindQuery{
				Field: key,
				Value: value,
			}
		}
	}

	return query, endIdx
}

// ParseKeyValue parses a key=value pair.
func ParseKeyValue(text string) (key, value string) {
	text = strings.TrimPrefix(text, ".")

	idx := strings.Index(text, "=")
	if idx == -1 {
		return text, ""
	}

	key = strings.TrimSpace(text[:idx])
	value = strings.TrimSpace(text[idx+1:])

	value = strings.Trim(value, `"'`)

	return key, value
}
