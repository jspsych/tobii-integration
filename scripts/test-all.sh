#!/bin/bash

# Run tests for all packages

set -e

echo "Running tests for all packages..."

# Test JavaScript packages
echo "Testing JavaScript packages..."
npm test

# Test Python package
echo "Testing Python package..."
cd python
pytest
cd ..

echo "All tests passed!"
