"""
Calibration and validation management using Tobii tracker adapters
"""

from typing import List, Dict, Any, Optional
import logging


class CalibrationManager:
    """
    Manages calibration and validation procedures using TobiiManager adapter.

    This class provides a high-level interface for calibration and validation
    that works with any Tobii tracker through the adapter pattern.
    """

    def __init__(self, tobii_manager: Any) -> None:
        """
        Initialize calibration manager

        Args:
            tobii_manager: TobiiManager instance with adapter
        """
        self.logger = logging.getLogger(__name__)
        self.tobii_manager = tobii_manager
        self.calibration_points: List[Dict[str, float]] = []
        self.validation_points: List[Dict[str, float]] = []
        self.calibration_active = False
        self.validation_active = False

    def start_calibration(self) -> Dict[str, Any]:
        """
        Start calibration procedure using the tracker adapter

        Returns:
            Response indicating calibration started
        """
        try:
            # Use adapter to start calibration
            success = self.tobii_manager.adapter.start_calibration()

            if success:
                self.calibration_active = True
                self.calibration_points = []
                self.logger.info("Calibration started")
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
        self, x: float, y: float, timestamp: float
    ) -> Dict[str, Any]:
        """
        Collect calibration data for a point using the tracker adapter

        Args:
            x: Normalized x coordinate (0-1)
            y: Normalized y coordinate (0-1)
            timestamp: Timestamp (for tracking purposes)

        Returns:
            Response indicating point collected
        """
        if not self.calibration_active:
            return {
                "type": "calibration_point",
                "success": False,
                "error": "Calibration not active",
            }

        try:
            # Import CalibrationPoint from adapter
            from .adapters import CalibrationPoint

            # Use adapter to collect calibration data
            point = CalibrationPoint(x=x, y=y)
            success = self.tobii_manager.adapter.collect_calibration_data(point)

            if success:
                self.calibration_points.append({"x": x, "y": y, "timestamp": timestamp})
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

    def compute_calibration(self) -> Dict[str, Any]:
        """
        Compute calibration from collected points using the tracker adapter

        Returns:
            Calibration result with quality metrics
        """
        if not self.calibration_active:
            return {
                "type": "calibration_compute",
                "success": False,
                "error": "Calibration not active",
            }

        try:
            # Use adapter to compute and apply calibration
            result = self.tobii_manager.adapter.compute_calibration()

            self.calibration_active = False

            if result.success:
                self.logger.info(
                    f"Calibration computed successfully (avg error: {result.average_error:.3f}°)"
                    if result.average_error
                    else "Calibration computed successfully"
                )

                # Build point quality data if available
                point_quality = []
                if result.point_errors and len(result.point_errors) == len(self.calibration_points):
                    point_quality = [
                        {
                            "point": self.calibration_points[i],
                            "error": result.point_errors[i],
                        }
                        for i in range(len(self.calibration_points))
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
            self.calibration_active = False
            self.logger.error(f"Error computing calibration: {e}")
            return {
                "type": "calibration_compute",
                "success": False,
                "error": str(e),
            }

    def start_validation(self) -> Dict[str, Any]:
        """
        Start validation procedure.

        Validation collects gaze data at known points to assess calibration quality.
        Note: Validation is an analysis procedure, not a tracker feature.

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

            self.validation_active = True
            self.validation_points = []
            self.logger.info("Validation started")

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
        self, x: float, y: float, timestamp: float, gaze_samples: Optional[List[Dict[str, Any]]] = None
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

        Returns:
            Response indicating point collected
        """
        if not self.validation_active:
            return {
                "type": "validation_point",
                "success": False,
                "error": "Validation not active",
            }

        try:
            # Store validation point with its expected position and collected gaze data
            self.validation_points.append({
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

    def compute_validation(self) -> Dict[str, Any]:
        """
        Compute validation metrics from collected points.

        Calculates accuracy (offset from target) and precision (consistency)
        for each validation point based on collected gaze samples.

        Returns:
            Validation result with accuracy/precision metrics
        """
        if not self.validation_active:
            return {
                "type": "validation_compute",
                "success": False,
                "error": "Validation not active",
            }

        try:
            if len(self.validation_points) < 3:
                return {
                    "type": "validation_compute",
                    "success": False,
                    "error": f"Need at least 3 validation points, got {len(self.validation_points)}",
                }

            # Compute metrics for each point
            point_data = []
            all_accuracies = []
            all_precisions = []

            for vp in self.validation_points:
                expected_x = vp["x"]
                expected_y = vp["y"]
                gaze_samples = vp.get("gaze_samples", [])

                if not gaze_samples:
                    # No gaze data collected for this point
                    continue

                # Calculate accuracy (mean distance from expected point)
                import math
                distances = []
                for sample in gaze_samples:
                    if sample.get("leftValid") or sample.get("rightValid"):
                        dx = sample["x"] - expected_x
                        dy = sample["y"] - expected_y
                        distance = math.sqrt(dx**2 + dy**2)
                        distances.append(distance)

                if not distances:
                    continue

                # Accuracy: mean distance from target (in normalized coordinates)
                accuracy_norm = sum(distances) / len(distances)
                # Convert to approximate degrees (assume ~50cm viewing distance, ~50cm screen width)
                # This is a rough approximation: degrees ≈ normalized_distance * screen_width_cm * (180/π) / viewing_distance_cm
                accuracy_degrees = accuracy_norm * 50 * 57.3 / 50  # ≈ normalized * 57.3

                # Precision: standard deviation of gaze samples (consistency)
                if len(gaze_samples) > 1:
                    mean_x = sum(s["x"] for s in gaze_samples if s.get("leftValid") or s.get("rightValid")) / len(distances)
                    mean_y = sum(s["y"] for s in gaze_samples if s.get("leftValid") or s.get("rightValid")) / len(distances)
                    variances = [
                        ((s["x"] - mean_x)**2 + (s["y"] - mean_y)**2)
                        for s in gaze_samples
                        if s.get("leftValid") or s.get("rightValid")
                    ]
                    precision_norm = math.sqrt(sum(variances) / len(variances))
                    precision_degrees = precision_norm * 50 * 57.3 / 50
                else:
                    precision_degrees = 0.0

                point_data.append({
                    "point": {"x": expected_x, "y": expected_y},
                    "accuracy": accuracy_degrees,
                    "precision": precision_degrees,
                })

                all_accuracies.append(accuracy_degrees)
                all_precisions.append(precision_degrees)

            # Calculate overall metrics
            if not point_data:
                return {
                    "type": "validation_compute",
                    "success": False,
                    "error": "No valid gaze samples collected",
                }

            average_accuracy = sum(all_accuracies) / len(all_accuracies)
            average_precision = sum(all_precisions) / len(all_precisions)

            self.validation_active = False
            self.logger.info(
                f"Validation computed: accuracy={average_accuracy:.2f}°, precision={average_precision:.2f}°"
            )

            return {
                "type": "validation_compute",
                "success": True,
                "averageAccuracy": average_accuracy,
                "averagePrecision": average_precision,
                "pointData": point_data,
            }

        except Exception as e:
            self.validation_active = False
            self.logger.error(f"Error computing validation: {e}")
            return {
                "type": "validation_compute",
                "success": False,
                "error": str(e),
            }
