# CHR Initialization Script for Testing
# This script configures the CHR container with a predictable state for testing.
#
# Usage: This script is automatically executed when the CHR container starts.
# It ensures a clean, consistent state for each test run.
#
# Configuration:
# - System identity: CHR-Test
# - Admin password: testpassword (DO NOT use in production!)
# - API enabled on port 8728
# - API-SSL enabled on port 8729
# - SSH enabled on port 22
# - Web interface enabled on port 80
#
# Network Configuration:
# - Bridge: bridge-test (all interfaces)
# - DHCP Pool: 192.168.88.100-192.168.88.200
# - Gateway: 192.168.88.1/24

# Set system identity
/system identity set name="CHR-Test"

# Configure admin user for testing (DO NOT use in production!)
/user set admin password="testpassword"

# Enable API service (plain)
/ip service set api port=8728 disabled=no

# Enable API-SSL service
/ip service set api-ssl port=8729 disabled=no

# Enable SSH service
/ip service set ssh port=22 disabled=no

# Enable Winbox service
/ip service set winbox port=8291 disabled=no

# Enable HTTP service
/ip service set www port=80 disabled=no

# Disable services we don't need for testing
/ip service set telnet disabled=yes
/ip service set ftp disabled=yes

# Create test bridge
/interface bridge add name=bridge-test comment="Test bridge"

# Add ether1 to bridge
/interface bridge port add bridge=bridge-test interface=ether1

# Configure IP address
/ip address add address=192.168.88.1/24 interface=bridge-test comment="Test network"

# Configure DHCP pool
/ip pool add name=dhcp-pool-test ranges=192.168.88.100-192.168.88.200

# Configure DHCP server
/ip dhcp-server add address-pool=dhcp-pool-test interface=bridge-test name=dhcp-test disabled=no

# Configure DHCP network
/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=8.8.8.8,8.8.4.4

# Configure DNS
/ip dns set servers=8.8.8.8,8.8.4.4 allow-remote-requests=yes

# Create test firewall rules
/ip firewall filter add chain=input action=accept comment="Accept all for testing" disabled=no

# Create test user for API access
/user add name=testuser password="testpassword" group=full comment="Test user for integration tests"

# Log that initialization is complete
/log info message="CHR initialization script completed successfully"
