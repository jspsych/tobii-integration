"""
jsPsych Tobii Integration - WebSocket Server for Tobii Eye Trackers

This package provides a WebSocket server for integrating Tobii Pro eye trackers
with jsPsych experiments running in web browsers.
"""

__version__ = "0.1.0"
__author__ = "jsPsych Team"
__license__ = "MIT"

from .server import TobiiServer
from .config import ServerConfig

__all__ = ["TobiiServer", "ServerConfig"]
