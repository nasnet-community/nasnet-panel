/ip firewall nat add chain=dstnat action=dst-nat protocol=tcp dst-port=18091 in-interface-list=Domestic-WAN to-addresses=192.168.50.21 to-ports=8080 comment="plugin-lab-broken-image"
/ip firewall filter add chain=forward action=accept protocol=tcp dst-address=192.168.50.21 dst-port=8080 in-interface-list=Domestic-WAN comment="plugin-lab-broken-image"
