import re
import os

os.chdir(r"C:\Users\Reza\Projects\NasNet\apps\backend")

# Read generated.go
with open("graph/generated.go", "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

missing_mutations = [
    "CreateRoutingChain", "DeleteInstance", "InstallService",
    "RemoveRoutingChain", "ResetTrafficQuota", "RestartInstance",
    "ReverifyInstance", "SetTrafficQuota", "StartInstance",
    "StopInstance", "UpdateRoutingChain", "ValidateServiceConfig",
]

missing_queries = [
    "GatewayStatus", "InstanceConfig", "InstanceHealth",
    "InstanceVerificationStatus", "RoutingChain", "RoutingChains",
    "ServiceConfigSchema", "ServiceDeviceBreakdown", "ServiceInstance",
    "ServiceInstances", "ServiceTrafficStats", "VirtualInterface",
    "VirtualInterfaces",
]

missing_subscriptions = [
    "InstanceHealthChanged", "InstanceStatusChanged",
    "RoutingChainChanged", "ServiceTrafficUpdated", "VerificationEvents",
]

# Extract interface blocks
interfaces = {}
for iface_name in ["MutationResolver", "QueryResolver", "SubscriptionResolver"]:
    pattern = f"type {iface_name} interface {{([^}}]+)}}"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        interfaces[iface_name] = match.group(1)

# Generate stubs
stubs = []
stubs.append('package resolver')
stubs.append('')
stubs.append('// This file contains stub implementations for GraphQL resolver methods')
stubs.append('// that are defined in the schema but not yet fully implemented.')
stubs.append('// Generated to satisfy the interface requirements.')
stubs.append('')
stubs.append('import (')
stubs.append('\t"context"')
stubs.append('\t"fmt"')
stubs.append('')
stubs.append('\t"backend/graph/model"')
stubs.append(')')
stubs.append('')

def extract_method_sig(iface_body, method_name):
    """Extract full method signature from interface body."""
    # Find the line with this method
    lines = iface_body.split("\n")
    for line in lines:
        line = line.strip()
        if line.startswith(method_name + "("):
            return line
    return None

def parse_return_type(sig):
    """Parse return type(s) from method signature."""
    # Extract return part after the last )
    parts = sig.rsplit(")", 1)
    if len(parts) < 2:
        return ""
    ret = parts[1].strip()
    # Remove outer parens if present
    if ret.startswith("(") and ret.endswith(")"):
        ret = ret[1:-1]
    return ret

def gen_zero_return(ret_str):
    """Generate zero value return statement."""
    parts = [p.strip() for p in ret_str.split(",")]
    values = []
    for p in parts:
        p = p.strip()
        if p == "error":
            values.append('fmt.Errorf("not implemented")')
        elif p.startswith("*"):
            values.append("nil")
        elif p.startswith("[]"):
            values.append("nil")
        elif p.startswith("[]*"):
            values.append("nil")
        elif p.startswith("map["):
            values.append("nil")
        elif p.startswith("<-chan"):
            values.append("nil")
        elif p == "string":
            values.append('""')
        elif p == "bool":
            values.append("false")
        elif p == "int":
            values.append("0")
        elif p == "float64":
            values.append("0")
        else:
            values.append("nil")
    return ", ".join(values)

# Generate mutation stubs
for method in missing_mutations:
    sig = extract_method_sig(interfaces["MutationResolver"], method)
    if sig:
        ret = parse_return_type(sig)
        zero = gen_zero_return(ret)
        stubs.append(f'// {method} is the resolver for the {method[0].lower() + method[1:]} field.')
        stubs.append(f'func (r *mutationResolver) {sig} {{')
        stubs.append(f'\treturn {zero}')
        stubs.append('}')
        stubs.append('')

# Generate query stubs
for method in missing_queries:
    sig = extract_method_sig(interfaces["QueryResolver"], method)
    if sig:
        ret = parse_return_type(sig)
        zero = gen_zero_return(ret)
        stubs.append(f'// {method} is the resolver for the {method[0].lower() + method[1:]} field.')
        stubs.append(f'func (r *queryResolver) {sig} {{')
        stubs.append(f'\treturn {zero}')
        stubs.append('}')
        stubs.append('')

# Generate subscription stubs
for method in missing_subscriptions:
    sig = extract_method_sig(interfaces["SubscriptionResolver"], method)
    if sig:
        ret = parse_return_type(sig)
        zero = gen_zero_return(ret)
        stubs.append(f'// {method} is the resolver for the {method[0].lower() + method[1:]} field.')
        stubs.append(f'func (r *subscriptionResolver) {sig} {{')
        stubs.append(f'\treturn {zero}')
        stubs.append('}')
        stubs.append('')

# Write output
output = "\n".join(stubs)
with open("graph/resolver/stubs.resolvers.go", "w", encoding="utf-8") as f:
    f.write(output)

print(f"Generated {len(missing_mutations) + len(missing_queries) + len(missing_subscriptions)} stubs")
print("Written to graph/resolver/stubs.resolvers.go")
