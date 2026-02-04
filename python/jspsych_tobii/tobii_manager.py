"""
Tobii eye tracker management using adapter pattern for multi-SDK support
"""

from typing import Optional, Dict, Any, Callable
import logging

from .adapters import (
    create_tracker_adapter,
    TobiiTrackerAdapter,
    GazeDataPoint,
    UserPositionData,
    SDKType,
)


class TobiiManager:
    """
    Manages Tobii eye tracker connection and data collection.

    Uses adapter pattern to support Tobii trackers:
    - tobii-research 2.x for modern Pro series (Spectrum, Fusion, Nano, Spark)
    - tobii-research 1.x for older models (X3-120, TX300, etc.)
    - Mock adapter for testing
    """

    def __init__(
        self,
        tracker_address: Optional[str] = None,
        sdk_type: Optional[SDKType] = None,
        use_mock: bool = False,
    ) -> None:
        """
        Initialize Tobii manager

        Args:
            tracker_address: Specific tracker address, or None to auto-detect
            sdk_type: Specific SDK to use (SDKType.TOBII_PRO), or None for auto-detection
            use_mock: If True, use mock tracker for testing
        """
        self.logger = logging.getLogger(__name__)
        self.tracker_address = tracker_address
        self.gaze_callback: Optional[Callable] = None

        # Create appropriate adapter
        try:
            self.adapter: TobiiTrackerAdapter = create_tracker_adapter(
                sdk_type=sdk_type, use_mock=use_mock
            )
            self.logger.info(f"Created adapter: {self.adapter.sdk_name} v{self.adapter.sdk_version}")
        except ImportError as e:
            self.logger.error(f"Failed to create tracker adapter: {e}")
            raise

    def find_tracker(self) -> bool:
        """
        Find and connect to Tobii eye tracker using the adapter

        Returns:
            True if tracker found and connected
        """
        try:
            return self.adapter.connect(self.tracker_address)

        except Exception as e:
            self.logger.error(f"Error finding tracker: {e}")
            return False

    def start_tracking(self, callback: Callable[[Dict[str, Any]], None]) -> bool:
        """
        Start gaze data collection

        Args:
            callback: Function to call with each gaze sample (receives Dict with gaze data)

        Returns:
            True if tracking started
        """
        try:
            self.gaze_callback = callback

            # Wrap callback to convert GazeDataPoint to Dict
            def adapter_callback(gaze_data: GazeDataPoint) -> None:
                if self.gaze_callback:
                    # Convert dataclass to dict for backward compatibility
                    gaze_dict = {
                        "x": gaze_data.x,
                        "y": gaze_data.y,
                        "timestamp": gaze_data.timestamp,
                        "leftValid": gaze_data.left_valid,
                        "rightValid": gaze_data.right_valid,
                        "leftPupilDiameter": gaze_data.left_pupil_diameter,
                        "rightPupilDiameter": gaze_data.right_pupil_diameter,
                    }
                    self.gaze_callback(gaze_dict)

            return self.adapter.subscribe_to_gaze_data(adapter_callback)

        except Exception as e:
            self.logger.error(f"Error starting tracking: {e}")
            return False

    def stop_tracking(self) -> bool:
        """
        Stop gaze data collection

        Returns:
            True if tracking stopped
        """
        try:
            result = self.adapter.unsubscribe_from_gaze_data()
            if result:
                self.gaze_callback = None
                self.logger.info("Gaze tracking stopped")
            return result

        except Exception as e:
            self.logger.error(f"Error stopping tracking: {e}")
            return False

    def is_tracking(self) -> bool:
        """Check if currently tracking"""
        return self.adapter.is_tracking()

    def get_tracker_info(self) -> Dict[str, Any]:
        """
        Get tracker information

        Returns:
            Dictionary with tracker details
        """
        tracker_info = self.adapter.get_tracker_info()

        if not tracker_info:
            return {"connected": False}

        return {
            "connected": True,
            "model": tracker_info.model,
            "serial": tracker_info.serial_number,
            "address": tracker_info.address,
            "name": tracker_info.device_name,
            "firmware": tracker_info.firmware_version,
            "sampling_frequency": tracker_info.sampling_frequency,
            "sdk": self.adapter.sdk_name,
            "sdk_version": self.adapter.sdk_version,
        }

    def get_user_position(self) -> Optional[Dict[str, Any]]:
        """
        Get current user position data (head position)

        Returns:
            Dictionary with user position data or None if not available
        """
        try:
            position_data = self.adapter.get_user_position()

            if not position_data:
                return None

            # Convert UserPositionData to dict for JSON serialization
            return {
                "leftX": position_data.left_x,
                "leftY": position_data.left_y,
                "leftZ": position_data.left_z,
                "rightX": position_data.right_x,
                "rightY": position_data.right_y,
                "rightZ": position_data.right_z,
                "leftValid": position_data.left_valid,
                "rightValid": position_data.right_valid,
                "leftOriginX": position_data.left_origin_x,
                "leftOriginY": position_data.left_origin_y,
                "leftOriginZ": position_data.left_origin_z,
                "rightOriginX": position_data.right_origin_x,
                "rightOriginY": position_data.right_origin_y,
                "rightOriginZ": position_data.right_origin_z,
            }

        except Exception as e:
            self.logger.error(f"Error getting user position: {e}")
            return None
