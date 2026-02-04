"""
Command-line interface for jsPsych Tobii server
"""

import sys
import argparse
import asyncio
from .config import ServerConfig
from .server import TobiiServer


def main() -> None:
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="jsPsych Tobii Eye Tracker WebSocket Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start server with auto-detected tracker
  jspsych-tobii

  # Start server with mock tracker (no hardware needed)
  jspsych-tobii --mock

  # Force Tobii Pro SDK
  jspsych-tobii --sdk tobii-pro

  # Start server with debug logging
  jspsych-tobii --log-level DEBUG --log-file tobii-server.log

  # Connect to specific tracker address
  jspsych-tobii --tracker tet-tcp://192.168.1.100

  # Full example with all options
  jspsych-tobii --port 9000 --sdk tobii-pro --log-level DEBUG
        """,
    )

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
        "--sdk",
        choices=["tobii-pro"],
        help="Force specific SDK: 'tobii-pro' for tobii-research (auto-detect if not specified)",
    )

    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use mock tracker for testing without hardware",
    )

    parser.add_argument(
        "--buffer-size",
        type=int,
        default=10000,
        help="Maximum buffer size (default: 10000)",
    )

    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Logging level (default: INFO)",
    )

    parser.add_argument(
        "--log-file",
        help="Log file path (logs to console if not specified)",
    )

    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 1.0.0",
    )

    args = parser.parse_args()

    # Create configuration
    config = ServerConfig(
        host=args.host,
        port=args.port,
        tracker_address=args.tracker,
        sdk_type=args.sdk,
        use_mock=args.mock,
        buffer_size=args.buffer_size,
        log_level=args.log_level,
        log_file=args.log_file,
    )

    # Create and start server
    server = TobiiServer(config)

    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
