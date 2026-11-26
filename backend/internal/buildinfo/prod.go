//go:build production

package buildinfo

// DevRouterUserID always returns an empty string in production builds, so
// router user IDs are always derived from the router and signed.
func DevRouterUserID() string {
	return ""
}

// DevSigningKey always returns an empty string in production builds, so the
// JWT signing key is always random per process.
func DevSigningKey() string {
	return ""
}

// DevRouterPassword always returns an empty string in production builds, so a
// session is never restored without the password given at login.
func DevRouterPassword() string {
	return ""
}
