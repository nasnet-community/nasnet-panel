package common

import (
	"net/http"
	"strconv"
	"strings"

	"nasnet-panel/internal/auth"
	ctxpkg "nasnet-panel/internal/context"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

func (v ReleaseVersion) base() [3]int {
	return [3]int{v.major, v.minor, v.patch}
}

// ParseReleaseVersion parses a release tag into a ReleaseVersion.
func ParseReleaseVersion(v string) (ReleaseVersion, bool) {
	m := ReleaseVersionPattern.FindStringSubmatch(v)
	if m == nil {
		return ReleaseVersion{}, false
	}

	n := func(s string) int {
		i, _ := strconv.Atoi(s)
		return i
	}
	rv := ReleaseVersion{major: n(m[1]), minor: n(m[2]), patch: n(m[3]), Channel: ReleaseChannelStable}
	switch {
	case m[4] != "":
		rv.Channel, rv.rc = ReleaseChannelRC, n(m[4])
	case m[5] != "":
		rv.Channel, rv.date, rv.build = ReleaseChannelDev, n(m[5]), n(m[6])
	}
	return rv, true
}

// ChannelRank orders release channels for comparing versions.
func ChannelRank(channel string) int {
	switch channel {
	case ReleaseChannelDev:
		return 0
	case ReleaseChannelRC:
		return 1
	}
	return 2
}

// CompareInts returns -1, 0 or 1 for a < b, a == b or a > b.
func CompareInts(a, b int) int {
	switch {
	case a < b:
		return -1
	case a > b:
		return 1
	}
	return 0
}

// CompareBase compares the major, minor and patch parts of two versions.
func CompareBase(a, b ReleaseVersion) int {
	ab, bb := a.base(), b.base()
	for i := range ab {
		if c := CompareInts(ab[i], bb[i]); c != 0 {
			return c
		}
	}
	return 0
}

// CompareReleaseVersions orders two release versions. Within one channel it follows how that channel
// is numbered: stable by X.Y.Z, rc by X.Y.Z then the rc number, dev by build date, then X.Y.Z, then the
// build number of that day. Across channels it compares X.Y.Z first and, when equal, ranks
// dev below rc below stable.
func CompareReleaseVersions(a, b ReleaseVersion) int {
	if a.Channel != b.Channel {
		if c := CompareBase(a, b); c != 0 {
			return c
		}
		return CompareInts(ChannelRank(a.Channel), ChannelRank(b.Channel))
	}

	switch a.Channel {
	case ReleaseChannelDev:
		if c := CompareInts(a.date, b.date); c != 0 {
			return c
		}
		if c := CompareBase(a, b); c != 0 {
			return c
		}
		return CompareInts(a.build, b.build)
	case ReleaseChannelRC:
		if c := CompareBase(a, b); c != 0 {
			return c
		}
		return CompareInts(a.rc, b.rc)
	}
	return CompareBase(a, b)
}

// CleanErrorMessage removes formatting artifacts from an error message.
func CleanErrorMessage(errMsg string) string {
	if errMsg == "" {
		return errMsg
	}

	patterns := []string{
		"%!w(<nil>)",
		"%!w(nil)",
		"close %!w",
	}

	result := errMsg
	for _, pattern := range patterns {
		result = strings.ReplaceAll(result, pattern, "")
	}

	result = strings.TrimSpace(result)
	result = strings.TrimSuffix(result, ": )")
	result = strings.TrimSuffix(result, ":")

	return result
}

func ErrorResponse(c echo.Context, statusCode int, message string, err error) error {
	errMsg := ""
	if err != nil {
		errMsg = CleanErrorMessage(err.Error())
	}
	return c.JSON(statusCode, Response{
		Status:  statusCode,
		Message: message,
		Error:   errMsg,
	})
}

func SuccessResponse(c echo.Context, statusCode int, message string, data interface{}) error {
	return c.JSON(statusCode, Response{
		Status:  statusCode,
		Message: message,
		Data:    data,
	})
}

func SimpleSuccessResponse(c echo.Context, statusCode int, message string) error {
	return c.JSON(statusCode, Response{
		Status:  statusCode,
		Message: message,
	})
}

func GetRouterOSCredentials(c echo.Context) (*auth.Credentials, error) {
	creds, ok := ctxpkg.GetCredentials(c)
	if !ok {
		return nil, ErrMissingCredentials
	}
	return creds, nil
}

func NewRouterOSClient(c echo.Context, creds *auth.Credentials) (*routeros.Client, error) {
	client, err := routeros.GetOrCreateClient(routeros.ConnectionConfig{
		Address:  creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	})
	if err != nil {
		if IsCredentialError(err) {
			_ = ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			return nil, ErrClientCreationFailed
		}

		// Distinguish between timeout (504) and offline (502)
		if routeros.IsTimeoutError(err) {
			_ = ErrorResponse(c, http.StatusGatewayTimeout, "RouterOS device not responding (timeout)", err)
			return nil, ErrClientCreationFailed
		}
		if routeros.IsOfflineError(err) {
			_ = ErrorResponse(c, http.StatusBadGateway, "RouterOS device offline or unreachable", err)
			return nil, ErrClientCreationFailed
		}

		_ = ErrorResponse(c, http.StatusInternalServerError, "Failed to connect to RouterOS device", err)
		return nil, ErrClientCreationFailed
	}

	PrepareRouter(creds.RouterOSHost, client)

	return client, nil
}

// TryGetRouterOSClient returns the RouterOS client of the request without writing an HTTP response
// when that fails, for handlers where the router is optional.
func TryGetRouterOSClient(c echo.Context) (*routeros.Client, error) {
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return nil, err
	}

	client, err := routeros.GetOrCreateClient(routeros.ConnectionConfig{
		Address:  creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	})
	if err != nil {
		return nil, err
	}

	PrepareRouter(creds.RouterOSHost, client)

	return client, nil
}

func GetRouterOSClient(c echo.Context) (*routeros.Client, error) {
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return nil, ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	client, err := NewRouterOSClient(c, creds)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func IsCredentialError(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())

	credentialKeywords := []string{
		"after login:",
		"no such user",
		"invalid user",
		"invalid password",
		"authentication failed",
		"login failed",
		"unauthorized",
	}

	for _, keyword := range credentialKeywords {
		if strings.Contains(errMsg, keyword) {
			return true
		}
	}

	return false
}

// GetWifiBandFromRadios returns the band of the radio that serves the interface.
func GetWifiBandFromRadios(radios []routeros.WiFiRadio, wifiInterfaceName string) string {
	for i := range radios {
		if radios[i].Interface == wifiInterfaceName {
			return radios[i].Band
		}
	}
	return ""
}
