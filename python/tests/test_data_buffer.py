"""Tests for DataBuffer"""

import time

from jspsych_tobii.data_buffer import DataBuffer


class TestDataBuffer:
    def test_add_and_get_latest(self):
        buf = DataBuffer()
        sample = {"x": 0.5, "y": 0.5, "timestamp": 1000.0}
        buf.add_sample(sample)
        latest = buf.get_latest_sample()
        assert latest is not None
        assert latest["x"] == 0.5
        assert "server_timestamp" in latest

    def test_empty_buffer_returns_none(self):
        buf = DataBuffer()
        assert buf.get_latest_sample() is None

    def test_max_size_enforced(self):
        buf = DataBuffer(max_size=5)
        for i in range(10):
            buf.add_sample({"x": i, "y": 0, "timestamp": float(i)})
        assert buf.get_size() == 5

    def test_get_samples_all(self):
        buf = DataBuffer()
        for i in range(3):
            buf.add_sample({"x": i, "y": 0, "timestamp": float(i * 100)})
        samples = buf.get_samples()
        assert len(samples) == 3

    def test_get_samples_time_range(self):
        buf = DataBuffer()
        for i in range(5):
            buf.add_sample({"x": i, "y": 0, "timestamp": float(i * 100)})
        samples = buf.get_samples(start_time=100.0, end_time=300.0)
        assert len(samples) == 3

    def test_clear(self):
        buf = DataBuffer()
        buf.add_sample({"x": 0.5, "y": 0.5, "timestamp": 1000.0})
        buf.clear()
        assert buf.get_size() == 0
        assert buf.get_latest_sample() is None

    def test_device_clock_offset(self):
        buf = DataBuffer()
        # Add samples with known timestamps
        server_time = time.time() * 1000
        for i in range(5):
            buf.add_sample({"x": 0, "y": 0, "timestamp": server_time - 100 + i})
        result = buf.get_device_clock_offset()
        assert result is not None
        assert "offset" in result
        assert "sample_count" in result
        assert result["sample_count"] == 5

    def test_device_clock_offset_empty(self):
        buf = DataBuffer()
        assert buf.get_device_clock_offset() is None

    def test_statistics_empty(self):
        buf = DataBuffer()
        stats = buf.get_statistics()
        assert stats["size"] == 0
        assert stats["sampling_rate"] == 0

    def test_statistics_with_data(self):
        buf = DataBuffer()
        for i in range(100):
            buf.add_sample({"x": 0, "y": 0, "timestamp": float(i * 10)})
        stats = buf.get_statistics()
        assert stats["size"] == 100
        assert stats["duration_ms"] > 0
