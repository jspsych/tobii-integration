#!/bin/bash

# Build all packages in the monorepo

set -e

echo "Building all packages..."

# Build JavaScript packages
echo "Building JavaScript packages..."
npm run build

echo "All packages built successfully!"
