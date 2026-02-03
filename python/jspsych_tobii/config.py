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
    sdk_type: Optional[str] = None  # SDK type: "tobii-pro" or None for auto-detect
    use_mock: bool = False  # Use mock tracker for testing

    # Data buffer settings
    buffer_size: int = 10000  # Maximum number of samples to buffer
    buffer_duration: int = 60000  # Maximum time to keep samples (ms)

    # Logging settings
    log_level: str = "INFO"
    log_file: Optional[str] = None

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
