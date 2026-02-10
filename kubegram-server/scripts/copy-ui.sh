#!/bin/bash

# Script to copy React build files from kubegram-ui-v2 to the server's public directory

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Copying React build files...${NC}"

# Define paths
UI_DIR="../kubegram-ui-v2/dist"
PUBLIC_DIR="./public"

# Check if UI dist directory exists
if [ ! -d "$UI_DIR" ]; then
  echo -e "${RED}❌ Error: UI build directory not found at $UI_DIR${NC}"
  echo -e "${YELLOW}💡 Please build the React app first by running:${NC}"
  echo -e "   cd ../kubegram-ui-v2 && npm run build"
  exit 1
fi

# Remove existing public directory if it exists
if [ -d "$PUBLIC_DIR" ]; then
  echo -e "${YELLOW}🗑️  Removing existing public directory...${NC}"
  rm -rf "$PUBLIC_DIR"
fi

# Create public directory
echo -e "${YELLOW}📁 Creating public directory...${NC}"
mkdir -p "$PUBLIC_DIR"

# Copy all files from UI dist to public
echo -e "${YELLOW}📋 Copying files...${NC}"
cp -r "$UI_DIR"/* "$PUBLIC_DIR"/

# Verify the copy
if [ -f "$PUBLIC_DIR/index.html" ]; then
  echo -e "${GREEN}✅ Successfully copied React build files!${NC}"
  echo -e "${GREEN}📊 Files in public directory:${NC}"
  ls -lh "$PUBLIC_DIR"
else
  echo -e "${RED}❌ Error: Copy failed - index.html not found${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 Done!${NC}"
