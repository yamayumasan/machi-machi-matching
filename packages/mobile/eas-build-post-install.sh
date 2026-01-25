#!/bin/bash
set -e

echo "Building @machi/shared package..."
cd ../shared
pnpm build
echo "@machi/shared built successfully"
