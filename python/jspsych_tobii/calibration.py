"""
Calibration and validation management using Tobii tracker adapters
"""

import threading
from typing import List, Dict, Any, Optional
import logging


class CalibrationSession:
    """Per-client calibration/validation session state"""

    def __init__(self, client_id: str):
        self.client_id = client_id
        self.calibration_points: List[Dict[str, float]] = []
        self.validation_points: List[Dict[str, float]] = []
        self.calibration_active = False
        self.validation_active = False


class CalibrationManager:
    """
    Manages calibration and validation procedures using TobiiManager adapter.

    This class provides a high-level interface for calibration and validation
    that works with any Tobii tracker through the adapter pattern.

    Supports multiple clients with per-client session state and locking
    to prevent concurrent calibration conflicts.
    """

    def __init__(self, tobii_manager: Any) -> None:
        """
        Initialize calibration manager

        Args:
            tobii_manager: TobiiManager instance with adapter
        """
        self.logger = logging.getLogger(__name__)
        self.tobii_manager = tobii_manager
        self._sessions: Dict[str, CalibrationSession] = {}
        self._calibration_lock = threading.Lock()
        self._active_calibration_client: Optional[str] = None

    def _get_or_create_session(self, client_id: str) -> CalibrationSession:
        """Get or create a session for a client"""
        if client_id not in self._sessions:
            self._sessions[client_id] = CalibrationSession(client_id)
        return self._sessions[client_id]

    def remove_session(self, client_id: str) -> None:
        """Remove a client's session (call when client disconnects)"""
        with self._calibration_lock:
            if client_id in self._sessions:
                del self._sessions[client_id]
            if self._active_calibration_client == client_id:
                # Release calibration lock and leave calibration mode
                try:
                    self.tobii_manager.adapter.leave_calibration_mode()
                except Exception:
                    pass
                self._active_calibration_client = None

    def start_calibration(self, client_id: str = "default") -> Dict[str, Any]:
        """
        Start calibration procedure using the tracker adapter

        Args:
            client_id: Unique identifier for the client

        Returns:
            Response indicating calibration started
        """
        try:
            with self._calibration_lock:
                # Check if another client is calibrating
                if self._active_calibration_client and self._active_calibration_client != client_id:
                    return {
                        "type": "calibration_start",
                        "success": False,
                        "error": "Another client is currently calibrating",
                    }

                # Use adapter to start calibration
                success = self.tobii_manager.adapter.start_calibration()

                if success:
                    session = self._get_or_create_session(client_id)
                    session.calibration_active = True
                    session.calibration_points = []
                    self._active_calibration_client = client_id
                    self.logger.info(f"Calibration started for client {client_id}")
                else:
                    self.logger.error("Failed to start calibration")

                return {
                    "type": "calibration_start",
                    "success": success,
                }

        except Exception as e:
            self.logger.error(f"Error starting calibration: {e}")
            return {
                "type": "calibration_start",
                "success": False,
                "error": str(e),
            }

    def collect_calibration_point(
        self, x: float, y: float, timestamp: float, client_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Collect calibration data for a point using the tracker adapter

        Args:
            x: Normalized x coordinate (0-1)
            y: Normalized y coordinate (0-1)
            timestamp: Timestamp (for tracking purposes)
            client_id: Unique identifier for the client

        Returns:
            Response indicating point collected
        """
        session = self._get_or_create_session(client_id)

        if not session.calibration_active:
            return {
                "type": "calibration_point",
                "success": False,
                "error": "Calibration not active",
            }

        if self._active_calibration_client != client_id:
            return {
                "type": "calibration_point",
                "success": False,
                "error": "This client does not own the active calibration",
            }

        try:
            # Import CalibrationPoint from adapter
            from .adapters import CalibrationPoint

            # Use adapter to collect calibration data
            point = CalibrationPoint(x=x, y=y)
            success = self.tobii_manager.adapter.collect_calibration_data(point)

            if success:
                session.calibration_points.append({"x": x, "y": y, "timestamp": timestamp})
                self.logger.info(f"Collected calibration point ({x:.3f}, {y:.3f})")
            else:
                self.logger.error(f"Failed to collect calibration point ({x:.3f}, {y:.3f})")

            return {
                "type": "calibration_point",
                "success": success,
                "point": {"x": x, "y": y},
            }

        except Exception as e:
            self.logger.error(f"Error collecting calibration point: {e}")
            return {
                "type": "calibration_point",
                "success": False,
                "error": str(e),
            }

    def compute_calibration(self, client_id: str = "default") -> Dict[str, Any]:
        """
        Compute calibration from collected points using the tracker adapter

        Args:
            client_id: Unique identifier for the client

        Returns:
            Calibration result with quality metrics
        """
        session = self._get_or_create_session(client_id)

        if not session.calibration_active:
            return {
                "type": "calibration_compute",
                "success": False,
                "error": "Calibration not active",
            }

        if self._active_calibration_client != client_id:
            return {
                "type": "calibration_compute",
                "success": False,
                "error": "This client does not own the active calibration",
            }

        try:
            # Use adapter to compute and apply calibration
            result = self.tobii_manager.adapter.compute_calibration()

            if result.success:
                self.logger.info(
                    f"Calibration computed successfully (avg error: {result.average_error:.3f}°)"
                    if result.average_error
                    else "Calibration computed successfully"
                )

                # Build point quality data if available
                point_quality = []
                if result.point_errors and len(result.point_errors) == len(session.calibration_points):
                    point_quality = [
                        {
                            "point": session.calibration_points[i],
                            "error": result.point_errors[i],
                        }
                        for i in range(len(session.calibration_points))
                    ]
            else:
                self.logger.error("Calibration computation failed")
                point_quality = []

            return {
                "type": "calibration_compute",
                "success": result.success,
                "averageError": result.average_error if result.average_error else None,
                "pointQuality": point_quality,
            }

        except Exception as e:
            self.logger.error(f"Error computing calibration: {e}")
            return {
                "type": "calibration_compute",
                "success": False,
                "error": str(e),
            }

        finally:
            # Always leave calibration mode and clean up state
            try:
                self.tobii_manager.adapter.leave_calibration_mode()
            except Exception:
                pass
            session.calibration_active = False
            with self._calibration_lock:
                if self._active_calibration_client == client_id:
                    self._active_calibration_client = None

    def start_validation(self, client_id: str = "default") -> Dict[str, Any]:
        """
        Start validation procedure.

        Validation collects gaze data at known points to assess calibration quality.
        Note: Validation is an analysis procedure, not a tracker feature.

        Args:
            client_id: Unique identifier for the client

        Returns:
            Response indicating validation started
        """
        try:
            # Check if tracker is connected and tracking
            if not self.tobii_manager.adapter.is_connected():
                return {
                    "type": "validation_start",
                    "success": False,
                    "error": "Tracker not connected",
                }

            session = self._get_or_create_session(client_id)
            session.validation_active = True
            session.validation_points = []
            self.logger.info(f"Validation started for client {client_id}")

            return {
                "type": "validation_start",
                "success": True,
            }

        except Exception as e:
            self.logger.error(f"Error starting validation: {e}")
            return {
                "type": "validation_start",
                "success": False,
                "error": str(e),
            }

    def collect_validation_point(
        self, x: float, y: float, timestamp: float, gaze_samples: Optional[List[Dict[str, Any]]] = None,
        client_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Collect validation data for a point.

        Validation works by showing a point at a known location and collecting
        gaze data to compare against the expected position.

        Args:
            x: Normalized x coordinate (0-1) of validation point
            y: Normalized y coordinate (0-1) of validation point
            timestamp: Timestamp when point was shown
            gaze_samples: Optional gaze samples collected at this point
            client_id: Unique identifier for the client

        Returns:
            Response indicating point collected
        """
        session = self._get_or_create_session(client_id)

        if not session.validation_active:
            return {
                "type": "validation_point",
                "success": False,
                "error": "Validation not active",
            }

        try:
            # Store validation point with its expected position and collected gaze data
            session.validation_points.append({
                "x": x,
                "y": y,
                "timestamp": timestamp,
                "gaze_samples": gaze_samples or []
            })

            self.logger.info(f"Collected validation point ({x:.3f}, {y:.3f})")

            return {
                "type": "validation_point",
                "success": True,
                "point": {"x": x, "y": y},
            }

        except Exception as e:
            self.logger.error(f"Error collecting validation point: {e}")
            return {
                "type": "validation_point",
                "success": False,
                "error": str(e),
            }

    def compute_validation(self, client_id: str = "default") -> Dict[str, Any]:
        """
        Compute validation metrics from collected points.

        Calculates accuracy (offset from target) and precision (consistency)
        for each validation point based on collected gaze samples.

        Args:
            client_id: Unique identifier for the client

        Returns:
            Validation result with accuracy/precision metrics
        """
        session = self._get_or_create_session(client_id)

        if not session.validation_active:
            return {
                "type": "validation_compute",
                "success": False,
                "error": "Validation not active",
            }

        try:
            if len(session.validation_points) < 3:
                return {
                    "type": "validation_compute",
                    "success": False,
                    "error": f"Need at least 3 validation points, got {len(session.validation_points)}",
                }

            # Compute metrics for each point
            point_data = []
            all_accuracies = []
            all_precisions = []

            import math

            # Saccade exclusion: skip first portion of samples to allow fixation
            # At 120Hz, 300ms = ~36 samples. We'll skip first 30% of samples.
            SACCADE_SKIP_RATIO = 0.3

            for vp in session.validation_points:
                expected_x = vp["x"]
                expected_y = vp["y"]
                gaze_samples = vp.get("gaze_samples", [])

                if not gaze_samples:
                    # No gaze data collected for this point
                    continue

                # Skip initial samples to exclude saccade period
                skip_count = int(len(gaze_samples) * SACCADE_SKIP_RATIO)
                fixation_samples = gaze_samples[skip_count:]

                if not fixation_samples:
                    continue

                # Calculate accuracy (mean distance from expected point)
                distances = []
                valid_samples = []
                for sample in fixation_samples:
                    if sample.get("leftValid") or sample.get("rightValid"):
                        dx = sample["x"] - expected_x
                        dy = sample["y"] - expected_y
                        distance = math.sqrt(dx**2 + dy**2)
                        distances.append(distance)
                        valid_samples.append(sample)

                if not distances:
                    continue

                # Accuracy: mean distance from target (in normalized coordinates)
                accuracy_norm = sum(distances) / len(distances)

                # Precision: standard deviation of gaze samples (consistency)
                if len(valid_samples) > 1:
                    mean_x = sum(s["x"] for s in valid_samples) / len(valid_samples)
                    mean_y = sum(s["y"] for s in valid_samples) / len(valid_samples)
                    variances = [
                        ((s["x"] - mean_x)**2 + (s["y"] - mean_y)**2)
                        for s in valid_samples
                    ]
                    precision_norm = math.sqrt(sum(variances) / len(variances)) if variances else 0.0
                else:
                    precision_norm = 0.0

                # Calculate mean gaze position for visualization
                mean_gaze_x = sum(s["x"] for s in valid_samples) / len(valid_samples)
                mean_gaze_y = sum(s["y"] for s in valid_samples) / len(valid_samples)

                # Return normalized values - client will convert to pixels
                point_data.append({
                    "point": {"x": expected_x, "y": expected_y},
                    "accuracyNorm": accuracy_norm,
                    "precisionNorm": precision_norm,
                    "meanGaze": {"x": mean_gaze_x, "y": mean_gaze_y},
                    "numSamples": len(valid_samples),
                    "numSamplesTotal": len(gaze_samples),
                    "numSamplesSkipped": skip_count,
                    "gazeSamples": [{"x": s["x"], "y": s["y"]} for s in valid_samples],
                })

                all_accuracies.append(accuracy_norm)
                all_precisions.append(precision_norm)

            # Calculate overall metrics
            if not point_data:
                session.validation_active = False
                return {
                    "type": "validation_compute",
                    "success": False,
                    "error": "No valid gaze samples collected",
                }

            avg_accuracy_norm = sum(all_accuracies) / len(all_accuracies) if all_accuracies else 0.0
            avg_precision_norm = sum(all_precisions) / len(all_precisions) if all_precisions else 0.0

            session.validation_active = False
            self.logger.info(
                f"Validation computed: accuracy_norm={avg_accuracy_norm:.4f}, precision_norm={avg_precision_norm:.4f}"
            )

            return {
                "type": "validation_compute",
                "success": True,
                "averageAccuracyNorm": avg_accuracy_norm,
                "averagePrecisionNorm": avg_precision_norm,
                "pointData": point_data,
            }

        except Exception as e:
            session.validation_active = False
            self.logger.error(f"Error computing validation: {e}")
            return {
                "type": "validation_compute",
                "success": False,
                "error": str(e),
            }
