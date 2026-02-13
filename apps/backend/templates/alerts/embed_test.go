package alerts

import (
	"html/template"
	"strings"
	"testing"
	"time"
)

func TestGetTemplate(t *testing.T) {
	tests := []struct {
		name        string
		channel     string
		templateName string
		wantErr     bool
	}{
		{
			name:        "email subject template exists",
			channel:     "email",
			templateName: "default-subject",
			wantErr:     false,
		},
		{
			name:        "email html body template exists",
			channel:     "email",
			templateName: "default-body.html",
			wantErr:     false,
		},
		{
			name:        "email text body template exists",
			channel:     "email",
			templateName: "default-body.txt",
			wantErr:     false,
		},
		{
			name:        "telegram message template exists",
			channel:     "telegram",
			templateName: "default-message",
			wantErr:     false,
		},
		{
			name:        "pushover title template exists",
			channel:     "pushover",
			templateName: "default-title",
			wantErr:     false,
		},
		{
			name:        "pushover message template exists",
			channel:     "pushover",
			templateName: "default-message",
			wantErr:     false,
		},
		{
			name:        "webhook payload template exists",
			channel:     "webhook",
			templateName: "default-payload",
			wantErr:     false,
		},
		{
			name:        "inapp title template exists",
			channel:     "inapp",
			templateName: "default-title",
			wantErr:     false,
		},
		{
			name:        "inapp message template exists",
			channel:     "inapp",
			templateName: "default-message",
			wantErr:     false,
		},
		{
			name:        "non-existent template returns error",
			channel:     "email",
			templateName: "non-existent",
			wantErr:     true,
		},
		{
			name:        "non-existent channel returns error",
			channel:     "sms",
			templateName: "default-message",
			wantErr:     true,
		},
		{
			name:        "empty channel returns error",
			channel:     "",
			templateName: "default-message",
			wantErr:     true,
		},
		{
			name:        "empty template name returns error",
			channel:     "email",
			templateName: "",
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			content, err := GetTemplate(tt.channel, tt.templateName)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetTemplate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && content == "" {
				t.Errorf("GetTemplate() returned empty content for valid template")
			}
		})
	}
}

func TestGetAllTemplatesForChannel(t *testing.T) {
	tests := []struct {
		name        string
		channel     string
		wantCount   int
		wantErr     bool
	}{
		{
			name:      "email channel has 3 templates",
			channel:   "email",
			wantCount: 3,
			wantErr:   false,
		},
		{
			name:      "telegram channel has 1 template",
			channel:   "telegram",
			wantCount: 1,
			wantErr:   false,
		},
		{
			name:      "pushover channel has 2 templates",
			channel:   "pushover",
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:      "webhook channel has 1 template",
			channel:   "webhook",
			wantCount: 1,
			wantErr:   false,
		},
		{
			name:      "inapp channel has 2 templates",
			channel:   "inapp",
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:      "non-existent channel returns error",
			channel:   "sms",
			wantCount: 0,
			wantErr:   true,
		},
		{
			name:      "empty channel returns error",
			channel:   "",
			wantCount: 0,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			templates, err := GetAllTemplatesForChannel(tt.channel)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetAllTemplatesForChannel() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(templates) != tt.wantCount {
				t.Errorf("GetAllTemplatesForChannel() got %d templates, want %d", len(templates), tt.wantCount)
			}
		})
	}
}

func TestGetSupportedChannels(t *testing.T) {
	channels := GetSupportedChannels()
	expected := []string{"email", "telegram", "pushover", "webhook", "inapp"}

	if len(channels) != len(expected) {
		t.Errorf("GetSupportedChannels() got %d channels, want %d", len(channels), len(expected))
	}

	for _, exp := range expected {
		found := false
		for _, ch := range channels {
			if ch == exp {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("GetSupportedChannels() missing expected channel: %s", exp)
		}
	}
}

func TestTemplateFuncMap(t *testing.T) {
	funcMap := TemplateFuncMap()

	expectedFuncs := []string{
		"upper", "lower", "title", "trim", "truncate",
		"formatTime", "join", "default", "add", "escape", "json",
	}

	for _, fn := range expectedFuncs {
		if _, ok := funcMap[fn]; !ok {
			t.Errorf("TemplateFuncMap() missing function: %s", fn)
		}
	}
}

func TestValidateTemplate(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		wantErr  bool
	}{
		{
			name:    "valid template",
			content: "Hello {{.Name}}",
			wantErr: false,
		},
		{
			name:    "valid template with functions",
			content: "{{.Name | upper}}",
			wantErr: false,
		},
		{
			name:    "invalid template - unclosed action",
			content: "Hello {{.Name",
			wantErr: true,
		},
		{
			name:    "invalid template - undefined function",
			content: "{{.Name | undefinedFunc}}",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateTemplate(tt.content)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateTemplate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestTemplateExists(t *testing.T) {
	tests := []struct {
		name        string
		channel     string
		templateName string
		want        bool
	}{
		{
			name:        "existing template",
			channel:     "email",
			templateName: "default-subject",
			want:        true,
		},
		{
			name:        "non-existing template",
			channel:     "email",
			templateName: "non-existent",
			want:        false,
		},
		{
			name:        "non-existing channel",
			channel:     "sms",
			templateName: "default-message",
			want:        false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := TemplateExists(tt.channel, tt.templateName); got != tt.want {
				t.Errorf("TemplateExists() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestTemplateRendering(t *testing.T) {
	type AlertData struct {
		EventType        string
		Severity         string
		Title            string
		Message          string
		RuleName         string
		RuleID           string
		DeviceName       string
		DeviceIP         string
		TriggeredAt      time.Time
		FormattedTime    string
		SuggestedActions []string
	}

	data := AlertData{
		EventType:     "router.offline",
		Severity:      "CRITICAL",
		Title:         "Router Offline",
		Message:       "Router has not responded to health checks for 5 minutes",
		RuleName:      "Router Connectivity Monitor",
		RuleID:        "rule-123",
		DeviceName:    "Office-Router-01",
		DeviceIP:      "192.168.1.1",
		TriggeredAt:   time.Now(),
		FormattedTime: time.Now().Format("2006-01-02 15:04:05"),
		SuggestedActions: []string{
			"Check physical network connection",
			"Verify router power supply",
			"Review firewall rules",
		},
	}

	tests := []struct {
		name        string
		channel     string
		templateName string
		checkContent []string // Strings that should appear in rendered output
	}{
		{
			name:        "email subject renders correctly",
			channel:     "email",
			templateName: "default-subject",
			checkContent: []string{"CRITICAL", "Router Offline", "Office-Router-01"},
		},
		{
			name:        "email html body renders correctly",
			channel:     "email",
			templateName: "default-body.html",
			checkContent: []string{"CRITICAL", "Router Offline", "192.168.1.1", "Suggested Actions"},
		},
		{
			name:        "email text body renders correctly",
			channel:     "email",
			templateName: "default-body.txt",
			checkContent: []string{"CRITICAL", "Router Offline", "192.168.1.1", "SUGGESTED ACTIONS"},
		},
		{
			name:        "telegram message renders correctly",
			channel:     "telegram",
			templateName: "default-message",
			checkContent: []string{"CRITICAL", "Router Offline", "router.offline"},
		},
		{
			name:        "pushover title renders correctly",
			channel:     "pushover",
			templateName: "default-title",
			checkContent: []string{"CRITICAL", "Router Offline"},
		},
		{
			name:        "inapp title renders correctly",
			channel:     "inapp",
			templateName: "default-title",
			checkContent: []string{"Router Offline"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmplContent, err := GetTemplate(tt.channel, tt.templateName)
			if err != nil {
				t.Fatalf("GetTemplate() error = %v", err)
			}

			tmpl, err := template.New(tt.templateName).Funcs(TemplateFuncMap()).Parse(tmplContent)
			if err != nil {
				t.Fatalf("template.Parse() error = %v", err)
			}

			var buf strings.Builder
			if err := tmpl.Execute(&buf, data); err != nil {
				t.Fatalf("template.Execute() error = %v", err)
			}

			rendered := buf.String()
			for _, check := range tt.checkContent {
				if !strings.Contains(rendered, check) {
					t.Errorf("Rendered template missing expected content: %s", check)
				}
			}
		})
	}
}

func TestTemplateFunctions(t *testing.T) {
	funcMap := TemplateFuncMap()

	t.Run("truncate function", func(t *testing.T) {
		truncate := funcMap["truncate"].(func(int, string) string)
		if got := truncate(10, "Hello World!"); got != "Hello W..." {
			t.Errorf("truncate() = %v, want 'Hello W...'", got)
		}
		if got := truncate(20, "Short"); got != "Short" {
			t.Errorf("truncate() = %v, want 'Short'", got)
		}
	})

	t.Run("default function", func(t *testing.T) {
		defaultFunc := funcMap["default"].(func(string, string) string)
		if got := defaultFunc("fallback", ""); got != "fallback" {
			t.Errorf("default() = %v, want 'fallback'", got)
		}
		if got := defaultFunc("fallback", "value"); got != "value" {
			t.Errorf("default() = %v, want 'value'", got)
		}
	})

	t.Run("join function", func(t *testing.T) {
		join := funcMap["join"].(func(string, []string) string)
		items := []string{"a", "b", "c"}
		if got := join(", ", items); got != "a, b, c" {
			t.Errorf("join() = %v, want 'a, b, c'", got)
		}
	})

	t.Run("add function", func(t *testing.T) {
		add := funcMap["add"].(func(int, int) int)
		if got := add(1, 2); got != 3 {
			t.Errorf("add() = %v, want 3", got)
		}
	})

	t.Run("escape function", func(t *testing.T) {
		escape := funcMap["escape"].(func(string) string)
		input := "Test_with*special[chars]"
		result := escape(input)
		// Should escape Telegram MarkdownV2 special characters
		if !strings.Contains(result, "\\_") || !strings.Contains(result, "\\*") {
			t.Errorf("escape() did not properly escape special characters")
		}
	})
}
