"""
WebSocket connection handler
"""

import json
import asyncio
import logging
import math
import uuid
from typing import Dict, Any, Optional
import websockets
from websockets.server import WebSocketServerProtocol


def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitize an object for JSON serialization.
    Converts NaN and Infinity to None since JSON doesn't support them.
    """
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(item) for item in obj]
    elif hasattr(obj, "__dict__"):
        # Handle dataclass-like objects
        return sanitize_for_json(vars(obj))
    return obj


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
        # Unique client ID for this connection
        self.client_id = str(uuid.uuid4())
        # Store reference to event loop for cross-thread callbacks
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    async def handle(self) -> None:
        """Handle WebSocket connection"""
        # Capture the event loop for use in cross-thread callbacks
        self._loop = asyncio.get_running_loop()

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
            response = self.calibration_manager.start_calibration(self.client_id)

        elif message_type == "calibration_point":
            point = data.get("point", {})
            timestamp = data.get("timestamp", 0)
            response = self.calibration_manager.collect_calibration_point(
                point.get("x", 0),
                point.get("y", 0),
                timestamp,
                self.client_id,
            )

        elif message_type == "calibration_compute":
            response = self.calibration_manager.compute_calibration(self.client_id)

        elif message_type == "get_calibration_data":
            response = self.calibration_manager.compute_calibration(self.client_id)

        elif message_type == "validation_start":
            response = self.calibration_manager.start_validation(self.client_id)

        elif message_type == "validation_point":
            point = data.get("point", {})
            timestamp = data.get("timestamp", 0)
            gaze_samples = data.get("gaze_samples", [])
            response = self.calibration_manager.collect_validation_point(
                point.get("x", 0),
                point.get("y", 0),
                timestamp,
                gaze_samples,
                self.client_id,
            )

        elif message_type == "validation_compute":
            response = self.calibration_manager.compute_validation(self.client_id)

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

        elif message_type == "get_user_position":
            response = self.handle_get_user_position()

        elif message_type == "get_device_clock_offset":
            response = self.handle_get_device_clock_offset()

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

    def handle_get_user_position(self) -> Dict[str, Any]:
        """Handle get user position request"""
        position = self.tobii_manager.get_user_position()
        return {
            "type": "get_user_position",
            "position": position,
        }

    def handle_get_device_clock_offset(self) -> Dict[str, Any]:
        """Handle get device clock offset request"""
        result = self.data_buffer.get_device_clock_offset()
        if result is None:
            return {
                "type": "get_device_clock_offset",
                "success": False,
                "error": "No gaze samples available to compute offset",
            }
        return {
            "type": "get_device_clock_offset",
            "success": True,
            **result,
        }

    def on_gaze_data(self, gaze_data: Dict[str, Any]) -> None:
        """
        Callback for gaze data from Tobii tracker.
        This runs in a different thread (Tobii SDK thread), so we need to
        use run_coroutine_threadsafe to schedule the WebSocket send.

        Args:
            gaze_data: Gaze data sample
        """
        # Add to buffer
        self.data_buffer.add_sample(gaze_data)

        # Send to client in real-time
        if not self._loop or not self.active:
            return

        async def send_gaze_data():
            try:
                await self.send(
                    {
                        "type": "gaze_data",
                        "gaze": gaze_data,
                    }
                )
            except Exception as e:
                self.logger.error(f"Error sending gaze data: {e}")

        # Schedule the coroutine on the main event loop from this thread
        asyncio.run_coroutine_threadsafe(send_gaze_data(), self._loop)

    async def send(self, data: Dict[str, Any]) -> None:
        """
        Send data to client

        Args:
            data: Data to send
        """
        try:
            if self.active:
                # Sanitize data to handle NaN/Infinity which aren't valid JSON
                sanitized = sanitize_for_json(data)
                await self.websocket.send(json.dumps(sanitized))
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
        # Remove calibration session for this client
        self.calibration_manager.remove_session(self.client_id)

        if self.tobii_manager.is_tracking():
            self.tobii_manager.stop_tracking()
