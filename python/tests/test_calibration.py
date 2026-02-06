"""Tests for CalibrationManager"""

import math

from jspsych_tobii.calibration import CalibrationManager, CalibrationSession
from jspsych_tobii.tobii_manager import TobiiManager
from jspsych_tobii.adapters import SDKType, create_tracker_adapter


def make_manager():
    """Create a CalibrationManager with a connected mock tracker."""
    manager = TobiiManager(use_mock=True)
    manager.find_tracker()
    return CalibrationManager(manager)


class TestCalibrationSession:
    def test_initial_state(self):
        session = CalibrationSession("client-1")
        assert session.client_id == "client-1"
        assert session.calibration_active is False
        assert session.validation_active is False
        assert session.calibration_points == []
        assert session.validation_points == []


class TestCalibrationManagerCalibration:
    def test_start_calibration(self):
        cm = make_manager()
        result = cm.start_calibration("c1")
        assert result["success"] is True
        assert result["type"] == "calibration_start"

    def test_collect_point_without_start_fails(self):
        cm = make_manager()
        result = cm.collect_calibration_point(0.5, 0.5, 0, client_id="c1")
        assert result["success"] is False
        assert "not active" in result["error"]

    def test_collect_point(self):
        cm = make_manager()
        cm.start_calibration("c1")
        result = cm.collect_calibration_point(0.5, 0.5, 1000, client_id="c1")
        assert result["success"] is True
        assert result["point"] == {"x": 0.5, "y": 0.5}

    def test_compute_calibration(self):
        cm = make_manager()
        cm.start_calibration("c1")
        for x, y in [(0.1, 0.1), (0.5, 0.5), (0.9, 0.9), (0.1, 0.9), (0.9, 0.1)]:
            cm.collect_calibration_point(x, y, 0, client_id="c1")
        result = cm.compute_calibration("c1")
        assert result["success"] is True
        assert result["type"] == "calibration_compute"

    def test_compute_calibration_without_start_fails(self):
        cm = make_manager()
        result = cm.compute_calibration("c1")
        assert result["success"] is False

    def test_another_client_blocked(self):
        cm = make_manager()
        cm.start_calibration("c1")
        result = cm.start_calibration("c2")
        assert result["success"] is False
        assert "Another client" in result["error"]

    def test_wrong_client_cannot_collect(self):
        cm = make_manager()
        cm.start_calibration("c1")
        result = cm.collect_calibration_point(0.5, 0.5, 0, client_id="c2")
        assert result["success"] is False

    def test_wrong_client_cannot_compute(self):
        cm = make_manager()
        cm.start_calibration("c1")
        cm.collect_calibration_point(0.5, 0.5, 0, client_id="c1")
        result = cm.compute_calibration("c2")
        assert result["success"] is False

    def test_remove_session_releases_lock(self):
        cm = make_manager()
        cm.start_calibration("c1")
        cm.remove_session("c1")
        # Another client should now be able to calibrate
        result = cm.start_calibration("c2")
        assert result["success"] is True


class TestCalibrationManagerValidation:
    def test_start_validation(self):
        cm = make_manager()
        result = cm.start_validation("c1")
        assert result["success"] is True
        assert result["type"] == "validation_start"

    def test_collect_validation_point(self):
        cm = make_manager()
        cm.start_validation("c1")
        result = cm.collect_validation_point(0.5, 0.5, 0, client_id="c1")
        assert result["success"] is True

    def test_collect_without_start_fails(self):
        cm = make_manager()
        result = cm.collect_validation_point(0.5, 0.5, 0, client_id="c1")
        assert result["success"] is False

    def test_compute_validation_needs_minimum_points(self):
        cm = make_manager()
        cm.start_validation("c1")
        cm.collect_validation_point(0.5, 0.5, 0, client_id="c1")
        result = cm.compute_validation("c1")
        assert result["success"] is False
        assert "at least 3" in result["error"]

    def test_compute_validation_with_gaze_samples(self):
        cm = make_manager()
        cm.start_validation("c1")

        points = [(0.1, 0.1), (0.5, 0.5), (0.9, 0.9)]
        for x, y in points:
            samples = [
                {"x": x + 0.01, "y": y + 0.01, "leftValid": True, "rightValid": True}
                for _ in range(20)
            ]
            cm.collect_validation_point(x, y, 0, gaze_samples=samples, client_id="c1")

        result = cm.compute_validation("c1")
        assert result["success"] is True
        assert "averageAccuracyNorm" in result
        assert "averagePrecisionNorm" in result
        assert "pointData" in result
        assert len(result["pointData"]) == 3
        # Accuracy should be small since gaze is close to target
        assert result["averageAccuracyNorm"] < 0.1

    def test_compute_validation_no_valid_samples(self):
        cm = make_manager()
        cm.start_validation("c1")
        # Points with no gaze samples
        for x, y in [(0.1, 0.1), (0.5, 0.5), (0.9, 0.9)]:
            cm.collect_validation_point(x, y, 0, gaze_samples=[], client_id="c1")
        result = cm.compute_validation("c1")
        assert result["success"] is False
        assert "No valid gaze samples" in result["error"]
