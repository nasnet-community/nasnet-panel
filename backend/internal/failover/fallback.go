package failover

const (
	// FallbackUser is the user name of the shared account the wizard uses when the NasNet API can't give the router its own.
	FallbackUser = "API-Fallback-Nov26"
	// FallbackPassword is the password of the shared fallback account.
	FallbackPassword = "UDnFc4nSmc39" //nolint:gosec // shared fallback account the user asked to ship
)

// FallbackServers are the servers of the shared fallback account, in failover order.
var FallbackServers = [...]string{"jamw36d8.s4i.co", "at4rx.vpn.s4i.co", "ajr22.vpn.s4i.co"}

// UsesFallback reports whether the credentials are those of the shared fallback account.
func UsesFallback(user, password string) bool {
	return user == FallbackUser && password == FallbackPassword
}
