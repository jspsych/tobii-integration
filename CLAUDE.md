# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

jsPsych-Tobii is a WebSocket-based Tobii eye tracker integration for jsPsych experiments. The architecture is:

**Browser (jsPsych)** ←→ **WebSocket** ←→ **Python Server** ←→ **Tobii Eye Tracker**

This is a monorepo (npm workspaces) with four JavaScript/TypeScript packages and a Python server.

## Common Commands

### Build & Dev
```bash
npm run build              # Build all packages
npm run build:watch        # Watch mode for all packages
npm run typecheck          # TypeScript type checking
```

### Testing
```bash
npm test                   # Run all JS tests (Jest across workspaces)
cd packages/extension-tobii && npm test  # Test a single package
cd packages/extension-tobii && npm run test:watch  # Watch mode for single package
cd python && pytest        # Run Python tests
```

### Linting & Formatting
```bash
npm run lint               # ESLint on all package source files
npm run lint:fix           # ESLint with auto-fix
npm run format             # Prettier format
npm run format:check       # Prettier check without writing
```

### Release (changesets)
```bash
npm run changeset          # Create a changeset
npm run version            # Version bump from changesets
npm run release            # Build + publish
```

## Architecture

### JavaScript Packages (packages/)

All packages follow the jsPsych v8 pattern: peer-depend on `jspsych >=8.0.0`, use `@jspsych/config` for Jest configuration, and build with Rollup into three formats (ESM, CJS, browser IIFE).

- **`@jspsych/extension-tobii`** — Core extension. Implements `JsPsychExtension` with lifecycle hooks (`initialize`, `on_start`, `on_load`, `on_finish`). Contains internal modules:
  - `WebSocketClient` — request/response WebSocket communication with `requestId` matching
  - `DataManager` — circular buffer for gaze samples (max 7200 = 60s @ 120Hz)
  - `TimeSync` — client/server clock sync using median offset from 10 samples
  - `CoordinateUtils` — normalized ↔ pixel coordinate conversion, container-relative positioning
  - `DataExport` — CSV/JSON export with nested object flattening

- **`@jspsych/plugin-tobii-calibration`** — Visual calibration UI (5/9-point grids, animations)
- **`@jspsych/plugin-tobii-validation`** — Validation plugin measuring gaze accuracy/precision
- **`@jspsych/plugin-tobii-user-position`** — Real-time head position feedback during setup

The plugins peer-depend on `@jspsych/extension-tobii` and access the tracker via `jsPsych.extensions.tobii`.

### Python Server (python/jspsych_tobii/)

Async WebSocket server using the `websockets` library. Key components:
- `server.py` — Main server class
- `websocket_handler.py` — Message routing
- `tobii_manager.py` — Tracker abstraction layer
- `adapters/` — Factory pattern: `TobiiProAdapter` (modern SDK), `TobiiXSeriesAdapter` (legacy), `MockAdapter` (testing)
- `calibration.py`, `time_sync.py`, `data_buffer.py` — Supporting modules

### WebSocket Protocol

JSON messages with `requestId` for request/response pairing. Message types include `start_tracking`, `stop_tracking`, `calibration_*`, `validation_*`, `gaze_data` (streamed), `marker`, `time_sync`.

### Build System

`rollup.config.base.mjs` exports `createConfig()` — a factory that generates ESM, CJS, and minified IIFE builds. Each package has its own `rollup.config.mjs` that calls this factory. `jspsych` is always external.

## Code Style

- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `style:`, `chore:`)
- **TypeScript**: Strict mode, no unused variables/parameters. ESLint + Prettier enforced.
- **Prettier**: Single quotes, semicolons, 100 char width, trailing commas (ES5), LF line endings
- **Python**: Black formatter, PEP 8, type hints, docstrings

## Requirements

- Node.js >= 18, npm >= 9
- Python >= 3.9
- jsPsych >= 8.0.0 (peer dependency)
