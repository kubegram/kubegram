#!/usr/bin/env bash
# test-e2e.sh — Full end-to-end validation of the kubegram-operator on minikube.
#
# What this script does:
#   1. Checks that all required tools are installed
#   2. Verifies minikube is running
#   3. Builds the operator Docker image
#   4. Loads the image into minikube
#   5. Installs / upgrades the Helm chart with CI-safe values
#   6. Waits for the deployment to become ready
#   7. Port-forwards the MCP HTTP/SSE endpoint (local :8082 → pod :8080)
#   8. Runs the E2E test suite
#   9. Cleans up on exit
#
# Environment variables (all optional):
#   IMG          Docker image name+tag   (default: kubegram-operator:latest)
#   NAMESPACE    Kubernetes namespace    (default: default)
#   RELEASE_NAME Helm release name       (default: kubegram-operator)
#   CLEANUP      Helm uninstall on exit  (default: true)
set -euo pipefail

cd "$(dirname "$0")/.."

# ── Configuration ────────────────────────────────────────────────────────────
IMG="${IMG:-kubegram-operator:latest}"
NAMESPACE="${NAMESPACE:-default}"
RELEASE_NAME="${RELEASE_NAME:-kubegram-operator}"
CHART_DIR="./charts/kubegram-operator"
CLEANUP="${CLEANUP:-true}"

# Port mapping: localhost:MCP_LOCAL_PORT → pod:MCP_CONTAINER_PORT
MCP_CONTAINER_PORT="8080"
MCP_LOCAL_PORT="8082"

PORT_FWD_PID=""

# ── Cleanup handler ───────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "==> Cleaning up..."
  if [ -n "$PORT_FWD_PID" ] && kill -0 "$PORT_FWD_PID" 2>/dev/null; then
    kill "$PORT_FWD_PID"
  fi
  if [ "$CLEANUP" = "true" ]; then
    echo "    Uninstalling Helm release '$RELEASE_NAME' (set CLEANUP=false to skip)..."
    helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── 1. Prerequisite check ────────────────────────────────────────────────────
echo "==> Checking prerequisites..."
MISSING=()
for cmd in minikube kubectl helm go docker; do
  if ! command -v "$cmd" &>/dev/null; then
    MISSING+=("$cmd")
  fi
done
if [ ${#MISSING[@]} -ne 0 ]; then
  echo "ERROR: The following required tools are not installed or not in PATH:"
  printf '    %s\n' "${MISSING[@]}"
  exit 1
fi

# ── 2. Verify minikube is running ────────────────────────────────────────────
echo "==> Verifying minikube is running..."
if ! minikube status --format='{{.Host}}' 2>/dev/null | grep -q "Running"; then
  echo "ERROR: minikube is not running. Start it with: minikube start"
  exit 1
fi

# ── 3. Build Docker image ────────────────────────────────────────────────────
echo "==> Building Docker image: $IMG"
docker build -t "$IMG" .

# ── 4. Load image into minikube ──────────────────────────────────────────────
echo "==> Loading image into minikube..."
minikube image load "$IMG"

# ── 5. Update Helm dependencies ──────────────────────────────────────────────
echo "==> Updating Helm chart dependencies..."
helm dependency update "$CHART_DIR"

# ── 6. Deploy with Helm ──────────────────────────────────────────────────────
IMAGE_REPO="$(echo "$IMG" | cut -d: -f1)"
IMAGE_TAG="$(echo "$IMG" | cut -d: -f2)"

echo "==> Deploying operator to minikube (namespace: $NAMESPACE, release: $RELEASE_NAME)..."
helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set "image.repository=$IMAGE_REPO" \
  --set "image.tag=$IMAGE_TAG" \
  --set image.pullPolicy=Never \
  --set kubegram.serverToken=ci-test-token \
  --set "kubegram.serverUrl=http://127.0.0.1:1" \
  --set "llm.websocketUrl=ws://127.0.0.1:1" \
  --set mcp.http.enabled=true \
  --set "mcp.http.port=$MCP_CONTAINER_PORT" \
  --set mcp.proxies.argo.enabled=false \
  --set mcp.proxies.k8s.enabled=false \
  --set argoMcpServer.enabled=false \
  --set k8sMcpServer.enabled=false \
  --wait --timeout 120s

# ── 7. Confirm rollout ───────────────────────────────────────────────────────
echo "==> Waiting for deployment rollout..."
kubectl rollout status "deployment/$RELEASE_NAME" \
  --namespace "$NAMESPACE" --timeout=120s

echo "==> Deployment is ready."

# ── 8. Port-forward MCP HTTP endpoint ───────────────────────────────────────
echo "==> Port-forwarding MCP endpoint: localhost:$MCP_LOCAL_PORT → pod:$MCP_CONTAINER_PORT"
kubectl port-forward "deployment/$RELEASE_NAME" \
  "$MCP_LOCAL_PORT:$MCP_CONTAINER_PORT" \
  --namespace "$NAMESPACE" &
PORT_FWD_PID=$!

# Give the tunnel a moment to open
sleep 3

# Verify port-forward is still alive
if ! kill -0 "$PORT_FWD_PID" 2>/dev/null; then
  echo "ERROR: port-forward process exited unexpectedly"
  exit 1
fi

# ── 9. Run E2E tests ─────────────────────────────────────────────────────────
echo "==> Running E2E tests..."
go test ./tests/e2e/... -v -timeout 120s

echo ""
echo "E2E tests passed."
