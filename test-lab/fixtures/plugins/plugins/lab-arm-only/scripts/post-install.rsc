/ip firewall nat add chain=dstnat action=dst-nat protocol=tcp dst-port=18093 in-interface-list=Domestic-WAN to-addresses=192.168.50.23 to-ports=8080 comment="plugin-lab-arm-only"
/ip firewall filter add chain=forward action=accept protocol=tcp dst-address=192.168.50.23 dst-port=8080 in-interface-list=Domestic-WAN comment="plugin-lab-arm-only"
