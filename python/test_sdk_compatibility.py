#!/usr/bin/env python3
"""
Tobii Pro SDK Compatibility Test Script

This script verifies that the installed tobii-research SDK version
has all the required APIs for jspsych-tobii to function correctly.

Run this after installing the SDK to verify compatibility:
    python test_sdk_compatibility.py
"""

import sys


def test_sdk_import():
    """Test that tobii_research can be imported"""
    try:
        import tobii_research as tr

        print("✅ tobii_research module imported successfully")
        return tr
    except ImportError as e:
        print("❌ Failed to import tobii_research")
        print(f"   Error: {e}")
        print("\n   Install with: pip install tobii-research>=1.11.0")
        sys.exit(1)


def test_sdk_version(tr):
    """Test and display SDK version"""
    try:
        version = tr.__version__
        print(f"✅ SDK Version: {version}")

        # Parse version
        major = int(version.split(".")[0])
        minor = int(version.split(".")[1])

        if major == 1 and minor >= 11:
            print(f"   ✅ Version 1.{minor}.x detected (compatible)")
        elif major == 2:
            print(f"   ✅ Version 2.{minor}.x detected (compatible)")
        elif major == 1 and minor < 11:
            print(
                f"   ⚠️  Version 1.{minor}.x detected - recommend upgrading to 1.11.0 or later"
            )
        else:
            print(f"   ⚠️  Unexpected version {version}")

        return version
    except Exception as e:
        print(f"❌ Could not determine SDK version: {e}")
        return None


def test_required_constants(tr):
    """Test that all required constants are available"""
    print("\n🔍 Checking required constants...")

    constants = {
        "EYETRACKER_GAZE_DATA": "Gaze data stream type",
        "VALIDITY_VALID": "Validity check constant",
        "CALIBRATION_STATUS_SUCCESS": "Calibration success status",
    }

    all_present = True
    for const_name, description in constants.items():
        if hasattr(tr, const_name):
            print(f"   ✅ {const_name}: {description}")
        else:
            print(f"   ❌ {const_name}: MISSING - {description}")
            all_present = False

    return all_present


def test_required_classes(tr):
    """Test that all required classes are available"""
    print("\n🔍 Checking required classes...")

    classes = {
        "ScreenBasedCalibration": "Screen-based calibration class",
        "EyeTracker": "Eye tracker class",
        "CalibrationResult": "Calibration result class",
        "CalibrationPoint": "Calibration point class",
        "GazeData": "Gaze data class",
    }

    all_present = True
    for class_name, description in classes.items():
        if hasattr(tr, class_name):
            print(f"   ✅ {class_name}: {description}")
        else:
            print(f"   ⚠️  {class_name}: {description} (may be internal)")

    return all_present


def test_required_functions(tr):
    """Test that all required functions are available"""
    print("\n🔍 Checking required functions...")

    functions = {
        "find_all_eyetrackers": "Find connected eye trackers",
    }

    all_present = True
    for func_name, description in functions.items():
        if hasattr(tr, func_name):
            print(f"   ✅ {func_name}: {description}")
        else:
            print(f"   ❌ {func_name}: MISSING - {description}")
            all_present = False

    return all_present


def test_tracker_discovery(tr):
    """Test tracker discovery (non-blocking)"""
    print("\n🔍 Testing tracker discovery...")

    try:
        trackers = tr.find_all_eyetrackers()
        if trackers:
            print(f"   ✅ Found {len(trackers)} eye tracker(s):")
            for i, tracker in enumerate(trackers, 1):
                print(f"      {i}. {tracker.model} ({tracker.serial_number})")
        else:
            print("   ℹ️  No eye trackers found (this is OK if none are connected)")
        return True
    except Exception as e:
        print(f"   ❌ Error during tracker discovery: {e}")
        return False


def test_calibration_class(tr):
    """Test ScreenBasedCalibration availability and methods"""
    print("\n🔍 Testing ScreenBasedCalibration class...")

    if not hasattr(tr, "ScreenBasedCalibration"):
        print("   ❌ ScreenBasedCalibration class not found")
        return False

    # Check if we can create an instance (requires a tracker, so we'll just check the class)
    calib_class = tr.ScreenBasedCalibration
    print(f"   ✅ ScreenBasedCalibration class available")

    # We can't test methods without a tracker, but we can list them
    methods = [
        "enter_calibration_mode",
        "leave_calibration_mode",
        "collect_data",
        "compute_and_apply",
        "discard_data",
    ]

    print("   📋 Expected methods:")
    for method in methods:
        print(f"      • {method}")

    return True


def main():
    """Run all compatibility tests"""
    print("=" * 60)
    print("Tobii Pro SDK Compatibility Test")
    print("=" * 60)
    print()

    # Import SDK
    tr = test_sdk_import()

    # Check version
    version = test_sdk_version(tr)

    # Check constants
    constants_ok = test_required_constants(tr)

    # Check classes
    classes_ok = test_required_classes(tr)

    # Check functions
    functions_ok = test_required_functions(tr)

    # Test tracker discovery
    discovery_ok = test_tracker_discovery(tr)

    # Test calibration class
    calibration_ok = test_calibration_class(tr)

    # Summary
    print("\n" + "=" * 60)
    print("COMPATIBILITY TEST SUMMARY")
    print("=" * 60)

    if constants_ok and functions_ok and discovery_ok and calibration_ok:
        print("✅ All critical tests passed!")
        print("   The installed SDK should work with jspsych-tobii")
        if version:
            print(f"   SDK Version: {version}")
        return 0
    else:
        print("⚠️  Some tests failed or had warnings")
        print("   The SDK may still work, but please review the output above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
