#!/bin/bash

# Run the Tobii WebSocket server

# Default values
PORT=8080
LOG_LEVEL="INFO"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--port PORT] [--log-level LEVEL]"
            exit 1
            ;;
    esac
done

# Check if Python package is installed
if ! python -c "import jspsych_tobii" 2>/dev/null; then
    echo "Installing Python package..."
    cd python
    pip install -e .
    cd ..
fi

# Run server
echo "Starting Tobii WebSocket server on port $PORT..."
jspsych-tobii-server --port "$PORT" --log-level "$LOG_LEVEL"
