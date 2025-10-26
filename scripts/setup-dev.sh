#!/bin/bash

# Set up development environment

set -e

echo "Setting up development environment..."

# Install JavaScript dependencies
echo "Installing JavaScript dependencies..."
npm install

# Install Python package in development mode
echo "Installing Python package..."
cd python
pip install -e ".[dev]"
cd ..

echo "Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Build packages: npm run build"
echo "  2. Start server: ./scripts/run-server.sh"
echo "  3. Open examples: open examples/basic-experiment/experiment.html"
