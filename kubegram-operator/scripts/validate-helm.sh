#!/usr/bin/env bash
# validate-helm.sh — Validate the kubegram-operator Helm chart.
# Runs dependency update, lint, template render, and dry-run install.
# No Kubernetes cluster required (dry-run uses --dry-run flag).
set -euo pipefail

cd "$(dirname "$0")/.."

CHART_DIR="./charts/kubegram-operator"

# Check helm is available
if ! command -v helm &>/dev/null; then
  echo "ERROR: helm is not installed or not in PATH"
  exit 1
fi

echo "==> Updating Helm chart dependencies..."
helm dependency update "$CHART_DIR"

echo "==> Linting Helm chart..."
helm lint "$CHART_DIR" \
  --set kubegram.serverToken=lint-test-token \
  --set image.tag=latest \
  --set argoMcpServer.enabled=false \
  --set k8sMcpServer.enabled=false

echo "==> Rendering Helm templates (dry render)..."
helm template kubegram-operator "$CHART_DIR" \
  --set kubegram.serverToken=lint-test-token \
  --set image.tag=latest \
  --set argoMcpServer.enabled=false \
  --set k8sMcpServer.enabled=false \
  > /dev/null

echo "==> Helm dry-run install..."
helm upgrade --install kubegram-operator "$CHART_DIR" \
  --dry-run \
  --set kubegram.serverToken=lint-test-token \
  --set image.tag=latest \
  --set argoMcpServer.enabled=false \
  --set k8sMcpServer.enabled=false \
  > /dev/null

echo ""
echo "Helm chart validation passed."
