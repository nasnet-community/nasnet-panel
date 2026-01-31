package translator

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRouterOSVersion_String(t *testing.T) {
	tests := []struct {
		name    string
		version RouterOSVersion
		want    string
	}{
		{
			name:    "major.minor only",
			version: RouterOSVersion{Major: 7, Minor: 13},
			want:    "7.13",
		},
		{
			name:    "major.minor.patch",
			version: RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			want:    "7.13.2",
		},
		{
			name:    "ROS 6.x",
			version: RouterOSVersion{Major: 6, Minor: 49, Patch: 13},
			want:    "6.49.13",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.version.String())
		})
	}
}

func TestRouterOSVersion_IsAtLeast(t *testing.T) {
	tests := []struct {
		name    string
		version RouterOSVersion
		major   int
		minor   int
		want    bool
	}{
		{
			name:    "exact match",
			version: RouterOSVersion{Major: 7, Minor: 13},
			major:   7,
			minor:   13,
			want:    true,
		},
		{
			name:    "higher minor",
			version: RouterOSVersion{Major: 7, Minor: 13},
			major:   7,
			minor:   10,
			want:    true,
		},
		{
			name:    "higher major",
			version: RouterOSVersion{Major: 7, Minor: 13},
			major:   6,
			minor:   49,
			want:    true,
		},
		{
			name:    "lower minor",
			version: RouterOSVersion{Major: 7, Minor: 10},
			major:   7,
			minor:   13,
			want:    false,
		},
		{
			name:    "lower major",
			version: RouterOSVersion{Major: 6, Minor: 49},
			major:   7,
			minor:   1,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.version.IsAtLeast(tt.major, tt.minor))
		})
	}
}

func TestRouterOSVersion_IsROS7(t *testing.T) {
	assert.True(t, RouterOSVersion{Major: 7, Minor: 13}.IsROS7())
	assert.True(t, RouterOSVersion{Major: 8, Minor: 0}.IsROS7())
	assert.False(t, RouterOSVersion{Major: 6, Minor: 49}.IsROS7())
}

func TestRouterOSVersion_IsROS6(t *testing.T) {
	assert.True(t, RouterOSVersion{Major: 6, Minor: 49}.IsROS6())
	assert.False(t, RouterOSVersion{Major: 7, Minor: 13}.IsROS6())
}

func TestParseVersion(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    RouterOSVersion
		wantErr bool
	}{
		{
			name:  "simple version",
			input: "7.13",
			want:  RouterOSVersion{Major: 7, Minor: 13},
		},
		{
			name:  "version with patch",
			input: "7.13.2",
			want:  RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
		},
		{
			name:  "version with channel",
			input: "7.13.2 (stable)",
			want:  RouterOSVersion{Major: 7, Minor: 13, Patch: 2, Channel: "stable"},
		},
		{
			name:  "ROS 6.x version",
			input: "6.49.13 (long-term)",
			want:  RouterOSVersion{Major: 6, Minor: 49, Patch: 13, Channel: "long-term"},
		},
		{
			name:    "invalid format - single number",
			input:   "7",
			wantErr: true,
		},
		{
			name:    "invalid format - empty",
			input:   "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseVersion(tt.input)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestFilter_String(t *testing.T) {
	tests := []struct {
		name   string
		filter Filter
		want   string
	}{
		{
			name:   "equality filter",
			filter: Filter{Field: "name", Operator: FilterOpEquals, Value: "ether1"},
			want:   "?name=ether1",
		},
		{
			name:   "not equals filter",
			filter: Filter{Field: "disabled", Operator: FilterOpNotEquals, Value: "yes"},
			want:   "?disabled!=yes",
		},
		{
			name:   "greater than filter",
			filter: Filter{Field: "mtu", Operator: FilterOpGreater, Value: 1500},
			want:   "?mtu>1500",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.filter.String())
		})
	}
}

func TestCommandError_Error(t *testing.T) {
	err := &CommandError{
		Code:     "NOT_FOUND",
		Message:  "Item not found",
		Category: ErrorCategoryNotFound,
	}

	assert.Equal(t, "[NOT_FOUND] NOT_FOUND: Item not found", err.Error())
}

func TestNewSuccessResponse(t *testing.T) {
	data := map[string]interface{}{"name": "ether1"}
	resp := NewSuccessResponse(data)

	assert.True(t, resp.Success)
	assert.Equal(t, data, resp.Data)
	assert.Nil(t, resp.Error)
}

func TestNewErrorResponse(t *testing.T) {
	resp := NewErrorResponse("VALIDATION_ERROR", "Invalid input", ErrorCategoryValidation)

	assert.False(t, resp.Success)
	assert.Nil(t, resp.Data)
	require.NotNil(t, resp.Error)
	assert.Equal(t, "VALIDATION_ERROR", resp.Error.Code)
	assert.Equal(t, "Invalid input", resp.Error.Message)
	assert.Equal(t, ErrorCategoryValidation, resp.Error.Category)
}

func TestNewCreateResponse(t *testing.T) {
	resp := NewCreateResponse("*A1")

	assert.True(t, resp.Success)
	assert.Equal(t, "*A1", resp.ID)
}
