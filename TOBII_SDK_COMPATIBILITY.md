# Tobii Pro SDK Compatibility Report
## Version 1.11.0 vs 2.x Compatibility Analysis

**Date**: 2026-01-07
**Current Requirement**: `tobii-research>=1.11.0`
**Target**: Ensure compatibility with both 1.x and 2.x versions

---

## Executive Summary

✅ **The current implementation is compatible with both SDK 1.11.0 and 2.x versions**

The core APIs used in this project remain stable across the 1.x → 2.x transition. No breaking changes affect the functionality implemented in `python/jspsych_tobii/adapters/tobii_pro.py`.

---

## Version Timeline

- **1.11.0**: Released March 13, 2023 (Final 1.x release)
- **2.0.0**: Released August 22, 2024 (Major version with architectural changes)
- **2.1.0**: Released November 27, 2024 (Current latest)

---

## Breaking Changes in SDK 2.0/2.1

### 1. **Removed APIs** ✅ No Impact
- **Track Box APIs**: Removed in v2.0
  → Not used in our implementation
- **HMD (Head-Mounted Device) Support**: Removed in v2.1
  → Not used in our implementation

### 2. **New Requirements** ⚠️ User Action Required
- **Tobii Pro Spectrum**: Requires dedicated Network Runtime (available via Eye Tracker Manager 2.7.0+)
- **Deactivated Trackers**: No longer supported in v2.0+
- **Spectrum Users**: Must install Tobii Pro Eye Tracker Manager 2.7.0+ before using SDK 2.0+

### 3. **Improvements** ✅ Beneficial
- **Data Buffers**: Added to all high-throughput data streams in v2.0
  - Makes streams more resistant to data loss
  - Prevents disconnection issues from slow data consumption
  - **Backward compatible** - existing code benefits automatically
- **ARM64 Support**: Added in v2.1 for Apple Silicon Macs

---

## API Compatibility Analysis

### Core APIs Used (All Compatible ✅)

| API | Usage in Code | v1.11.0 | v2.x | Notes |
|-----|---------------|---------|------|-------|
| `find_all_eyetrackers()` | Finding available trackers | ✅ | ✅ | Stable |
| `subscribe_to()` | Start gaze data stream | ✅ | ✅ | Stable |
| `unsubscribe_from()` | Stop gaze data stream | ✅ | ✅ | Stable |
| `EYETRACKER_GAZE_DATA` | Stream type constant | ✅ | ✅ | Stable |
| `VALIDITY_VALID` | Validity checking | ✅ | ✅ | Stable |
| `CALIBRATION_STATUS_SUCCESS` | Calibration result | ✅ | ✅ | Stable |
| `ScreenBasedCalibration` | Calibration class | ✅ | ✅ | Stable |
| `enter_calibration_mode()` | Start calibration | ✅ | ✅ | Stable |
| `collect_data()` | Collect calibration point | ✅ | ✅ | Stable |
| `compute_and_apply()` | Apply calibration | ✅ | ✅ | Stable |
| `leave_calibration_mode()` | Exit calibration | ✅ | ✅ | Stable |

### Tracker Properties (All Compatible ✅)

- `tracker.model`
- `tracker.serial_number`
- `tracker.address`
- `tracker.device_name`
- `tracker.firmware_version`
- `tracker.get_gaze_output_frequency()`

### Gaze Data Attributes (All Compatible ✅)

- `gaze_data.left_gaze_point_on_display_area`
- `gaze_data.right_gaze_point_on_display_area`
- `gaze_data.left_gaze_point_validity`
- `gaze_data.right_gaze_point_validity`
- `gaze_data.system_time_stamp`
- `gaze_data.left_pupil_diameter`
- `gaze_data.right_pupil_diameter`
- `gaze_data.left_gaze_origin_in_user_coordinate_system`
- `gaze_data.right_gaze_origin_in_user_coordinate_system`

---

## Current Package Requirements

### requirements.txt
```
tobii-research>=1.11.0
```

### pyproject.toml
```toml
tobii-pro = ["tobii-research>=1.11.0"]
```

**Status**: ✅ These requirements work with both 1.x and 2.x

The `>=1.11.0` specification allows installation of:
- Version 1.11.0 (as requested)
- Any 2.x version (2.0.0, 2.1.0, or future releases)

---

## Recommendations

### 1. **Keep Current Version Specification** ✅
```python
tobii-research>=1.11.0
```

This allows users to install either:
- **1.11.0** for older/lab systems that require it
- **2.x** for new installations with latest features

### 2. **Update Documentation**
Add installation notes for users with Tobii Pro Spectrum:
```markdown
### Tobii Pro Spectrum Users
If using SDK 2.0+, install Tobii Pro Eye Tracker Manager 2.7.0 or later
to get the required Network Runtime.
```

### 3. **Optional: Add Version Detection**
Consider adding a version check to inform users of SDK version in use:
```python
import tobii_research as tr
print(f"Using Tobii Pro SDK version: {tr.__version__}")
```

### 4. **Testing Priority**
Test with both versions if possible:
- ✅ **Primary**: Version 1.11.0 (user requirement)
- ⚪ **Secondary**: Version 2.1.0 (latest)

---

## Compatibility Matrix

| Feature | v1.11.0 | v2.0.0 | v2.1.0 |
|---------|---------|---------|---------|
| Find trackers | ✅ | ✅ | ✅ |
| Gaze data streaming | ✅ | ✅ (buffered) | ✅ (buffered) |
| Screen-based calibration | ✅ | ✅ | ✅ |
| Tracker properties | ✅ | ✅ | ✅ |
| Tobii Pro Spectrum | ✅ (direct) | ✅ (runtime) | ✅ (runtime) |
| Deactivated trackers | ✅ | ❌ | ❌ |
| Track Box APIs | ✅ | ❌ (deprecated) | ❌ (removed) |
| HMD support | ✅ (deprecated) | ✅ (deprecated) | ❌ (removed) |
| Apple Silicon native | ❌ | ❌ | ✅ |

---

## Potential Issues & Mitigations

### Issue: Validity Constant Usage
**Location**: `tobii_pro.py:171-172, 236`

```python
left_valid=gaze_data.left_gaze_point_validity == tr.VALIDITY_VALID
```

**Status**: ✅ Should work in both versions, but alternative API exists

**Alternative** (for future reference):
```python
# Nested attribute access (also valid)
left_valid = gaze_data.left_eye.gaze_point.validity
```

Both patterns are supported in the SDK.

---

## Testing Checklist

To verify compatibility with version 1.11.0:

- [ ] Install SDK 1.11.0: `pip install tobii-research==1.11.0`
- [ ] Test tracker discovery: `find_trackers()`
- [ ] Test gaze data streaming: `subscribe_to_gaze_data()`
- [ ] Test calibration: `start_calibration()`, `collect_calibration_data()`, `compute_calibration()`
- [ ] Verify all tracker properties accessible
- [ ] Check validity constants work as expected

---

## References

- [Tobii Pro SDK What's New](https://developer.tobiipro.com/tobiiprosdk/whatsnew.html)
- [Tobii Pro SDK Python Documentation](https://developer.tobiipro.com/python.html)
- [tobii-research PyPI](https://pypi.org/project/tobii-research/)
- [Validity Codes Documentation](https://developer.tobiipro.com/commonconcepts/validitycodes.html)
- [Tobii Pro SDK Addons (Examples)](https://github.com/tobiipro/prosdk-addons-python)

---

## Conclusion

**✅ No code changes required for version 1.11.0 compatibility**

The current implementation using `tobii-research>=1.11.0` is compatible with:
- Version 1.11.0 (your requirement)
- Version 2.0.x (latest stable)
- Version 2.1.x (latest with ARM support)

Users can install the version that best suits their hardware and OS requirements.
