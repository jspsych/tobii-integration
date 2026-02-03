# Tobii SDK Adapter System

The jsPsych-Tobii Python server uses an **adapter pattern** to support Tobii eye trackers. All real hardware is supported through a single SDK (`tobii-research`), with a mock adapter available for testing.

## Supported Hardware

All Tobii trackers are supported via the `tobii-research` package:

- **Modern Pro series** (via `tobii-research` 2.x): Spectrum, Fusion, Nano, Spark
- **Older models** (via `tobii-research` 1.x): X3-120, TX300, X2-60, T120, etc.
- **Mock Tracker**: Realistic simulated gaze data, no hardware required

> **Note:** If you have an older tracker like the X3-120, install `tobii-research<2`. Version 1.x supports these models; version 2.x dropped them. The Python API is the same across both versions.

## Installation

### For Tobii Trackers

```bash
# Install with Tobii SDK support
pip install jspsych-tobii[tobii]

# Or install SDK separately
pip install jspsych-tobii
pip install tobii-research>=1.11.0

# For older trackers (X3-120, TX300, etc.), pin to 1.x
pip install "tobii-research>=1.11.0,<2"
```

### For Development/Testing (No Hardware)

```bash
# Use mock tracker
pip install jspsych-tobii

# No additional dependencies needed
# Use use_mock=True when starting server (see Usage below)
```

## Architecture

### Adapter Pattern

```
┌─────────────────────────┐
│    TobiiManager         │
│  (WebSocket Interface)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  TobiiTrackerAdapter    │
│   (Abstract Base)       │
└───────────┬─────────────┘
            │
      ┌─────┴─────┬──────────────┐
      ▼           ▼              ▼
┌──────────┐ ┌───────────┐ ┌──────────┐
│ Tobii    │ │  Mock     │ │ Future   │
│ Pro      │ │  Adapter  │ │ Adapters │
│ Adapter  │ │           │ │   ...    │
└──────────┘ └───────────┘ └──────────┘
```

### Key Components

1. **`TobiiTrackerAdapter`** (base.py)
   - Abstract base class defining tracker interface
   - All adapters implement this interface

2. **`TobiiProAdapter`** (tobii_pro.py)
   - Implements support for all Tobii trackers
   - Uses `tobii-research` SDK (works with both 1.x and 2.x)

3. **`MockTrackerAdapter`** (mock.py)
   - Testing adapter with simulated gaze data
   - 120 Hz realistic eye movement simulation

4. **Factory** (factory.py)
   - Detects if `tobii-research` is installed
   - Creates appropriate adapter

## Usage

### Automatic SDK Detection

The server automatically detects if `tobii-research` is installed:

```python
from jspsych_tobii import TobiiManager

# Auto-detect SDK
manager = TobiiManager()
manager.find_tracker()
```

### Explicit SDK Selection

You can force a specific SDK:

```python
from jspsych_tobii import TobiiManager
from jspsych_tobii.adapters import SDKType

# Force Tobii Pro SDK
manager = TobiiManager(sdk_type=SDKType.TOBII_PRO)

# Use mock tracker for testing
manager = TobiiManager(use_mock=True)
```

### Check Available SDKs

```python
from jspsych_tobii.adapters import get_available_sdks, print_sdk_status

# Get SDK info programmatically
sdks = get_available_sdks()
for sdk in sdks:
    print(f"{sdk['name']}: {'installed' if sdk['available'] else 'not installed'}")

# Or use built-in pretty printer
print_sdk_status()
```

Output example:
```
=== Tobii SDK Status ===

Available: Tobii Pro (tobii-research) (v1.11.0)

========================

1 SDK(s) available
```

### Server CLI

When starting the server from command line:

```bash
# Auto-detect SDK
jspsych-tobii

# Use mock tracker (no hardware)
jspsych-tobii --mock
```

## Adapter Interface

All adapters implement these methods:

### Connection Management
- `find_trackers()` - Discover available trackers
- `connect(address)` - Connect to tracker
- `disconnect()` - Disconnect from tracker
- `get_tracker_info()` - Get tracker details
- `is_connected()` - Check connection status

### Gaze Data Collection
- `subscribe_to_gaze_data(callback)` - Start streaming gaze data
- `unsubscribe_from_gaze_data()` - Stop streaming
- `is_tracking()` - Check tracking status

### Calibration
- `start_calibration()` - Enter calibration mode
- `collect_calibration_data(point)` - Collect data for point
- `compute_calibration()` - Compute and apply calibration
- `discard_calibration_data(point)` - Remove point data
- `leave_calibration_mode()` - Exit calibration

### SDK Information
- `sdk_name` - SDK name property
- `sdk_version` - SDK version property

## Data Format

All adapters convert SDK-specific data to a standardized format:

```python
@dataclass
class GazeDataPoint:
    x: float                    # Normalized X (0-1)
    y: float                    # Normalized Y (0-1)
    timestamp: float            # Milliseconds
    left_valid: bool            # Left eye validity
    right_valid: bool           # Right eye validity
    left_pupil_diameter: float  # mm
    right_pupil_diameter: float # mm
    # Optional 3D data (if supported by tracker)
    left_gaze_origin_x: Optional[float]
    left_gaze_origin_y: Optional[float]
    left_gaze_origin_z: Optional[float]
    right_gaze_origin_x: Optional[float]
    right_gaze_origin_y: Optional[float]
    right_gaze_origin_z: Optional[float]
```

## Adding New Adapters

To add support for a new tracker SDK:

1. Create a new adapter class in `jspsych_tobii/adapters/`
2. Inherit from `TobiiTrackerAdapter`
3. Implement all abstract methods
4. Add SDK detection to `factory.py`
5. Update documentation

Example skeleton:

```python
from .base import TobiiTrackerAdapter

class MyNewAdapter(TobiiTrackerAdapter):
    def __init__(self):
        # Initialize your SDK
        pass

    @property
    def sdk_name(self) -> str:
        return "my-sdk"

    # Implement all required methods...
```

## Troubleshooting

### "No Tobii SDK found" Error

**Cause**: `tobii-research` is not installed.

**Solution**:
```bash
pip install tobii-research

# Or use mock mode for testing
jspsych-tobii --mock
```

### Older Tracker Not Detected

**Cause**: `tobii-research` 2.x dropped support for some older models.

**Solution**: Install version 1.x instead:
```bash
pip install "tobii-research>=1.11.0,<2"
```

## Testing

Run adapter tests:

```bash
# Test with mock adapter (no hardware needed)
pytest tests/test_adapters.py --mock

# Test with real hardware
pytest tests/test_adapters.py --sdk tobii-pro
```

## Performance Notes

- **TobiiProAdapter**: Full 3D gaze origin data, high precision
- **MockAdapter**: 120 Hz simulation with realistic eye movement patterns

## License

Same as jsPsych-Tobii main package (MIT).

## Support

- **GitHub Issues**: https://github.com/jspsych/jspsych-tobii/issues
- **Tobii Hardware/SDK Support**: https://www.tobii.com/support
