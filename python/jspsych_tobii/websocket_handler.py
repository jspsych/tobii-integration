"""
WebSocket connection handler
"""

import json
import asyncio
import logging
from typing import Dict, Any, Optional
import websockets
from websockets.server import WebSocketServerProtocol


class WebSocketHandler:
    """Handles individual WebSocket client connections"""

    def __init__(
        self,
        websocket: WebSocketServerProtocol,
        tobii_manager: Any,
        data_buffer: Any,
        time_sync: Any,
        calibration_manager: Any,
    ) -> None:
        """
        Initialize WebSocket handler

        Args:
            websocket: WebSocket connection
            tobii_manager: TobiiManager instance
            data_buffer: DataBuffer instance
            time_sync: TimeSync instance
            calibration_manager: CalibrationManager instance
        """
        self.websocket = websocket
        self.tobii_manager = tobii_manager
        self.data_buffer = data_buffer
        self.time_sync = time_sync
        self.calibration_manager = calibration_manager
        self.logger = logging.getLogger(__name__)
        self.active = True

    async def handle(self) -> None:
        """Handle WebSocket connection"""
        try:
            self.logger.info(f"Client connected: {self.websocket.remote_address}")

            async for message in self.websocket:
                if not self.active:
                    break

                try:
                    data = json.loads(message)
                    response = await self.process_message(data)

                    if response:
                        await self.send(response)

                except json.JSONDecodeError:
                    self.logger.error("Invalid JSON received")
                    await self.send_error("Invalid JSON")

                except Exception as e:
                    self.logger.error(f"Error processing message: {e}")
                    await self.send_error(str(e))

        except websockets.exceptions.ConnectionClosed:
            self.logger.info("Client disconnected")
        except Exception as e:
            self.logger.error(f"WebSocket error: {e}")
        finally:
            self.active = False
            await self.cleanup()

    async def process_message(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process incoming message

        Args:
            data: Message data

        Returns:
            Response data or None
        """
        message_type = data.get("type")
        request_id = data.get("requestId")

        response = None

        if message_type == "start_tracking":
            response = self.handle_start_tracking()

        elif message_type == "stop_tracking":
            response = self.handle_stop_tracking()

        elif message_type == "calibration_start":
            response = self.calibration_manager.start_calibration()

        elif message_type == "calibration_point":
            point = data.get("point", {})
            timestamp = data.get("timestamp", 0)
            response = self.calibration_manager.collect_calibration_point(
                point.get("x", 0),
                point.get("y", 0),
                timestamp,
            )

        elif message_type == "calibration_compute":
            response = self.calibration_manager.compute_calibration()

        elif message_type == "get_calibration_data":
            response = self.calibration_manager.compute_calibration()

        elif message_type == "validation_start":
            response = self.calibration_manager.start_validation()

        elif message_type == "validation_point":
            point = data.get("point", {})
            timestamp = data.get("timestamp", 0)
            response = self.calibration_manager.collect_validation_point(
                point.get("x", 0),
                point.get("y", 0),
                timestamp,
            )

        elif message_type == "validation_compute":
            response = self.calibration_manager.compute_validation()

        elif message_type == "get_current_gaze":
            response = self.handle_get_current_gaze()

        elif message_type == "get_data":
            start_time = data.get("start_time")
            end_time = data.get("end_time")
            response = self.handle_get_data(start_time, end_time)

        elif message_type == "marker":
            self.handle_marker(data)
            response = {"type": "marker", "success": True}

        elif message_type == "time_sync":
            client_time = data.get("clientTime", 0)
            response = self.time_sync.handle_sync_request(client_time)

        else:
            self.logger.warning(f"Unknown message type: {message_type}")
            response = {"type": "error", "error": f"Unknown message type: {message_type}"}

        # Add request ID to response if present
        if response and request_id:
            response["requestId"] = request_id

        return response

    def handle_start_tracking(self) -> Dict[str, Any]:
        """Handle start tracking request"""
        success = self.tobii_manager.start_tracking(self.on_gaze_data)
        return {
            "type": "start_tracking",
            "success": success,
        }

    def handle_stop_tracking(self) -> Dict[str, Any]:
        """Handle stop tracking request"""
        success = self.tobii_manager.stop_tracking()
        return {
            "type": "stop_tracking",
            "success": success,
        }

    def handle_get_current_gaze(self) -> Dict[str, Any]:
        """Handle get current gaze request"""
        gaze = self.data_buffer.get_latest_sample()
        return {
            "type": "get_current_gaze",
            "gaze": gaze,
        }

    def handle_get_data(
        self, start_time: Optional[float], end_time: Optional[float]
    ) -> Dict[str, Any]:
        """Handle get data request"""
        samples = self.data_buffer.get_samples(start_time, end_time)
        return {
            "type": "get_data",
            "samples": samples,
        }

    def handle_marker(self, data: Dict[str, Any]) -> None:
        """Handle marker"""
        self.data_buffer.add_marker(data)

    def on_gaze_data(self, gaze_data: Dict[str, Any]) -> None:
        """
        Callback for gaze data from Tobii tracker

        Args:
            gaze_data: Gaze data sample
        """
        # Add to buffer
        self.data_buffer.add_sample(gaze_data)

        # Send to client in real-time
        asyncio.create_task(
            self.send(
                {
                    "type": "gaze_data",
                    "gaze": gaze_data,
                }
            )
        )

    async def send(self, data: Dict[str, Any]) -> None:
        """
        Send data to client

        Args:
            data: Data to send
        """
        try:
            if self.active:
                await self.websocket.send(json.dumps(data))
        except Exception as e:
            self.logger.error(f"Error sending data: {e}")

    async def send_error(self, error: str) -> None:
        """
        Send error message to client

        Args:
            error: Error message
        """
        await self.send(
            {
                "type": "error",
                "error": error,
            }
        )

    async def cleanup(self) -> None:
        """Cleanup resources"""
        if self.tobii_manager.is_tracking():
            self.tobii_manager.stop_tracking()
