"""
Adapter for Tobii Pro series trackers using tobii-research SDK
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

# Try to import tobii_research
try:
    import tobii_research as tr

    TOBII_RESEARCH_AVAILABLE = True
except ImportError:
    TOBII_RESEARCH_AVAILABLE = False
    tr = None


class TobiiProAdapter(TobiiTrackerAdapter):
    """
    Adapter for Tobii Pro series eye trackers.

    Supports trackers using the tobii-research SDK:
    - Tobii Pro Spectrum
    - Tobii Pro Fusion
    - Tobii Pro Nano
    - Tobii Pro TX300
    - And other Tobii Pro series trackers
    """

    def __init__(self) -> None:
        if not TOBII_RESEARCH_AVAILABLE:
            raise ImportError(
                "tobii-research SDK not available. Install with: pip install tobii-research"
            )

        self.logger = logging.getLogger(__name__)
        self._tracker: Optional[Any] = None
        self._gaze_callback: Optional[Callable[[GazeDataPoint], None]] = None
        self._is_tracking = False
        self._in_calibration_mode = False

    @property
    def sdk_name(self) -> str:
        return "tobii-research"

    @property
    def sdk_version(self) -> str:
        return getattr(tr, "__version__", "unknown") if tr else "unknown"

    def find_trackers(self) -> List[Any]:
        """Find all available Tobii Pro trackers"""
        try:
            return tr.find_all_eyetrackers()
        except Exception as e:
            self.logger.error(f"Error finding trackers: {e}")
            return []

    def connect(self, tracker_address: Optional[str] = None) -> bool:
        """Connect to Tobii Pro tracker"""
        try:
            if tracker_address:
                # Connect to specific tracker by address
                trackers = self.find_trackers()
                for tracker in trackers:
                    if tracker.address == tracker_address:
                        self._tracker = tracker
                        self.logger.info(f"Connected to tracker: {tracker.model}")
                        return True
                self.logger.error(f"Tracker not found at address: {tracker_address}")
                return False
            else:
                # Auto-detect first available tracker
                trackers = self.find_trackers()
                if not trackers:
                    self.logger.error("No Tobii Pro trackers found")
                    return False
                self._tracker = trackers[0]
                self.logger.info(f"Connected to tracker: {self._tracker.model}")
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
            self._tracker = None
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
            return TrackerInfo(
                model=self._tracker.model,
                serial_number=self._tracker.serial_number,
                address=self._tracker.address,
                device_name=self._tracker.device_name,
                firmware_version=self._tracker.firmware_version,
                sampling_frequency=self._tracker.get_gaze_output_frequency(),
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
            self._tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, self._internal_gaze_callback)
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
            self._tracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, self._internal_gaze_callback)
            self._is_tracking = False
            self._gaze_callback = None
            self.logger.info("Unsubscribed from gaze data")
            return True
        except Exception as e:
            self.logger.error(f"Error unsubscribing from gaze data: {e}")
            return False

    def _internal_gaze_callback(self, gaze_data: Any) -> None:
        """Internal callback that converts SDK data to standardized format"""
        if not self._gaze_callback:
            return

        try:
            # Convert tobii-research gaze data to standardized format
            standardized = GazeDataPoint(
                x=gaze_data.left_gaze_point_on_display_area[0]
                if gaze_data.left_gaze_point_validity
                else gaze_data.right_gaze_point_on_display_area[0],
                y=gaze_data.left_gaze_point_on_display_area[1]
                if gaze_data.left_gaze_point_validity
                else gaze_data.right_gaze_point_on_display_area[1],
                timestamp=gaze_data.system_time_stamp / 1000.0,  # Convert to ms
                left_valid=gaze_data.left_gaze_point_validity == tr.VALIDITY_VALID,
                right_valid=gaze_data.right_gaze_point_validity == tr.VALIDITY_VALID,
                left_pupil_diameter=gaze_data.left_pupil_diameter,
                right_pupil_diameter=gaze_data.right_pupil_diameter,
                left_gaze_origin_x=gaze_data.left_gaze_origin_in_user_coordinate_system[0],
                left_gaze_origin_y=gaze_data.left_gaze_origin_in_user_coordinate_system[1],
                left_gaze_origin_z=gaze_data.left_gaze_origin_in_user_coordinate_system[2],
                right_gaze_origin_x=gaze_data.right_gaze_origin_in_user_coordinate_system[0],
                right_gaze_origin_y=gaze_data.right_gaze_origin_in_user_coordinate_system[1],
                right_gaze_origin_z=gaze_data.right_gaze_origin_in_user_coordinate_system[2],
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
            calibration = tr.ScreenBasedCalibration(self._tracker)
            self._calibration = calibration
            calibration.enter_calibration_mode()
            self._in_calibration_mode = True
            self.logger.info("Entered calibration mode")
            return True
        except Exception as e:
            self.logger.error(f"Error starting calibration: {e}")
            return False

    def collect_calibration_data(self, point: CalibrationPoint) -> bool:
        """Collect calibration data for a point"""
        if not hasattr(self, "_calibration"):
            self.logger.error("Not in calibration mode")
            return False

        try:
            result = self._calibration.collect_data(point.x, point.y)
            if result != tr.CALIBRATION_STATUS_SUCCESS:
                self.logger.warning(f"Calibration data collection had status: {result}")
                return False
            return True
        except Exception as e:
            self.logger.error(f"Error collecting calibration data: {e}")
            return False

    def compute_calibration(self) -> CalibrationResult:
        """Compute calibration from collected data"""
        if not hasattr(self, "_calibration"):
            return CalibrationResult(success=False)

        try:
            result = self._calibration.compute_and_apply()

            if result.status != tr.CALIBRATION_STATUS_SUCCESS:
                return CalibrationResult(success=False)

            # Calculate average error from calibration points
            errors = []
            for point in result.calibration_points:
                for sample in point.calibration_samples:
                    if sample.left_eye.validity == tr.VALIDITY_VALID:
                        errors.append(self._calculate_error_degrees(sample.left_eye))
                    if sample.right_eye.validity == tr.VALIDITY_VALID:
                        errors.append(self._calculate_error_degrees(sample.right_eye))

            avg_error = sum(errors) / len(errors) if errors else None

            return CalibrationResult(
                success=True,
                average_error=avg_error,
                point_errors=errors if errors else None,
            )

        except Exception as e:
            self.logger.error(f"Error computing calibration: {e}")
            return CalibrationResult(success=False)

    def _calculate_error_degrees(self, eye_data: Any) -> float:
        """Calculate calibration error in degrees for an eye"""
        # This is a simplified calculation
        # In practice, you'd use the actual geometry and position data
        import math

        # Get the position on screen (normalized)
        pos = eye_data.position_on_display_area

        # Simple approximation: convert normalized screen distance to degrees
        # Assumes typical viewing geometry (this should be calibrated for your setup)
        screen_distance_cm = 65.0
        screen_width_cm = 50.0
        pixels_per_cm = 1920 / screen_width_cm

        # Calculate angular error (simplified)
        error_x = abs(pos[0] - 0.5) * screen_width_cm
        error_y = abs(pos[1] - 0.5) * screen_width_cm
        error_distance = math.sqrt(error_x**2 + error_y**2)

        # Convert to degrees
        error_degrees = math.degrees(math.atan(error_distance / screen_distance_cm))

        return error_degrees

    def discard_calibration_data(self, point: Optional[CalibrationPoint] = None) -> bool:
        """Discard calibration data"""
        if not hasattr(self, "_calibration"):
            return False

        try:
            if point:
                self._calibration.discard_data(point.x, point.y)
            else:
                # Discard all by leaving and re-entering calibration mode
                self._calibration.leave_calibration_mode()
                self._calibration.enter_calibration_mode()
            return True
        except Exception as e:
            self.logger.error(f"Error discarding calibration data: {e}")
            return False

    def leave_calibration_mode(self) -> bool:
        """Exit calibration mode"""
        if not hasattr(self, "_calibration"):
            return False

        try:
            self._calibration.leave_calibration_mode()
            self._in_calibration_mode = False
            delattr(self, "_calibration")
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
