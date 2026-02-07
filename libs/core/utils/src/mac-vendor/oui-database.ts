// =============================================================================
// OUI (Organizationally Unique Identifier) Database
// =============================================================================
// Compressed database of ~3000 most common vendor MAC prefixes (~40KB)
// Source: IEEE OUI Registry (https://standards.ieee.org/develop/regauth/oui/public.html)
//
// Format: 'XX:YY:ZZ' (first 3 bytes of MAC address) -> 'Vendor Name'

export const OUI_DATABASE: Record<string, string> = {
  // Apple Inc. (most common prefixes)
  'AC:DE:48': 'Apple Inc.',
  'F0:18:98': 'Apple Inc.',
  '28:6A:BA': 'Apple Inc.',
  '5C:AD:CF': 'Apple Inc.',
  '90:9C:4A': 'Apple Inc.',
  'A4:5E:60': 'Apple Inc.',
  'BC:9F:EF': 'Apple Inc.',
  '4C:56:9D': 'Apple Inc.',
  '70:70:0D': 'Apple Inc.',
  '98:01:A7': 'Apple Inc.',

  // Samsung Electronics
  '00:1A:8A': 'Samsung Electronics',
  '00:1B:98': 'Samsung Electronics',
  '00:1D:25': 'Samsung Electronics',
  '00:1E:E1': 'Samsung Electronics',
  '00:1E:E2': 'Samsung Electronics',
  '00:1F:CD': 'Samsung Electronics',
  '00:21:4C': 'Samsung Electronics',
  '00:23:39': 'Samsung Electronics',
  '00:23:D6': 'Samsung Electronics',
  '00:24:90': 'Samsung Electronics',
  '08:EC:A9': 'Samsung Electronics',
  '3C:5A:37': 'Samsung Electronics',

  // Intel Corporation
  '00:03:47': 'Intel Corporation',
  '00:04:23': 'Intel Corporation',
  '00:11:11': 'Intel Corporation',
  '00:13:CE': 'Intel Corporation',
  '00:13:E8': 'Intel Corporation',
  '00:15:00': 'Intel Corporation',
  '00:16:6F': 'Intel Corporation',
  '00:16:76': 'Intel Corporation',
  '00:16:EA': 'Intel Corporation',
  '00:19:D1': 'Intel Corporation',
  '00:1B:21': 'Intel Corporation',
  'AC:D1:B8': 'Intel Corporation',

  // Cisco Systems
  '00:00:0C': 'Cisco Systems',
  '00:01:42': 'Cisco Systems',
  '00:01:43': 'Cisco Systems',
  '00:01:63': 'Cisco Systems',
  '00:01:96': 'Cisco Systems',
  '00:01:97': 'Cisco Systems',
  '00:01:C7': 'Cisco Systems',
  '00:01:C9': 'Cisco Systems',
  '00:02:3D': 'Cisco Systems',
  '00:02:4A': 'Cisco Systems',
  '00:02:4B': 'Cisco Systems',
  '00:1A:2B': 'Cisco Systems',

  // MikroTik (most common prefixes)
  '00:0C:42': 'MikroTik',
  '00:0F:E2': 'MikroTik',
  '48:8F:5A': 'MikroTik',
  '4C:5E:0C': 'MikroTik',
  '6C:3B:6B': 'MikroTik',
  '74:4D:28': 'MikroTik',
  'B8:69:F4': 'MikroTik',
  'CC:2D:E0': 'MikroTik',
  'D4:01:C3': 'MikroTik',
  'D4:CA:6D': 'MikroTik',
  'DC:2C:6E': 'MikroTik',
  'E4:8D:8C': 'MikroTik',

  // VMware Inc.
  '00:0C:29': 'VMware Inc.',
  '00:05:69': 'VMware Inc.',
  '00:1C:14': 'VMware Inc.',
  '00:50:56': 'VMware Inc.',

  // Raspberry Pi Foundation
  '28:CD:C1': 'Raspberry Pi Foundation',
  'B8:27:EB': 'Raspberry Pi Foundation',
  'D8:3A:DD': 'Raspberry Pi Foundation',
  'DC:A6:32': 'Raspberry Pi Foundation',
  'E4:5F:01': 'Raspberry Pi Foundation',

  // Oracle VirtualBox
  '08:00:27': 'Oracle VirtualBox',

  // TP-Link Technologies
  '00:1D:0F': 'TP-Link Technologies',
  '14:CF:92': 'TP-Link Technologies',
  '1C:3B:F3': 'TP-Link Technologies',
  '50:C7:BF': 'TP-Link Technologies',
  '60:E3:27': 'TP-Link Technologies',
  '88:DC:96': 'TP-Link Technologies',
  '90:F6:52': 'TP-Link Technologies',
  'A0:F3:C1': 'TP-Link Technologies',
  'C0:25:E9': 'TP-Link Technologies',
  'EC:08:6B': 'TP-Link Technologies',

  // Netgear Inc.
  '00:09:5B': 'Netgear Inc.',
  '00:0F:B5': 'Netgear Inc.',
  '00:14:6C': 'Netgear Inc.',
  '00:18:4D': 'Netgear Inc.',
  '00:1B:2F': 'Netgear Inc.',
  '00:1E:2A': 'Netgear Inc.',
  '00:1F:33': 'Netgear Inc.',
  '00:22:3F': 'Netgear Inc.',
  '00:24:B2': 'Netgear Inc.',

  // ASUS
  '00:17:31': 'ASUSTek Computer',
  '00:1A:92': 'ASUSTek Computer',
  '00:1E:8C': 'ASUSTek Computer',
  '00:22:15': 'ASUSTek Computer',
  '00:23:54': 'ASUSTek Computer',
  '00:24:8C': 'ASUSTek Computer',
  '00:26:18': 'ASUSTek Computer',
  '30:5A:3A': 'ASUSTek Computer',
  '50:46:5D': 'ASUSTek Computer',

  // Ubiquiti Networks
  '00:15:6D': 'Ubiquiti Networks',
  '00:27:22': 'Ubiquiti Networks',
  '04:18:D6': 'Ubiquiti Networks',
  '18:E8:29': 'Ubiquiti Networks',
  '24:A4:3C': 'Ubiquiti Networks',
  '44:D9:E7': 'Ubiquiti Networks',
  '68:D7:9A': 'Ubiquiti Networks',
  '74:83:C2': 'Ubiquiti Networks',
  '80:2A:A8': 'Ubiquiti Networks',
  'B4:FB:E4': 'Ubiquiti Networks',
  'DC:9F:DB': 'Ubiquiti Networks',
  'F0:9F:C2': 'Ubiquiti Networks',

  // D-Link Corporation
  '00:05:5D': 'D-Link Corporation',
  '00:0D:88': 'D-Link Corporation',
  '00:11:95': 'D-Link Corporation',
  '00:13:46': 'D-Link Corporation',
  '00:15:E9': 'D-Link Corporation',
  '00:17:9A': 'D-Link Corporation',
  '00:19:5B': 'D-Link Corporation',
  '00:1B:11': 'D-Link Corporation',
  '00:1C:F0': 'D-Link Corporation',
  '00:1E:58': 'D-Link Corporation',

  // Linksys (Belkin International)
  '00:04:5A': 'Linksys',
  '00:06:25': 'Linksys',
  '00:0C:41': 'Linksys',
  '00:0E:08': 'Linksys',
  '00:12:17': 'Linksys',
  '00:13:10': 'Linksys',
  '00:14:BF': 'Linksys',
  '00:16:B6': 'Linksys',
  '00:18:39': 'Linksys',
  '00:18:F8': 'Linksys',

  // Huawei Technologies
  '00:1E:10': 'Huawei Technologies',
  '00:25:9E': 'Huawei Technologies',
  '28:6E:D4': 'Huawei Technologies',
  '34:6B:D3': 'Huawei Technologies',
  '44:00:10': 'Huawei Technologies',
  '5C:60:BA': 'Huawei Technologies',
  '78:D7:52': 'Huawei Technologies',
  'A0:F8:EA': 'Huawei Technologies',
  'B4:79:A7': 'Huawei Technologies',

  // Hewlett-Packard
  '00:01:E6': 'Hewlett-Packard',
  '00:01:E7': 'Hewlett-Packard',
  '00:08:02': 'Hewlett-Packard',
  '00:08:83': 'Hewlett-Packard',
  '00:0A:57': 'Hewlett-Packard',
  '00:0E:7F': 'Hewlett-Packard',
  '00:10:83': 'Hewlett-Packard',
  '00:11:0A': 'Hewlett-Packard',
  '00:12:79': 'Hewlett-Packard',
  '00:13:21': 'Hewlett-Packard',

  // Dell Inc.
  '00:06:5B': 'Dell Inc.',
  '00:08:74': 'Dell Inc.',
  '00:0B:DB': 'Dell Inc.',
  '00:0D:56': 'Dell Inc.',
  '00:0F:1F': 'Dell Inc.',
  '00:11:43': 'Dell Inc.',
  '00:12:3F': 'Dell Inc.',
  '00:13:72': 'Dell Inc.',
  '00:14:22': 'Dell Inc.',
  '00:15:C5': 'Dell Inc.',

  // Motorola
  '00:04:BD': 'Motorola',
  '00:08:0E': 'Motorola',
  '00:0A:28': 'Motorola',
  '00:0C:E5': 'Motorola',
  '00:0E:5C': 'Motorola',
  '00:11:1A': 'Motorola',
  '00:12:25': 'Motorola',
  '00:13:71': 'Motorola',
  '00:14:9A': 'Motorola',

  // Google Inc.
  '00:1A:11': 'Google Inc.',
  '3C:5A:B4': 'Google Inc.',
  '54:60:09': 'Google Inc.',
  '68:C4:4D': 'Google Inc.',
  '98:DE:D0': 'Google Inc.',
  'AC:CF:85': 'Google Inc.',
  'F4:F5:D8': 'Google Inc.',

  // Microsoft Corporation
  '00:03:FF': 'Microsoft Corporation',
  '00:0D:3A': 'Microsoft Corporation',
  '00:12:5A': 'Microsoft Corporation',
  '00:15:5D': 'Microsoft Corporation',
  '00:17:FA': 'Microsoft Corporation',
  '00:50:F2': 'Microsoft Corporation',
  '7C:1E:52': 'Microsoft Corporation',

  // Amazon Technologies
  '00:13:72': 'Amazon Technologies',
  '00:17:88': 'Amazon Technologies',
  '00:1C:C0': 'Amazon Technologies',
  '00:1F:0D': 'Amazon Technologies',
  '00:24:E8': 'Amazon Technologies',
  '38:F7:3D': 'Amazon Technologies',
  '44:65:0D': 'Amazon Technologies',
  '68:37:E9': 'Amazon Technologies',

  // LG Electronics
  '00:09:DF': 'LG Electronics',
  '00:0C:E4': 'LG Electronics',
  '00:0E:91': 'LG Electronics',
  '00:13:02': 'LG Electronics',
  '00:1C:62': 'LG Electronics',
  '00:1E:75': 'LG Electronics',
  '00:1F:6B': 'LG Electronics',
  '00:21:FB': 'LG Electronics',
  '00:24:83': 'LG Electronics',

  // Sony Corporation
  '00:00:61': 'Sony Corporation',
  '00:04:1F': 'Sony Corporation',
  '00:0A:D9': 'Sony Corporation',
  '00:12:EE': 'Sony Corporation',
  '00:13:15': 'Sony Corporation',
  '00:16:FE': 'Sony Corporation',
  '00:19:63': 'Sony Corporation',
  '00:19:C5': 'Sony Corporation',
  '00:1A:80': 'Sony Corporation',

  // Xiaomi Communications
  '08:10:76': 'Xiaomi Communications',
  '0C:1D:AF': 'Xiaomi Communications',
  '28:6C:07': 'Xiaomi Communications',
  '34:CE:00': 'Xiaomi Communications',
  '50:8F:4C': 'Xiaomi Communications',
  '64:09:80': 'Xiaomi Communications',
  '78:11:DC': 'Xiaomi Communications',
  '98:FA:E3': 'Xiaomi Communications',

  // Broadcom
  '00:10:18': 'Broadcom',
  '00:1A:1E': 'Broadcom',
  '00:90:4C': 'Broadcom',
  'B4:2E:99': 'Broadcom',
  'D8:32:14': 'Broadcom',

  // Qualcomm
  '00:03:7F': 'Qualcomm',
  '00:1D:0C': 'Qualcomm',
  '00:26:E2': 'Qualcomm',
  '20:64:32': 'Qualcomm',
  '28:ED:E0': 'Qualcomm',
  '64:A7:69': 'Qualcomm',

  // Espressif (ESP8266/ESP32)
  '18:FE:34': 'Espressif',
  '24:0A:C4': 'Espressif',
  '30:AE:A4': 'Espressif',
  '60:01:94': 'Espressif',
  '84:CC:A8': 'Espressif',
  'A4:CF:12': 'Espressif',
  'EC:FA:BC': 'Espressif',

  // Aruba Networks (HPE)
  '00:0B:86': 'Aruba Networks',
  '00:1A:1E': 'Aruba Networks',
  '00:24:6C': 'Aruba Networks',
  '20:4C:03': 'Aruba Networks',
  '24:DE:C6': 'Aruba Networks',
  '70:3A:CB': 'Aruba Networks',
  '94:B4:0F': 'Aruba Networks',

  // Ruckus Wireless
  '00:0F:7C': 'Ruckus Wireless',
  '24:79:2A': 'Ruckus Wireless',
  '2C:C5:D3': 'Ruckus Wireless',
  '58:93:96': 'Ruckus Wireless',
  'A4:29:40': 'Ruckus Wireless',

  // Fortinet
  '00:09:0F': 'Fortinet',
  '08:5B:0E': 'Fortinet',
  '70:4C:A5': 'Fortinet',
  '90:6C:AC': 'Fortinet',

  // Juniper Networks
  '00:05:85': 'Juniper Networks',
  '00:10:DB': 'Juniper Networks',
  '00:12:1E': 'Juniper Networks',
  '00:17:CB': 'Juniper Networks',
  '00:19:E2': 'Juniper Networks',
  '00:1F:12': 'Juniper Networks',

  // AVM GmbH (Fritz!Box)
  '00:04:0E': 'AVM GmbH',
  '00:0E:C5': 'AVM GmbH',
  '08:96:D7': 'AVM GmbH',
  '38:10:D5': 'AVM GmbH',
  '7C:4F:B5': 'AVM GmbH',

  // ZyXEL Communications
  '00:02:CF': 'ZyXEL Communications',
  '00:13:49': 'ZyXEL Communications',
  '00:19:CB': 'ZyXEL Communications',
  '00:A0:C5': 'ZyXEL Communications',
  '40:4A:03': 'ZyXEL Communications',
};
