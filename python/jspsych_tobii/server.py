"""
WebSocket server for Tobii eye tracker integration
"""

import asyncio
import logging
import signal
import sys
from typing import Set
from websockets.asyncio.server import serve, ServerConnection

from .config import ServerConfig
from .logger import setup_logger
from .tobii_manager import TobiiManager
from .data_buffer import DataBuffer
from .time_sync import TimeSync
from .calibration import CalibrationManager
from .websocket_handler import WebSocketHandler


class TobiiServer:
    """WebSocket server for Tobii eye tracker"""

    def __init__(self, config: ServerConfig) -> None:
        """
        Initialize server

        Args:
            config: Server configuration
        """
        self.config = config
        self.logger = setup_logger(
            "jspsych_tobii",
            level=config.get_log_level(),
            log_file=config.log_file,
        )

        # Initialize components
        # Convert sdk_type string to SDKType enum if specified
        sdk_type_enum = None
        if config.sdk_type:
            from .adapters import SDKType
            sdk_map = {
                "tobii-pro": SDKType.TOBII_PRO,
                "mock": SDKType.MOCK,
            }
            sdk_type_enum = sdk_map.get(config.sdk_type)

        self.tobii_manager = TobiiManager(
            tracker_address=config.tracker_address,
            sdk_type=sdk_type_enum,
            use_mock=config.use_mock,
        )
        self.data_buffer = DataBuffer(config.buffer_size, config.buffer_duration)
        self.time_sync = TimeSync()
        self.calibration_manager = CalibrationManager(self.tobii_manager)

        # Active connections
        self.clients: Set[ServerConnection] = set()

        # Server state
        self.running = False

    async def start(self) -> None:
        """Start the WebSocket server"""
        self.logger.info(f"Starting Tobii WebSocket server on {self.config.host}:{self.config.port}")

        # Find and connect to tracker
        if not self.tobii_manager.find_tracker():
            self.logger.error("Failed to find Tobii eye tracker")
            return

        tracker_info = self.tobii_manager.get_tracker_info()
        self.logger.info(f"Connected to tracker: {tracker_info}")

        # Start WebSocket server
        async with serve(
            self.handle_client,
            self.config.host,
            self.config.port,
        ):
            self.running = True
            self.logger.info("Server started successfully")

            # Keep server running
            await self.run_forever()

    async def handle_client(self, websocket: ServerConnection) -> None:
        """
        Handle new client connection

        Args:
            websocket: WebSocket connection
        """
        self.clients.add(websocket)

        try:
            handler = WebSocketHandler(
                websocket,
                self.tobii_manager,
                self.data_buffer,
                self.time_sync,
                self.calibration_manager,
            )
            await handler.handle()

        finally:
            self.clients.remove(websocket)

    async def run_forever(self) -> None:
        """Keep server running"""
        # Set up signal handlers for graceful shutdown (not supported on Windows)
        if sys.platform != "win32":
            loop = asyncio.get_event_loop()
            for sig in (signal.SIGTERM, signal.SIGINT):
                loop.add_signal_handler(sig, lambda: asyncio.create_task(self.shutdown()))

        # Periodic cleanup task
        while self.running:
            await asyncio.sleep(10)
            self.data_buffer.cleanup_old_data()

    async def shutdown(self) -> None:
        """Shutdown server gracefully"""
        self.logger.info("Shutting down server...")
        self.running = False

        # Remove signal handlers to avoid issues if server restarts in same process
        if sys.platform != "win32":
            loop = asyncio.get_event_loop()
            for sig in (signal.SIGTERM, signal.SIGINT):
                loop.remove_signal_handler(sig)

        # Stop tracking
        if self.tobii_manager.is_tracking():
            self.tobii_manager.stop_tracking()

        # Close all client connections
        for client in self.clients:
            await client.close()

        self.logger.info("Server shutdown complete")


def main() -> None:
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="jsPsych Tobii WebSocket Server")
    parser.add_argument(
        "--host",
        default="localhost",
        help="Server host address (default: localhost)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Server port (default: 8080)",
    )
    parser.add_argument(
        "--tracker",
        help="Specific tracker address (auto-detect if not specified)",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level (default: INFO)",
    )
    parser.add_argument(
        "--log-file",
        help="Log file path (logs to console if not specified)",
    )

    args = parser.parse_args()

    config = ServerConfig(
        host=args.host,
        port=args.port,
        tracker_address=args.tracker,
        log_level=args.log_level,
        log_file=args.log_file,
    )

    server = TobiiServer(config)

    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\nServer stopped by user")


if __name__ == "__main__":
    main()
