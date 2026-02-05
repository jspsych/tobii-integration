# TODO — 1.0 Release

Items identified during pre-release review. Organized by priority.

## Critical

### ~~1. `sendMarker` uses `||` instead of `??` for timestamp~~ DONE

### ~~2. Extension README documents non-existent GazeData fields~~ DONE

## High Priority

### ~~3. `animation` parameter defined but not connected in calibration plugin~~ DONE

Removed the `animation` parameter from the plugin API, types, and README since it was not connected to any logic.

### ~~4. No try-finally cleanup in plugin `trial()` methods~~ DONE

### ~~5. `stopTracking()` leaves inconsistent state on error~~ DONE

### ~~6. WebSocket `on()` silently overwrites handlers~~ DONE

### ~~7. Python: no coordinate validation for calibration points~~ DONE

### ~~8. Migrate Python server to modern `websockets` API~~ DONE

## Documentation

### ~~9. CITATION.cff missing from `plugin-tobii-user-position`~~ DONE

### ~~10. No CONTRIBUTING.md~~ DONE

### ~~11. Python README links to non-existent `/docs/` directory~~ DONE

## Minor

### ~~12. Empty author URL in `package.json` files~~ DONE

### 13. Connection timeout hardcoded at 5 seconds

**File:** `packages/extension-tobii/src/websocket-client.ts:45`

The WebSocket connection timeout is a hardcoded `5000`ms, not configurable through `initialize()` parameters. Researchers running the server on a different machine over a network may need longer. Consider making this configurable.

### 14. No WebSocket origin validation in Python server

**File:** `python/jspsych_tobii/server.py:78-82`

No `origins` parameter is passed to `websockets.serve()`. Any webpage on any domain can connect. In a typical lab setup (localhost) this is fine, but if bound to `0.0.0.0` on a shared network, any browser can connect. Document this as a security consideration.

### 15. Linear reconnection backoff

**File:** `packages/extension-tobii/src/websocket-client.ts:201`

```typescript
const delay = this.config.reconnectDelay * this.currentReconnectAttempt;
```

Reconnection delay grows linearly (1s, 2s, 3s) rather than exponentially (1s, 2s, 4s, 8s). For the typical localhost use case, linear is fine. Exponential would be better for sustained outages.
