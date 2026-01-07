"""
Time synchronization between server and client
"""

import time
from typing import Dict, Any


class TimeSync:
    """Time synchronization manager"""

    def __init__(self) -> None:
        self.offset: float = 0.0
        self.synced: bool = False

    def handle_sync_request(self, client_time: float) -> Dict[str, Any]:
        """
        Handle time sync request from client

        Args:
            client_time: Client timestamp (ms)

        Returns:
            Response with server time
        """
        server_time = time.time() * 1000  # milliseconds

        return {
            "type": "time_sync",
            "serverTime": server_time,
            "clientTime": client_time,
        }

    def set_offset(self, offset: float) -> None:
        """
        Set time offset

        Args:
            offset: Time offset in milliseconds
        """
        self.offset = offset
        self.synced = True

    def to_server_time(self, client_time: float) -> float:
        """
        Convert client time to server time

        Args:
            client_time: Client timestamp (ms)

        Returns:
            Server timestamp (ms)
        """
        return client_time + self.offset

    def to_client_time(self, server_time: float) -> float:
        """
        Convert server time to client time

        Args:
            server_time: Server timestamp (ms)

        Returns:
            Client timestamp (ms)
        """
        return server_time - self.offset

    def is_synced(self) -> bool:
        """Check if time is synchronized"""
        return self.synced
