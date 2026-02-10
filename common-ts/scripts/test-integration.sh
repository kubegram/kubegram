#!/bin/bash

# Integration Test Runner Script
# This script helps run integration tests against a GraphQL server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

GRAPHQL_ENDPOINT="${GRAPHQL_ENDPOINT:-http://localhost:8080/api/v1/graphql}"
WS_ENDPOINT="${WS_ENDPOINT:-ws://localhost:8080/api/v1/graphql}"

echo -e "${GREEN}Integration Test Runner${NC}"
echo "========================"
echo ""
echo "GraphQL Endpoint: $GRAPHQL_ENDPOINT"
echo "WebSocket Endpoint: $WS_ENDPOINT"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking server availability...${NC}"
if curl -s -f -o /dev/null -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'; then
  echo -e "${GREEN}✓ Server is running${NC}"
else
  echo -e "${RED}✗ Server is not accessible at $GRAPHQL_ENDPOINT${NC}"
  echo ""
  echo "Please start your GraphQL server first:"
  echo "  cd /path/to/your/server"
  echo "  npm run dev"
  echo ""
  exit 1
fi

# Check introspection
echo -e "${YELLOW}Checking GraphQL schema...${NC}"
if curl -s -f -o /dev/null -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'; then
  echo -e "${GREEN}✓ Schema introspection works${NC}"
else
  echo -e "${YELLOW}⚠ Schema introspection failed (might be disabled)${NC}"
fi

echo ""
echo -e "${YELLOW}Running integration tests...${NC}"
echo ""

# Run tests
npm run test:integration -- "$@"

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ Integration tests passed!${NC}"
else
  echo ""
  echo -e "${RED}✗ Integration tests failed${NC}"
  exit $TEST_EXIT_CODE
fi
