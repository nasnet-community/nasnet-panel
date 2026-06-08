# ============================================================================
# Script: VPNE Address List to Routing Rules Manager v7.0
# Description: Links domain entries with their dynamic IP entries and creates
#              routing rules using WanInterface from the parent domain entry
# Version: 7.0 - Uses format validation instead of :toip for IP detection
# ============================================================================
# Configuration variables
:local addressListName "VPNE"
:local scriptName "VPNE-Route-Manager"
:local debugMode false
:local quietMode false
:local tablePrefix "to-"
# Statistics counters
:local totalProcessed 0
:local rulesCreated 0
:local rulesUpdated 0
:local skipped 0
:local dynamicProcessed 0
:if (!$quietMode) do={
:log debug "[$scriptName] ===== Starting VPNE routing rules update v7.0 ====="
:log debug "[$scriptName] Using format-based IP validation to avoid domain resolution"
}
# ============================================================================
# Function to check if string is IP format (contains only digits and dots)
# ============================================================================
:local isIPFormat do={
:local addr $1
:local isIP true
# Check if it contains any letters (domains have letters, IPs don't)
:local letters "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
:for i from=0 to=([:len $addr] - 1) do={
:local char [:pick $addr $i ($i + 1)]
:if ([:find $letters $char] >= 0) do={
:set isIP false
}
}
# Additional check: must have at least one dot and start with a digit
:if ($isIP && [:find $addr "."] < 0) do={
:set isIP false
}
:return $isIP
}
# ============================================================================
# Step 1: First pass - collect domain entries with WanInterface
# ============================================================================
:local domainMap [:toarray ""]
:foreach entry in=[/ip firewall address-list find list=$addressListName dynamic=no] do={
# Get entry properties
:local addr [/ip firewall address-list get $entry address]
:local comment [/ip firewall address-list get $entry comment]
:if ($debugMode && !$quietMode) do={
:log debug "[$scriptName] Checking domain entry: $addr"
}
# Extract WanInterface from comment
:local wanInterface ""
:local wanStartPos [:find $comment "WanInterface:"]
:if ([:typeof $wanStartPos] != "nil") do={
:local wanValueStart ($wanStartPos + 13)
:local endpointMarkerPos [:find $comment " Endpoint:" $wanValueStart]
:if ([:typeof $endpointMarkerPos] != "nil") do={
:set wanInterface [:pick $comment $wanValueStart $endpointMarkerPos]
} else={
:local dashPos [:find $comment " -" $wanValueStart]
:if ([:typeof $dashPos] != "nil") do={
:set wanInterface [:pick $comment $wanValueStart $dashPos]
} else={
:set wanInterface [:pick $comment $wanValueStart]
}
}
:if ([:len $wanInterface] > 0) do={
# Store domain with its WanInterface
:set ($domainMap->$addr) $wanInterface
:if (!$quietMode) do={
:log debug "[$scriptName] Found domain $addr with WanInterface: $wanInterface"
}
}
}
}
# ============================================================================
# Step 2: Process all entries (both static and dynamic)
# ============================================================================
:foreach entry in=[/ip firewall address-list find list=$addressListName] do={
:set totalProcessed ($totalProcessed + 1)
# Get entry properties
:local addr [/ip firewall address-list get $entry address]
:local comment [/ip firewall address-list get $entry comment]
:local dynamic [/ip firewall address-list get $entry dynamic]
:if ($debugMode && !$quietMode) do={
:log debug "[$scriptName] Processing entry: $addr (dynamic=$dynamic, comment=$comment)"
}
# ========== NEW IP FORMAT VALIDATION ==========
:local isValidIP [$isIPFormat $addr]
:if (!$quietMode) do={
:log debug "[$scriptName] Format check for $addr: isIP=$isValidIP"
}
# If NOT a valid IP format, skip immediately
:if (!$isValidIP) do={
:if (!$quietMode) do={
:log debug "[$scriptName] >>> SKIPPING DOMAIN ENTRY: $addr (contains letters, not an IP)"
}
:set skipped ($skipped + 1)
} else={
# ===== ONLY PROCESS VALID IP ADDRESSES =====
:if (!$quietMode) do={
:log debug "[$scriptName] >>> VALID IP FORMAT: $addr - proceeding with processing"
}
:local wanInterface ""
:local endpoint ""
:if ($dynamic = true) do={
# For dynamic entries, the comment is usually the domain name
:if ([:typeof ($domainMap->$comment)] != "nil") do={
:set wanInterface ($domainMap->$comment)
:set endpoint $comment
:set dynamicProcessed ($dynamicProcessed + 1)
:if (!$quietMode) do={
:log debug "[$scriptName] Dynamic entry $addr linked to domain $comment with WanInterface: $wanInterface"
}
} else={
:if ($debugMode && !$quietMode) do={
:log debug "[$scriptName] Dynamic entry $addr has no matching domain entry, skipping"
}
:set skipped ($skipped + 1)
}
} else={
# For static IP entries, extract WanInterface from comment
:local wanStartPos [:find $comment "WanInterface:"]
:if ([:typeof $wanStartPos] != "nil") do={
:local wanValueStart ($wanStartPos + 13)
:local endpointMarkerPos [:find $comment " Endpoint:" $wanValueStart]
:if ([:typeof $endpointMarkerPos] != "nil") do={
:set wanInterface [:pick $comment $wanValueStart $endpointMarkerPos]
} else={
:local dashPos [:find $comment " -" $wanValueStart]
:if ([:typeof $dashPos] != "nil") do={
:set wanInterface [:pick $comment $wanValueStart $dashPos]
} else={
:set wanInterface [:pick $comment $wanValueStart]
}
}
# Extract endpoint
:local endpointStartPos [:find $comment "Endpoint:"]
:if ([:typeof $endpointStartPos] != "nil") do={
:local endpointValueStart ($endpointStartPos + 9)
:local dashMarkerPos [:find $comment " -" $endpointValueStart]
:if ([:typeof $dashMarkerPos] != "nil") do={
:set endpoint [:pick $comment $endpointValueStart $dashMarkerPos]
} else={
:set endpoint [:pick $comment $endpointValueStart]
}
} else={
:set endpoint $addr
}
}
}
# Create/Update routing rules only if we have a WanInterface
:if ([:len $wanInterface] > 0) do={
# Build routing table name
:local routingTable ($tablePrefix . $wanInterface)
:if ($debugMode && !$quietMode) do={
:log debug "[$scriptName] Using routing table: $routingTable for IP: $addr"
}
# Check if routing table exists
:local tableExists false
:do {
:local testTable [/routing table find name=$routingTable]
:if ([:len $testTable] > 0) do={
:set tableExists true
}
} on-error={
:set tableExists false
}
:if (!$tableExists) do={
:if (!$quietMode) do={
:log error "[$scriptName] Routing table '$routingTable' does not exist, skipping $addr"
}
:set skipped ($skipped + 1)
} else={
:local dstAddress $addr
:local ruleComment "VPNE-Resolved: $endpoint"
:if ($debugMode && !$quietMode) do={
:log debug "[$scriptName] Preparing rule: dst=$dstAddress table=$routingTable"
}
# Check if routing rule already exists
:local existingRule [/routing rule find dst-address=$dstAddress table=$routingTable]
:if ([:len $existingRule] > 0) do={
# Rule exists - verify configuration
:local ruleID [:pick $existingRule 0]
:local currentAction [/routing rule get $ruleID action]
:local currentDisabled [/routing rule get $ruleID disabled]
:local currentComment [/routing rule get $ruleID comment]
:local needsUpdate false
:if ($currentAction != "lookup-only-in-table") do={
:set needsUpdate true
}
:if ($currentDisabled = true) do={
:set needsUpdate true
}
:if ($currentComment != $ruleComment) do={
:set needsUpdate true
}
:if ($needsUpdate) do={
:do {
/routing rule set $ruleID \
action=lookup-only-in-table \
disabled=no \
comment=$ruleComment
:if (!$quietMode) do={
:log debug "[$scriptName] Updated routing rule for $dstAddress in table $routingTable"
}
:set rulesUpdated ($rulesUpdated + 1)
} on-error={
:if (!$quietMode) do={
:log error "[$scriptName] Failed to update routing rule for $dstAddress"
}
}
} else={
:if ($debugMode && !$quietMode) do={
:log debug "[$scriptName] Routing rule for $dstAddress in table $routingTable already correct"
}
}
} else={
# Rule doesn't exist - create new one
:do {
/routing rule add \
dst-address=$dstAddress \
action=lookup-only-in-table \
table=$routingTable \
disabled=no \
comment=$ruleComment
:if (!$quietMode) do={
:log debug "[$scriptName] Created routing rule: dst=$dstAddress table=$routingTable"
}
:set rulesCreated ($rulesCreated + 1)
} on-error={
:if (!$quietMode) do={
:log error "[$scriptName] Failed to create routing rule for $dstAddress in table $routingTable"
}
}
}
}
}
}
}
# ============================================================================
# Step 4: Clean up orphaned routing rules
# ============================================================================
:local orphansRemoved 0
:foreach rule in=[/routing rule find comment~"VPNE-Resolved:"] do={
:local ruleDst [/routing rule get $rule dst-address]
:local ruleComment [/routing rule get $rule comment]
# The IP is now stored without /32
:local ruleIP $ruleDst
# Check if this IP exists in current address list
:local found false
:foreach entry in=[/ip firewall address-list find list=$addressListName] do={
:local entryAddr [/ip firewall address-list get $entry address]
:if ($entryAddr = $ruleIP) do={
:set found true
}
}
:if (!$found) do={
:do {
/routing rule remove $rule
:set orphansRemoved ($orphansRemoved + 1)
:if (!$quietMode) do={
:log debug "[$scriptName] Removed orphaned routing rule for $ruleDst"
}
} on-error={
:if (!$quietMode) do={
:log warning "[$scriptName] Failed to remove orphaned rule for $ruleDst"
}
}
}
}
# ============================================================================
# Final Statistics and Logging
# ============================================================================
:if (!$quietMode) do={
:log debug "[$scriptName] ===== VPNE routing rules update completed ====="
:log debug "[$scriptName] Statistics: Total=$totalProcessed Created=$rulesCreated Updated=$rulesUpdated"
:log debug "[$scriptName] Dynamic entries processed: $dynamicProcessed"
:log debug "[$scriptName] Orphans removed: $orphansRemoved Skipped=$skipped"
}
# End of script