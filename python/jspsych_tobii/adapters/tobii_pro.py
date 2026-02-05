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
    UserPositionData,
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
        self._latest_gaze_data: Optional[Any] = None
        # Lock for thread-safe access to latest gaze data (SDK callbacks run on separate thread)
        import threading

        self._gaze_data_lock = threading.Lock()

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
            if hasattr(self, "_position_gaze_subscribed") and self._position_gaze_subscribed:
                self.unsubscribe_from_position_gaze()
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
        # Store latest gaze data for user position queries (thread-safe)
        with self._gaze_data_lock:
            self._latest_gaze_data = gaze_data

        if not self._gaze_callback:
            return

        try:
            # Access nested structure: gaze_data.left_eye.gaze_point, etc.
            left_eye = gaze_data.left_eye
            right_eye = gaze_data.right_eye

            # Get gaze point data
            left_gaze_point = left_eye.gaze_point.position_on_display_area
            right_gaze_point = right_eye.gaze_point.position_on_display_area
            left_gaze_valid = left_eye.gaze_point.validity == 1
            right_gaze_valid = right_eye.gaze_point.validity == 1

            # Get gaze origin (eye position in user coordinates)
            left_origin = left_eye.gaze_origin.position_in_user_coordinates
            right_origin = right_eye.gaze_origin.position_in_user_coordinates

            # Get pupil data
            left_pupil = left_eye.pupil.diameter
            right_pupil = right_eye.pupil.diameter

            # Convert tobii-research gaze data to standardized format
            standardized = GazeDataPoint(
                x=left_gaze_point[0] if left_gaze_valid else right_gaze_point[0],
                y=left_gaze_point[1] if left_gaze_valid else right_gaze_point[1],
                timestamp=gaze_data.system_time_stamp / 1000.0,  # Convert to ms
                left_valid=left_gaze_valid,
                right_valid=right_gaze_valid,
                left_pupil_diameter=left_pupil,
                right_pupil_diameter=right_pupil,
                left_gaze_origin_x=left_origin[0] if left_origin else None,
                left_gaze_origin_y=left_origin[1] if left_origin else None,
                left_gaze_origin_z=left_origin[2] if left_origin else None,
                right_gaze_origin_x=right_origin[0] if right_origin else None,
                right_gaze_origin_y=right_origin[1] if right_origin else None,
                right_gaze_origin_z=right_origin[2] if right_origin else None,
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

            return CalibrationResult(success=True)

        except Exception as e:
            self.logger.error(f"Error computing calibration: {e}")
            return CalibrationResult(success=False)

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

    def _position_gaze_callback(self, gaze_data: Any) -> None:
        """Callback for position-only gaze subscription (activates illuminators)"""
        with self._gaze_data_lock:
            self._latest_gaze_data = gaze_data

    def unsubscribe_from_position_gaze(self) -> bool:
        """Unsubscribe from position-only gaze data"""
        if not self._tracker:
            return False

        try:
            if hasattr(self, "_position_gaze_subscribed") and self._position_gaze_subscribed:
                self._tracker.unsubscribe_from(
                    tr.EYETRACKER_GAZE_DATA, self._position_gaze_callback
                )
                self._position_gaze_subscribed = False
                self.logger.info("Unsubscribed from position gaze data")
            return True
        except Exception as e:
            self.logger.error(f"Error unsubscribing from position gaze: {e}")
            return False

    def get_user_position(self) -> Optional[UserPositionData]:
        """
        Get current user position data (head position).

        Returns normalized position data based on the track box coordinates.
        The track box defines the optimal tracking volume:
        - X: 0 (left) to 1 (right)
        - Y: 0 (top) to 1 (bottom)
        - Z: 0 (too close) to 1 (too far)

        Optimal position is typically around (0.5, 0.5, 0.5).
        """
        if not self._tracker:
            return None

        # Ensure we're subscribed to gaze data (this activates the IR illuminators)
        # This is needed for position guide to work before tracking is started
        if not self._is_tracking:
            if not hasattr(self, "_position_gaze_subscribed") or not self._position_gaze_subscribed:
                self._tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, self._position_gaze_callback)
                self._position_gaze_subscribed = True

        # Get latest gaze data if available (thread-safe)
        with self._gaze_data_lock:
            if not self._latest_gaze_data:
                return UserPositionData()
            gaze_data = self._latest_gaze_data

        try:

            # Get track box for normalization
            track_box = self._tracker.get_track_box()

            # Normalize positions relative to track box
            # Track box defines the optimal tracking volume in 3D space
            # UCS coordinates: X = user's right (+), Y = up (+), Z = towards user (+)
            def normalize_position(origin_xyz, track_box):
                """Normalize 3D position to 0-1 range based on track box.

                Returns normalized coordinates where:
                - X: 0 = user's far left, 0.5 = center, 1 = user's far right
                - Y: 0 = bottom, 0.5 = center, 1 = top
                - Z: 0 = far from screen (back of track box), 1 = close to screen (front)
                """
                if not origin_xyz or len(origin_xyz) != 3:
                    return None, None, None

                x, y, z = origin_xyz

                # Get track box corners (in mm, UCS coordinates)
                # Use corners that span the full range for each axis:
                # X: back_lower_left (left) to back_lower_right (right)
                # Y: back_lower_left (bottom) to back_upper_left (top)
                # Z: back_lower_left (far) to front_lower_left (close)
                back_lower_left = track_box.back_lower_left
                back_lower_right = track_box.back_lower_right
                back_upper_left = track_box.back_upper_left
                front_lower_left = track_box.front_lower_left

                # X range: left to right (user's perspective)
                x_min = back_lower_left[0]
                x_max = back_lower_right[0]
                x_range = x_max - x_min

                # Y range: bottom to top
                y_min = back_lower_left[1]
                y_max = back_upper_left[1]
                y_range = y_max - y_min

                # Z range: back (far from user) to front (close to user)
                z_min = back_lower_left[2]
                z_max = front_lower_left[2]
                z_range = z_max - z_min

                norm_x = (x - x_min) / x_range if x_range != 0 else 0.5
                norm_y = (y - y_min) / y_range if y_range != 0 else 0.5
                norm_z = (z - z_min) / z_range if z_range != 0 else 0.5

                # Clamp to 0-1 range
                norm_x = max(0.0, min(1.0, norm_x))
                norm_y = max(0.0, min(1.0, norm_y))
                norm_z = max(0.0, min(1.0, norm_z))

                return norm_x, norm_y, norm_z

            # Process left eye position
            # GazeData has nested left_eye and right_eye objects
            left_eye = gaze_data.left_eye
            left_origin = left_eye.gaze_origin.position_in_user_coordinates
            # Validity is 1 for valid, 0 for invalid
            left_valid = left_eye.gaze_origin.validity == 1
            left_x, left_y, left_z = normalize_position(left_origin, track_box)

            # Process right eye position
            right_eye = gaze_data.right_eye
            right_origin = right_eye.gaze_origin.position_in_user_coordinates
            right_valid = right_eye.gaze_origin.validity == 1
            right_x, right_y, right_z = normalize_position(right_origin, track_box)

            return UserPositionData(
                left_x=left_x,
                left_y=left_y,
                left_z=left_z,
                right_x=right_x,
                right_y=right_y,
                right_z=right_z,
                left_valid=left_valid,
                right_valid=right_valid,
                left_origin_x=left_origin[0] if left_origin and len(left_origin) > 0 else None,
                left_origin_y=left_origin[1] if left_origin and len(left_origin) > 1 else None,
                left_origin_z=left_origin[2] if left_origin and len(left_origin) > 2 else None,
                right_origin_x=(
                    right_origin[0] if right_origin and len(right_origin) > 0 else None
                ),
                right_origin_y=(
                    right_origin[1] if right_origin and len(right_origin) > 1 else None
                ),
                right_origin_z=(
                    right_origin[2] if right_origin and len(right_origin) > 2 else None
                ),
            )

        except Exception as e:
            self.logger.error(f"Error getting user position: {e}")
            return UserPositionData()
