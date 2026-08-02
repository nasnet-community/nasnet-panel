package utils

import "strings"

// EscapeQuotes escapes double quotes so a value can be embedded in a
// double-quoted RouterOS script string without terminating it early. Unlike
// EscapeScriptString it leaves newlines and dollar signs alone.
func EscapeQuotes(value string) string {
	return strings.ReplaceAll(value, `"`, `\"`)
}
