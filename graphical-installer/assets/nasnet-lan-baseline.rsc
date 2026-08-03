:if ([:len [/interface/bridge find name="LANBridgeSplit"]] > 0) do={
  :log info "nasnet-panel: LANBridgeSplit already exists, skipping LAN baseline"
} else={
  :log info "nasnet-panel: applying LAN baseline (192.168.10.0/24)"
  :local wanIfaces [:toarray ""]
  :foreach c in=[/ip/dhcp-client find] do={
    :set wanIfaces ($wanIfaces , [/ip/dhcp-client get $c interface])
  }
  :do {
    :foreach p in=[/interface/pppoe-client find] do={
      :set wanIfaces ($wanIfaces , [/interface/pppoe-client get $p interface])
    }
  } on-error={}
  :local isWanIf do={
    :foreach w in=$2 do={
      :if ($1 = $w) do={ :return true }
    }
    :return false
  }
  :foreach w in=$wanIfaces do={
    :if ([:len [/interface/ethernet find name=$w]] = 0) do={
      :log warning ("nasnet-panel: WAN uplink " . $w . " is not a plain ethernet (VLAN/bridge); its parent may be bridged into the LAN - review manually")
    }
  }
  /interface/bridge add name="LANBridgeSplit" comment="Split"
  /ip/address add address="192.168.10.1/24" interface="LANBridgeSplit" network="192.168.10.0" comment="Split"
  :if ([:len [/ip/pool find name="DHCP-pool-Split"]] = 0) do={
    /ip/pool add name="DHCP-pool-Split" ranges="192.168.10.2-192.168.10.254" comment="Split"
  }
  :if ([:len [/ip/dhcp-server find name="DHCP-Split"]] = 0) do={
    /ip/dhcp-server add name="DHCP-Split" interface="LANBridgeSplit" address-pool="DHCP-pool-Split" comment="Split"
  }
  :if ([:len [/ip/dhcp-server/network find comment="Split"]] = 0) do={
    /ip/dhcp-server/network add address="192.168.10.0/24" gateway="192.168.10.1" dns-server="192.168.10.1" comment="Split"
  }
  :do { /interface/macvlan remove [find] } on-error={}
  :foreach e in=[/interface/ethernet find] do={
    :local en [/interface/ethernet get $e name]
    :if (![$isWanIf $en $wanIfaces]) do={
      :local blocked false
      :foreach pid in=[/interface/bridge/port find interface=$en] do={
        :local pbr [/interface/bridge/port get $pid bridge]
        :if ($pbr = "containers" || $pbr = "LANBridgeSplit" || [$isWanIf $pbr $wanIfaces]) do={
          :set blocked true
        } else={
          :do { /interface/bridge/port remove $pid } on-error={}
        }
      }
      :if (!$blocked) do={
        :do { /interface/bridge/port add bridge="LANBridgeSplit" interface=$en comment="Split" } on-error={
          :log warning ("nasnet-panel: could not add " . $en . " to LANBridgeSplit")
        }
      }
    }
  }
  :do {
    :foreach w in=[/interface/wifi find] do={
      :local wn [/interface/wifi get $w name]
      :local mode ""
      :do { :set mode [/interface/wifi get $w configuration.mode] } on-error={}
      :if ($mode != "station" && $mode != "station-bridge" && ![$isWanIf $wn $wanIfaces]) do={
        :local blocked false
        :foreach pid in=[/interface/bridge/port find interface=$wn] do={
          :local pbr [/interface/bridge/port get $pid bridge]
          :if ($pbr = "containers" || $pbr = "LANBridgeSplit" || [$isWanIf $pbr $wanIfaces]) do={
            :set blocked true
          } else={
            :do { /interface/bridge/port remove $pid } on-error={}
          }
        }
        :if (!$blocked) do={
          :do { /interface/bridge/port add bridge="LANBridgeSplit" interface=$wn comment="Split" } on-error={
            :log warning ("nasnet-panel: could not add " . $wn . " to LANBridgeSplit")
          }
        }
      }
    }
  } on-error={}
  :foreach b in=[/interface/bridge find] do={
    :local bn [/interface/bridge get $b name]
    :if ($bn != "containers" && $bn != "LANBridgeSplit" && ![$isWanIf $bn $wanIfaces]) do={
      :do { /ip/dhcp-server remove [find interface=$bn] } on-error={}
      :do { /ip/address remove [find interface=$bn] } on-error={}
      :do { /interface/bridge/port remove [find bridge=$bn] } on-error={}
      :do { /interface/bridge remove $b } on-error={}
    }
  }
  :if ([:len [/interface/bridge/port find bridge="LANBridgeSplit"]] = 0) do={
    :log warning "nasnet-panel: LANBridgeSplit has no member ports (single-bridge/AP-mode router); reach the panel at the router's current address until the wizard runs"
  }
  :log info "nasnet-panel: LAN baseline applied, gateway is 192.168.10.1"
}
