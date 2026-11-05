/ip firewall nat add chain=dstnat action=dst-nat protocol=tcp dst-port=18094 in-interface-list=Domestic-WAN to-addresses=192.168.50.24 to-ports=8080 comment="plugin-lab-amd64"
/ip firewall filter add chain=forward action=accept protocol=tcp dst-address=192.168.50.24 dst-port=8080 in-interface-list=Domestic-WAN comment="plugin-lab-amd64"
