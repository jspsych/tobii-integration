"""
Adapter for Tobii X-series trackers using legacy Tobii Analytics SDK

Note: The legacy Tobii Analytics SDK uses a different API structure.
This adapter provides compatibility for older trackers like:
- Tobii X3-120
- Tobii X2-60
- Tobii X2-30
- Tobii X1 Light
"""

import logging
from typing import Optional, Callable, List, Any

from .base import (
    TobiiTrackerAdapter,
    GazeDataPoint,
    TrackerInfo,
    CalibrationPoint,
    CalibrationResult,
)

# Try to import legacy Tobii SDK
try:
    # The legacy SDK might be imported differently depending on version
    # Common patterns: tobii.sdk, tobii_controller, tobiigazesdk
    import tobii.sdk.mainloop as mainloop
    import tobii.sdk.browsing as browsing
    import tobii.sdk.eyetracker as eyetracker

    TOBII_LEGACY_AVAILABLE = True
except ImportError:
    try:
        # Alternative import path for some versions
        from tobiigazesdk import *

        TOBII_LEGACY_AVAILABLE = True
    except ImportError:
        TOBII_LEGACY_AVAILABLE = False


class TobiiXSeriesAdapter(TobiiTrackerAdapter):
    """
    Adapter for Tobii X-series eye trackers using the legacy Analytics SDK.

    Supports older Tobii trackers including:
    - Tobii X3-120
    - Tobii X2-60
    - Tobii X2-30
    - Tobii X1 Light

    Note: This requires the legacy Tobii Analytics SDK to be installed.
    Installation varies by platform and SDK version.
    """

    def __init__(self) -> None:
        if not TOBII_LEGACY_AVAILABLE:
            raise ImportError(
                "Legacy Tobii SDK not available. "
                "Install the Tobii Analytics SDK for X-series tracker support. "
                "Contact Tobii support for SDK downloads."
            )

        self.logger = logging.getLogger(__name__)
        self._tracker: Optional[Any] = None
        self._mainloop: Optional[Any] = None
        self._gaze_callback: Optional[Callable[[GazeDataPoint], None]] = None
        self._is_tracking = False
        self._in_calibration_mode = False
        self._calibration_points: List[CalibrationPoint] = []

    @property
    def sdk_name(self) -> str:
        return "tobii-analytics-sdk"

    @property
    def sdk_version(self) -> str:
        # Legacy SDK version detection varies
        try:
            return getattr(eyetracker, "__version__", "unknown")
        except:
            return "unknown"

    def find_trackers(self) -> List[Any]:
        """Find all available Tobii X-series trackers"""
        try:
            # Create mainloop for browsing
            if not self._mainloop:
                self._mainloop = mainloop.MainloopThread()

            browser = browsing.EyetrackerBrowser(self._mainloop)
            trackers = []

            def on_tracker_found(tracker_info: Any) -> None:
                trackers.append(tracker_info)

            browser.start(on_tracker_found)
            browser.wait_until_found(timeout=5000)  # 5 second timeout
            browser.stop()

            return trackers

        except Exception as e:
            self.logger.error(f"Error finding trackers: {e}")
            return []

    def connect(self, tracker_address: Optional[str] = None) -> bool:
        """Connect to Tobii X-series tracker"""
        try:
            if not self._mainloop:
                self._mainloop = mainloop.MainloopThread()

            if tracker_address:
                # Connect to specific tracker
                self._tracker = eyetracker.Eyetracker(tracker_address)
            else:
                # Auto-detect first available
                trackers = self.find_trackers()
                if not trackers:
                    self.logger.error("No Tobii X-series trackers found")
                    return False

                tracker_info = trackers[0]
                self._tracker = eyetracker.Eyetracker(tracker_info.product_id)

            # Initialize connection
            self._tracker.RunEventLoop()
            self.logger.info(f"Connected to X-series tracker")
            return True

        except Exception as e:
            self.logger.error(f"Error connecting to tracker: {e}")
            return False

    def disconnect(self) -> bool:
        """Disconnect from tracker"""
        try:
            if self._is_tracking:
                self.unsubscribe_from_gaze_data()
            if self._in_calibration_mode:
                self.leave_calibration_mode()

            if self._tracker:
                self._tracker.StopTracking()
                self._tracker = None

            if self._mainloop:
                self._mainloop.stop()
                self._mainloop = None

            self.logger.info("Disconnected from tracker")
            return True

        except Exception as e:
            self.logger.error(f"Error disconnecting: {e}")
            return False

    def get_tracker_info(self) -> Optional[TrackerInfo]:
        """Get tracker information"""
        if not self._tracker:
            return None

        try:
            info = self._tracker.GetDeviceInfo()
            return TrackerInfo(
                model=info.model,
                serial_number=info.serialNumber,
                address=info.productId,
                device_name=info.productId,
                firmware_version=getattr(info, "firmwareVersion", None),
                sampling_frequency=getattr(info, "framerate", None),
            )

        except Exception as e:
            self.logger.error(f"Error getting tracker info: {e}")
            return None

    def subscribe_to_gaze_data(self, callback: Callable[[GazeDataPoint], None]) -> bool:
        """Subscribe to gaze data stream"""
        if not self._tracker:
            self.logger.error("No tracker connected")
            return False

        try:
            self._gaze_callback = callback
            self._tracker.events.OnGazeDataReceived += self._internal_gaze_callback
            self._tracker.StartTracking()
            self._is_tracking = True
            self.logger.info("Subscribed to gaze data")
            return True

        except Exception as e:
            self.logger.error(f"Error subscribing to gaze data: {e}")
            return False

    def unsubscribe_from_gaze_data(self) -> bool:
        """Unsubscribe from gaze data stream"""
        if not self._tracker:
            return False

        try:
            self._tracker.StopTracking()
            self._tracker.events.OnGazeDataReceived -= self._internal_gaze_callback
            self._is_tracking = False
            self._gaze_callback = None
            self.logger.info("Unsubscribed from gaze data")
            return True

        except Exception as e:
            self.logger.error(f"Error unsubscribing from gaze data: {e}")
            return False

    def _internal_gaze_callback(self, error: Any, gaze_data: Any) -> None:
        """Internal callback that converts SDK data to standardized format"""
        if error or not self._gaze_callback:
            return

        try:
            # Convert legacy SDK gaze data to standardized format
            # Note: Field names may vary by SDK version
            standardized = GazeDataPoint(
                x=gaze_data.LeftGazePoint2D.x
                if gaze_data.LeftValidity == 0
                else gaze_data.RightGazePoint2D.x,
                y=gaze_data.LeftGazePoint2D.y
                if gaze_data.LeftValidity == 0
                else gaze_data.RightGazePoint2D.y,
                timestamp=gaze_data.Timestamp / 1000.0,  # Convert microseconds to ms
                left_valid=gaze_data.LeftValidity == 0,  # 0 = valid in legacy SDK
                right_valid=gaze_data.RightValidity == 0,
                left_pupil_diameter=gaze_data.LeftPupil,
                right_pupil_diameter=gaze_data.RightPupil,
                # Legacy SDK may not have 3D origin data
                left_gaze_origin_x=None,
                left_gaze_origin_y=None,
                left_gaze_origin_z=None,
                right_gaze_origin_x=None,
                right_gaze_origin_y=None,
                right_gaze_origin_z=None,
            )

            self._gaze_callback(standardized)

        except Exception as e:
            self.logger.error(f"Error processing gaze data: {e}")

    def start_calibration(self) -> bool:
        """Start calibration mode"""
        if not self._tracker:
            self.logger.error("No tracker connected")
            return False

        try:
            self._tracker.StartCalibration()
            self._in_calibration_mode = True
            self._calibration_points = []
            self.logger.info("Entered calibration mode")
            return True

        except Exception as e:
            self.logger.error(f"Error starting calibration: {e}")
            return False

    def collect_calibration_data(self, point: CalibrationPoint) -> bool:
        """Collect calibration data for a point"""
        if not self._in_calibration_mode:
            self.logger.error("Not in calibration mode")
            return False

        try:
            # Add calibration point
            self._tracker.AddCalibrationPoint(point.x, point.y)
            self._calibration_points.append(point)
            return True

        except Exception as e:
            self.logger.error(f"Error collecting calibration data: {e}")
            return False

    def compute_calibration(self) -> CalibrationResult:
        """Compute calibration from collected data"""
        if not self._in_calibration_mode:
            return CalibrationResult(success=False)

        try:
            # Compute calibration
            result = self._tracker.ComputeCalibration()

            # The result format varies by SDK version
            # This is a simplified version
            if hasattr(result, "Status") and result.Status == "Success":
                return CalibrationResult(
                    success=True,
                    average_error=getattr(result, "AverageError", None),
                )
            else:
                return CalibrationResult(success=False)

        except Exception as e:
            self.logger.error(f"Error computing calibration: {e}")
            return CalibrationResult(success=False)

    def discard_calibration_data(self, point: Optional[CalibrationPoint] = None) -> bool:
        """Discard calibration data"""
        if not self._in_calibration_mode:
            return False

        try:
            if point:
                self._tracker.RemoveCalibrationPoint(point.x, point.y)
                self._calibration_points.remove(point)
            else:
                self._tracker.ClearCalibration()
                self._calibration_points = []
            return True

        except Exception as e:
            self.logger.error(f"Error discarding calibration data: {e}")
            return False

    def leave_calibration_mode(self) -> bool:
        """Exit calibration mode"""
        if not self._in_calibration_mode:
            return False

        try:
            self._tracker.StopCalibration()
            self._in_calibration_mode = False
            self._calibration_points = []
            self.logger.info("Left calibration mode")
            return True

        except Exception as e:
            self.logger.error(f"Error leaving calibration mode: {e}")
            return False

    def is_connected(self) -> bool:
        """Check if tracker is connected"""
        return self._tracker is not None

    def is_tracking(self) -> bool:
        """Check if currently tracking"""
        return self._is_tracking
