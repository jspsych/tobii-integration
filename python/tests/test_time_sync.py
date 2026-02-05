"""Tests for TimeSync"""

from jspsych_tobii.time_sync import TimeSync


class TestTimeSync:
    def test_initial_state(self):
        ts = TimeSync()
        assert ts.is_synced() is False
        assert ts.offset == 0.0

    def test_handle_sync_request(self):
        ts = TimeSync()
        response = ts.handle_sync_request(1000.0)
        assert response["type"] == "time_sync"
        assert response["clientTime"] == 1000.0
        assert "serverTime" in response
        assert response["serverTime"] > 0

    def test_set_offset(self):
        ts = TimeSync()
        ts.set_offset(50.0)
        assert ts.is_synced() is True
        assert ts.offset == 50.0

    def test_to_server_time(self):
        ts = TimeSync()
        ts.set_offset(100.0)
        assert ts.to_server_time(500.0) == 600.0

    def test_to_client_time(self):
        ts = TimeSync()
        ts.set_offset(100.0)
        assert ts.to_client_time(600.0) == 500.0

    def test_round_trip_conversion(self):
        ts = TimeSync()
        ts.set_offset(42.5)
        client_time = 1000.0
        server_time = ts.to_server_time(client_time)
        assert ts.to_client_time(server_time) == client_time
