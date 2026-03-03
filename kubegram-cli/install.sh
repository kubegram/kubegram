#!/usr/bin/env bash
# install.sh — one-line installer for kubegram
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/kubegram/kubegram/main/kubegram-cli/install.sh | bash
#
# Environment overrides:
#   KUBEGRAM_VERSION     — install a specific version (e.g. v1.2.3). Defaults to latest.
#   KUBEGRAM_INSTALL_DIR — override install directory. Defaults to /usr/local/bin or ~/.local/bin.

set -euo pipefail

# ---------------------------------------------------------------------------
# Terminal colours (disabled automatically when not a TTY)
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' BOLD='' RESET=''
fi

info()    { printf "${BLUE}[kubegram]${RESET} %s\n" "$*"; }
success() { printf "${GREEN}[kubegram]${RESET} %s\n" "$*"; }
warn()    { printf "${YELLOW}[kubegram]${RESET} WARNING: %s\n" "$*" >&2; }
fatal()   { printf "${RED}[kubegram]${RESET} ERROR: %s\n" "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Dependency check
# ---------------------------------------------------------------------------
need_cmd() {
  command -v "$1" > /dev/null 2>&1 || fatal "Required command not found: '$1'. Please install it and retry."
}

need_cmd curl
need_cmd tar

if ! command -v shasum > /dev/null 2>&1 && ! command -v sha256sum > /dev/null 2>&1; then
  fatal "Required command not found: 'shasum' or 'sha256sum'. Please install one and retry."
fi

# ---------------------------------------------------------------------------
# Platform detection
# ---------------------------------------------------------------------------
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "darwin" ;;
    Linux)  echo "linux" ;;
    *)      fatal "Unsupported OS: $(uname -s). Only darwin and linux are supported." ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64)  echo "amd64" ;;
    arm64|aarch64) echo "arm64" ;;
    *)             fatal "Unsupported architecture: $(uname -m). Only amd64 and arm64 are supported." ;;
  esac
}

OS="$(detect_os)"
ARCH="$(detect_arch)"

info "Detected platform: ${BOLD}${OS}/${ARCH}${RESET}"

# ---------------------------------------------------------------------------
# Resolve version
# ---------------------------------------------------------------------------
GITHUB_REPO="kubegram/kubegram"
BINARY_NAME="kubegram"

if [ -z "${KUBEGRAM_VERSION:-}" ]; then
  info "Fetching latest release..."
  # Monorepo releases are tagged kubegram-cli/v* — filter for the CLI component.
  KUBEGRAM_VERSION="$(
    curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases" \
      | grep '"tag_name"' \
      | grep '"kubegram-cli/' \
      | head -1 \
      | sed 's/.*"kubegram-cli\/\(v[^"]*\)".*/\1/'
  )"
  if [ -z "$KUBEGRAM_VERSION" ]; then
    fatal "Could not determine the latest release. Set KUBEGRAM_VERSION manually: KUBEGRAM_VERSION=v1.0.0 bash install.sh"
  fi
fi

# Normalise: ensure leading 'v' for display; strip it for archive filenames.
VERSION_TAG="${KUBEGRAM_VERSION#v}"   # e.g. 1.2.3  (used in archive names)
VERSION_DISPLAY="v${VERSION_TAG}"     # e.g. v1.2.3 (used in display + release tag)

info "Installing kubegram ${BOLD}${VERSION_DISPLAY}${RESET}"

# ---------------------------------------------------------------------------
# Build download URLs
# ---------------------------------------------------------------------------
# GoReleaser archive naming: kubegram_<version>_<os>_<arch>.tar.gz
# Checksums file:            kubegram_checksums.txt
# Both attached to GitHub Release tagged: kubegram-cli/v<version>

RELEASE_TAG="kubegram-cli/${VERSION_DISPLAY}"
BASE_URL="https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}"
ARCHIVE_NAME="${BINARY_NAME}_${VERSION_TAG}_${OS}_${ARCH}.tar.gz"
CHECKSUMS_NAME="${BINARY_NAME}_checksums.txt"

# ---------------------------------------------------------------------------
# Download to a temp directory (cleaned up on exit)
# ---------------------------------------------------------------------------
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

info "Downloading ${ARCHIVE_NAME}..."
curl -fsSL --progress-bar "${BASE_URL}/${ARCHIVE_NAME}" -o "${TMP_DIR}/${ARCHIVE_NAME}"

info "Downloading checksums..."
curl -fsSL "${BASE_URL}/${CHECKSUMS_NAME}" -o "${TMP_DIR}/${CHECKSUMS_NAME}"

# ---------------------------------------------------------------------------
# Checksum verification
# ---------------------------------------------------------------------------
info "Verifying SHA256 checksum..."

if command -v shasum > /dev/null 2>&1; then
  CHECKSUM_CMD="shasum -a 256"
else
  CHECKSUM_CMD="sha256sum"
fi

EXPECTED="$(grep "${ARCHIVE_NAME}" "${TMP_DIR}/${CHECKSUMS_NAME}" | awk '{print $1}')"
if [ -z "$EXPECTED" ]; then
  fatal "Checksum for '${ARCHIVE_NAME}' not found in checksums file. The release may be incomplete."
fi

ACTUAL="$($CHECKSUM_CMD "${TMP_DIR}/${ARCHIVE_NAME}" | awk '{print $1}')"

if [ "$EXPECTED" != "$ACTUAL" ]; then
  fatal "Checksum mismatch for ${ARCHIVE_NAME}:
  expected: ${EXPECTED}
  got:      ${ACTUAL}
The download may be corrupted or tampered with."
fi

success "Checksum verified."

# ---------------------------------------------------------------------------
# Extract binary
# ---------------------------------------------------------------------------
info "Extracting binary..."
tar -xzf "${TMP_DIR}/${ARCHIVE_NAME}" -C "$TMP_DIR"

EXTRACTED="${TMP_DIR}/${BINARY_NAME}"
[ -f "$EXTRACTED" ] || fatal "Binary '${BINARY_NAME}' not found in archive."
chmod +x "$EXTRACTED"

# ---------------------------------------------------------------------------
# Determine install directory
# ---------------------------------------------------------------------------
if [ -n "${KUBEGRAM_INSTALL_DIR:-}" ]; then
  INSTALL_DIR="$KUBEGRAM_INSTALL_DIR"
elif [ -w "/usr/local/bin" ]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="${HOME}/.local/bin"
  warn "No write access to /usr/local/bin. Installing to ${INSTALL_DIR}."
  warn "Ensure ${INSTALL_DIR} is in your PATH:"
  warn "  export PATH=\"\${HOME}/.local/bin:\${PATH}\""
fi

mkdir -p "$INSTALL_DIR"

# ---------------------------------------------------------------------------
# Install binary
# ---------------------------------------------------------------------------
INSTALL_PATH="${INSTALL_DIR}/${BINARY_NAME}"

if [ -f "$INSTALL_PATH" ]; then
  CURRENT="$("$INSTALL_PATH" version 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")"
  info "Replacing existing installation (${CURRENT})..."
fi

cp "$EXTRACTED" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"

success "kubegram ${VERSION_DISPLAY} installed to ${BOLD}${INSTALL_PATH}${RESET}"

# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------
if "$INSTALL_PATH" version > /dev/null 2>&1; then
  success "Smoke test passed: $("$INSTALL_PATH" version)"
else
  warn "Binary installed but 'kubegram version' returned non-zero. Try: ${INSTALL_PATH} version"
fi

# ---------------------------------------------------------------------------
# Post-install guidance
# ---------------------------------------------------------------------------
printf "\n${BOLD}Quick start:${RESET}\n"
printf "  kubegram start              # Start the full Kubegram stack\n"
printf "  kubegram operator install   # Deploy the operator to your cluster\n"
printf "  kubegram version            # Confirm the installed version\n"
printf "\nDocs: https://www.kubegram.com\n\n"
