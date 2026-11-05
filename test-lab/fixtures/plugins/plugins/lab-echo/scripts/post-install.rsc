/ip firewall nat add chain=dstnat action=dst-nat protocol=tcp dst-port=18090 in-interface-list=Domestic-WAN to-addresses=192.168.50.20 to-ports=8080 comment="plugin-lab-echo"
/ip firewall filter add chain=forward action=accept protocol=tcp dst-address=192.168.50.20 dst-port=8080 in-interface-list=Domestic-WAN comment="plugin-lab-echo"
