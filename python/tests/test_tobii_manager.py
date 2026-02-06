"""Tests for TobiiManager"""

from jspsych_tobii.tobii_manager import TobiiManager


class TestTobiiManager:
    def test_create_with_mock(self):
        manager = TobiiManager(use_mock=True)
        assert manager.adapter is not None
        assert manager.adapter.sdk_name == "mock"

    def test_find_tracker(self):
        manager = TobiiManager(use_mock=True)
        assert manager.find_tracker() is True

    def test_tracker_info(self):
        manager = TobiiManager(use_mock=True)
        manager.find_tracker()
        info = manager.get_tracker_info()
        assert info["connected"] is True
        assert info["model"] == "Mock Tobii Pro Spectrum"
        assert info["sdk"] == "mock"

    def test_tracker_info_not_connected(self):
        manager = TobiiManager(use_mock=True)
        info = manager.get_tracker_info()
        assert info["connected"] is False

    def test_start_stop_tracking(self):
        manager = TobiiManager(use_mock=True)
        manager.find_tracker()
        samples = []
        assert manager.start_tracking(lambda d: samples.append(d)) is True
        assert manager.is_tracking() is True
        assert manager.stop_tracking() is True
        assert manager.is_tracking() is False

    def test_user_position(self):
        manager = TobiiManager(use_mock=True)
        manager.find_tracker()
        pos = manager.get_user_position()
        assert pos is not None
        assert "leftX" in pos
        assert "rightX" in pos
        assert "leftValid" in pos

    def test_user_position_not_connected(self):
        manager = TobiiManager(use_mock=True)
        pos = manager.get_user_position()
        assert pos is None
