"""
Factory for creating appropriate Tobii tracker adapter based on available SDKs
"""

import logging
from typing import Optional, List, Dict, Any
from enum import Enum

from .base import TobiiTrackerAdapter


class SDKType(Enum):
    """Available SDK types"""

    TOBII_PRO = "tobii-research"
    TOBII_X_SERIES = "tobii-analytics-sdk"
    MOCK = "mock"


def get_available_sdks() -> List[Dict[str, Any]]:
    """
    Detect which Tobii SDKs are available.

    Returns:
        List of dictionaries with SDK information:
        [{"type": SDKType, "name": str, "version": str, "available": bool}]
    """
    logger = logging.getLogger(__name__)
    available = []

    # Check for tobii-research (Tobii Pro)
    try:
        import tobii_research as tr

        available.append(
            {
                "type": SDKType.TOBII_PRO,
                "name": "Tobii Pro (tobii-research)",
                "version": getattr(tr, "__version__", "unknown"),
                "available": True,
            }
        )
    except ImportError:
        available.append(
            {
                "type": SDKType.TOBII_PRO,
                "name": "Tobii Pro (tobii-research)",
                "version": None,
                "available": False,
            }
        )

    # Check for legacy Tobii SDK (X-series)
    legacy_available = False
    try:
        import tobii.sdk.mainloop

        legacy_available = True
    except ImportError:
        try:
            from tobiigazesdk import *

            legacy_available = True
        except ImportError:
            pass

    if legacy_available:
        available.append(
            {
                "type": SDKType.TOBII_X_SERIES,
                "name": "Tobii X-Series (Analytics SDK)",
                "version": "unknown",
                "available": True,
            }
        )
    else:
        available.append(
            {
                "type": SDKType.TOBII_X_SERIES,
                "name": "Tobii X-Series (Analytics SDK)",
                "version": None,
                "available": False,
            }
        )

    return available


def create_tracker_adapter(
    sdk_type: Optional[SDKType] = None, use_mock: bool = False
) -> TobiiTrackerAdapter:
    """
    Create appropriate tracker adapter based on SDK type.

    Args:
        sdk_type: Specific SDK to use, or None for auto-detection
        use_mock: If True, use mock tracker regardless of available SDKs

    Returns:
        TobiiTrackerAdapter instance

    Raises:
        ImportError: If no SDK is available or specified SDK not found
    """
    logger = logging.getLogger(__name__)

    # Mock mode for testing
    if use_mock:
        logger.info("Using mock tracker adapter")
        from .mock import MockTrackerAdapter

        return MockTrackerAdapter()

    # Get available SDKs
    available_sdks = get_available_sdks()
    available_types = [sdk["type"] for sdk in available_sdks if sdk["available"]]

    # If specific SDK requested, use it
    if sdk_type:
        if sdk_type not in available_types:
            raise ImportError(
                f"Requested SDK '{sdk_type.value}' is not available. "
                f"Available SDKs: {[sdk.value for sdk in available_types]}"
            )

        if sdk_type == SDKType.TOBII_PRO:
            from .tobii_pro import TobiiProAdapter

            logger.info("Using Tobii Pro adapter (tobii-research SDK)")
            return TobiiProAdapter()

        elif sdk_type == SDKType.TOBII_X_SERIES:
            from .tobii_x_series import TobiiXSeriesAdapter

            logger.info("Using Tobii X-Series adapter (legacy SDK)")
            return TobiiXSeriesAdapter()

    # Auto-detection: prefer modern SDK over legacy
    if SDKType.TOBII_PRO in available_types:
        from .tobii_pro import TobiiProAdapter

        logger.info("Auto-detected: Using Tobii Pro adapter (tobii-research SDK)")
        return TobiiProAdapter()

    if SDKType.TOBII_X_SERIES in available_types:
        from .tobii_x_series import TobiiXSeriesAdapter

        logger.info("Auto-detected: Using Tobii X-Series adapter (legacy SDK)")
        return TobiiXSeriesAdapter()

    # No SDK available - suggest mock mode or installation
    raise ImportError(
        "No Tobii SDK found. Install one of:\n"
        "  - Tobii Pro: pip install tobii-research\n"
        "  - Tobii X-Series: Install legacy Analytics SDK from Tobii\n"
        "Or use mock mode: create_tracker_adapter(use_mock=True)"
    )


def print_sdk_status() -> None:
    """
    Print status of available Tobii SDKs.

    Useful for debugging and setup verification.
    """
    print("\n=== Tobii SDK Status ===\n")

    sdks = get_available_sdks()
    for sdk in sdks:
        status = "✓ Available" if sdk["available"] else "✗ Not installed"
        version = f" (v{sdk['version']})" if sdk["version"] else ""
        print(f"{status}: {sdk['name']}{version}")

    print("\n" + "=" * 24 + "\n")

    # Print recommendations
    available = [sdk for sdk in sdks if sdk["available"]]
    if not available:
        print("⚠ No Tobii SDKs installed!")
        print("\nTo install:")
        print("  • Tobii Pro series: pip install tobii-research")
        print("  • Tobii X-series: Contact Tobii support for legacy SDK")
    else:
        print(f"✓ {len(available)} SDK(s) available")
        if len(available) > 1:
            print("  Note: Tobii Pro SDK will be preferred for auto-detection")
