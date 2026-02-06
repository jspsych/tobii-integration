"""Tests for MockTrackerAdapter"""

import time

from jspsych_tobii.adapters.mock import MockTrackerAdapter
from jspsych_tobii.adapters.base import CalibrationPoint


class TestMockAdapter:
    def test_sdk_info(self):
        adapter = MockTrackerAdapter()
        assert adapter.sdk_name == "mock"
        assert adapter.sdk_version == "1.0.0"

    def test_connect_disconnect(self):
        adapter = MockTrackerAdapter()
        assert adapter.is_connected() is False
        assert adapter.connect() is True
        assert adapter.is_connected() is True
        assert adapter.disconnect() is True
        assert adapter.is_connected() is False

    def test_tracker_info(self):
        adapter = MockTrackerAdapter()
        assert adapter.get_tracker_info() is None
        adapter.connect()
        info = adapter.get_tracker_info()
        assert info is not None
        assert info.model == "Mock Tobii Pro Spectrum"
        assert info.sampling_frequency == 120.0

    def test_find_trackers(self):
        adapter = MockTrackerAdapter()
        trackers = adapter.find_trackers()
        assert len(trackers) == 1

    def test_gaze_subscription(self):
        adapter = MockTrackerAdapter()
        adapter.connect()
        samples = []
        assert adapter.subscribe_to_gaze_data(lambda d: samples.append(d)) is True
        assert adapter.is_tracking() is True
        time.sleep(0.1)
        assert adapter.unsubscribe_from_gaze_data() is True
        assert adapter.is_tracking() is False
        assert len(samples) > 0
        # Check sample structure
        sample = samples[0]
        assert 0 <= sample.x <= 1
        assert 0 <= sample.y <= 1
        assert sample.timestamp > 0

    def test_gaze_subscription_requires_connection(self):
        adapter = MockTrackerAdapter()
        assert adapter.subscribe_to_gaze_data(lambda d: None) is False

    def test_calibration_workflow(self):
        adapter = MockTrackerAdapter()
        adapter.connect()
        assert adapter.start_calibration() is True
        for x, y in [(0.1, 0.1), (0.5, 0.5), (0.9, 0.9)]:
            assert adapter.collect_calibration_data(CalibrationPoint(x, y)) is True
        result = adapter.compute_calibration()
        assert result.success is True
        assert adapter.leave_calibration_mode() is True

    def test_calibration_too_few_points(self):
        adapter = MockTrackerAdapter()
        adapter.connect()
        adapter.start_calibration()
        adapter.collect_calibration_data(CalibrationPoint(0.5, 0.5))
        result = adapter.compute_calibration()
        assert result.success is False

    def test_calibration_requires_connection(self):
        adapter = MockTrackerAdapter()
        assert adapter.start_calibration() is False

    def test_user_position(self):
        adapter = MockTrackerAdapter()
        assert adapter.get_user_position() is None
        adapter.connect()
        pos = adapter.get_user_position()
        assert pos is not None
        assert pos.left_valid is True
        assert pos.right_valid is True
        assert 0 <= pos.left_x <= 1
        assert 0 <= pos.right_x <= 1
