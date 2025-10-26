"""
Tobii eye tracker management
"""

import time
from typing import Optional, Dict, Any, Callable
import logging

# Note: In production, this would use: import tobii_research as tr
# For now, we'll create a mock implementation


class TobiiManager:
    """Manages Tobii eye tracker connection and data collection"""

    def __init__(self, tracker_address: Optional[str] = None) -> None:
        """
        Initialize Tobii manager

        Args:
            tracker_address: Specific tracker address, or None to auto-detect
        """
        self.logger = logging.getLogger(__name__)
        self.tracker_address = tracker_address
        self.tracker: Optional[Any] = None
        self.gaze_callback: Optional[Callable] = None
        self.tracking = False

    def find_tracker(self) -> bool:
        """
        Find and connect to Tobii eye tracker

        Returns:
            True if tracker found and connected
        """
        try:
            # In production:
            # trackers = tr.find_all_eyetrackers()
            # if not trackers:
            #     self.logger.error("No eye trackers found")
            #     return False
            # self.tracker = trackers[0]

            # Mock implementation
            self.logger.info("Mock: Tobii tracker found")
            self.tracker = MockTobiiTracker()
            return True

        except Exception as e:
            self.logger.error(f"Error finding tracker: {e}")
            return False

    def start_tracking(self, callback: Callable[[Dict[str, Any]], None]) -> bool:
        """
        Start gaze data collection

        Args:
            callback: Function to call with each gaze sample

        Returns:
            True if tracking started
        """
        if not self.tracker:
            self.logger.error("No tracker connected")
            return False

        try:
            self.gaze_callback = callback
            # In production:
            # self.tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, self._gaze_data_callback)

            # Mock implementation
            self.tracker.subscribe(self._gaze_data_callback)
            self.tracking = True
            self.logger.info("Gaze tracking started")
            return True

        except Exception as e:
            self.logger.error(f"Error starting tracking: {e}")
            return False

    def stop_tracking(self) -> bool:
        """
        Stop gaze data collection

        Returns:
            True if tracking stopped
        """
        if not self.tracker:
            return False

        try:
            # In production:
            # self.tracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA)

            # Mock implementation
            self.tracker.unsubscribe()
            self.tracking = False
            self.logger.info("Gaze tracking stopped")
            return True

        except Exception as e:
            self.logger.error(f"Error stopping tracking: {e}")
            return False

    def _gaze_data_callback(self, gaze_data: Any) -> None:
        """
        Internal callback for gaze data

        Args:
            gaze_data: Raw gaze data from Tobii SDK
        """
        if self.gaze_callback:
            # Convert to standard format
            formatted_data = self._format_gaze_data(gaze_data)
            self.gaze_callback(formatted_data)

    def _format_gaze_data(self, gaze_data: Any) -> Dict[str, Any]:
        """
        Format gaze data to standard structure

        Args:
            gaze_data: Raw gaze data

        Returns:
            Formatted gaze data
        """
        # In production, would extract from Tobii data structure
        # For mock, generate simulated data
        timestamp = time.time() * 1000

        return {
            "x": getattr(gaze_data, "x", 0.5),
            "y": getattr(gaze_data, "y", 0.5),
            "timestamp": timestamp,
            "leftValid": getattr(gaze_data, "left_valid", True),
            "rightValid": getattr(gaze_data, "right_valid", True),
            "leftPupilDiameter": getattr(gaze_data, "left_pupil", 3.0),
            "rightPupilDiameter": getattr(gaze_data, "right_pupil", 3.0),
        }

    def is_tracking(self) -> bool:
        """Check if currently tracking"""
        return self.tracking

    def get_tracker_info(self) -> Dict[str, Any]:
        """
        Get tracker information

        Returns:
            Dictionary with tracker details
        """
        if not self.tracker:
            return {"connected": False}

        # In production:
        # return {
        #     "connected": True,
        #     "model": self.tracker.model,
        #     "serial": self.tracker.serial_number,
        #     "address": self.tracker.address,
        #     "name": self.tracker.device_name,
        # }

        return {
            "connected": True,
            "model": "Tobii Pro Mock",
            "serial": "MOCK123456",
            "address": "mock://localhost",
            "name": "Mock Tracker",
        }


class MockTobiiTracker:
    """Mock Tobii tracker for testing"""

    def __init__(self) -> None:
        self.callback: Optional[Callable] = None
        self.subscribed = False

    def subscribe(self, callback: Callable) -> None:
        """Subscribe to gaze data"""
        self.callback = callback
        self.subscribed = True

    def unsubscribe(self) -> None:
        """Unsubscribe from gaze data"""
        self.callback = None
        self.subscribed = False


class MockGazeData:
    """Mock gaze data point"""

    def __init__(self) -> None:
        import random

        self.x = random.uniform(0.3, 0.7)
        self.y = random.uniform(0.3, 0.7)
        self.left_valid = True
        self.right_valid = True
        self.left_pupil = random.uniform(2.5, 4.0)
        self.right_pupil = random.uniform(2.5, 4.0)
