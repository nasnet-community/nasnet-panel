# Installing Nasnet Panel on MikroTik

This guide explains how to install Nasnet Panel on a MikroTik RouterOS device. There are two routes: the automated `install.sh` script (recommended) and a manual installation via Winbox or the RouterOS terminal. Both deploy the panel as a RouterOS container and produce an identical result.

## Before you begin

You will need the following, regardless of which route you choose.

- A MikroTik router running RouterOS v7.x.
- The `container` package installed and enabled. Install it from **System > Packages** in WebFig or Winbox, or download the matching architecture from mikrotik.com. After enabling, reboot the router.
- Container `device-mode` enabled. The first time this is switched on, RouterOS demands physical confirmation: press the reset/mode button briefly, or perform a cold power-cycle (unplug, plug back in) for boards without a button.
- External storage available. The container, its tarball, and root directory live under `disk1/` by default.
- At least 30 MB of free RAM on the router.
- A supported CPU architecture: `arm`, `arm64`, or `x86_64`.

The router must also be reachable on the RouterOS API port (8291) and SSH port (22) from the machine running the script.

## Route 1: The automated script

The `install.sh` script performs the entire deployment end-to-end: it probes the router, verifies prerequisites, enables device-mode if required, downloads the prebuilt container image tar for the router's architecture, uploads it, configures the networking and firewall rules, creates and starts the container, then polls the panel's health endpoint until it responds.

By default it installs the latest snapshot, published as ready-to-use RouterOS tars on the rolling `snapshot` release. The build pipeline packages these (with `skopeo`) so nothing needs converting locally. Pass `--version <tag>` to install a tagged release instead, or `--image-tar <path>` to use a local tar and skip the download entirely.

### Local prerequisites

The machine running the script (not the router) needs `bash`, `curl`, `ssh`, `scp`, and either `sha256sum` or `shasum`. How you get these depends on your operating system.

**Linux**

These tools are present on virtually every distribution out of the box. If `scp` is missing, install the OpenSSH client (`openssh-clients` on Fedora/RHEL, `openssh-client` on Debian/Ubuntu).

**macOS**

`bash`, `curl`, `ssh`, and `scp` ship with macOS. There is no `sha256sum`, but `shasum` is present and the script uses it automatically. Run the script from Terminal.

**Windows**

The script will not run under Command Prompt or PowerShell directly, as it is a bash script. Use one of the following:

- **WSL (recommended).** Install Windows Subsystem for Linux (`wsl --install` in an elevated PowerShell), open your Linux shell, and run the script as you would on Linux.
- **Git Bash.** Installed with [Git for Windows](https://git-scm.com/download/win). It provides `bash`, `curl`, `ssh`, and `scp`. Run the script from a Git Bash window.

If you would rather not set up a Unix shell on Windows at all, use the manual route in [Route 2](#route-2-manual-installation-via-winbox-or-terminal) instead. Winbox is a native Windows application, so the manual installation needs no extra tooling.

### Running it interactively

The simplest invocation prompts you for the router's address and credentials:

```bash
bash install.sh
```

You will be asked for the router IP, then the user (defaults to `admin`) and password. The script probes the API and SSH ports before continuing, and will prompt for alternative ports if the defaults are not open.

### Running it non-interactively

Supply the credentials through an env-style config file:

```bash
cat > router.env <<'EOF'
ROUTER_IP=192.168.88.1
ROUTER_USER=admin
ROUTER_PASS=secret
EOF

bash install.sh --config router.env
```

Alternatively, pass the password through the `SSHPASS` environment variable rather than writing it to disk:

```bash
SSHPASS=secret bash install.sh --config router.env
```

### Useful flags

| Flag                 | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `--dry-run`          | Print every action the script would take, change nothing.               |
| `--uninstall`        | Stop and remove the container, networking, NAT rules, and uploaded tar. |
| `--config <file>`    | Read `ROUTER_IP`, `ROUTER_USER`, and `ROUTER_PASS` from an env file.    |
| `--version <tag>`    | Release tag to install (default: `snapshot`).                           |
| `--image-tar <path>` | Use a local tar instead of downloading a release asset.                 |
| `--lan-port <port>`  | LAN port for the panel (default: 8080).                                 |
| `--no-lan-baseline`  | Skip the baseline LAN setup (see below).                                |
| `--no-rollback`      | Leave partial state in place on failure rather than undoing it.         |
| `-v`, `--verbose`    | Verbose output.                                                         |
| `-h`, `--help`       | Show usage.                                                             |

### The baseline LAN

As its final step, the script moves the router's LAN onto the same bridge the setup wizard uses (`LANBridgeSplit`, `192.168.10.1/24`, with DHCP for `192.168.10.2-254`). This keeps you connected while the wizard later reconfigures the router: the wizard preserves this bridge, so your connection to the panel survives the process. The change runs as a detached RouterOS job, so it completes even though it briefly interrupts your session. Interfaces acting as WAN uplinks (DHCP client or PPPoE) are left out of the bridge. On a device in AP/bridge mode (all ports on one uplink bridge) the bridge is created but has no member ports, so the panel remains at the router's current address until the wizard runs.

The RouterOS commands live in `scripts/nasnet-lan-baseline.rsc`. The script uploads the copy sitting next to `install.sh`; if you downloaded `install.sh` on its own, the file is fetched from the repository automatically.

After it applies, reconnect (or renew your DHCP lease) to get a `192.168.10.x` address; the panel is then at `http://192.168.10.1:8080/`.

The step is skipped entirely when `LANBridgeSplit` already exists (a re-install, or a router already configured by the wizard). Pass `--no-lan-baseline` to opt out and keep your current LAN untouched; note the wizard will then dismantle your LAN mid-run and you will need to reconnect to `192.168.10.x` once it finishes.

### When it finishes

The panel is reachable at `http://<router-ip>:8080/`, or on whichever port you passed to `--lan-port`. With the baseline LAN applied, use `http://192.168.10.1:8080/` instead. If anything fails partway through, the script rolls back the changes it made, unless you passed `--no-rollback`.

To remove the panel later:

```bash
bash install.sh --uninstall --config router.env
```

This removes the container, its networking, the installer firewall rules, and the uploaded files. It does not restore your original LAN: the baseline bridge (`LANBridgeSplit`, `192.168.10.1/24`) and its DHCP server stay in place, since that is now the router's LAN.

## Route 2: Manual installation via Winbox or terminal

Use this route if you would rather not run the script, or if your workstation cannot reach the router directly. Every step below mirrors exactly what the script does. Commands are written for the RouterOS terminal (the **New Terminal** window in Winbox); the equivalent menus are noted where helpful.

### Step 1: Confirm the prerequisites

In the terminal, check the package is present and enabled:

```
/system/package/print where name=container
```

If it is disabled, enable it and reboot:

```
/system/package/enable container
/system/reboot
```

Check the architecture and free memory:

```
/system/resource/print
```

The architecture must be `arm`, `arm64`, or `x86_64`, and free memory must be at least 30 MB.

### Step 2: Enable container device-mode

```
/system/device-mode/print
```

If `container` is `no`, enable it. RouterOS will wait for physical confirmation:

```
/system/device-mode/update container=yes
```

Within roughly two minutes, press the router's reset/mode button briefly, or cold power-cycle the router. Re-run the print command to confirm `container: yes`.

### Step 3: Download and upload the image

The build pipeline publishes ready-to-use RouterOS container tars on the rolling `snapshot` release, so there is nothing to package by hand. Download the one that matches your board's architecture. Note that RouterOS and the asset names use different labels:

| RouterOS architecture | Asset to download            |
| --------------------- | ---------------------------- |
| `x86_64`              | `nasnet-panel-dev-amd64.tar` |
| `arm64`               | `nasnet-panel-dev-arm64.tar` |
| `arm`                 | `nasnet-panel-dev-armv7.tar` |

You checked the architecture with `/system/resource/print` in Step 1. Each tar has a matching `.sha256` file; verify the download before uploading.

In Winbox, open **Files** and drag the tar into the `disk1` directory, so it lands at `disk1/nasnet-panel-dev-<suffix>.tar`. Note that path; you reference it when creating the container in Step 5.

### Step 4: Configure the networking

These commands create a virtual ethernet interface for the container, a bridge, an address, and the firewall rules that expose the panel on the LAN. Run them in order.

```
/interface/veth/add name=veth-nasnet-panel address=192.168.50.2/24 gateway=192.168.50.1

/interface/bridge/add name=containers

/ip/address/add address=192.168.50.1/24 interface=containers

/interface/bridge/port/add bridge=containers interface=veth-nasnet-panel

/ip/firewall/nat/add chain=srcnat action=masquerade src-address=192.168.50.0/24 comment="nasnet-panel-installer-srcnat"

/ip/firewall/nat/add chain=dstnat action=dst-nat protocol=tcp dst-port=8080 to-addresses=192.168.50.2 to-ports=80 comment="nasnet-panel-installer-dstnat"

/ip/firewall/filter/add chain=forward action=accept protocol=tcp dst-address=192.168.50.2 dst-port=80 comment="nasnet-panel-installer-forward"
```

The dstnat rule maps LAN port 8080 to the container. If you want the panel on a different port, change `dst-port=8080` accordingly. Move both new firewall rules to the top of their respective chains so they take effect ahead of any blocking rules:

```
/ip/firewall/nat/move [find comment="nasnet-panel-installer-dstnat"] destination=0
/ip/firewall/filter/move [find comment="nasnet-panel-installer-forward"] destination=0
```

### Step 5: Create and start the container

Once the `container` package is installed and device-mode is enabled, Winbox and WebFig show a **Container** menu in the left-hand sidebar. You can create the container there instead of using the terminal.

**Using the Container menu (Winbox/WebFig)**

1. Open **Container** and click the **+** (Add) button.
2. Set the fields:
   - **File:** `disk1/nasnet-panel-dev-arm64.tar` (the tar you uploaded; match your architecture)
   - **Interface:** `veth-nasnet-panel`
   - **Root Dir:** `disk1/images/nasnet-panel`
   - **Name:** `nasnet-panel`
   - **Start On Boot:** ticked
   - **Logging:** ticked
3. Click **OK**. The new entry appears in the list and RouterOS begins extracting the image; the status moves through `extracting` to `stopped` once ready.
4. Select the `nasnet-panel` row and click **Start**. The status changes to `running`.

**Using the terminal**

Create the container from the uploaded tarball, attaching it to `veth-nasnet-panel`. Replace the filename with the tarball you uploaded.

```
/container/add file=disk1/nasnet-panel-dev-arm64.tar interface=veth-nasnet-panel root-dir=disk1/images/nasnet-panel name=nasnet-panel start-on-boot=yes logging=yes
```

RouterOS extracts the image, which takes a moment. Once the container shows as extracted, start it:

```
/container/start [find name=nasnet-panel]
```

**Alternative: pull from the registry (not recommended)**

Instead of uploading a tar, RouterOS can pull the image straight from GitHub Container Registry. In the New Container dialog this is the **Remote Image** field rather than **File**; set the registry first in **Container > Config**:

```
/container/config/set registry-url=https://ghcr.io tmpdir=disk1/pull
/container/add remote-image=nasnet-community/nasnet-panel:dev interface=veth-nasnet-panel root-dir=disk1/images/nasnet-panel name=nasnet-panel start-on-boot=yes logging=yes
```

Use the multi-arch `dev` tag (or `latest`); the registry serves the image matching your board, so no architecture suffix is needed. This route needs working DNS and outbound HTTPS on the router, and `tmpdir` must sit on the external disk.

RouterOS's registry pull is unreliable in practice, which is why the tar route above is the supported method. Treat this as a convenience that may not work on every board or RouterOS version, and fall back to the tar if the pull stalls or errors.

### Step 6: Verify

In the **Container** menu, the `nasnet-panel` row should show status `running`. From the terminal you can check the same thing:

```
/container/print
```

Then confirm the panel is serving. From a machine on the LAN:

```
http://<router-ip>:8080/
```

The health endpoint at `http://<router-ip>:8080/health` should return HTTP 200 once the container is fully up. If it does not, inspect the container and its logs:

```
/container/print detail where name=nasnet-panel
/log/print where topics~"container"
```

## Removing Nasnet Panel manually

To undo a manual installation, stop and remove the container, then delete the networking and firewall entries and the uploaded tarball:

```
/container/stop [find name=nasnet-panel]
/container/remove [find name=nasnet-panel]

/ip/firewall/nat/remove [find comment="nasnet-panel-installer-srcnat"]
/ip/firewall/nat/remove [find comment="nasnet-panel-installer-dstnat"]
/ip/firewall/filter/remove [find comment="nasnet-panel-installer-forward"]

/interface/bridge/port/remove [find interface=veth-nasnet-panel]
/ip/address/remove [find address=192.168.50.1/24]
/interface/bridge/remove [find name=containers]
/interface/veth/remove [find name=veth-nasnet-panel]

/file/remove [find name="disk1/nasnet-panel-dev-arm64.tar"]
```
