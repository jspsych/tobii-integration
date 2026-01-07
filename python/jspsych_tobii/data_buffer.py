"""
Data buffer for storing and retrieving gaze data
"""

import time
import threading
from collections import deque
from typing import List, Dict, Any, Optional


class DataBuffer:
    """Thread-safe buffer for gaze data"""

    def __init__(self, max_size: int = 10000, max_duration_ms: int = 60000):
        """
        Initialize data buffer

        Args:
            max_size: Maximum number of samples to store
            max_duration_ms: Maximum time to keep samples (milliseconds)
        """
        self.max_size = max_size
        self.max_duration_ms = max_duration_ms
        self.buffer: deque = deque(maxlen=max_size)
        self.markers: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def add_sample(self, sample: Dict[str, Any]) -> None:
        """
        Add gaze sample to buffer

        Args:
            sample: Gaze data sample
        """
        sample["server_timestamp"] = time.time() * 1000  # milliseconds
        with self._lock:
            self.buffer.append(sample)

    def add_marker(self, marker: Dict[str, Any]) -> None:
        """
        Add marker to buffer

        Args:
            marker: Marker data
        """
        marker["server_timestamp"] = time.time() * 1000
        with self._lock:
            self.markers.append(marker)

    def get_samples(
        self,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get samples within time range

        Args:
            start_time: Start timestamp (client time, ms)
            end_time: End timestamp (client time, ms)

        Returns:
            List of samples
        """
        with self._lock:
            if not self.buffer:
                return []

            samples = list(self.buffer)

        if start_time is not None:
            samples = [s for s in samples if s.get("timestamp", 0) >= start_time]

        if end_time is not None:
            samples = [s for s in samples if s.get("timestamp", 0) <= end_time]

        return samples

    def get_latest_sample(self) -> Optional[Dict[str, Any]]:
        """
        Get most recent sample

        Returns:
            Latest sample or None
        """
        with self._lock:
            if self.buffer:
                return self.buffer[-1]
            return None

    def clear(self) -> None:
        """Clear all data"""
        with self._lock:
            self.buffer.clear()
            self.markers.clear()

    def cleanup_old_data(self) -> None:
        """Remove old data beyond max_duration_ms"""
        with self._lock:
            if not self.buffer:
                return

            current_time = time.time() * 1000
            cutoff_time = current_time - self.max_duration_ms

            # Remove old samples
            while self.buffer and self.buffer[0].get("server_timestamp", 0) < cutoff_time:
                self.buffer.popleft()

            # Remove old markers
            self.markers = [
                m for m in self.markers if m.get("server_timestamp", 0) >= cutoff_time
            ]

    def get_size(self) -> int:
        """Get current buffer size"""
        with self._lock:
            return len(self.buffer)

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get buffer statistics

        Returns:
            Dictionary with buffer stats
        """
        with self._lock:
            if not self.buffer:
                return {
                    "size": 0,
                    "sampling_rate": 0,
                    "duration_ms": 0,
                }

            samples = list(self.buffer)

        timestamps = [s.get("timestamp", 0) for s in samples]

        duration_ms = max(timestamps) - min(timestamps) if timestamps else 0
        sampling_rate = len(samples) / (duration_ms / 1000) if duration_ms > 0 else 0

        return {
            "size": len(samples),
            "sampling_rate": sampling_rate,
            "duration_ms": duration_ms,
            "oldest_timestamp": min(timestamps) if timestamps else 0,
            "newest_timestamp": max(timestamps) if timestamps else 0,
        }
