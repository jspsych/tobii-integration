"""
Abstract base class for Tobii tracker adapters
"""

from abc import ABC, abstractmethod
from typing import Optional, Callable, Dict, Any, List
from dataclasses import dataclass


@dataclass
class GazeDataPoint:
    """Standardized gaze data point across all SDKs"""

    x: float  # Normalized X coordinate (0-1)
    y: float  # Normalized Y coordinate (0-1)
    timestamp: float  # Timestamp in milliseconds
    left_valid: bool  # Left eye data validity
    right_valid: bool  # Right eye data validity
    left_pupil_diameter: float  # Left pupil diameter in mm
    right_pupil_diameter: float  # Right pupil diameter in mm

    # Optional 3D gaze data
    left_gaze_origin_x: Optional[float] = None
    left_gaze_origin_y: Optional[float] = None
    left_gaze_origin_z: Optional[float] = None
    right_gaze_origin_x: Optional[float] = None
    right_gaze_origin_y: Optional[float] = None
    right_gaze_origin_z: Optional[float] = None


@dataclass
class TrackerInfo:
    """Standardized tracker information"""

    model: str
    serial_number: str
    address: str
    device_name: str
    firmware_version: Optional[str] = None
    sampling_frequency: Optional[float] = None


@dataclass
class CalibrationPoint:
    """Calibration point data"""

    x: float  # Normalized X (0-1)
    y: float  # Normalized Y (0-1)


@dataclass
class CalibrationResult:
    """Calibration result"""

    success: bool
    average_error: Optional[float] = None  # In degrees
    point_errors: Optional[List[float]] = None  # Per-point errors in degrees


@dataclass
class UserPositionData:
    """User position data from eye tracker"""

    # Normalized position (0-1, where 0.5 is center)
    left_x: Optional[float] = None
    left_y: Optional[float] = None
    left_z: Optional[float] = None  # Distance in normalized units (0=too close, 1=too far)
    right_x: Optional[float] = None
    right_y: Optional[float] = None
    right_z: Optional[float] = None

    # Validity flags
    left_valid: bool = False
    right_valid: bool = False

    # Raw 3D coordinates in mm (optional)
    left_origin_x: Optional[float] = None
    left_origin_y: Optional[float] = None
    left_origin_z: Optional[float] = None
    right_origin_x: Optional[float] = None
    right_origin_y: Optional[float] = None
    right_origin_z: Optional[float] = None


class TobiiTrackerAdapter(ABC):
    """
    Abstract base class for Tobii tracker adapters.

    This provides a common interface for different Tobii SDKs
    (tobii-research for Pro series, legacy SDK for X-series, etc.)
    """

    # Configurable screen geometry for degree-of-visual-angle calculations.
    # These defaults match typical lab setups; override via ServerConfig.
    screen_distance_cm: float = 65.0
    screen_width_cm: float = 50.0

    @abstractmethod
    def find_trackers(self) -> List[Any]:
        """
        Find all available eye trackers.

        Returns:
            List of tracker objects (SDK-specific)
        """
        pass

    @abstractmethod
    def connect(self, tracker_address: Optional[str] = None) -> bool:
        """
        Connect to a specific tracker or auto-detect.

        Args:
            tracker_address: Specific tracker address, or None for auto-detect

        Returns:
            True if connection successful
        """
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """
        Disconnect from tracker.

        Returns:
            True if disconnection successful
        """
        pass

    @abstractmethod
    def get_tracker_info(self) -> Optional[TrackerInfo]:
        """
        Get information about the connected tracker.

        Returns:
            TrackerInfo object or None if not connected
        """
        pass

    @abstractmethod
    def subscribe_to_gaze_data(self, callback: Callable[[GazeDataPoint], None]) -> bool:
        """
        Subscribe to gaze data stream.

        Args:
            callback: Function to call with each gaze data point

        Returns:
            True if subscription successful
        """
        pass

    @abstractmethod
    def unsubscribe_from_gaze_data(self) -> bool:
        """
        Unsubscribe from gaze data stream.

        Returns:
            True if unsubscription successful
        """
        pass

    @abstractmethod
    def start_calibration(self) -> bool:
        """
        Start calibration procedure.

        Returns:
            True if calibration started successfully
        """
        pass

    @abstractmethod
    def collect_calibration_data(self, point: CalibrationPoint) -> bool:
        """
        Collect calibration data for a specific point.

        Args:
            point: Calibration point coordinates

        Returns:
            True if data collection successful
        """
        pass

    @abstractmethod
    def compute_calibration(self) -> CalibrationResult:
        """
        Compute calibration from collected data.

        Returns:
            CalibrationResult object
        """
        pass

    @abstractmethod
    def discard_calibration_data(self, point: Optional[CalibrationPoint] = None) -> bool:
        """
        Discard calibration data for a point or all points.

        Args:
            point: Specific point to discard, or None for all points

        Returns:
            True if successful
        """
        pass

    @abstractmethod
    def leave_calibration_mode(self) -> bool:
        """
        Exit calibration mode.

        Returns:
            True if successful
        """
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Check if tracker is connected"""
        pass

    @abstractmethod
    def is_tracking(self) -> bool:
        """Check if currently collecting gaze data"""
        pass

    @abstractmethod
    def get_user_position(self) -> Optional[UserPositionData]:
        """
        Get current user position data (head position).

        Returns:
            UserPositionData object or None if not available
        """
        pass

    @property
    @abstractmethod
    def sdk_name(self) -> str:
        """Return the name of the SDK being used"""
        pass

    @property
    @abstractmethod
    def sdk_version(self) -> str:
        """Return the version of the SDK being used"""
        pass
