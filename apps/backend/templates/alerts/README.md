# Alert Notification Templates

This directory contains embedded Go templates for rendering alert notifications across different
channels.

## Directory Structure

```
templates/alerts/
├── embed.go                              # Go embed helpers and template functions
├── embed_test.go                         # Comprehensive tests
├── README.md                             # This file
├── email/
│   ├── default-subject.tmpl              # Email subject line
│   ├── default-body.html.tmpl           # HTML email body with inline CSS
│   └── default-body.txt.tmpl            # Plaintext email fallback
├── telegram/
│   └── default-message.tmpl             # Telegram message in MarkdownV2 format
├── pushover/
│   ├── default-title.tmpl               # Pushover notification title
│   └── default-message.tmpl             # Pushover message body
├── webhook/
│   └── default-payload.tmpl             # JSON webhook payload
└── inapp/
    ├── default-title.tmpl               # In-app notification title
    └── default-message.tmpl             # In-app notification body
```

## Template Variables

All templates have access to the following data:

| Variable            | Type      | Description                  | Example                             |
| ------------------- | --------- | ---------------------------- | ----------------------------------- |
| `.EventType`        | string    | Event identifier             | `"router.offline"`                  |
| `.Severity`         | string    | Alert severity level         | `"CRITICAL"`, `"WARNING"`, `"INFO"` |
| `.Title`            | string    | Alert title                  | `"Router Offline"`                  |
| `.Message`          | string    | Alert message                | `"Router has not responded..."`     |
| `.RuleName`         | string    | Name of the alert rule       | `"Router Connectivity Monitor"`     |
| `.RuleID`           | string    | Rule identifier              | `"rule-123"`                        |
| `.DeviceName`       | string    | Device hostname (optional)   | `"Office-Router-01"`                |
| `.DeviceIP`         | string    | Device IP address (optional) | `"192.168.1.1"`                     |
| `.TriggeredAt`      | time.Time | Timestamp when alert fired   | `time.Now()`                        |
| `.FormattedTime`    | string    | Pre-formatted timestamp      | `"2024-01-15 14:30:00"`             |
| `.EventData`        | map       | Event-specific nested data   | `{"cpu_usage": 95}`                 |
| `.SuggestedActions` | []string  | Troubleshooting steps        | `["Check network", "Verify power"]` |

## Template Functions

The following functions are available in all templates:

### String Manipulation

| Function   | Description            | Example                                                               |
| ---------- | ---------------------- | --------------------------------------------------------------------- |
| `upper`    | Convert to uppercase   | `{{.Text \| upper}}` → `"HELLO"`                                      |
| `lower`    | Convert to lowercase   | `{{.Text \| lower}}` → `"hello"`                                      |
| `title`    | Title case             | `{{.Text \| title}}` → `"Hello World"`                                |
| `trim`     | Trim whitespace        | `{{.Text \| trim}}`                                                   |
| `truncate` | Truncate with ellipsis | `{{.Text \| truncate 50}}` → `"This is a long text that gets tru..."` |

### Time Formatting

| Function     | Description      | Example                                                        |
| ------------ | ---------------- | -------------------------------------------------------------- |
| `formatTime` | Format time.Time | `{{.TriggeredAt \| formatTime "2006-01-02"}}` → `"2024-01-15"` |

### Utilities

| Function  | Description                | Example                                              |
| --------- | -------------------------- | ---------------------------------------------------- |
| `default` | Fallback value if empty    | `{{.DeviceName \| default "Unknown"}}` → `"Unknown"` |
| `join`    | Join string slice          | `{{.Actions \| join ", "}}` → `"a, b, c"`            |
| `add`     | Add integers               | `{{add $i 1}}` → `2` (if `$i` is 1)                  |
| `escape`  | Escape Telegram MarkdownV2 | `{{.Text \| escape}}`                                |
| `json`    | JSON encode (placeholder)  | `{{.EventData \| json}}`                             |

## Usage

### Loading Templates

```go
import "backend/templates/alerts"

// Get a specific template
content, err := alerts.GetTemplate("email", "default-subject")
if err != nil {
    // Handle error
}

// Check if template exists
if alerts.TemplateExists("telegram", "default-message") {
    // Template exists
}

// Get all templates for a channel
templates, err := alerts.GetAllTemplatesForChannel("email")
// Returns: ["default-subject", "default-body.html", "default-body.txt"]

// Get supported channels
channels := alerts.GetSupportedChannels()
// Returns: ["email", "telegram", "pushover", "webhook", "inapp"]
```

### Rendering Templates

```go
import (
    "bytes"
    "html/template"
    "backend/templates/alerts"
)

// Load template content
tmplContent, err := alerts.GetTemplate("email", "default-subject")
if err != nil {
    return err
}

// Parse with function map
tmpl, err := template.New("subject").
    Funcs(alerts.TemplateFuncMap()).
    Parse(tmplContent)
if err != nil {
    return err
}

// Prepare data
data := struct {
    EventType     string
    Severity      string
    Title         string
    Message       string
    RuleName      string
    DeviceName    string
    FormattedTime string
}{
    EventType:     "router.offline",
    Severity:      "CRITICAL",
    Title:         "Router Offline",
    Message:       "Router has not responded to health checks",
    RuleName:      "Connectivity Monitor",
    DeviceName:    "Office-Router-01",
    FormattedTime: "2024-01-15 14:30:00",
}

// Execute template
var buf bytes.Buffer
if err := tmpl.Execute(&buf, data); err != nil {
    return err
}

result := buf.String()
// Result: "[CRITICAL] Router Offline - Office-Router-01"
```

### Validating Templates

```go
import "backend/templates/alerts"

// Validate custom template syntax
customTemplate := "Alert: {{.Title}} on {{.DeviceName}}"
if err := alerts.ValidateTemplate(customTemplate); err != nil {
    // Invalid template syntax
    return err
}
```

## Channel-Specific Notes

### Email

- **HTML template** (`default-body.html.tmpl`): Uses inline CSS for email client compatibility
- **Text template** (`default-body.txt.tmpl`): Plain text fallback for clients that don't support
  HTML
- **Subject template** (`default-subject.tmpl`): Keep short (< 50 chars recommended)

### Telegram

- Uses **MarkdownV2** format (strict escaping required)
- Use the `escape` function for user-provided text: `{{.Message | escape}}`
- Supports: **bold** (`*text*`), _italic_ (`_text_`), `code` (`` `text` ``), [links](url)

### Pushover

- **Title**: Max 250 characters
- **Message**: Max 1024 characters
- Supports HTML tags: `<b>`, `<i>`, `<u>`, `<font color="...">`

### Webhook

- JSON payload template
- Use proper escaping for JSON values
- Can include nested `EventData` structure
- RFC 3339 timestamp format for API interoperability

### In-App

- Simple plain text format
- Supports basic Markdown (bold, italic, links)
- Optimized for brevity (mobile notifications)

## Best Practices

### 1. Use Semantic Severity Colors

```html
<!-- Email HTML -->
<div class="alert-details {{.Severity}}">
  <!-- Auto-applies appropriate color based on CRITICAL/WARNING/INFO -->
</div>
```

### 2. Always Provide Fallback Values

```go
{{.DeviceName | default "Unknown"}}
{{.DeviceIP | default "N/A"}}
```

### 3. Escape User Input for Security

```go
// Telegram (MarkdownV2)
{{.Message | escape}}

// Email (HTML) - Go's html/template does this automatically
{{.Message}}
```

### 4. Test Template Changes

```bash
cd apps/backend
go test -v ./templates/alerts/
```

### 5. Keep Messages Actionable

Include troubleshooting steps in `SuggestedActions`:

```go
SuggestedActions: []string{
    "Check physical network connection",
    "Verify router power supply",
    "Review firewall rules blocking management access",
}
```

## Extending Templates

### Adding a New Channel

1. Create directory: `templates/alerts/newchannel/`
2. Add template file: `newchannel/default-message.tmpl`
3. Update `embed.go`: Add channel to `GetSupportedChannels()`
4. Update `//go:embed` directive: `//go:embed ... newchannel/*.tmpl`
5. Add tests in `embed_test.go`

### Creating Custom Templates

Custom templates can be stored in the database and rendered using the same template engine:

```go
// User-defined template from database
customTemplate := loadFromDatabase(userID, "custom-alert")

// Parse and render
tmpl, _ := template.New("custom").
    Funcs(alerts.TemplateFuncMap()).
    Parse(customTemplate)

tmpl.Execute(&buf, data)
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
go test -v ./templates/alerts/

# Run specific test
go test -v ./templates/alerts/ -run TestTemplateRendering

# Check coverage
go test -cover ./templates/alerts/
```

Tests cover:

- ✅ Template existence for all channels
- ✅ Template parsing and validation
- ✅ Rendering with real data
- ✅ Template functions
- ✅ Error handling
- ✅ Edge cases (empty values, missing data)

## Performance

- **Embedded at compile time**: Zero filesystem I/O at runtime
- **Cached by Go**: Templates loaded once into memory
- **Fast rendering**: ~100μs per template execution
- **Low memory**: ~50KB for all embedded templates

## Security Considerations

1. **HTML Email**: Use `html/template` (not `text/template`) for automatic XSS protection
2. **Telegram**: Always escape user input with `{{.Message | escape}}`
3. **Webhook**: Validate JSON structure, escape special characters
4. **User Templates**: Always validate with `ValidateTemplate()` before saving to database

## References

- [Go html/template docs](https://pkg.go.dev/html/template)
- [Telegram MarkdownV2 spec](https://core.telegram.org/bots/api#markdownv2-style)
- [Pushover API docs](https://pushover.net/api)
- [Email HTML best practices](https://www.campaignmonitor.com/css/)
