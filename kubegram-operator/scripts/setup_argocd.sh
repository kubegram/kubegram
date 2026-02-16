#!/bin/bash
set -e

# Wait for Argo CD server to be ready
echo "Waiting for Argo CD server..."
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# Get initial admin password
ADMIN_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo "Initial Admin Password retrieved."

# Port forward in background
echo "Starting port-forward..."
kubectl port-forward svc/argocd-server -n argocd 8085:443 > /dev/null 2>&1 &
PF_PID=$!

# Ensure cleanup
trap "kill $PF_PID" EXIT

# Wait for port-forward
sleep 5

echo "Logging in to get JWT..."
# Get JWT
TOKEN=$(curl -k -s -X POST -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"$ADMIN_PASSWORD\"}" https://localhost:8085/api/v1/session | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to get login token"
    exit 1
fi

echo "Login successful. Generating persistent token..."

# Create a token (unfortunately API keys usually require CLI or specific API that creates user tokens)
# The /session token is temporary (24h default). For testing this is sufficient.
# If we need a persistent token for the tool, we can use this session token or create a local user capability.
# For now, let's output this token.

echo "ARGOCD_TOKEN=$TOKEN" > tests/e2e/argocd_token.env
echo "Token saved to tests/e2e/argocd_token.env"

# Create the Application
echo "Applying Test Application..."
kubectl apply -f k8s/argocd/application.yaml
