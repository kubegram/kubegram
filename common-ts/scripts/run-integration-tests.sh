#!/bin/bash

# Script to run integration tests for GraphQL subscriptions
# This script helps ensure the GraphQL server is running before running tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GRAPHQL_WS_URL=${GRAPHQL_WS_URL:-"ws://localhost:4000/graphql"}
GRAPHQL_HTTP_URL=${GRAPHQL_HTTP_URL:-"http://localhost:4000/graphql"}
HTTP_CHECK_URL=${HTTP_CHECK_URL:-"http://localhost:4000/graphql"}

echo -e "${YELLOW}🔍 GraphQL Integration Test Runner${NC}"
echo ""
echo "Configuration:"
echo "  WebSocket URL: $GRAPHQL_WS_URL"
echo "  HTTP URL: $GRAPHQL_HTTP_URL"
echo ""

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}Checking if GraphQL server is running...${NC}"
    
    # Try to connect to HTTP endpoint
    if curl -s -f -o /dev/null "$HTTP_CHECK_URL"; then
        echo -e "${GREEN}✅ Server is running at $HTTP_CHECK_URL${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not responding at $HTTP_CHECK_URL${NC}"
        return 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running integration tests...${NC}"
    echo ""
    
    # Unset SKIP_INTEGRATION_TESTS to ensure tests run
    unset SKIP_INTEGRATION_TESTS
    
    # Run the tests
    npm test -- subscription-client.integration.test.ts
}

# Main execution
main() {
    if check_server; then
        echo ""
        run_tests
    else
        echo ""
        echo -e "${RED}Cannot run integration tests without a running server.${NC}"
        echo ""
        echo "Please start your GraphQL server first:"
        echo "  1. Start your server with WebSocket support"
        echo "  2. Ensure it's accessible at $GRAPHQL_HTTP_URL"
        echo "  3. Run this script again"
        echo ""
        echo "Or set custom URLs:"
        echo "  export GRAPHQL_WS_URL=ws://your-server:port/graphql"
        echo "  export GRAPHQL_HTTP_URL=http://your-server:port/graphql"
        echo "  ./scripts/run-integration-tests.sh"
        echo ""
        exit 1
    fi
}

# Run main function
main
