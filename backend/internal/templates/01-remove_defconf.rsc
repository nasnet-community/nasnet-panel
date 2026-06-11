:if ($action = "revert") do={
 :if (!($keepUsers = "yes")) do={
   /user set admin password=""
   :delay 0.5
   /user expire-password admin
 }
 /disk settings
 set auto-smb-sharing=no auto-media-sharing=no auto-media-interface=none
 /ip firewall filter remove [find comment~"defconf"]
 /ipv6 firewall filter remove [find comment~"defconf"]
 /ipv6 firewall address-list remove [find comment~"defconf"]
 /ip firewall nat remove [find comment~"defconf"]
 /interface list member remove [find comment~"defconf"]
 /interface detect-internet set detect-interface-list=none
 /interface detect-internet set lan-interface-list=none
 /interface detect-internet set wan-interface-list=none
 /interface detect-internet set internet-interface-list=none
 /interface list remove [find comment~"defconf"]
 /tool mac-server set allowed-interface-list=all
 /tool mac-server mac-winbox set allowed-interface-list=all
 /ip neighbor discovery-settings set discover-interface-list=!dynamic
   :local o [/ip dhcp-server network find comment="defconf"]
   :if ([:len $o] != 0) do={ /ip dhcp-server network remove $o }
   :local o [/ip dhcp-server find name="defconf" !disabled]
   :if ([:len $o] != 0) do={ /ip dhcp-server remove $o }
   /ip pool {
     :local o [find name="default-dhcp" ranges=192.168.88.10-192.168.88.254]
     :if ([:len $o] != 0) do={ remove $o }
   }
   :local o [/ip dhcp-client find comment="defconf"]
   :if ([:len $o] != 0) do={ /ip dhcp-client remove $o }
 /ip dns {
   set allow-remote-requests=no
   :local o [static find comment="defconf"]
   :if ([:len $o] != 0) do={ static remove $o }
 }
 /ip address {
   :local o [find comment="defconf"]
   :if ([:len $o] != 0) do={ remove $o }
 }
 :foreach iface in=[/interface ethernet find] do={
   /interface ethernet set $iface name=[get $iface default-name]
 }
 /interface bridge port remove [find comment="defconf"]
 /interface bridge remove [find comment="defconf"]
 /interface bonding remove [find comment="defconf"]
 /interface wifi reset wifi1
 /interface wifi reset wifi2
}
:log info Defconf_script_finished;
:set defconfMode;
:set ssid;