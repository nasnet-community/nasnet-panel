{
    :local lanBridgeName "LANBridgeSplit"
    :local lanIP "192.168.10.1"
    :local lanCIDR "192.168.10.1/24"
    :local lanNetwork "192.168.10.0"
    :local lanNetworkCIDR "192.168.10.0/24"
    :local lanNetworkPrefix 192.168.10.0/24
    :local lanPoolName "DHCP-pool-Split"
    :local lanPoolRanges "192.168.10.2-192.168.10.254"
    :local lanDhcpName "DHCP-Split"
    :local wanPort "ether1"
    :local containerSubnet "192.168.50.0/24"
    :local containerDNS "1.0.0.1"
    :local tag "nasnet-panel-baseline"
    :local failed false

    :log info "nasnet-panel: baseline v4 starting"

    :local layoutPresent false
    :local lanBridge ""
    :onerror err in={
        :if ([:len [/interface/bridge find name=$lanBridgeName]] > 0) do={
            :set layoutPresent true
            :set lanBridge $lanBridgeName
            :log info "nasnet-panel: NasNet layout already present; LAN and WAN rewiring will be skipped"
        } else={
            :local candidates [:toarray ""]
            :foreach b in=[/interface/bridge find] do={
                :local bn [/interface/bridge get $b name]
                :if ($bn != "containers") do={
                    :if (([:len [/ip/address find interface=$bn dynamic=no]] > 0) && ([:len [/ip/dhcp-server find interface=$bn]] > 0)) do={
                        :set candidates ($candidates, $bn)
                    }
                }
            }
            :if ([:len $candidates] = 1) do={
                :set lanBridge ($candidates->0)
            }
            :if ([:len $candidates] > 1) do={
                :foreach c in=$candidates do={
                    :if (($lanBridge = "") && ([:len [/interface/list/member find list=LAN interface=$c]] > 0)) do={
                        :set lanBridge $c
                    }
                }
            }
            :if ($lanBridge = "") do={
                :error ("no unambiguous LAN bridge found (candidates: " . [:tostr $candidates] . ")")
            }
            :log info ("nasnet-panel: LAN bridge is " . $lanBridge)
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: LAN bridge discovery failed: " . $err)
    }

    :onerror err in={
        :local removed 0
        :foreach r in=[/ip/firewall/filter find where (action=drop || action=reject || action=tarpit)] do={
            :local c [:tostr [/ip/firewall/filter get $r comment]]
            :local dp [:tostr [/ip/firewall/filter get $r dst-port]]
            :local isDNS (($dp ~ "(^|,)53(-|,|\$)") || ($c ~ "DNS") || ($c ~ "dns") || ($c ~ "Dns"))
            :local isDefconf ($c ~ "^defconf")
            :if ((!$isDNS) && ((!$layoutPresent) || $isDefconf)) do={
                /ip/firewall/filter remove $r
                :set removed ($removed + 1)
            }
        }
        :foreach r in=[/ip/firewall/raw find where (action=drop)] do={
            :local c [:tostr [/ip/firewall/raw get $r comment]]
            :local dp [:tostr [/ip/firewall/raw get $r dst-port]]
            :local isDNS (($dp ~ "(^|,)53(-|,|\$)") || ($c ~ "DNS") || ($c ~ "dns") || ($c ~ "Dns"))
            :local isDefconf ($c ~ "^defconf")
            :if ((!$isDNS) && ((!$layoutPresent) || $isDefconf)) do={
                /ip/firewall/raw remove $r
                :set removed ($removed + 1)
            }
        }
        :onerror v6err in={
            :foreach r in=[/ipv6/firewall/filter find where (action=drop || action=reject)] do={
                :local c [:tostr [/ipv6/firewall/filter get $r comment]]
                :local dp [:tostr [/ipv6/firewall/filter get $r dst-port]]
                :local isDNS (($dp ~ "(^|,)53(-|,|\$)") || ($c ~ "DNS") || ($c ~ "dns") || ($c ~ "Dns"))
                :local isDefconf ($c ~ "^defconf")
                :if ((!$isDNS) && ((!$layoutPresent) || $isDefconf)) do={
                    /ipv6/firewall/filter remove $r
                    :set removed ($removed + 1)
                }
            }
            :foreach r in=[/ipv6/firewall/raw find where (action=drop)] do={
                :local c [:tostr [/ipv6/firewall/raw get $r comment]]
                :local isDefconf ($c ~ "^defconf")
                :if ((!($c ~ "DNS")) && ((!$layoutPresent) || $isDefconf)) do={
                    /ipv6/firewall/raw remove $r
                    :set removed ($removed + 1)
                }
            }
        } do={
            :log info ("nasnet-panel: IPv6 firewall not available, skipped (" . $v6err . ")")
        }
        :log info ("nasnet-panel: removed " . $removed . " blocking firewall rules; DNS rules kept")
    } do={
        :set failed true
        :log error ("nasnet-panel: firewall cleanup failed: " . $err)
    }

    :onerror err in={
        :foreach ln in=[:toarray "WAN,LAN"] do={
            :if ([:len [/interface/list find name=$ln]] = 0) do={
                /interface/list add name=$ln comment=$tag
            }
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: interface list preparation failed: " . $err)
    }

    :if (!$layoutPresent) do={
        :onerror err in={
            :if ([:len [/interface find name=$wanPort]] = 0) do={
                :error ($wanPort . " does not exist on this router")
            }
            :local alreadyWan false
            :if ([:len [/ip/dhcp-client find interface=$wanPort]] > 0) do={ :set alreadyWan true }
            :if ([:len [/interface/list/member find list=WAN interface=$wanPort]] > 0) do={ :set alreadyWan true }
            :onerror ignore in={
                :if ([:len [/interface/pppoe-client find interface=$wanPort]] > 0) do={ :set alreadyWan true }
            } do={}
            :onerror ignore in={
                :if ([:len [/interface/macvlan find interface=$wanPort]] > 0) do={ :set alreadyWan true }
            } do={}

            :foreach p in=[/interface/bridge/port find interface=$wanPort] do={
                :local pb [/interface/bridge/port get $p bridge]
                :log info ("nasnet-panel: taking " . $wanPort . " out of bridge " . $pb . " to use it as WAN")
                /interface/bridge/port remove $p
            }
            :if ([:len [/interface/list/member find list=LAN interface=$wanPort]] > 0) do={
                /interface/list/member remove [find list=LAN interface=$wanPort]
            }
            :if ([:len [/ip/dhcp-client find interface=$wanPort]] = 0) do={
                /ip/dhcp-client add interface=$wanPort add-default-route=yes use-peer-dns=yes use-peer-ntp=yes disabled=no comment=($tag . ": WAN uplink")
            }
            :if ([:len [/interface/list/member find list=WAN interface=$wanPort]] = 0) do={
                /interface/list/member add list=WAN interface=$wanPort comment=$tag
            }
            :if ($alreadyWan) do={
                :log info ("nasnet-panel: " . $wanPort . " was already a WAN uplink")
            } else={
                :log info ("nasnet-panel: " . $wanPort . " is now the WAN uplink")
            }

            :if ([:len [/ip/firewall/nat find chain=srcnat action=masquerade out-interface-list=WAN]] = 0) do={
                /ip/firewall/nat add chain=srcnat action=masquerade out-interface-list=WAN comment=($tag . ": masquerade WAN")
                :log info "nasnet-panel: added masquerade for the WAN list"
            }
        } do={
            :set failed true
            :log error ("nasnet-panel: WAN preparation failed: " . $err)
        }
    }

    :onerror err in={
        /ip/neighbor/discovery-settings set discover-interface-list=all
        /tool/mac-server set allowed-interface-list=all
        /tool/mac-server/mac-winbox set allowed-interface-list=all
    } do={
        :set failed true
        :log error ("nasnet-panel: management access settings failed: " . $err)
    }

    :onerror err in={
        :local staticDNS [/ip/dns get servers]
        :local dynamicDNS [/ip/dns get dynamic-servers]
        :local dohServer [/ip/dns get use-doh-server]
        :if (([:len $staticDNS] = 0) && ([:len $dynamicDNS] = 0) && ([:len $dohServer] = 0)) do={
            /ip/dns set servers=1.1.1.1,1.0.0.1
        }
        /ip/dns set allow-remote-requests=yes
    } do={
        :set failed true
        :log error ("nasnet-panel: router DNS preparation failed: " . $err)
    }
    :onerror err in={
        /system/ntp/client set enabled=yes
        :foreach ntpHost in=[:toarray "pool.ntp.org,time.cloudflare.com,time.google.com"] do={
            :if ([:len [/system/ntp/client/servers find address=$ntpHost]] = 0) do={
                /system/ntp/client/servers add address=$ntpHost
            }
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: NTP preparation failed: " . $err)
    }

    :foreach proto in=[:toarray "tcp,udp"] do={
        :local ownedComment ("nasnet-panel-installer-container-dns-" . $proto)
        :onerror err in={
            :local previous [/ip/firewall/nat find comment=$ownedComment]
            :local replacement [/ip/firewall/nat add chain=dstnat action=dst-nat protocol=$proto dst-port=53 src-address=$containerSubnet to-addresses=$containerDNS to-ports=53 disabled=no comment=$ownedComment]
            :onerror moveError in={
                :local firstRule [:pick [/ip/firewall/nat find dynamic=no] 0]
                :if ($firstRule != $replacement) do={
                    /ip/firewall/nat move $replacement destination=$firstRule
                }
            } do={
                /ip/firewall/nat remove $replacement
                :error $moveError
            }
            :foreach oldRule in=$previous do={
                /ip/firewall/nat remove $oldRule
            }
        } do={
            :set failed true
            :log error ("nasnet-panel: container DNS " . $proto . " failed: " . $err)
        }
    }

    :onerror err in={
        :local resolved [:resolve "release-assets.githubusercontent.com"]
        :log info ("nasnet-panel: download hostname resolves to " . $resolved)
    } do={
        :log warning ("nasnet-panel: download hostname does not resolve yet: " . $err)
    }

    :if (!$layoutPresent && ($lanBridge != "")) do={
        :onerror err in={
            :local dhcpIDs [/ip/dhcp-server find interface=$lanBridge]
            :if ([:len $dhcpIDs] != 1) do={ :error ("expected one DHCP server on " . $lanBridge . ", found " . [:len $dhcpIDs]) }
            :local dhcpID ($dhcpIDs->0)
            :local oldDhcpName [/ip/dhcp-server get $dhcpID name]
            :foreach leaseID in=[/ip/dhcp-server/lease find dynamic=no] do={
                :local leaseServer [/ip/dhcp-server/lease get $leaseID server]
                :if (($leaseServer = $oldDhcpName) || ($leaseServer = "all")) do={
                    :if (!([/ip/dhcp-server/lease get $leaseID address] in $lanNetworkPrefix)) do={
                        :error "static DHCP reservations outside 192.168.10.0/24 must be migrated by hand first"
                    }
                }
            }
            :local addrIDs [/ip/address find interface=$lanBridge dynamic=no]
            :local targetExists ([:len [/ip/address find interface=$lanBridge address=$lanCIDR]] > 0)
            :if (([:len $addrIDs] > 1) && (!$targetExists)) do={
                :error ("expected one static address on " . $lanBridge . ", found " . [:len $addrIDs])
            }

            /interface/bridge set [find name=$lanBridge] name=$lanBridgeName comment="Split"
            :set lanBridge $lanBridgeName
            :if ([:len [/interface/list/member find list=LAN interface=$lanBridgeName]] = 0) do={
                /interface/list/member add list=LAN interface=$lanBridgeName comment="Split"
            }

            :local oldPool [:tostr [/ip/dhcp-server get $dhcpID address-pool]]
            :if ([:len [/ip/pool find name=$lanPoolName]] > 0) do={
                /ip/pool set [find name=$lanPoolName] ranges=$lanPoolRanges
            } else={
                :if (($oldPool != "") && ($oldPool != "static-only") && ([:len [/ip/pool find name=$oldPool]] > 0)) do={
                    /ip/pool set [find name=$oldPool] name=$lanPoolName ranges=$lanPoolRanges comment="Split"
                } else={
                    /ip/pool add name=$lanPoolName ranges=$lanPoolRanges comment="Split"
                }
            }

            /ip/dhcp-server set $dhcpID name=$lanDhcpName address-pool=$lanPoolName comment="Split" disabled=no

            :local oldIP ""
            :local oldNetworkCIDR ""
            :if ($targetExists) do={
                /ip/address set [find interface=$lanBridgeName address=$lanCIDR] comment="Split" disabled=no
            } else={
                :if ([:len $addrIDs] = 1) do={
                    :local a ($addrIDs->0)
                    :local oldAddr [:tostr [/ip/address get $a address]]
                    :set oldIP [:pick $oldAddr 0 [:find $oldAddr "/"]]
                    :set oldNetworkCIDR ([:tostr [/ip/address get $a network]] . [:pick $oldAddr [:find $oldAddr "/"] [:len $oldAddr]])
                    /ip/address set $a address=$lanCIDR network=$lanNetwork comment="Split" disabled=no
                } else={
                    /ip/address add address=$lanCIDR network=$lanNetwork interface=$lanBridgeName comment="Split"
                }
            }
            :local netIDs [/ip/dhcp-server/network find address=$lanNetworkCIDR]
            :if ([:len $netIDs] = 0) do={
                :if (($oldNetworkCIDR != "") && ([:len [/ip/dhcp-server/network find address=$oldNetworkCIDR]] = 1)) do={
                    /ip/dhcp-server/network set [find address=$oldNetworkCIDR] address=$lanNetworkCIDR gateway=$lanIP dns-server=$lanIP comment="Split"
                } else={
                    /ip/dhcp-server/network add address=$lanNetworkCIDR gateway=$lanIP dns-server=$lanIP comment="Split"
                }
            } else={
                /ip/dhcp-server/network set ($netIDs->0) gateway=$lanIP dns-server=$lanIP comment="Split"
            }
            :if ($oldIP != "") do={
                /ip/dns/static set [find address=$oldIP] address=$lanIP
            }

            /ip/dhcp-server/lease remove [find server=$lanDhcpName dynamic=yes]
            :log warning ("nasnet-panel: LAN moving to " . $lanIP . "; clients will briefly disconnect and renew DHCP")
            :foreach portID in=[/interface/bridge/port find bridge=$lanBridgeName disabled=no] do={
                :local portName [/interface/bridge/port get $portID interface]
                :local ifaceID [/interface find name=$portName]
                :if (([:len $ifaceID] = 1) && (![/interface get $ifaceID disabled])) do={
                    :onerror cycleError in={
                        /interface disable $ifaceID
                        :delay 1s
                        /interface enable $ifaceID
                    } do={
                        /interface enable $ifaceID
                        :log warning ("nasnet-panel: link cycle failed on " . $portName . ": " . $cycleError)
                    }
                }
            }
            :log info ("nasnet-panel: LAN gateway is " . $lanIP . " on " . $lanBridgeName)
        } do={
            :set failed true
            :log error ("nasnet-panel: LAN migration failed: " . $err)
        }
    }

    :if ($failed) do={
        :log error "nasnet-panel: BASELINE FINISHED WITH ERRORS; inspect the preceding nasnet-panel log lines"
        :error "nasnet-panel baseline finished with errors"
    }
    :log info ("nasnet-panel: BASELINE READY; LAN gateway is " . $lanIP . "; reconnect at " . $lanIP . " or by MAC address")
    :put ("NasNet baseline ready. Reconnect at " . $lanIP . "; clients on the old subnet renew DHCP automatically.")
}
