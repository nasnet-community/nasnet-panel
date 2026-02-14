import re
import os
import glob

os.chdir(r"C:\Users\Reza\Projects\NasNet\apps\backend")

# Read generated.go
with open("graph/generated.go", "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# Extract interface methods
interfaces = {}
for iface_name in ["MutationResolver", "QueryResolver", "SubscriptionResolver"]:
    pattern = f"type {iface_name} interface {{([^}}]+)}}"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        methods = re.findall(r"\t(\w+)\(", match.group(1))
        interfaces[iface_name] = set(methods)

# Find implemented methods by scanning Go files directly
resolver_types = {
    "MutationResolver": "mutationResolver",
    "QueryResolver": "queryResolver",
    "SubscriptionResolver": "subscriptionResolver",
}

for iface_name, receiver in resolver_types.items():
    implemented = set()
    pattern_str = rf"func \(r \*{receiver}\) (\w+)\("

    for gofile in glob.glob("graph/resolver/*.go"):
        if gofile.endswith("_test.go"):
            continue
        with open(gofile, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                m = re.search(pattern_str, line)
                if m:
                    implemented.add(m.group(1))

    required = interfaces.get(iface_name, set())
    missing = sorted(required - implemented)

    print(f"\n--- {iface_name}: {len(implemented)} implemented, {len(missing)} missing ---")
    if missing:
        for m in missing:
            print(f"  {m}")
    else:
        print("  ALL IMPLEMENTED!")
