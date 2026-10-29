package utils

import (
	"fmt"
	"strings"
)

// EscapeQuotes escapes double quotes so a value can be embedded in a
// double-quoted RouterOS script string without terminating it early. Unlike
// EscapeScriptString it leaves newlines and dollar signs alone.
func EscapeQuotes(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	return strings.ReplaceAll(value, `"`, `\"`)
}

// EscapeRouterOSString escapes value so it can be placed between the double
// quotes of a RouterOS script string and read back unchanged. Backslashes,
// double quotes and dollar signs are backslash-escaped, line breaks and tabs
// use their named escapes, and control characters and every non-ASCII byte
// use the two-digit hex escape.
func EscapeRouterOSString(text string) string {
	var b strings.Builder
	for i := 0; i < len(text); i++ {
		c := text[i]
		switch {
		case c == '\\', c == '"', c == '$':
			b.WriteByte('\\')
			b.WriteByte(c)
		case c == '\n':
			b.WriteString(`\n`)
		case c == '\r':
			b.WriteString(`\r`)
		case c == '\t':
			b.WriteString(`\t`)
		case c < 0x20 || c >= 0x7f:
			fmt.Fprintf(&b, `\%02X`, c)
		default:
			b.WriteByte(c)
		}
	}
	return b.String()
}
