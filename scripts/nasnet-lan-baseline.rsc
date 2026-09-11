# NasNet panel preparation baseline
# Import this entire file; do not split it into independently executed lines.
# Existing installer creates the container bridge/veth, image, NAT and web access.
# Reserve this subnet for the container; change these three values together if needed.
{
    :local containerSubnet "192.168.50.0/24"
    :local containerIP "192.168.50.2"
    :local containerGateway "192.168.50.1"
    :local containerDNS "1.0.0.1"
    :local containerNetwork [:toip [:pick $containerSubnet 0 [:find $containerSubnet "/"]]]
    :local failed false

    :log info "nasnet-panel: baseline v3 starting; preserving WAN; default LAN migration runs last"

    # Reject a known subnet collision before changing settings.
    # This catches the /24 used by this installer, not every possible overlapping prefix.
    :foreach a in=[/ip/address find network=$containerNetwork] do={
        :if ([/ip/address get $a interface] != "containers") do={
            :error ("nasnet-panel: " . $containerSubnet . " belongs to another interface; choose an unused container subnet")
        }
    }

    # Independent operations: failure in one must not hide the result of the other.
    :onerror err in={
        /ip/neighbor/discovery-settings set discover-interface-list=all
        :if ([/ip/neighbor/discovery-settings get discover-interface-list] != "all") do={
            :error "setting verification failed"
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: neighbor discovery failed: " . $err)
    }
    :onerror err in={
        /tool/mac-server set allowed-interface-list=all
        :if ([/tool/mac-server get allowed-interface-list] != "all") do={
            :error "setting verification failed"
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: MAC Telnet setting failed: " . $err)
    }
    # MAC WinBox and LAN list membership remain valid because no LAN bridge is removed.

    :onerror err in={
        :local staticDNS [/ip/dns get servers]
        :local dynamicDNS [/ip/dns get dynamic-servers]
        :local dohServer [/ip/dns get use-doh-server]
        :if (([:len $staticDNS] = 0) && ([:len $dynamicDNS] = 0) && ([:len $dohServer] = 0)) do={
            /ip/dns set servers=1.1.1.1,1.0.0.1
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: router DNS preparation failed: " . $err)
    }

    :onerror err in={
        /system/ntp/client set enabled=yes
    } do={
        :set failed true
        :log error ("nasnet-panel: enabling NTP failed: " . $err)
    }
    :foreach ntpHost in=[:toarray "pool.ntp.org,time.cloudflare.com,time.google.com"] do={
        :onerror err in={
            :if ([:len [/system/ntp/client/servers find address=$ntpHost]] = 0) do={
                /system/ntp/client/servers add address=$ntpHost
            }
        } do={
            :set failed true
            :log error ("nasnet-panel: NTP server " . $ntpHost . " failed: " . $err)
        }
    }

    # Rebuild only rules bearing these exact installer-owned comments.
    # Add/position the replacement before removing previous entries. This repairs
    # disabled, duplicate or edited rules, including unexpected extra match conditions.
    # Move above existing DNS redirects; do not flush connection tracking.
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
            :if ([:len [/ip/firewall/nat find comment=$ownedComment]] != 1) do={
                :error "expected exactly one owned DNS rule"
            }
            :if ([/ip/firewall/nat get $replacement disabled]) do={
                :error "DNS rule is disabled"
            }
        } do={
            :set failed true
            :log error ("nasnet-panel: container DNS " . $proto . " failed: " . $err)
        }
    }

    # The default input firewall rejects a new container network that is not LAN.
    # Permit the panel to reach only its router-side gateway; leave existing rules intact.
    :onerror err in={
        :local ownedComment "nasnet-panel-baseline-container-router"
        :local previous [/ip/firewall/filter find comment=$ownedComment]
        :local replacement [/ip/firewall/filter add chain=input action=accept src-address=$containerIP dst-address=$containerGateway disabled=no comment=$ownedComment]
        :onerror moveError in={
            :local firstRule [:pick [/ip/firewall/filter find dynamic=no] 0]
            :if ($firstRule != $replacement) do={
                /ip/firewall/filter move $replacement destination=$firstRule
            }
        } do={
            /ip/firewall/filter remove $replacement
            :error $moveError
        }
        :foreach oldRule in=$previous do={
            /ip/firewall/filter remove $oldRule
        }
        :if ([:len [/ip/firewall/filter find comment=$ownedComment]] != 1) do={
            :error "expected exactly one container-to-router rule"
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: container-to-router access failed: " . $err)
    }

    # Readiness checks do not reset ports, DHCP clients, routes or active connections.
    :onerror err in={
        :local resolved [:resolve "release-assets.githubusercontent.com"]
        :log info ("nasnet-panel: download hostname resolves to " . $resolved)
    } do={
        :set failed true
        :log error ("nasnet-panel: download hostname resolution failed: " . $err)
    }
    :onerror err in={
        :local remaining 30
        :while (([/system/ntp/client get status] != "synchronized") && ($remaining > 0)) do={
            :delay 1s
            :set remaining ($remaining - 1)
        }
        :if ([/system/ntp/client get status] != "synchronized") do={
            :error "clock is not NTP-synchronized after 30 seconds; retry when synchronized"
        }
    } do={
        :set failed true
        :log error ("nasnet-panel: clock readiness failed: " . $err)
    }

    :if ($failed) do={
        :log error "nasnet-panel: BASELINE FAILED; inspect preceding errors, then rerun; installation must not continue"
        :error "nasnet-panel baseline preparation failed"
    }

    # Final phase: default LAN migration. NASnet Connect already has the target LAN.
    # Preserve the existing bridge/MAC/ports and old gateway as a transition alias.
    # A new DHCP pool moves renewing clients to 192.168.10.0/24.
    :local oldGateway [/ip/address find address="192.168.88.1/24"]
    :if ([:len $oldGateway] = 0) do={
        :if ([:len [/ip/address find address="192.168.10.1/24" disabled=no]] = 0) do={
            :error "nasnet-panel: neither supported LAN gateway exists; LAN migration not attempted"
        }
        :log info "nasnet-panel: target LAN gateway already exists; existing LAN configuration preserved"
    } else={
        :if ([:len $oldGateway] != 1) do={ :error "nasnet-panel: ambiguous default gateway" }
        :local lanIface [/ip/address get $oldGateway interface]
        :if ([:len [/interface/bridge find name=$lanIface]] != 1) do={
            :error "nasnet-panel: default LAN gateway is not on a bridge"
        }
        :local dhcpID [/ip/dhcp-server find interface=$lanIface]
        :if ([:len $dhcpID] != 1) do={ :error "nasnet-panel: expected one DHCP server on default LAN" }
        :if ([/ip/dhcp-server get $dhcpID disabled]) do={ :error "nasnet-panel: default LAN DHCP server is disabled" }
        :local dhcpName [/ip/dhcp-server get $dhcpID name]
        :local newGateway [/ip/address find address="192.168.10.1/24"]
        :foreach a in=[/ip/address find network=192.168.10.0] do={
            :if ([/ip/address get $a interface] != $lanIface) do={
                :error "nasnet-panel: target LAN network already belongs to a different interface"
            }
        }
        :if ([:len $newGateway] > 1) do={ :error "nasnet-panel: duplicate target gateway addresses" }
        # Static reservations need an explicit mapping, not silent reassignment.
        :foreach leaseID in=[/ip/dhcp-server/lease find dynamic=no] do={
            :local leaseServer [/ip/dhcp-server/lease get $leaseID server]
            :if (($leaseServer = $dhcpName) || ($leaseServer = "all")) do={
                :error "nasnet-panel: static DHCP reservations require migration before default LAN cutover"
            }
        }
        :local poolName "nasnet-panel-baseline-lan-pool"
        :local poolID [/ip/pool find name=$poolName]
        :if ([:len $poolID] > 0) do={
            :if ([:tostr [/ip/pool get $poolID ranges]] != "192.168.10.2-192.168.10.254") do={
                :error "nasnet-panel: reserved migration pool has unexpected ranges"
            }
        }
        :local targetNetwork [/ip/dhcp-server/network find address="192.168.10.0/24"]
        :if ([:len $targetNetwork] > 1) do={ :error "nasnet-panel: duplicate target DHCP networks" }
        :local needsReconnect false
        :if ([/ip/dhcp-server get $dhcpID address-pool] != $poolName) do={ :set needsReconnect true }
        :if ([:len $newGateway] > 0) do={
            :if ([/ip/address get $newGateway comment] = "nasnet-panel: LAN migration pending") do={ :set needsReconnect true }
        } else={
            :set needsReconnect true
        }

        # Prepare the new gateway and DHCP options before switching the active pool.
        :if ([:len $newGateway] = 0) do={
            /ip/address add address=192.168.10.1/24 network=192.168.10.0 interface=$lanIface comment="nasnet-panel: LAN migration pending"
            :set newGateway [/ip/address find address="192.168.10.1/24"]
        }
        /ip/address set $newGateway disabled=no
        :if ([:len $poolID] = 0) do={
            /ip/pool add name=$poolName ranges=192.168.10.2-192.168.10.254
        }
        :if ([:len $targetNetwork] = 0) do={
            /ip/dhcp-server/network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1 comment="nasnet-panel: migrated LAN"
        } else={
            /ip/dhcp-server/network set $targetNetwork gateway=192.168.10.1 dns-server=192.168.10.1
        }
        /ip/dns set allow-remote-requests=yes
        :if ($needsReconnect) do={
            /ip/address set $newGateway comment="nasnet-panel: LAN migration pending"
        }
        /ip/dhcp-server set $dhcpID address-pool=$poolName authoritative=yes lease-time=5m
        # Remove old dynamic bindings only after the new pool is active.
        # This alone does not force clients to renew; the final link cycle helps.
        :foreach leaseID in=[/ip/dhcp-server/lease find server=$dhcpName dynamic=yes] do={
            :local leaseIP [/ip/dhcp-server/lease get $leaseID address]
            :if ($leaseIP in 192.168.88.0/24) do={ /ip/dhcp-server/lease remove $leaseID }
        }
        /ip/dns/static set [find name="router.lan" address=192.168.88.1] address=192.168.10.1
        :if ([/ip/dhcp-server get $dhcpID address-pool] != $poolName) do={
            :error "nasnet-panel: DHCP pool switch verification failed"
        }

        # Last disruptive operation. Only currently enabled members of this LAN.
        # Do not touch WAN interfaces, move ports, or delete the original bridge.
        :if ($needsReconnect) do={
            :log warning "nasnet-panel: LAN moving to 192.168.10.1; clients will briefly disconnect and renew DHCP"
            :foreach portID in=[/interface/bridge/port find bridge=$lanIface disabled=no] do={
                :local portName [/interface/bridge/port get $portID interface]
                :local ifaceID [/interface find name=$portName]
                :if (![/interface get $ifaceID disabled]) do={
                    :onerror cycleError in={
                        /interface disable $ifaceID
                        :delay 1s
                        /interface enable $ifaceID
                    } do={
                        # Always attempt to restore a port disabled by this script.
                        /interface enable $ifaceID
                        :error ("nasnet-panel: LAN reconnect failed on " . $portName . ": " . $cycleError)
                    }
                }
            }
            /ip/address set $newGateway comment="nasnet-panel: migrated LAN"
        }
        :log info "nasnet-panel: DHCP now assigns 192.168.10.x; 192.168.88.1 retained temporarily for clients still renewing"
    }
    :log info "nasnet-panel: BASELINE READY; LAN gateway is 192.168.10.1; container installation and application checks are still required"
    :put "NasNet baseline ready. Reconnect at 192.168.10.1; clients still on 192.168.88.x may need DHCP renewal."
}

