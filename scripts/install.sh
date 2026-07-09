#!/usr/bin/env bash
# Deploy NasNet Panel container to a MikroTik RouterOS device.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)"

# ---- defaults --------------------------------------------------------------
GH_OWNER="nasnet-community"
GH_REPO="nasnet-panel"
ASSET_PREFIX="nasnet-panel"
SNAPSHOT_RELEASE="snapshot"
SNAPSHOT_CHANNEL="dev"

BRIDGE_NAME="containers"
BRIDGE_IP_CIDR="192.168.50.1/24"
BRIDGE_NET="192.168.50.0/24"

VETH_NAME="veth1"
VETH_ADDR_CIDR="192.168.50.2/24"
VETH_IP="192.168.50.2"
VETH_GW="192.168.50.1"

CONTAINER_NAME="nnc"
CONTAINER_ROOT_DIR="disk1/images/nnc"
TAR_REMOTE_DIR="disk1"

LAN_BRIDGE="LANBridgeSplit"
LAN_BRIDGE_IP="192.168.10.1"
LAN_BASELINE_RSC="nasnet-lan-baseline.rsc"

COMMENT_TAG="nasnet-panel-installer"
MIN_FREE_MB=30
DEVICE_MODE_TIMEOUT=120
START_TIMEOUT=120

# ---- args ------------------------------------------------------------------
DRY_RUN=0
UNINSTALL=0
VERBOSE=0
NO_ROLLBACK=0
NO_LAN_BASELINE=0
LAN_BASELINE_APPLIED=0
CONFIG_FILE=""
VERSION=""
IMAGE_TAR=""
LAN_PORT=8080

ROUTER_IP=""
ROUTER_USER=""
ROUTER_PASS=""
ROUTER_PORT=8291
SSH_PORT=22

usage() {
  cat <<'EOF'
Usage: install.sh [options]

  --dry-run            Print actions, change nothing.
  --uninstall          Stop+remove container, networking, uploaded tar.
  --config <file>      env-style file: ROUTER_IP=, ROUTER_USER=, ROUTER_PASS=
  --version <tag>      Release tag to install (default: snapshot).
  --image-tar <path>   Use a local tar instead of downloading a release asset.
  --lan-port <port>    LAN port for dstnat to panel (default: 8080).
  --no-lan-baseline    Skip the baseline LAN setup (LANBridgeSplit, 192.168.10.0/24).
  --no-rollback        Do not undo partial state on failure.
  -v, --verbose        Verbose output.
  -h, --help           This help.

Env: SSHPASS may supply the router password.
EOF
}

err() { printf 'error: %s\n' "$*" >&2; }
log() { printf '%b\n' "$*"; }
v()   { (( VERBOSE )) && printf '[v] %s\n' "$*" >&2; return 0; }

print_banner() {
  [[ -t 1 ]] && { clear 2>/dev/null || printf '\033[2J\033[H'; }
  cat <<'EOF'
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                       ║
║   ███╗   ██╗ █████╗ ███████╗███╗   ██╗███████╗████████╗    ██████╗  █████╗ ███╗   ██╗███████╗██╗      ║
║   ████╗  ██║██╔══██╗██╔════╝████╗  ██║██╔════╝╚══██╔══╝    ██╔══██╗██╔══██╗████╗  ██║██╔════╝██║      ║
║   ██╔██╗ ██║███████║███████╗██╔██╗ ██║█████╗     ██║       ██████╔╝███████║██╔██╗ ██║█████╗  ██║      ║
║   ██║╚██╗██║██╔══██║╚════██║██║╚██╗██║██╔══╝     ██║       ██╔═══╝ ██╔══██║██║╚██╗██║██╔══╝  ██║      ║
║   ██║ ╚████║██║  ██║███████║██║ ╚████║███████╗   ██║       ██║     ██║  ██║██║ ╚████║███████╗███████╗ ║
║   ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚══════╝   ╚═╝       ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝ ║
║                                                                                                       ║
║                E N T E R P R I S E - G R A D E   M I K R O T I K   M A N A G E M E N T                ║
║                                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)     DRY_RUN=1 ;;
    --uninstall)   UNINSTALL=1 ;;
    --config)      CONFIG_FILE="${2:?--config requires a path}"; shift ;;
    --version)     VERSION="${2:?--version requires a tag}"; shift ;;
    --image-tar)   IMAGE_TAR="${2:?--image-tar requires a path}"; shift ;;
    --lan-port)    LAN_PORT="${2:?--lan-port requires a port}"; shift ;;
    --no-lan-baseline) NO_LAN_BASELINE=1 ;;
    --no-rollback) NO_ROLLBACK=1 ;;
    -v|--verbose)  VERBOSE=1 ;;
    -h|--help)     usage; exit 0 ;;
    *) err "unknown argument: $1"; usage >&2; exit 2 ;;
  esac
  shift
done

print_banner

# ---- prereqs ---------------------------------------------------------------
need() { command -v "$1" >/dev/null 2>&1 || { err "missing required tool: $1"; exit 2; }; }
need curl
need ssh
need scp
if command -v sha256sum >/dev/null 2>&1; then
  SHA256_BIN="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  SHA256_BIN="shasum -a 256"
else
  err "need sha256sum or shasum"; exit 2
fi

# ---- credentials -----------------------------------------------------------
if [[ -n "$CONFIG_FILE" ]]; then
  [[ -r "$CONFIG_FILE" ]] || { err "cannot read $CONFIG_FILE"; exit 2; }
  while IFS='=' read -r key val; do
    [[ -z "${key// }" || "$key" =~ ^[[:space:]]*# ]] && continue
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    case "$key" in
      ROUTER_IP)   ROUTER_IP="$val" ;;
      ROUTER_USER) ROUTER_USER="$val" ;;
      ROUTER_PASS) ROUTER_PASS="$val" ;;
    esac
  done < "$CONFIG_FILE"
fi

ROUTER_PASS="${ROUTER_PASS:-${SSHPASS:-}}"

tcp_open() {
  local host="$1" port="$2" timeout_s=3 pid wd rc
  ( exec 3<>"/dev/tcp/$host/$port" ) >/dev/null 2>&1 &
  pid=$!
  ( sleep "$timeout_s"; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 &
  wd=$!
  wait "$pid" 2>/dev/null; rc=$?
  kill "$wd" 2>/dev/null
  wait "$wd" 2>/dev/null
  return $rc
}

probe_port() {
  local host="$1" port="$2" pid i=0
  local frames=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)
  tcp_open "$host" "$port" &
  pid=$!
  tput civis 2>/dev/null || true
  while kill -0 "$pid" 2>/dev/null; do
    printf '\r  probing %s:%-5s  %s ' "$host" "$port" "${frames[i % ${#frames[@]}]}"
    i=$(( i + 1 ))
    sleep 0.1
  done
  tput cnorm 2>/dev/null || true
  if wait "$pid"; then
    printf '\r  \033[32m✓\033[0m found mikrotik at %s:%s                \n' "$host" "$port"
    return 0
  fi
  printf '\r  \033[31m✗\033[0m unreachable at %s:%s                     \n' "$host" "$port"
  return 1
}

while true; do
  if [[ -z "$ROUTER_IP" ]]; then
    read -r -p "Router IP: " ROUTER_IP
  fi
  [[ -z "$ROUTER_IP" ]] && continue
  if ! [[ "$ROUTER_IP" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]]; then
    err "invalid host: $ROUTER_IP"
    ROUTER_IP=""
    continue
  fi
  if probe_port "$ROUTER_IP" "$ROUTER_PORT"; then
    break
  fi
  read -r -p "  Port to try (blank to re-enter IP): " ans
  if [[ -z "$ans" ]]; then
    ROUTER_IP=""
    ROUTER_PORT=8291
  elif [[ "$ans" =~ ^[0-9]+$ ]] && (( ans >= 1 && ans <= 65535 )); then
    ROUTER_PORT="$ans"
  else
    err "invalid port: $ans"
  fi
done

while ! probe_port "$ROUTER_IP" "$SSH_PORT"; do
  read -r -p "  SSH port [22]: " ans
  if [[ -z "$ans" ]]; then
    err "SSH not reachable on port ${SSH_PORT}"
  elif [[ "$ans" =~ ^[0-9]+$ ]] && (( ans >= 1 && ans <= 65535 )); then
    SSH_PORT="$ans"
  else
    err "invalid port: $ans"
  fi
done

if [[ -z "$ROUTER_USER" ]]; then
  read -r -p $'\n  \033[1m\xF0\x9F\x91\xA4 Router user\033[0m \033[2m[admin]\033[0m: ' ROUTER_USER
  ROUTER_USER="${ROUTER_USER:-admin}"
fi
if [[ -z "$ROUTER_PASS" ]]; then
  read -r -s -p $'  \033[1m\xF0\x9F\x94\x91 Router password\033[0m: ' ROUTER_PASS; echo
fi
[[ -n "$ROUTER_IP" && -n "$ROUTER_USER" && -n "$ROUTER_PASS" ]] || {
  err "router IP, user, and password are required"; exit 2;
}

# ---- SSH plumbing ----------------------------------------------------------
SSH_ASKPASS_HELPER="$(mktemp)"
chmod 700 "$SSH_ASKPASS_HELPER"
cat > "$SSH_ASKPASS_HELPER" <<'HELPER'
#!/usr/bin/env bash
printf '%s\n' "$NASNET_ASKPASS"
HELPER

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o LogLevel=ERROR
          -o BatchMode=no -o NumberOfPasswordPrompts=1
          -o ConnectTimeout=4 -o ServerAliveInterval=5 -o ServerAliveCountMax=2)
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) ;;
  *)
    SSH_CONTROL_DIR="$(mktemp -d)"
    SSH_CONTROL_PATH="${SSH_CONTROL_DIR}/cm-%h-%p"
    SSH_OPTS+=(-o ControlMaster=auto -o "ControlPath=${SSH_CONTROL_PATH}"
               -o ControlPersist=60)
    ;;
esac

ssh_pw() {
  NASNET_ASKPASS="$ROUTER_PASS" SSH_ASKPASS="$SSH_ASKPASS_HELPER" \
    SSH_ASKPASS_REQUIRE=force DISPLAY=':0' \
    ssh -p "$SSH_PORT" "${SSH_OPTS[@]}" "$@" </dev/null
}
scp_pw() {
  NASNET_ASKPASS="$ROUTER_PASS" SSH_ASKPASS="$SSH_ASKPASS_HELPER" \
    SSH_ASKPASS_REQUIRE=force DISPLAY=':0' \
    scp -P "$SSH_PORT" "${SSH_OPTS[@]}" "$@" </dev/null
}

ros_cmd() {
  ssh_pw "${ROUTER_USER}@${ROUTER_IP}" "$@"
}

trim() { local s="${1-}"; s="${s%$'\r'}"; s="${s%$'\n'}"; s="${s#$'\n'}"; printf '%s' "$s"; }

ros_exists() {
  local path="$1" selector="$2" out
  out="$(ros_cmd ":put [:len [${path}/find ${selector}]]" 2>/dev/null)"
  out="$(trim "$out")"
  [[ "$out" =~ ^[1-9] ]]
}

ros_ensure() {
  local label="$1" path="$2" selector="$3" addargs="$4"
  if ros_exists "$path" "$selector"; then
    printf '  \033[32m✓\033[0m %s (exists)\n' "$label"
    return 0
  fi
  if (( DRY_RUN )); then
    printf '  + %s (would add)\n' "$label"
    return 0
  fi
  if ! spin "$label" ros_cmd "${path}/add ${addargs}"; then
    err "failed to add ${label}"; return 1
  fi
  push_rollback "ros_cmd '${path}/remove [find ${selector}]' >/dev/null 2>&1 || true"
}

ros_remove() {
  local label="$1" path="$2" selector="$3"
  if ! ros_exists "$path" "$selector"; then
    return 0
  fi
  log "  remove: ${label}"
  (( DRY_RUN )) && return 0
  ros_cmd "${path}/remove [find ${selector}]" >/dev/null 2>&1 || true
}

ros_move_to_top() {
  local path="$1" selector="$2"
  (( DRY_RUN )) && return 0
  ros_cmd "${path}/move [find ${selector}] destination=0" >/dev/null 2>&1 || true
}

ros_ensure_dir() {
  local dir="$1"
  (( DRY_RUN )) && { log "  [dry-run] mkdir ${dir}"; return 0; }
  if ros_cmd "/file/print where name=\"${dir}\"" 2>/dev/null \
     | grep -qE '^[[:space:]]*[0-9]+'; then
    return 0
  fi
  ros_cmd "/file/add name=\"${dir}\" type=directory" >/dev/null 2>&1 || true
}

# ---- spinner helpers -------------------------------------------------------
SPIN_FRAMES=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)

spin() {
  local label="$1"; shift
  local pid i=0 rc=0 tmp
  tmp="$(mktemp)"
  ( "$@" ) >"$tmp" 2>&1 &
  pid=$!
  tput civis 2>/dev/null || true
  while kill -0 "$pid" 2>/dev/null; do
    printf '\r  %s %s ' "${SPIN_FRAMES[i % ${#SPIN_FRAMES[@]}]}" "$label"
    i=$(( i + 1 ))
    sleep 0.1
  done
  tput cnorm 2>/dev/null || true
  wait "$pid" || rc=$?
  if (( rc == 0 )); then
    printf '\r  \033[32m✓\033[0m %s                                        \n' "$label"
  else
    printf '\r  \033[31m✗\033[0m %s                                        \n' "$label"
    if [[ -s "$tmp" ]]; then
      sed 's/^/      /' "$tmp" >&2
    fi
  fi
  rm -f "$tmp"
  return $rc
}

spin_out() {
  local label="$1" var="$2"; shift 2
  local pid i=0 rc=0 tmp_out tmp_err
  tmp_out="$(mktemp)"; tmp_err="$(mktemp)"
  ( "$@" >"$tmp_out" 2>"$tmp_err" ) &
  pid=$!
  tput civis 2>/dev/null || true
  while kill -0 "$pid" 2>/dev/null; do
    printf '\r  %s %s ' "${SPIN_FRAMES[i % ${#SPIN_FRAMES[@]}]}" "$label"
    i=$(( i + 1 ))
    sleep 0.1
  done
  tput cnorm 2>/dev/null || true
  wait "$pid" || rc=$?
  printf -v "$var" '%s' "$(cat "$tmp_out")"
  if (( rc == 0 )); then
    printf '\r  \033[32m✓\033[0m %s                                        \n' "$label"
  else
    printf '\r  \033[31m✗\033[0m %s                                        \n' "$label"
    if [[ -s "$tmp_err" ]]; then
      sed 's/^/      /' "$tmp_err" >&2
    fi
  fi
  rm -f "$tmp_out" "$tmp_err"
  return $rc
}

print_router_box() {
  local inner_w=44 hline
  printf -v hline '%*s' "$inner_w" ''
  hline="${hline// /─}"
  printf '\n'
  printf '  ╭%s╮\n' "$hline"
  printf '  │  %-*s│\n' $((inner_w-2)) 'MikroTik'
  printf '  │%-*s│\n' $inner_w ''
  printf '  │  %-*s│\n' $((inner_w-2)) "Board     ${ROUTEROS_BOARD}"
  printf '  │  %-*s│\n' $((inner_w-2)) "Arch      ${ROUTEROS_ARCH}"
  printf '  │  %-*s│\n' $((inner_w-2)) "RouterOS  ${ROUTEROS_VERSION}"
  printf '  │  %-*s│\n' $((inner_w-2)) "Memory    ${ROUTEROS_FREE_MB} MB free"
  printf '  ╰%s╯\n' "$hline"
}

# ---- rollback --------------------------------------------------------------
ROLLBACK=()
push_rollback() { ROLLBACK+=("$1"); }
do_rollback() {
  (( ${#ROLLBACK[@]} == 0 )) && return 0
  err "rolling back ${#ROLLBACK[@]} action(s)"
  local i
  for ((i=${#ROLLBACK[@]}-1; i>=0; i--)); do
    log "[rollback] ${ROLLBACK[i]}"
    eval "${ROLLBACK[i]}" || true
  done
}
on_exit() {
  local rc=$?
  tput cnorm 2>/dev/null || true
  if [[ -n "${SSH_CONTROL_DIR:-}" && -d "${SSH_CONTROL_DIR:-}" ]]; then
    ssh -p "${SSH_PORT}" -o "ControlPath=${SSH_CONTROL_PATH}" -O exit \
        "${ROUTER_USER}@${ROUTER_IP}" >/dev/null 2>&1 || true
    rm -rf "$SSH_CONTROL_DIR"
  fi
  [[ -n "${SSH_ASKPASS_HELPER:-}" && -e "${SSH_ASKPASS_HELPER:-}" ]] && rm -f "$SSH_ASKPASS_HELPER"
  if (( rc != 0 && NO_ROLLBACK == 0 && DRY_RUN == 0 && UNINSTALL == 0 )); then
    do_rollback
  fi
  exit "$rc"
}
trap on_exit EXIT

# ---- probe -----------------------------------------------------------------
probe() {
  log ""
  log "Connecting to ${ROUTER_USER}@${ROUTER_IP}:${SSH_PORT} ..."
  if ! spin "authenticating over SSH" ros_cmd ':put ok'; then
    err "SSH login failed - check user/password or SSH service policies"
    exit 1
  fi

  local out
  if ! spin_out "reading system info" out \
       ros_cmd ':put ("V=" . [/system/resource/get version]); :put ("A=" . [/system/resource/get architecture-name]); :put ("B=" . [/system/resource/get board-name]); :put ("F=" . [/system/resource/get free-memory])'; then
    err "/system/resource read failed"; exit 1
  fi

  ROUTEROS_VERSION=""; ROUTEROS_ARCH=""; ROUTEROS_BOARD=""
  local free_mem=0 line
  while IFS= read -r line; do
    line="${line%$'\r'}"
    case "$line" in
      V=*) ROUTEROS_VERSION="${line#V=}" ;;
      A=*) ROUTEROS_ARCH="${line#A=}" ;;
      B=*) ROUTEROS_BOARD="${line#B=}" ;;
      F=*) free_mem="${line#F=}" ;;
    esac
  done <<< "$out"
  ROUTEROS_FREE_MB=$(( free_mem / 1024 / 1024 ))

  print_router_box

  case "$ROUTEROS_ARCH" in
    arm|arm64|x86_64) ;;
    *) err "unsupported architecture: ${ROUTEROS_ARCH:-unknown} (need arm, arm64, or x86_64)"; exit 1 ;;
  esac
  if (( ROUTEROS_FREE_MB < MIN_FREE_MB )); then
    err "free memory ${ROUTEROS_FREE_MB}MB below threshold ${MIN_FREE_MB}MB"; exit 1
  fi
}

ensure_device_mode() {
  log ""
  log "Checking container support ..."

  local out
  spin_out "container package present" out \
    ros_cmd ':put [:len [/system/package/find name=container]]' || true
  out="$(trim "$out")"
  if [[ -z "$out" || ! "$out" =~ ^[1-9] ]]; then
    err "container package is not installed on this router."
    err "install via WebFig/Winbox 'System > Packages' or download the matching arch from mikrotik.com"
    exit 1
  fi

  spin_out "container package enabled" out \
    ros_cmd ':put [/system/package/get [find name=container] disabled]' || true
  out="$(trim "$out")"
  if [[ "$out" == "true" ]]; then
    err "container package is installed but disabled."
    err "run on the router: /system/package/enable container ; /system/reboot"
    exit 1
  fi

  spin_out "device-mode container" out \
    ros_cmd ':put [/system/device-mode/get container]' || true
  local mode; mode="$(trim "$out")"

  case "$mode" in
    yes|true)
      log "  device-mode container is already enabled"
      return 0
      ;;
    no|false) ;;
    *)
      err "could not read /system/device-mode container (got: '${mode}'). Run '/system device-mode print' on the router to inspect."
      exit 1
      ;;
  esac

  log "  \033[31m✗ device-mode container=no (needs enabling)\033[0m"
  log ""
  log "RouterOS requires physical confirmation when enabling container mode."
  read -r -p "Proceed? [y/N]: " ans
  [[ "$ans" =~ ^[yY] ]] || { err "aborted by user"; exit 1; }

  if (( DRY_RUN )); then
    log "[dry-run] /system/device-mode/update container=yes"
    return 0
  fi

  log ""
  log "  \033[33m⚠  Action required on the router\033[0m"
  log ""
  log "  Within the next ${DEVICE_MODE_TIMEOUT}s, do \033[1mone\033[0m of the following:"
  log ""
  log "    \033[1m1.\033[0m If your router has a \033[1mreset/mode button\033[0m:"
  log "       press it briefly while the router is powered on."
  log ""
  log "    \033[1m2.\033[0m If your router has \033[1mno button\033[0m (x86 / CHR):"
  log "       perform a cold power-cycle (unplug power, plug back in)."
  log ""

  ( ros_cmd '/system/device-mode/update container=yes' >/dev/null 2>&1 ) &
  local update_pid=$!

  local i=0 elapsed=0 mode router_state="online"
  tput civis 2>/dev/null || true
  while (( elapsed < DEVICE_MODE_TIMEOUT )); do
    printf '\r  %s waiting for physical confirmation ... %3ds left  [router: %-7s] ' \
           "${SPIN_FRAMES[i % ${#SPIN_FRAMES[@]}]}" $((DEVICE_MODE_TIMEOUT - elapsed)) "$router_state"
    i=$(( i + 1 ))
    sleep 0.5
    elapsed=$(( elapsed + 1 ))

    if (( elapsed % 4 == 0 )); then
      if mode="$(ros_cmd ':put [/system/device-mode/get container]' 2>/dev/null)"; then
        router_state="online"
        mode="$(trim "$mode")"
        if [[ "$mode" == "yes" || "$mode" == "true" ]]; then
          kill "$update_pid" 2>/dev/null || true
          wait "$update_pid" 2>/dev/null || true
          tput cnorm 2>/dev/null || true
          printf '\r  \033[32m✓ device-mode container=yes confirmed                                                  \033[0m\n'
          return 0
        fi
      else
        router_state="offline"
      fi
    fi
  done
  tput cnorm 2>/dev/null || true
  printf '\n'
  kill "$update_pid" 2>/dev/null || true
  wait "$update_pid" 2>/dev/null || true
  err "device-mode change not confirmed within ${DEVICE_MODE_TIMEOUT}s"
  exit 1
}

# ---- image download --------------------------------------------------------
# RouterOS reports arm/arm64/x86_64; release assets use the image build suffix.
asset_suffix() {
  case "$1" in
    x86_64) printf 'amd64' ;;
    arm64)  printf 'arm64' ;;
    arm)    printf 'armv7' ;;
    *) err "unsupported architecture: $1"; exit 1 ;;
  esac
}

download_asset() {
  local arch="$1" release channel suffix asset url sha_url out_dir out sha
  if [[ -n "$VERSION" ]]; then
    release="$VERSION"; channel="${VERSION#v}"
  else
    release="$SNAPSHOT_RELEASE"; channel="$SNAPSHOT_CHANNEL"
  fi
  suffix="$(asset_suffix "$arch")"
  asset="${ASSET_PREFIX}-${channel}-${suffix}.tar"
  url="https://github.com/${GH_OWNER}/${GH_REPO}/releases/download/${release}/${asset}"
  sha_url="${url}.sha256"
  out_dir="${TMPDIR:-/tmp}/nasnet-panel-installer"
  mkdir -p "$out_dir"
  out="${out_dir}/${asset}"
  sha="${out}.sha256"

  log "Downloading ${asset} ..."
  curl -fL --progress-bar "$url"     -o "$out" || { err "download failed: $url"; exit 1; }
  curl -fsSL              "$sha_url" -o "$sha" || { err "checksum download failed: $sha_url"; exit 1; }

  local expected actual
  expected="$(awk '{print $1; exit}' "$sha")"
  actual="$($SHA256_BIN "$out" | awk '{print $1}')"
  if [[ "$expected" != "$actual" ]]; then
    err "checksum mismatch for ${asset}: got ${actual}, expected ${expected}"; exit 1
  fi
  log "  checksum OK"
  ASSET_NAME="$asset"
  LOCAL_TAR="$out"
}

# ---- upload ----------------------------------------------------------------
upload_tar() {
  local local_path="$1"
  local remote_path="${TAR_REMOTE_DIR}/${ASSET_NAME}"
  REMOTE_TAR="$remote_path"

  local local_size remote_size
  local_size="$(stat -f %z "$local_path" 2>/dev/null || stat -c %s "$local_path" 2>/dev/null)"

  if ros_exists /file "name=\"${remote_path}\""; then
    remote_size="$(trim "$(ros_cmd ":put [/file/get [find name=\"${remote_path}\"] size]" 2>/dev/null || true)")"
    if [[ -n "$remote_size" && "$remote_size" == "$local_size" ]]; then
      log "Tar already on router (${remote_size} bytes match), skipping upload."
      return 0
    fi
    log "Tar on router differs (local=${local_size}, remote=${remote_size:-?}); replacing"
    if (( ! DRY_RUN )); then
      ros_cmd "/file/remove [find name=\"${remote_path}\"]" >/dev/null 2>&1 || true
    fi
  fi
  log "Uploading $(basename "$local_path") -> ${remote_path} ..."
  if (( DRY_RUN )); then
    log "[dry-run] scp upload"
    return 0
  fi
  ros_ensure_dir "$TAR_REMOTE_DIR"
  scp_pw "$local_path" "${ROUTER_USER}@${ROUTER_IP}:${remote_path}"
  push_rollback "remove_remote_file '${remote_path}'"
}

remove_remote_file() {
  local name="$1"
  ros_cmd "/file/remove [find name=\"${name}\"]" >/dev/null 2>&1 || true
}

# ---- network + container ---------------------------------------------------
configure_network() {
  log ""
  log "Configuring network ..."

  ros_ensure "veth ${VETH_NAME} (${VETH_ADDR_CIDR})" \
    /interface/veth "name=${VETH_NAME}" \
    "name=${VETH_NAME} address=${VETH_ADDR_CIDR} gateway=${VETH_GW}"

  ros_ensure "bridge ${BRIDGE_NAME}" \
    /interface/bridge "name=${BRIDGE_NAME}" \
    "name=${BRIDGE_NAME}"

  ros_ensure "ip ${BRIDGE_IP_CIDR} on ${BRIDGE_NAME}" \
    /ip/address "address=\"${BRIDGE_IP_CIDR}\"" \
    "address=${BRIDGE_IP_CIDR} interface=${BRIDGE_NAME}"

  ros_ensure "${VETH_NAME} -> bridge ${BRIDGE_NAME}" \
    /interface/bridge/port "interface=${VETH_NAME}" \
    "bridge=${BRIDGE_NAME} interface=${VETH_NAME}"

  ros_ensure "srcnat masquerade for ${BRIDGE_NET}" \
    /ip/firewall/nat "comment=\"${COMMENT_TAG}-srcnat\"" \
    "chain=srcnat action=masquerade src-address=${BRIDGE_NET} comment=\"${COMMENT_TAG}-srcnat\""

  ros_ensure "dstnat tcp/${LAN_PORT} -> ${VETH_IP}:80" \
    /ip/firewall/nat "comment=\"${COMMENT_TAG}-dstnat\"" \
    "chain=dstnat action=dst-nat protocol=tcp dst-port=${LAN_PORT} to-addresses=${VETH_IP} to-ports=80 comment=\"${COMMENT_TAG}-dstnat\""
  ros_move_to_top /ip/firewall/nat "comment=\"${COMMENT_TAG}-dstnat\""

  ros_ensure "forward accept tcp/80 -> ${VETH_IP}" \
    /ip/firewall/filter "comment=\"${COMMENT_TAG}-forward\"" \
    "chain=forward action=accept protocol=tcp dst-address=${VETH_IP} dst-port=80 comment=\"${COMMENT_TAG}-forward\""
  ros_move_to_top /ip/firewall/filter "comment=\"${COMMENT_TAG}-forward\""
}

deploy_container() {
  log ""
  log "Configuring container ..."
  if ros_exists /container "name=${CONTAINER_NAME}"; then
    printf '  \033[32m✓\033[0m container %s (exists)\n' "$CONTAINER_NAME"
    return 0
  fi
  if (( DRY_RUN )); then
    printf '  + container %s (would add from %s)\n' "$CONTAINER_NAME" "$REMOTE_TAR"
    return 0
  fi
  if ! spin "extracting tar and adding container ${CONTAINER_NAME}" \
       ros_cmd "/container/add file=${REMOTE_TAR} interface=${VETH_NAME} root-dir=${CONTAINER_ROOT_DIR} name=${CONTAINER_NAME} start-on-boot=yes logging=yes"; then
    err "failed to add container"; exit 1
  fi
  push_rollback "ros_cmd '/container/remove [find name=${CONTAINER_NAME}]' >/dev/null 2>&1 || true"
}

get_container_field() {
  local field="$1" out val

  out="$(ros_cmd ":put [:tostr [/container/get [find name=${CONTAINER_NAME}]]]" 2>/dev/null || true)"
  if [[ -n "$out" ]]; then
    val="$(printf '%s' "$out" | awk -v f="$field" -v RS=';' -v FS='=' '$1==f {print $2; exit}')"
    if [[ -n "$val" ]]; then
      val="${val#\"}"; val="${val%\"}"
      printf '%s' "$val"
      return
    fi
  fi

  if [[ "$field" == "status" ]]; then
    out="$(ros_cmd "/container/print where name=${CONTAINER_NAME}" 2>/dev/null || true)"
    if printf '%s' "$out" | grep -qE '^[[:space:]]*[0-9]+[[:space:]]+R[[:space:]]'; then
      printf 'running'; return
    fi
    if printf '%s' "$out" | grep -qE '^[[:space:]]*[0-9]+[[:space:]]+E[[:space:]]'; then
      printf 'error'; return
    fi
    local kw
    for kw in running error extracting extracted paused stopped halted; do
      if [[ "$out" =~ (^|[^a-zA-Z])${kw}([^a-zA-Z]|$) ]]; then
        printf '%s' "$kw"; return
      fi
    done
    printf 'stopped'
    return
  fi

  out="$(ros_cmd "/container/print detail where name=${CONTAINER_NAME}" 2>/dev/null || true)"
  printf '%s' "$out" \
    | sed -nE "s/.*[ ;]${field}=\"?([^\"; ]+)\"?.*/\1/p" \
    | head -1
}

start_and_poll() {
  log ""
  log "Starting container ${CONTAINER_NAME} ..."
  if (( DRY_RUN )); then
    log "[dry-run] /container/start"
    log "[dry-run] poll status until running"
    return 0
  fi
  local start_out start_rc=0
  start_out="$(ros_cmd "/container/start [find name=${CONTAINER_NAME}]" 2>&1)" || start_rc=$?
  if (( start_rc != 0 )); then
    err "/container/start failed:"
    sed 's/^/    /' <<< "$start_out" >&2
    exit 1
  fi
  [[ -n "$start_out" ]] && v "/container/start: ${start_out}"

  local actual_port
  actual_port="$(ros_cmd "/ip/firewall/nat/print detail where comment=\"${COMMENT_TAG}-dstnat\"" 2>/dev/null \
                  | sed -nE 's/.*dst-port=([0-9]+).*/\1/p' | head -1)"
  [[ -z "$actual_port" ]] && actual_port="$LAN_PORT"
  local health_url="http://${ROUTER_IP}:${actual_port}/health"
  log "Polling ${health_url} ..."

  local start_ts=$SECONDS elapsed=0 i=0 last_poll=-10 http_code="--"
  tput civis 2>/dev/null || true
  while :; do
    elapsed=$(( SECONDS - start_ts ))
    (( elapsed >= START_TIMEOUT )) && break

    printf '\r  %s waiting for /health 200  (last: %-3s, %ds elapsed)   ' \
           "${SPIN_FRAMES[i % ${#SPIN_FRAMES[@]}]}" "$http_code" "$elapsed"
    i=$(( i + 1 ))
    sleep 0.2

    if (( elapsed - last_poll >= 2 )); then
      last_poll=$elapsed
      http_code="$(curl -sS --connect-timeout 2 --max-time 4 \
                        -o /dev/null -w '%{http_code}' "$health_url" 2>/dev/null || echo '--')"
      if [[ "$http_code" == "200" ]]; then
        tput cnorm 2>/dev/null || true
        printf '\r  \033[32m✓\033[0m container healthy at %s                                  \n' "$health_url"
        return 0
      fi
    fi
  done
  tput cnorm 2>/dev/null || true
  printf '\r  \033[31m✗\033[0m /health did not return 200 within %ds (last: %s)\n' \
         "$START_TIMEOUT" "$http_code"
  local status status_err
  status="$(get_container_field status)"
  err "RouterOS reports container status: ${status:-unknown}"
  status_err="$(get_container_field error)"
  [[ -n "$status_err" ]] && err "error field: ${status_err}"
  err "recent container log entries:"
  ros_cmd '/log/print without-paging where topics~"container"' 2>&1 \
    | tail -10 | sed 's/^/    /' >&2
  err "inspect manually: /container/print detail where name=${CONTAINER_NAME}"
  exit 1
}

# ---- LAN baseline ----------------------------------------------------------
setup_lan_baseline() {
  log ""
  log "Configuring baseline LAN (bridge ${LAN_BRIDGE}, ${LAN_BRIDGE_IP}/24) ..."

  if ros_exists /interface/bridge "name=${LAN_BRIDGE}"; then
    printf '  \033[32m✓\033[0m bridge %s (exists, skipping LAN baseline)\n' "$LAN_BRIDGE"
    return 0
  fi
  if (( DRY_RUN )); then
    log "[dry-run] would move LAN to ${LAN_BRIDGE_IP}/24 via detached RouterOS job"
    return 0
  fi

  local rsc="${SCRIPT_DIR}/${LAN_BASELINE_RSC}" tmp=""
  if [[ ! -r "$rsc" ]]; then
    local ref="${VERSION:-$SNAPSHOT_CHANNEL}"
    local url="https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${ref}/scripts/${LAN_BASELINE_RSC}"
    tmp="$(mktemp)"
    if ! spin "downloading LAN baseline script" curl -fsSL "$url" -o "$tmp"; then
      rm -f "$tmp"
      err "LAN baseline script not found next to install.sh and download failed: ${url}"
      err "skipping LAN baseline; run the wizard from a wired connection or re-run install.sh"
      return 0
    fi
    rsc="$tmp"
  fi
  if ! spin "uploading LAN baseline script" \
       scp_pw "$rsc" "${ROUTER_USER}@${ROUTER_IP}:${LAN_BASELINE_RSC}"; then
    [[ -n "$tmp" ]] && rm -f "$tmp"
    err "LAN baseline upload failed; run the wizard from a wired connection or re-run install.sh"
    return 0
  fi
  [[ -n "$tmp" ]] && rm -f "$tmp"
  if ! spin "starting detached LAN baseline job" \
       ros_cmd ":execute script={/import file-name=${LAN_BASELINE_RSC}}"; then
    err "LAN baseline job failed to start; run the wizard from a wired connection or re-run install.sh"
    return 0
  fi
  LAN_BASELINE_APPLIED=1
}

# ---- uninstall -------------------------------------------------------------
uninstall_path() {
  log ""
  log "Uninstalling ..."

  if ros_exists /container "name=${CONTAINER_NAME}"; then
    log "  stop:   container ${CONTAINER_NAME}"
    if (( ! DRY_RUN )); then
      ros_cmd "/container/stop [find name=${CONTAINER_NAME}]" >/dev/null 2>&1 || true
      sleep 2
    fi
    ros_remove "container ${CONTAINER_NAME}" /container "name=${CONTAINER_NAME}"
  fi

  ros_remove "nat ${COMMENT_TAG}-srcnat"  /ip/firewall/nat    "comment=\"${COMMENT_TAG}-srcnat\""
  ros_remove "nat ${COMMENT_TAG}-dstnat"  /ip/firewall/nat    "comment=\"${COMMENT_TAG}-dstnat\""
  ros_remove "filter forward"             /ip/firewall/filter "comment=\"${COMMENT_TAG}-forward\""
  ros_remove "bridge port ${VETH_NAME}"   /interface/bridge/port "interface=${VETH_NAME}"
  ros_remove "ip ${BRIDGE_IP_CIDR}"       /ip/address          "address=\"${BRIDGE_IP_CIDR}\""
  ros_remove "bridge ${BRIDGE_NAME}"      /interface/bridge    "name=${BRIDGE_NAME}"
  ros_remove "veth ${VETH_NAME}"          /interface/veth      "name=${VETH_NAME}"

  log "  remove: tar(s) under ${TAR_REMOTE_DIR}/${ASSET_PREFIX}-*.tar"
  if (( ! DRY_RUN )); then
    ros_cmd "/file/remove [find where (name~\"^${TAR_REMOTE_DIR}/${ASSET_PREFIX}-\") and (name~\"\\.tar\$\")]" \
      >/dev/null 2>&1 || true
    remove_remote_file "$LAN_BASELINE_RSC"
  fi

  log ""
  log "Uninstall complete."
}

# ---- main ------------------------------------------------------------------
main() {
  log ""
  log "  router: ${ROUTER_USER}@${ROUTER_IP}:${SSH_PORT}"
  (( DRY_RUN )) && log "  mode:   DRY RUN (no changes)"

  probe

  if (( UNINSTALL )); then
    uninstall_path
    return 0
  fi

  ensure_device_mode

  if [[ -n "$IMAGE_TAR" ]]; then
    [[ -r "$IMAGE_TAR" ]] || { err "image tar not readable: $IMAGE_TAR"; exit 2; }
    LOCAL_TAR="$IMAGE_TAR"
    ASSET_NAME="$(basename "$IMAGE_TAR")"
    log ""
    log "Using local tar: ${LOCAL_TAR}"
  else
    log ""
    if [[ -n "$VERSION" ]]; then
      log "Release: ${VERSION}  arch: ${ROUTEROS_ARCH}"
    else
      log "Snapshot release: ${SNAPSHOT_RELEASE}  arch: ${ROUTEROS_ARCH}"
    fi
    download_asset "$ROUTEROS_ARCH"
  fi

  upload_tar "$LOCAL_TAR"
  configure_network
  deploy_container
  start_and_poll

  local final_port
  final_port="$(ros_cmd "/ip/firewall/nat/print detail where comment=\"${COMMENT_TAG}-dstnat\"" 2>/dev/null \
                  | sed -nE 's/.*dst-port=([0-9]+).*/\1/p' | head -1)"
  [[ -z "$final_port" ]] && final_port="$LAN_PORT"

  if (( ! NO_LAN_BASELINE )); then
    setup_lan_baseline
  fi

  log ""
  if (( LAN_BASELINE_APPLIED )); then
    log "\033[32m✓ Done. Baseline LAN ${LAN_BRIDGE_IP%.*}.0/24 (bridge ${LAN_BRIDGE}) configured.\033[0m"
    log "  Reconnect (or renew your DHCP lease) on the ${LAN_BRIDGE_IP%.*}.x network,"
    log "  then open \033[1mhttp://${LAN_BRIDGE_IP}:${final_port}/\033[0m"
    log "  If it does not respond, the panel is still at \033[1mhttp://${ROUTER_IP}:${final_port}/\033[0m"
  else
    log "\033[32m✓ Done. Panel reachable at http://${ROUTER_IP}:${final_port}/\033[0m"
  fi
}

main
