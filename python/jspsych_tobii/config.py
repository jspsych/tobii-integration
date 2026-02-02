"""
Configuration management for Tobii server
"""

from dataclasses import dataclass
from typing import Optional
import logging


@dataclass
class ServerConfig:
    """Server configuration options"""

    # WebSocket server settings
    host: str = "localhost"
    port: int = 8080

    # Tobii tracker settings
    tracker_address: Optional[str] = None  # Auto-detect if None
    sampling_rate: int = 60  # Hz
    sdk_type: Optional[str] = None  # SDK type: "tobii-pro", "tobii-x-series", or None for auto-detect
    use_mock: bool = False  # Use mock tracker for testing

    # Data buffer settings
    buffer_size: int = 10000  # Maximum number of samples to buffer
    buffer_duration: int = 60000  # Maximum time to keep samples (ms)

    # Logging settings
    log_level: str = "INFO"
    log_file: Optional[str] = None

    # Screen geometry (used for degree-of-visual-angle calculations)
    screen_distance_cm: float = 65.0  # Viewing distance from screen in cm
    screen_width_cm: float = 50.0  # Physical screen width in cm

    # Feature flags
    enable_time_sync: bool = True
    enable_calibration: bool = True
    enable_validation: bool = True

    def get_log_level(self) -> int:
        """Convert log level string to logging constant"""
        levels = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
            "CRITICAL": logging.CRITICAL,
        }
        return levels.get(self.log_level.upper(), logging.INFO)
