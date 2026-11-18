package net

func resolveNetwatchCommentType(comment string) NetwatchHostType {
	switch comment {
	case "Failover Netwatch - Foreign Link":
		return NetwatchHostTypeForeign
	case "Failover Netwatch - VPN-Client":
		return NetwatchHostTypeVPN
	case "Failover Netwatch - Domestic Link":
		return NetwatchHostTypeDomestic
	default:
		return ""
	}
}
