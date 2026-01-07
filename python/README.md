# jspsych-tobii (Python Server)

WebSocket server for integrating Tobii eye trackers with jsPsych experiments.

**Multi-SDK Support**: Works with both modern Tobii Pro series trackers and legacy X-series trackers (including X3-120)!

## Installation

### For Tobii Pro Series Trackers
```bash
# Recommended: Install with Tobii Pro SDK
pip install jspsych-tobii[tobii-pro]
```

### For Tobii X-Series Trackers (X3-120, X2-60, etc.)
```bash
# 1. Install jspsych-tobii
pip install jspsych-tobii

# 2. Install legacy Tobii Analytics SDK
# Contact Tobii support for SDK installer
# The server will auto-detect the legacy SDK
```

### For Testing Without Hardware
```bash
# Use built-in mock tracker
pip install jspsych-tobii
jspsych-tobii-server --mock
```

## Supported Hardware

- ✅ **Tobii Pro Series**: Spectrum, Fusion, Nano, TX300 (via `tobii-research` SDK)
- ✅ **Tobii X-Series**: X3-120, X2-60, X2-30, X1 Light (via legacy Analytics SDK)
- ✅ **Mock Tracker**: For testing and development without hardware

See [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) for detailed SDK information.

## Quick Start

### Start Server

```bash
# Basic usage (auto-detect tracker, port 8080)
jspsych-tobii-server

# Specify port
jspsych-tobii-server --port 9000

# Enable debug logging
jspsych-tobii-server --log-level DEBUG

# Log to file
jspsych-tobii-server --log-file server.log
```

### Use with jsPsych

See the [main README](../README.md) for JavaScript integration examples.

## Command-Line Options

```
jspsych-tobii-server [OPTIONS]

Options:
  --host HOST           Server host address (default: localhost)
  --port PORT           Server port (default: 8080)
  --tracker ADDRESS     Specific tracker address (auto-detect if not specified)
  --sampling-rate HZ    Sampling rate in Hz (default: 60)
  --buffer-size SIZE    Maximum buffer size (default: 10000)
  --log-level LEVEL     Logging level: DEBUG, INFO, WARNING, ERROR (default: INFO)
  --log-file FILE       Log file path (console if not specified)
  --version             Show version and exit
  --help                Show this help message
```

## Python API

You can also use the server programmatically:

```python
from jspsych_tobii import TobiiServer, ServerConfig
import asyncio

# Create configuration
config = ServerConfig(
    host='localhost',
    port=8080,
    log_level='INFO'
)

# Create and start server
server = TobiiServer(config)
asyncio.run(server.start())
```

## Features

- **Auto-detection**: Automatically finds connected Tobii eye trackers
- **WebSocket Protocol**: Real-time bidirectional communication
- **Time Synchronization**: Accurate timestamp alignment between client and server
- **Calibration Support**: Full calibration and validation workflow
- **Data Buffering**: Efficient data storage and retrieval
- **Marker Support**: Inject custom markers into data stream
- **Logging**: Comprehensive logging for debugging

## Supported Tobii Trackers

This server supports all Tobii Pro eye trackers that work with the Tobii Pro SDK, including:

- Tobii Pro Spectrum
- Tobii Pro Fusion
- Tobii Pro Nano
- Tobii Pro Spark
- Tobii 4C (limited support)

## WebSocket Protocol

The server communicates via WebSocket using JSON messages.

### Message Types

**Client → Server:**
- `start_tracking`: Start eye tracking data collection
- `stop_tracking`: Stop eye tracking
- `calibration_start`: Begin calibration
- `calibration_point`: Collect calibration point
- `calibration_compute`: Compute calibration
- `validation_start`: Begin validation
- `validation_point`: Collect validation point
- `validation_compute`: Compute validation
- `get_current_gaze`: Get latest gaze position
- `get_data`: Get gaze data for time range
- `marker`: Send marker
- `time_sync`: Synchronize time

**Server → Client:**
- `gaze_data`: Real-time gaze data stream
- Response messages for each request type

## Troubleshooting

### Tracker Not Found

1. Ensure tracker is connected (USB or network)
2. Check that Tobii Eye Tracker Manager software recognizes the tracker
3. Verify that no other applications are using the tracker
4. Try specifying tracker address explicitly:
   ```bash
   jspsych-tobii-server --tracker tet-tcp://192.168.1.100
   ```

### Connection Issues

1. Check firewall settings
2. Verify port is not in use
3. Try a different port:
   ```bash
   jspsych-tobii-server --port 9000
   ```

### Performance Issues

1. Reduce sampling rate:
   ```bash
   jspsych-tobii-server --sampling-rate 30
   ```
2. Increase buffer size:
   ```bash
   jspsych-tobii-server --buffer-size 20000
   ```

## Development

### Install Development Dependencies

```bash
pip install -e ".[dev]"
```

### Run Tests

```bash
pytest
```

### Code Formatting

```bash
black jspsych_tobii
ruff check jspsych_tobii
```

## License

MIT

## Support

- [GitHub Issues](https://github.com/jspsych/jspsych-tobii/issues)
- [Documentation](../docs/)
