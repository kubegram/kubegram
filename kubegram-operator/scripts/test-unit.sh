#!/usr/bin/env bash
# test-unit.sh — Run formatting checks, vet, compile check, and integration tests.
# No Kubernetes cluster required.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Checking formatting..."
UNFORMATTED="$(gofmt -l .)"
if [ -n "$UNFORMATTED" ]; then
  echo "ERROR: The following files need formatting (run 'go fmt ./...'):"
  echo "$UNFORMATTED"
  exit 1
fi

echo "==> Running go vet..."
go vet ./...

echo "==> Compile check..."
go build -o /dev/null ./cmd/manager/main.go

echo "==> Running integration tests..."
go test ./tests/integration/... -v -count=1 -race -timeout 120s

echo ""
echo "All unit/integration checks passed."
