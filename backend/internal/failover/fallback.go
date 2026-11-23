package failover

const (
	// FallbackUser is the user name of the shared account the wizard uses when the NasNet API can't give the router its own.
	FallbackUser = "NNC_1DPgB09O"
	// FallbackPassword is the password of the shared fallback account.
	FallbackPassword = "wCjiNNt9" //nolint:gosec // shared fallback account the user asked to ship
)

// FallbackServers are the servers of the shared fallback account, in failover order.
var FallbackServers = [...]string{"at4rx.vpn.s4i.co", "ai4mo.vpn.s4i.co", "vav9r.vpn.s4i.co"}

// UsesFallback reports whether the credentials are those of the shared fallback account.
func UsesFallback(user, password string) bool {
	return user == FallbackUser && password == FallbackPassword
}
