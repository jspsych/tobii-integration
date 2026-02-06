"""Tests for ServerConfig"""

import logging

from jspsych_tobii.config import ServerConfig


class TestServerConfig:
    def test_defaults(self):
        config = ServerConfig()
        assert config.host == "localhost"
        assert config.port == 8080
        assert config.tracker_address is None
        assert config.use_mock is False
        assert config.buffer_size == 10000
        assert config.buffer_duration == 60000
        assert config.log_level == "INFO"
        assert config.log_file is None

    def test_custom_values(self):
        config = ServerConfig(host="0.0.0.0", port=9000, use_mock=True, buffer_size=5000)
        assert config.host == "0.0.0.0"
        assert config.port == 9000
        assert config.use_mock is True
        assert config.buffer_size == 5000

    def test_get_log_level(self):
        assert ServerConfig(log_level="DEBUG").get_log_level() == logging.DEBUG
        assert ServerConfig(log_level="INFO").get_log_level() == logging.INFO
        assert ServerConfig(log_level="WARNING").get_log_level() == logging.WARNING
        assert ServerConfig(log_level="ERROR").get_log_level() == logging.ERROR

    def test_get_log_level_case_insensitive(self):
        assert ServerConfig(log_level="debug").get_log_level() == logging.DEBUG

    def test_get_log_level_invalid_defaults_to_info(self):
        assert ServerConfig(log_level="INVALID").get_log_level() == logging.INFO
