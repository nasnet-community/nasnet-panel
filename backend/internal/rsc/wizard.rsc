# Disable IPv6
/ipv6/settings set disable-ipv6=yes

# Configure system settings
/system ntp client set enabled=yes
/system ntp server set broadcast=yes enabled=yes manycast=yes multicast=yes
/system ntp client servers add address="pool.ntp.org"
/system ntp client servers add address="time.cloudflare.com"
/system ntp client servers add address="time.google.com"
/system package update set channel=stable
/system routerboard settings set auto-upgrade=yes

# Clear comments from all ether interfaces
/interface/ethernet set [find] comment=""

# Remove all MACVLAN interfaces
/interface/macvlan remove [find]

# Remove all static bindings for OVPN and L2TP
/interface/ovpn-server/remove [find]
/interface/l2tp-server/remove [find]

# Remove all DHCP clients
/ip/dhcp-client remove [find]

# Remove and recreate routing tables
/routing/table remove [find name=table-domestic]
/routing/table remove [find name=table-domestic-link]
/routing/table remove [find name=table-foreign]
/routing/table remove [find name=table-foreign-link]
/routing/table remove [find name=table-split]
/routing/table remove [find name=table-vpn]
/routing/table add name=table-domestic fib
/routing/table add name=table-domestic-link fib
/routing/table add name=table-foreign fib
/routing/table add name=table-foreign-link fib
/routing/table add name=table-split fib
/routing/table add name=table-vpn fib

# Configure routing rules
/routing/rule remove [find comment=rule-domestic]
/routing/rule remove [find comment=rule-foreign]
/routing/rule remove [find comment=rule-vpn]
/routing/rule remove [find comment=rule-foreign-link]
/routing/rule remove [find comment=rule-domestic-link]
/routing/rule add action=lookup-only-in-table disabled=no src-address="192.168.20.0/24" table="table-domestic" comment="rule-domestic"
/routing/rule add action=lookup-only-in-table disabled=no routing-mark="table-domestic" table="table-domestic" comment="rule-domestic"
/routing/rule add action=lookup-only-in-table disabled=no src-address="192.168.30.0/24" table="table-foreign" comment="rule-foreign"
/routing/rule add action=lookup-only-in-table disabled=no routing-mark="table-foreign" table="table-foreign" comment="rule-foreign"
/routing/rule add action=lookup-only-in-table disabled=no src-address="192.168.40.0/24" table="table-vpn" comment="rule-vpn"
/routing/rule add action=lookup-only-in-table disabled=no routing-mark="table-vpn" table="table-vpn" comment="rule-vpn"
/routing/rule add action=lookup-only-in-table disabled=no src-address="192.168.31.0/24" table="table-foreign-link" comment="rule-foreign-link"
/routing/rule add action=lookup-only-in-table disabled=no routing-mark="table-foreign-link" table="table-foreign-link" comment="rule-foreign-link"
/routing/rule add action=lookup-only-in-table disabled=no src-address="192.168.21.0/24" table="table-domestic-link" comment="rule-domestic-link"
/routing/rule add action=lookup-only-in-table disabled=no routing-mark="table-domestic-link" table="table-domestic-link" comment="rule-domestic-link"

/interface/bridge/port remove [find]
/interface/bridge remove [find]
/ip/address remove [find]
/ip/dhcp-server remove [find]
/ip/dhcp-server/network remove [find]

# Create bridges
/interface/bridge add name=bridge-ftah
/interface/bridge add name=bridge-domestic
/interface/bridge add name=bridge-domestic-link
/interface/bridge add name=bridge-foreign
/interface/bridge add name=bridge-foreign-link
/interface/bridge add name=bridge-split
/interface/bridge add name=bridge-vpn

# Assign IP addresses to bridges
/ip/address add address=192.168.10.1/24 interface=bridge-split
/ip/address add address=192.168.20.1/24 interface=bridge-domestic
/ip/address add address=192.168.21.1/24 interface=bridge-domestic-link
/ip/address add address=192.168.30.1/24 interface=bridge-foreign
/ip/address add address=192.168.31.1/24 interface=bridge-foreign-link
/ip/address add address=192.168.39.12/32 interface=bridge-ftah
/ip/address add address=192.168.40.1/24 interface=bridge-vpn

# Create IP pools for DHCP
/ip/pool remove [find]
/ip/pool add name=pool-split ranges=192.168.10.2-192.168.10.254
/ip/pool add name=pool-domestic ranges=192.168.20.2-192.168.20.254
/ip/pool add name=pool-domestic-link ranges=192.168.21.2-192.168.21.254
/ip/pool add name=pool-foreign ranges=192.168.30.2-192.168.30.254
/ip/pool add name=pool-foreign-link ranges=192.168.31.2-192.168.31.254
/ip/pool add name=pool-vpn ranges=192.168.40.2-192.168.40.254

# Create DHCP servers for bridges
/ip/dhcp-server add name=dhcp-split interface=bridge-split address-pool=pool-split disabled=no
/ip/dhcp-server add name=dhcp-domestic interface=bridge-domestic address-pool=pool-domestic disabled=no
/ip/dhcp-server add name=dhcp-domestic-link interface=bridge-domestic-link address-pool=pool-domestic-link disabled=no
/ip/dhcp-server add name=dhcp-foreign interface=bridge-foreign address-pool=pool-foreign disabled=no
/ip/dhcp-server add name=dhcp-foreign-link interface=bridge-foreign-link address-pool=pool-foreign-link disabled=no
/ip/dhcp-server add name=dhcp-vpn interface=bridge-vpn address-pool=pool-vpn disabled=no

# Create DHCP server networks
/ip/dhcp-server/network add address=192.168.10.0/24 gateway=192.168.10.1
/ip/dhcp-server/network add address=192.168.20.0/24 gateway=192.168.20.1
/ip/dhcp-server/network add address=192.168.21.0/24 gateway=192.168.21.1
/ip/dhcp-server/network add address=192.168.30.0/24 gateway=192.168.30.1
/ip/dhcp-server/network add address=192.168.31.0/24 gateway=192.168.31.1
/ip/dhcp-server/network add address=192.168.40.0/24 gateway=192.168.40.1

# Configure DNS settings
/ip/dns set allow-remote-requests=yes cache-size=20480KiB doh-max-concurrent-queries=\
    500 doh-max-server-connections=50 max-concurrent-queries=500 \
    max-concurrent-tcp-sessions=50 servers=\
    4.2.2.2,217.218.127.127,4.2.2.1 use-doh-server=https://8.8.8.8/dns-query

# Configure DNS forwarders
/ip/dns/forwarders remove [find]
/ip/dns/forwarders add dns-servers=4.2.2.2 name=dns-fw-vpn verify-doh-cert=no
/ip/dns/forwarders add dns-servers=217.218.127.127 name=dns-fw-domestic verify-doh-cert=no
/ip/dns/forwarders add dns-servers=4.2.2.1 name=dns-fw-foreign verify-doh-cert=no
/ip/dns/forwarders add dns-servers=4.2.2.2,217.218.127.127,4.2.2.1 name=dns-fw-general verify-doh-cert=no

# Configure DNS static entries
/ip/dns/static remove [find]
/ip/dns/static add comment="Forward .ir TLD queries via domestic DNS" forward-to=Domestic regexp="\\.ir" type=FWD
/ip/dns/static add address=8.8.8.8 comment=DOH-Domain-Static-Entry name=dns.google type=A
/ip/dns/static add address=8.8.4.4 comment=DOH-Domain-Static-Entry name=dns.google type=A
/ip/dns/static add address=2001:4860:4860::8888 comment=DOH-Domain-Static-Entry name=dns.google type=AAAA
/ip/dns/static add address=2001:4860:4860::8844 comment=DOH-Domain-Static-Entry name=dns.google type=AAAA
/ip/dns/static add address=1.1.1.1 comment=DOH-Domain-Static-Entry name=cloudflare-dns.com type=A
/ip/dns/static add address=1.0.0.1 comment=DOH-Domain-Static-Entry name=cloudflare-dns.com type=A
/ip/dns/static add address=2606:4700:4700::1111 comment=DOH-Domain-Static-Entry name=cloudflare-dns.com type=AAAA
/ip/dns/static add address=2606:4700:4700::1001 comment=DOH-Domain-Static-Entry name=cloudflare-dns.com type=AAAA
/ip/dns/static add address=45.90.28.140 comment=DOH-Domain-Static-Entry name=dns.nextdns.io type=A
/ip/dns/static add address=45.90.30.140 comment=DOH-Domain-Static-Entry name=dns.nextdns.io type=A
/ip/dns/static add address=2a07:a8c0::9d:4621 comment=DOH-Domain-Static-Entry name=dns.nextdns.io type=AAAA
/ip/dns/static add address=2a07:a8c1::9d:4621 comment=DOH-Domain-Static-Entry name=dns.nextdns.io type=AAAA
/ip/dns/static add comment="Forward s4i.co via Foreign DNS" forward-to=Foreign match-subdomain=yes name=s4i.co type=FWD
/ip/dns/static add comment="Forward starlink4iran.com via Foreign DNS" forward-to=Foreign match-subdomain=yes name=starlink4iran.com type=FWD
/ip/dns/static add comment="Forward curl.se via General DNS" forward-to=General name=curl.se type=FWD
/ip/dns/static add comment="Forward pki.goog via General DNS" forward-to=General name=pki.goog type=FWD
/ip/dns/static add comment="Forward cacerts.digicert.com via General DNS" forward-to=General name=cacerts.digicert.com type=FWD
/ip/dns/static add comment="Forward crl.d-trust.net via General DNS" forward-to=General name=crl.d-trust.net type=FWD
/ip/dns/static add comment="Forward d-trust.net via General DNS" forward-to=General name=d-trust.net type=FWD
/ip/dns/static add comment="Forward accv.es via General DNS" forward-to=General name=accv.es type=FWD
/ip/dns/static add comment="Forward crl.certigna.fr via General DNS" forward-to=General name=crl.certigna.fr type=FWD
/ip/dns/static add comment="Forward crl.dhimyotis.com via General DNS" forward-to=General name=crl.dhimyotis.com type=FWD
/ip/dns/static add comment="Forward crl.securetrust.com via General DNS" forward-to=General name=crl.securetrust.com type=FWD
/ip/dns/static add comment="Forward crl.comodoca.com via General DNS" forward-to=General name=crl.comodoca.com type=FWD
/ip/dns/static add comment="Forward pool.ntp.org via General DNS for NTP" forward-to=General name=pool.ntp.org type=FWD
/ip/dns/static add comment="Forward time.cloudflare.com via General DNS for NTP" forward-to=General name=time.cloudflare.com type=FWD
/ip/dns/static add comment="Forward time.google.com via General DNS for NTP" forward-to=General name=time.google.com type=FWD

# Configure firewall address lists
/ip/firewall/address-list remove [find list=addr-list-local]
/ip/firewall/address-list remove [find list=addr-list-split]
/ip/firewall/address-list remove [find list=addr-list-domestic]
/ip/firewall/address-list remove [find list=addr-list-domestic-link]
/ip/firewall/address-list remove [find list=addr-list-foreign]
/ip/firewall/address-list remove [find list=addr-list-foreign-link]
/ip/firewall/address-list add address=10.0.0.0/8 list=addr-list-local
/ip/firewall/address-list add address=172.16.0.0/12 list=addr-list-local
/ip/firewall/address-list add address=192.168.0.0/16 list=addr-list-local
/ip/firewall/address-list add address=192.168.10.0/24 list=addr-list-split
/ip/firewall/address-list add address=192.168.20.0/24 list=addr-list-domestic
/ip/firewall/address-list add address=192.168.21.0/24 list=addr-list-domestic-link
/ip/firewall/address-list add address=192.168.30.0/24 list=addr-list-foreign
/ip/firewall/address-list add address=192.168.31.0/24 list=addr-list-foreign-link


# Create MACVLAN interfaces
/interface/macvlan add name=macvlan-ether1-wan-foreign interface=ether1 on-up=":if (\$bound=1) do={\n:local gw (\$\"gateway-address\" . \"%\" . \$interface)\n:local routeCount [/ip route print count-only where comment=\"route-foreign\"]\n:if (\$routeCount > 0) do={\n    /ip route set [ find comment=\"route-foreign\" gateway!=\$gw ] gateway=\$gw\n}\n}"
/interface/macvlan add name=macvlan-ether2-wan-domestic interface=ether2 on-up=":if (\$bound=1) do={\n:local gw (\$\"gateway-address\" . \"%\" . \$interface)\n:local routeCount [/ip route print count-only where comment=\"route-domestic\"]\n:if (\$routeCount > 0) do={\n    /ip route set [ find comment=\"route-domestic\" gateway!=\$gw ] gateway=\$gw\n}\n}"


#set admin password
/user set admin password="1"