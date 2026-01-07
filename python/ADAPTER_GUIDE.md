# Tobii SDK Adapter System

The jsPsych-Tobii Python server uses an **adapter pattern** to support multiple Tobii eye tracker models and SDKs. This allows seamless support for both modern Tobii Pro series trackers and legacy X-series trackers.

## Supported Hardware

### Tobii Pro Series (via `tobii-research` SDK)
- ✅ Tobii Pro Spectrum
- ✅ Tobii Pro Fusion
- ✅ Tobii Pro Nano
- ✅ Tobii Pro TX300
- ✅ Other Tobii Pro series trackers

### Tobii X-Series (via Legacy Analytics SDK)
- ✅ **Tobii X3-120**
- ✅ Tobii X2-60
- ✅ Tobii X2-30
- ✅ Tobii X1 Light

### Mock Tracker (for Testing)
- ✅ Mock adapter with realistic simulated gaze data
- No hardware required

## Installation

### For Tobii Pro Series Trackers

```bash
# Install with Tobii Pro support
pip install jspsych-tobii[tobii-pro]

# Or install SDK separately
pip install jspsych-tobii
pip install tobii-research>=1.11.0
```

### For Tobii X-Series Trackers (X3-120, X2-60, etc.)

The legacy Tobii Analytics SDK is **not available via pip**. You must:

1. Contact [Tobii Support](https://www.tobii.com/support) to obtain the legacy SDK
2. Install the SDK following Tobii's platform-specific instructions
3. Install jspsych-tobii:
   ```bash
   pip install jspsych-tobii
   ```

The server will automatically detect the legacy SDK if installed.

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
      ┌─────┴─────┬─────────────┬──────────────┐
      ▼           ▼             ▼              ▼
┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐
│ Tobii    │ │ Tobii    │ │  Mock     │ │ Future   │
│ Pro      │ │ X-Series │ │  Adapter  │ │ Adapters │
│ Adapter  │ │ Adapter  │ │           │ │   ...    │
└──────────┘ └──────────┘ └───────────┘ └──────────┘
```

### Key Components

1. **`TobiiTrackerAdapter`** (base.py)
   - Abstract base class defining tracker interface
   - All adapters implement this interface

2. **`TobiiProAdapter`** (tobii_pro.py)
   - Implements Tobii Pro series support
   - Uses `tobii-research` SDK

3. **`TobiiXSeriesAdapter`** (tobii_x_series.py)
   - Implements X-series tracker support
   - Uses legacy Tobii Analytics SDK

4. **`MockTrackerAdapter`** (mock.py)
   - Testing adapter with simulated gaze data
   - 120 Hz realistic eye movement simulation

5. **Factory** (factory.py)
   - Auto-detects available SDKs
   - Creates appropriate adapter

## Usage

### Automatic SDK Detection

The server automatically detects which SDKs are installed and uses the best available:

```python
from jspsych_tobii import TobiiManager

# Auto-detect SDK (prefers Tobii Pro if both installed)
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

# Force legacy X-series SDK (for X3-120)
manager = TobiiManager(sdk_type=SDKType.TOBII_X_SERIES)

# Use mock tracker for testing
manager = TobiiManager(use_mock=True)
```

### Check Available SDKs

```python
from jspsych_tobii.adapters import get_available_sdks, print_sdk_status

# Get SDK info programmatically
sdks = get_available_sdks()
for sdk in sdks:
    print(f"{sdk['name']}: {'✓' if sdk['available'] else '✗'}")

# Or use built-in pretty printer
print_sdk_status()
```

Output example:
```
=== Tobii SDK Status ===

✓ Available: Tobii Pro (tobii-research) (v1.11.0)
✗ Not installed: Tobii X-Series (Analytics SDK)

========================

✓ 1 SDK(s) available
```

### Server CLI with SDK Selection

When starting the server from command line:

```bash
# Auto-detect SDK
python -m jspsych_tobii.server

# Use specific SDK
python -m jspsych_tobii.server --sdk tobii-pro
python -m jspsych_tobii.server --sdk tobii-x-series

# Use mock tracker (no hardware)
python -m jspsych_tobii.server --mock
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

To add support for a new Tobii SDK or tracker series:

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

**Cause**: Neither `tobii-research` nor legacy SDK is installed.

**Solution**:
```bash
# For Pro series trackers
pip install tobii-research

# For X-series trackers (X3-120)
# Contact Tobii support for legacy SDK installer

# Or use mock mode for testing
python -m jspsych_tobii.server --mock
```

### SDK Auto-Detection Picks Wrong SDK

**Cause**: Multiple SDKs installed; factory prefers Pro SDK.

**Solution**: Force specific SDK:
```python
from jspsych_tobii.adapters import SDKType

manager = TobiiManager(sdk_type=SDKType.TOBII_X_SERIES)
```

### Legacy SDK Import Errors

**Cause**: Legacy SDK installed incorrectly or not in Python path.

**Solution**:
1. Verify SDK installation following Tobii's instructions
2. Check Python can import SDK:
   ```python
   import tobii.sdk.mainloop  # Should not raise ImportError
   ```
3. Contact Tobii support if issues persist

## Testing

Run adapter tests:

```bash
# Test with mock adapter (no hardware needed)
pytest tests/test_adapters.py --mock

# Test with real hardware (specify SDK)
pytest tests/test_adapters.py --sdk tobii-pro
pytest tests/test_adapters.py --sdk tobii-x-series
```

## Migration Guide

If you were using the old direct SDK implementation:

**Before:**
```python
from jspsych_tobii import TobiiManager

manager = TobiiManager()  # Always used mock
```

**After:**
```python
from jspsych_tobii import TobiiManager
from jspsych_tobii.adapters import SDKType

# Auto-detect real hardware
manager = TobiiManager()

# Or explicit mock
manager = TobiiManager(use_mock=True)

# Or specific SDK
manager = TobiiManager(sdk_type=SDKType.TOBII_PRO)
```

The API remains the same - only initialization changes.

## Performance Notes

- **Tobii Pro Adapter**: Full 3D gaze origin data, high precision
- **Tobii X-Series Adapter**: 2D gaze point only (legacy SDK limitation)
- **Mock Adapter**: 120 Hz simulation with realistic eye movement patterns

## License

Same as jsPsych-Tobii main package (MIT).

## Support

- **GitHub Issues**: https://github.com/jspsych/jspsych-tobii/issues
- **Tobii Hardware/SDK Support**: https://www.tobii.com/support
