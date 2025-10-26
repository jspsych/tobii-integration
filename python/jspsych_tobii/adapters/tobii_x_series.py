"""
Adapter for Tobii X-series trackers using legacy Tobii Analytics SDK 3.0

Based on Tobii Pro Analytics SDK 3.0 API. This adapter provides compatibility
for older trackers like:
- Tobii X3-120
- Tobii X2-60
- Tobii X2-30
- Tobii X1 Light

API Reference: https://www.developer.tobiipro.com/python/python-oldmigrationsdk.html
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

# Try to import legacy Tobii Analytics SDK 3.0
try:
    # Correct namespace for Tobii Analytics SDK 3.0
    from tobii.eye_tracking_io.mainloop import MainloopThread
    from tobii.eye_tracking_io.browsing import EyetrackerBrowser
    from tobii.eye_tracking_io.basic import EyetrackerException

    TOBII_LEGACY_AVAILABLE = True
except ImportError:
    TOBII_LEGACY_AVAILABLE = False
    MainloopThread = None
    EyetrackerBrowser = None
    EyetrackerException = None


class TobiiXSeriesAdapter(TobiiTrackerAdapter):
    """
    Adapter for Tobii X-series eye trackers using the legacy Analytics SDK 3.0.

    Supports older Tobii trackers including:
    - Tobii X3-120
    - Tobii X2-60
    - Tobii X2-30
    - Tobii X1 Light

    Note: This requires the legacy Tobii Analytics SDK 3.0 to be installed.
    Contact Tobii support for SDK downloads and installation instructions.
    """

    def __init__(self) -> None:
        if not TOBII_LEGACY_AVAILABLE:
            raise ImportError(
                "Legacy Tobii Analytics SDK 3.0 not available. "
                "Install the Tobii Analytics SDK for X-series tracker support. "
                "Contact Tobii support for SDK downloads."
            )

        self.logger = logging.getLogger(__name__)
        self._tracker: Optional[Any] = None
        self._mainloop: Optional[MainloopThread] = None
        self._browser: Optional[EyetrackerBrowser] = None
        self._gaze_callback: Optional[Callable[[GazeDataPoint], None]] = None
        self._is_tracking = False
        self._in_calibration_mode = False
        self._found_trackers: List[Any] = []

    @property
    def sdk_name(self) -> str:
        return "tobii-analytics-sdk-3"

    @property
    def sdk_version(self) -> str:
        # Legacy SDK 3.0 version detection
        try:
            import tobii.eye_tracking_io
            return getattr(tobii.eye_tracking_io, "__version__", "3.0")
        except:
            return "3.0"

    def find_trackers(self) -> List[Any]:
        """Find all available Tobii X-series trackers using EyetrackerBrowser"""
        try:
            # Create mainloop thread for browsing
            if not self._mainloop:
                self._mainloop = MainloopThread()

            # Clear previous results
            self._found_trackers = []

            # Callback for when trackers are found
            def on_eyetracker_found(event_type: str, event_name: str, eyetracker_info: Any) -> None:
                if event_type == "add":
                    self._found_trackers.append(eyetracker_info)
                    self.logger.info(f"Found tracker: {eyetracker_info.product_id}")

            # Create and start browser
            self._browser = EyetrackerBrowser(on_eyetracker_found, self._mainloop)
            self._browser.start()

            # Wait a bit for trackers to be discovered (typically 2-3 seconds)
            import time
            time.sleep(3)

            # Stop browser
            self._browser.stop()
            self._browser = None

            return self._found_trackers

        except Exception as e:
            self.logger.error(f"Error finding trackers: {e}")
            return []

    def connect(self, tracker_address: Optional[str] = None) -> bool:
        """Connect to Tobii X-series tracker"""
        try:
            # Ensure mainloop is running
            if not self._mainloop:
                self._mainloop = MainloopThread()
                self._mainloop.start()

            # Find trackers if not already found
            if not self._found_trackers:
                trackers = self.find_trackers()
            else:
                trackers = self._found_trackers

            if not trackers:
                self.logger.error("No Tobii X-series trackers found")
                return False

            # Select tracker
            if tracker_address:
                # Find specific tracker by product_id (address in legacy SDK)
                tracker_info = None
                for t in trackers:
                    if t.product_id == tracker_address:
                        tracker_info = t
                        break
                if not tracker_info:
                    self.logger.error(f"Tracker not found with product_id: {tracker_address}")
                    return False
            else:
                # Use first available tracker
                tracker_info = trackers[0]

            # Get the EyeTracker object from the info
            # In Analytics SDK 3.0, the tracker info has factory and the factory creates the eyetracker
            self._tracker = tracker_info.factory.create_eyetracker()

            self.logger.info(f"Connected to X-series tracker: {tracker_info.model}")
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
                # StopTracking only if tracking
                if self._is_tracking:
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
            # Legacy SDK stores info from EyetrackerInfo
            # Need to get it via GetUnitInfo or access stored eyetracker_info
            # For simplicity, we'll get what we can from the tracker
            unit_info = self._tracker.GetUnitInfo()

            # Try to get framerate
            try:
                framerate = self._tracker.GetFramerate()
            except:
                framerate = None

            return TrackerInfo(
                model=unit_info.model if hasattr(unit_info, 'model') else "X-Series",
                serial_number=unit_info.serial_number if hasattr(unit_info, 'serial_number') else "Unknown",
                address=str(self._tracker),  # product_id not directly accessible after connection
                device_name=self._tracker.GetUnitName() if hasattr(self._tracker, 'GetUnitName') else "X-Series Tracker",
                firmware_version=unit_info.firmware_version if hasattr(unit_info, 'firmware_version') else None,
                sampling_frequency=framerate,
            )

        except Exception as e:
            self.logger.error(f"Error getting tracker info: {e}")
            # Return minimal info if we can't get details
            return TrackerInfo(
                model="Tobii X-Series",
                serial_number="Unknown",
                address="Unknown",
                device_name="X-Series Tracker",
            )

    def subscribe_to_gaze_data(self, callback: Callable[[GazeDataPoint], None]) -> bool:
        """Subscribe to gaze data stream using OnGazeDataReceived event"""
        if not self._tracker:
            self.logger.error("No tracker connected")
            return False

        try:
            self._gaze_callback = callback

            # Subscribe to gaze data event (Analytics SDK 3.0 API)
            self._tracker.events.OnGazeDataReceived += self._internal_gaze_callback

            # Start tracking
            self._tracker.StartTracking()
            self._is_tracking = True
            self.logger.info("Subscribed to gaze data (legacy SDK)")
            return True

        except Exception as e:
            self.logger.error(f"Error subscribing to gaze data: {e}")
            return False

    def unsubscribe_from_gaze_data(self) -> bool:
        """Unsubscribe from gaze data stream"""
        if not self._tracker:
            return False

        try:
            # Stop tracking first
            self._tracker.StopTracking()

            # Unsubscribe from event
            self._tracker.events.OnGazeDataReceived -= self._internal_gaze_callback

            self._is_tracking = False
            self._gaze_callback = None
            self.logger.info("Unsubscribed from gaze data")
            return True

        except Exception as e:
            self.logger.error(f"Error unsubscribing from gaze data: {e}")
            return False

    def _internal_gaze_callback(self, error: Any, gaze_data: Any) -> None:
        """
        Internal callback that converts Analytics SDK 3.0 GazeDataItem to standardized format.

        GazeDataItem structure (Analytics SDK 3.0):
        - Timestamp: Device timestamp (microseconds)
        - LeftGazePoint2D: (x, y) in normalized coordinates
        - RightGazePoint2D: (x, y) in normalized coordinates
        - LeftValidity: 0-4 (0 = valid, 4 = invalid)
        - RightValidity: 0-4 (0 = valid, 4 = invalid)
        - LeftPupil: Pupil diameter in mm
        - RightPupil: Pupil diameter in mm
        """
        if error or not self._gaze_callback:
            if error:
                self.logger.warning(f"Gaze data error: {error}")
            return

        try:
            # Determine which eye has valid data
            left_valid = gaze_data.LeftValidity == 0
            right_valid = gaze_data.RightValidity == 0

            # Use valid eye data, prefer left if both valid
            if left_valid:
                gaze_x = gaze_data.LeftGazePoint2D.x
                gaze_y = gaze_data.LeftGazePoint2D.y
            elif right_valid:
                gaze_x = gaze_data.RightGazePoint2D.x
                gaze_y = gaze_data.RightGazePoint2D.y
            else:
                # No valid data, use left anyway as fallback
                gaze_x = gaze_data.LeftGazePoint2D.x if hasattr(gaze_data.LeftGazePoint2D, 'x') else 0.5
                gaze_y = gaze_data.LeftGazePoint2D.y if hasattr(gaze_data.LeftGazePoint2D, 'y') else 0.5

            # Convert to standardized format
            standardized = GazeDataPoint(
                x=gaze_x,
                y=gaze_y,
                timestamp=gaze_data.Timestamp / 1000.0,  # Convert microseconds to milliseconds
                left_valid=left_valid,
                right_valid=right_valid,
                left_pupil_diameter=gaze_data.LeftPupil if hasattr(gaze_data, 'LeftPupil') else 0.0,
                right_pupil_diameter=gaze_data.RightPupil if hasattr(gaze_data, 'RightPupil') else 0.0,
                # Analytics SDK 3.0 has 3D data in LeftEyePosition3D, RightEyePosition3D
                left_gaze_origin_x=gaze_data.LeftEyePosition3D.x if hasattr(gaze_data, 'LeftEyePosition3D') else None,
                left_gaze_origin_y=gaze_data.LeftEyePosition3D.y if hasattr(gaze_data, 'LeftEyePosition3D') else None,
                left_gaze_origin_z=gaze_data.LeftEyePosition3D.z if hasattr(gaze_data, 'LeftEyePosition3D') else None,
                right_gaze_origin_x=gaze_data.RightEyePosition3D.x if hasattr(gaze_data, 'RightEyePosition3D') else None,
                right_gaze_origin_y=gaze_data.RightEyePosition3D.y if hasattr(gaze_data, 'RightEyePosition3D') else None,
                right_gaze_origin_z=gaze_data.RightEyePosition3D.z if hasattr(gaze_data, 'RightEyePosition3D') else None,
            )

            self._gaze_callback(standardized)

        except Exception as e:
            self.logger.error(f"Error processing gaze data: {e}")

    def start_calibration(self) -> bool:
        """
        Start calibration mode using Analytics SDK 3.0 API.

        In legacy SDK: StartCalibration() (equivalent to enter + clear in new SDK)
        """
        if not self._tracker:
            self.logger.error("No tracker connected")
            return False

        try:
            # StartCalibration in legacy SDK clears previous calibration and enters mode
            self._tracker.StartCalibration()
            self._in_calibration_mode = True
            self.logger.info("Entered calibration mode (legacy SDK)")
            return True

        except Exception as e:
            self.logger.error(f"Error starting calibration: {e}")
            return False

    def collect_calibration_data(self, point: CalibrationPoint) -> bool:
        """
        Collect calibration data for a point.

        In legacy SDK: AddCalibrationPoint(x, y)
        """
        if not self._in_calibration_mode:
            self.logger.error("Not in calibration mode")
            return False

        try:
            # AddCalibrationPoint in legacy SDK (normalized coordinates 0-1)
            self._tracker.AddCalibrationPoint(point.x, point.y)
            self.logger.info(f"Collected calibration point ({point.x:.3f}, {point.y:.3f})")
            return True

        except Exception as e:
            self.logger.error(f"Error collecting calibration data: {e}")
            return False

    def compute_calibration(self) -> CalibrationResult:
        """
        Compute calibration from collected data.

        In legacy SDK: ComputeCalibration() returns calibration state object
        """
        if not self._in_calibration_mode:
            return CalibrationResult(success=False)

        try:
            # Compute calibration (legacy SDK)
            calib_state = self._tracker.ComputeCalibration()

            # Check calibration state
            # In Analytics SDK 3.0, we get a State object back
            # We need to check state_flag and get_error_approximation
            try:
                # Try to get error approximation
                error = calib_state.get_error_approximation()
                # Convert from degrees to a simple average
                avg_error = error if error is not None else None
            except:
                avg_error = None

            # Apply calibration by calling SetCalibration with the computed state
            try:
                self._tracker.SetCalibration(calib_state)
                success = True
                self.logger.info(f"Calibration computed and applied (error: {avg_error})")
            except Exception as e:
                self.logger.warning(f"Calibration computed but not applied: {e}")
                success = False

            return CalibrationResult(
                success=success,
                average_error=avg_error,
            )

        except Exception as e:
            self.logger.error(f"Error computing calibration: {e}")
            return CalibrationResult(success=False)

    def discard_calibration_data(self, point: Optional[CalibrationPoint] = None) -> bool:
        """
        Discard calibration data.

        In legacy SDK: RemoveCalibrationPoint(x, y) or ClearCalibration()
        """
        if not self._in_calibration_mode:
            return False

        try:
            if point:
                # Remove specific point
                self._tracker.RemoveCalibrationPoint(point.x, point.y)
                self.logger.info(f"Removed calibration point ({point.x:.3f}, {point.y:.3f})")
            else:
                # Clear all points - need to restart calibration
                self._tracker.StopCalibration()
                self._tracker.StartCalibration()
                self.logger.info("Cleared all calibration points")

            return True

        except Exception as e:
            self.logger.error(f"Error discarding calibration data: {e}")
            return False

    def leave_calibration_mode(self) -> bool:
        """
        Exit calibration mode.

        In legacy SDK: StopCalibration()
        """
        if not self._in_calibration_mode:
            return False

        try:
            self._tracker.StopCalibration()
            self._in_calibration_mode = False
            self.logger.info("Left calibration mode (legacy SDK)")
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
