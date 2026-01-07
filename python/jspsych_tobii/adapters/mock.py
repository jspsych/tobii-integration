"""
Mock tracker adapter for testing without hardware
"""

import logging
import random
import threading
import time
from typing import Optional, Callable, List, Any

from .base import (
    TobiiTrackerAdapter,
    GazeDataPoint,
    TrackerInfo,
    CalibrationPoint,
    CalibrationResult,
    UserPositionData,
)


class MockTrackerAdapter(TobiiTrackerAdapter):
    """
    Mock tracker adapter for testing and development.

    Simulates eye tracker behavior without requiring actual hardware.
    Generates realistic gaze data patterns.
    """

    def __init__(self) -> None:
        self.logger = logging.getLogger(__name__)
        self._connected = False
        self._tracking = False
        self._gaze_callback: Optional[Callable[[GazeDataPoint], None]] = None
        self._tracking_thread: Optional[threading.Thread] = None
        self._stop_tracking_event = threading.Event()
        self._in_calibration_mode = False
        self._calibration_points: List[CalibrationPoint] = []

    @property
    def sdk_name(self) -> str:
        return "mock"

    @property
    def sdk_version(self) -> str:
        return "1.0.0"

    def find_trackers(self) -> List[Any]:
        """Find mock trackers (always returns one)"""
        return [{"id": "mock-tracker-001", "name": "Mock Tobii Tracker"}]

    def connect(self, tracker_address: Optional[str] = None) -> bool:
        """Connect to mock tracker"""
        self._connected = True
        self.logger.info("Connected to mock tracker")
        return True

    def disconnect(self) -> bool:
        """Disconnect from mock tracker"""
        if self._tracking:
            self.unsubscribe_from_gaze_data()
        self._connected = False
        self.logger.info("Disconnected from mock tracker")
        return True

    def get_tracker_info(self) -> Optional[TrackerInfo]:
        """Get mock tracker information"""
        if not self._connected:
            return None

        return TrackerInfo(
            model="Mock Tobii Pro Spectrum",
            serial_number="MOCK-123456789",
            address="mock://localhost",
            device_name="Mock Eye Tracker",
            firmware_version="1.0.0-mock",
            sampling_frequency=120.0,
        )

    def subscribe_to_gaze_data(self, callback: Callable[[GazeDataPoint], None]) -> bool:
        """Start generating mock gaze data"""
        if not self._connected:
            self.logger.error("Not connected")
            return False

        self._gaze_callback = callback
        self._tracking = True
        self._stop_tracking_event.clear()

        # Start background thread to generate gaze data
        self._tracking_thread = threading.Thread(target=self._generate_gaze_data, daemon=True)
        self._tracking_thread.start()

        self.logger.info("Started generating mock gaze data")
        return True

    def unsubscribe_from_gaze_data(self) -> bool:
        """Stop generating mock gaze data"""
        if not self._tracking:
            return False

        self._tracking = False
        self._stop_tracking_event.set()

        if self._tracking_thread:
            self._tracking_thread.join(timeout=1.0)
            self._tracking_thread = None

        self._gaze_callback = None
        self.logger.info("Stopped generating mock gaze data")
        return True

    def _generate_gaze_data(self) -> None:
        """Background thread that generates realistic gaze data"""
        # Simulate 120 Hz sampling rate
        sample_interval = 1.0 / 120.0

        # Initialize gaze position (center of screen)
        gaze_x = 0.5
        gaze_y = 0.5

        # Velocity for smooth motion
        velocity_x = 0.0
        velocity_y = 0.0

        while not self._stop_tracking_event.is_set():
            start_time = time.time()

            # Generate smooth, realistic eye movement
            # Occasionally add saccades (rapid movements)
            if random.random() < 0.02:  # 2% chance of saccade
                # Large rapid movement
                velocity_x = random.uniform(-0.3, 0.3)
                velocity_y = random.uniform(-0.3, 0.3)
            else:
                # Smooth pursuit with drift
                velocity_x += random.gauss(0, 0.002)
                velocity_y += random.gauss(0, 0.002)

                # Damping to prevent unbounded drift
                velocity_x *= 0.95
                velocity_y *= 0.95

            # Update position
            gaze_x += velocity_x * sample_interval
            gaze_y += velocity_y * sample_interval

            # Keep within bounds with soft boundaries
            if gaze_x < 0.1:
                gaze_x = 0.1
                velocity_x = abs(velocity_x)
            elif gaze_x > 0.9:
                gaze_x = 0.9
                velocity_x = -abs(velocity_x)

            if gaze_y < 0.1:
                gaze_y = 0.1
                velocity_y = abs(velocity_y)
            elif gaze_y > 0.9:
                gaze_y = 0.9
                velocity_y = -abs(velocity_y)

            # Add small jitter (fixational eye movements)
            x_jitter = random.gauss(0, 0.002)
            y_jitter = random.gauss(0, 0.002)

            # Create gaze data point
            gaze_data = GazeDataPoint(
                x=max(0, min(1, gaze_x + x_jitter)),
                y=max(0, min(1, gaze_y + y_jitter)),
                timestamp=time.time() * 1000,
                left_valid=random.random() > 0.02,  # 98% validity
                right_valid=random.random() > 0.02,
                left_pupil_diameter=random.gauss(3.5, 0.3),
                right_pupil_diameter=random.gauss(3.5, 0.3),
            )

            # Call callback with generated data
            if self._gaze_callback:
                self._gaze_callback(gaze_data)

            # Maintain timing
            elapsed = time.time() - start_time
            sleep_time = max(0, sample_interval - elapsed)
            if sleep_time > 0:
                time.sleep(sleep_time)

    def start_calibration(self) -> bool:
        """Start mock calibration"""
        if not self._connected:
            return False

        self._in_calibration_mode = True
        self._calibration_points = []
        self.logger.info("Started mock calibration")
        return True

    def collect_calibration_data(self, point: CalibrationPoint) -> bool:
        """Collect mock calibration data"""
        if not self._in_calibration_mode:
            return False

        self._calibration_points.append(point)
        self.logger.info(f"Collected calibration data for point ({point.x}, {point.y})")
        return True

    def compute_calibration(self) -> CalibrationResult:
        """Compute mock calibration"""
        if not self._in_calibration_mode:
            return CalibrationResult(success=False)

        # Simulate calibration quality (better with more points)
        num_points = len(self._calibration_points)
        if num_points < 3:
            return CalibrationResult(success=False)

        # Mock average error (decreases with more points)
        base_error = 1.5
        error_reduction = 0.1 * (num_points - 5)
        avg_error = max(0.3, base_error - error_reduction)

        # Generate per-point errors
        point_errors = [random.gauss(avg_error, 0.2) for _ in self._calibration_points]

        self.logger.info(f"Mock calibration computed: {avg_error:.2f}° average error")
        return CalibrationResult(
            success=True, average_error=avg_error, point_errors=point_errors
        )

    def discard_calibration_data(self, point: Optional[CalibrationPoint] = None) -> bool:
        """Discard mock calibration data"""
        if not self._in_calibration_mode:
            return False

        if point:
            try:
                self._calibration_points.remove(point)
            except ValueError:
                return False
        else:
            self._calibration_points = []

        return True

    def leave_calibration_mode(self) -> bool:
        """Exit mock calibration mode"""
        if not self._in_calibration_mode:
            return False

        self._in_calibration_mode = False
        self._calibration_points = []
        self.logger.info("Left mock calibration mode")
        return True

    def is_connected(self) -> bool:
        """Check if mock tracker is connected"""
        return self._connected

    def is_tracking(self) -> bool:
        """Check if mock tracking is active"""
        return self._tracking

    def get_user_position(self) -> Optional[UserPositionData]:
        """Get mock user position data"""
        if not self._connected:
            return None

        # Generate realistic mock position data
        # Simulate user positioned reasonably well (around center with slight variation)
        base_x, base_y, base_z = 0.5, 0.5, 0.5
        variation = 0.05

        return UserPositionData(
            left_x=base_x + random.uniform(-variation, variation),
            left_y=base_y + random.uniform(-variation, variation),
            left_z=base_z + random.uniform(-variation, variation),
            right_x=base_x + random.uniform(-variation, variation),
            right_y=base_y + random.uniform(-variation, variation),
            right_z=base_z + random.uniform(-variation, variation),
            left_valid=True,
            right_valid=True,
            # Mock raw coordinates (in mm, centered around optimal distance)
            left_origin_x=random.uniform(-20, 20),
            left_origin_y=random.uniform(-15, 15),
            left_origin_z=600 + random.uniform(-50, 50),
            right_origin_x=random.uniform(-20, 20),
            right_origin_y=random.uniform(-15, 15),
            right_origin_z=600 + random.uniform(-50, 50),
        )
