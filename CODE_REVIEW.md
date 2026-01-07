# Code Review: Tobii Integration for jsPsych

This document provides a comprehensive review of the plugins, extensions, and server packages, identifying potential problems, improvements, and areas of concern.

## Table of Contents
1. [Extension: @jspsych/extension-tobii](#extension-jspsynextension-tobii)
2. [Plugin: plugin-tobii-calibration](#plugin-plugin-tobii-calibration)
3. [Plugin: plugin-tobii-validation](#plugin-plugin-tobii-validation)
4. [Plugin: plugin-tobii-user-position](#plugin-plugin-tobii-user-position)
5. [Python Server: jspsych-tobii](#python-server-jspsych-tobii)
6. [Cross-Cutting Concerns](#cross-cutting-concerns)
7. [Summary and Recommendations](#summary-and-recommendations)

---

## Extension: @jspsych/extension-tobii

### Issues Identified

#### 1. Memory Leak Potential in Data Manager (MEDIUM)
**File:** `packages/extension-tobii/src/data-manager.ts:15-17`

The `addGazeData` method continuously pushes to an array without any bounds checking:

```typescript
addGazeData(data: GazeData): void {
  this.gazeBuffer.push(data);
}
```

**Problem:** At 120Hz sampling, this accumulates ~7,200 samples/minute. Long experiments could cause memory issues.

**Recommendation:** Implement a configurable max buffer size or use a circular buffer.

#### 2. Unhandled Connection State in startTracking (HIGH)
**File:** `packages/extension-tobii/src/index.ts:169-176`

```typescript
async startTracking(): Promise<void> {
  if (!this.isConnected()) {
    throw new Error("Not connected to server. Call connect() first.");
  }
  await this.ws.send({ type: "start_tracking" });
  this.tracking = true;
}
```

**Problem:** Sets `this.tracking = true` before server confirms success. If the server fails to start tracking, the state becomes inconsistent.

**Recommendation:** Wait for server confirmation before setting state:
```typescript
const response = await this.ws.sendAndWait({ type: "start_tracking" });
if (response.success) {
  this.tracking = true;
}
```

#### 3. Time Sync Not Used in Data Collection (MEDIUM)
**File:** `packages/extension-tobii/src/index.ts:91-96`

Trial start markers use `performance.now()` without applying time sync offset:

```typescript
await this.sendMarker({
  label: "trial_start",
  timestamp: performance.now(),  // Not synchronized
  ...params.metadata,
});
```

**Problem:** Timestamps won't be aligned with server time, defeating the purpose of time synchronization.

**Recommendation:** Use `this.timeSync.toServerTime(performance.now())`.

#### 4. WebSocket Reconnect Doesn't Re-sync Time (MEDIUM)
**File:** `packages/extension-tobii/src/websocket-client.ts:191-209`

The `handleDisconnect` method attempts to reconnect but doesn't trigger time re-synchronization.

**Problem:** After reconnection, time sync offset may be stale or invalid.

**Recommendation:** Emit a "reconnected" event that triggers `this.timeSync.synchronize()`.

#### 5. Race Condition in sendAndWait (LOW)
**File:** `packages/extension-tobii/src/websocket-client.ts:123-148`

The request ID generation uses `Date.now()` + `Math.random()`:

```typescript
const requestId = `req_${Date.now()}_${Math.random()}`;
```

**Problem:** In rapid succession, `Date.now()` could be identical, and `Math.random()` collision is unlikely but possible.

**Recommendation:** Use a proper UUID or monotonic counter.

#### 6. No Validation of Server Response Types (MEDIUM)
**File:** `packages/extension-tobii/src/index.ts:218-223`

```typescript
async computeCalibration(): Promise<CalibrationResult> {
  const response = await this.ws.sendAndWait({
    type: "calibration_compute",
  });
  return response as CalibrationResult;  // Unsafe cast
}
```

**Problem:** No validation that the response actually conforms to `CalibrationResult` interface.

**Recommendation:** Add runtime validation similar to `validateGazeData`.

---

## Plugin: plugin-tobii-calibration

### Issues Identified

#### 1. Styles Persist After Plugin Unload (LOW)
**File:** `packages/plugin-tobii-calibration/src/index.ts:143-303`

The `injectStyles` method adds styles to `document.head` with a static flag:

```typescript
private static styleInjected = false;
// ...
PluginTobiiCalibrationPlugin.styleInjected = true;
```

**Problem:** Styles remain even after the trial completes or jsPsych ends. If page is reused (SPA), old styles persist.

**Recommendation:** Add cleanup in `on_finish` or provide a `removeStyles` method.

#### 2. Custom Points Not Validated (MEDIUM)
**File:** `packages/plugin-tobii-calibration/src/index.ts:327`

```typescript
const points = trial.custom_points || this.getCalibrationPoints(trial.calibration_points as 5 | 9);
```

**Problem:** Custom points aren't validated. User could provide invalid coordinates (outside 0-1 range).

**Recommendation:** Validate custom points before use:
```typescript
if (trial.custom_points) {
  for (const point of trial.custom_points) {
    if (!isValidCalibrationPoint(point)) {
      throw new Error(`Invalid calibration point: ${JSON.stringify(point)}`);
    }
  }
}
```

#### 3. No Error Handling for Extension Access (HIGH)
**File:** `packages/plugin-tobii-calibration/src/index.ts:309`

```typescript
const tobiiExt = this.jsPsych.extensions.tobii as any;
```

**Problem:** Uses `as any` type cast, losing type safety. No graceful handling if extension methods are missing.

**Recommendation:** Add proper type checking:
```typescript
if (typeof tobiiExt.startCalibration !== 'function') {
  throw new Error("Tobii extension missing required method: startCalibration");
}
```

#### 4. calibration_points Type Not Properly Constrained (LOW)
**File:** `packages/plugin-tobii-calibration/src/index.ts:19-22`

```typescript
calibration_points: {
  type: ParameterType.INT,
  default: 9,
},
```

**Problem:** Accepts any integer but `getCalibrationPoints` only handles 5 or 9. Value like 7 would silently use 5-point.

**Recommendation:** Add validation or support more grid sizes.

#### 5. No Retry Mechanism for Failed Calibration (MEDIUM)
**File:** `packages/plugin-tobii-calibration/src/index.ts:357-364`

After computing calibration, results are displayed but there's no automatic retry option for failed points.

**Recommendation:** Consider adding a retry workflow for points with high error.

---

## Plugin: plugin-tobii-validation

### Issues Identified

#### 1. Timing Race Between Collection and Data Retrieval (HIGH)
**File:** `packages/plugin-tobii-validation/src/index.ts:372-379`

```typescript
// Wait for data collection
await this.delay(trial.collection_duration);

// Get gaze samples collected during this point's display
const gazeSamples = tobiiExt.getRecentGazeData(trial.collection_duration);
```

**Problem:** There's no guarantee that `getRecentGazeData` returns samples from exactly when the point was displayed. Network latency or buffer timing could cause misalignment.

**Recommendation:** Capture start timestamp before delay and use time-range query:
```typescript
const startTime = performance.now();
await this.delay(trial.collection_duration);
const endTime = performance.now();
const gazeSamples = tobiiExt.getGazeData(startTime, endTime);
```

#### 2. Duplicate Style Class Names (LOW)
**Files:** Both calibration and validation plugins use similar but slightly different CSS class names that could conflict.

**Problem:** Class names like `.result-content h2` could have specificity conflicts.

**Recommendation:** Use more specific prefixes: `.tobii-calibration-result-content`, `.tobii-validation-result-content`.

#### 3. Hard-coded Success Threshold (MEDIUM)
**File:** `packages/plugin-tobii-validation/src/index.ts`

There's no configurable threshold for determining if validation "succeeded."

**Recommendation:** Add parameters like `accuracy_threshold_good`, `accuracy_threshold_acceptable`.

---

## Plugin: plugin-tobii-user-position

### Issues Identified

#### 1. setInterval Not Properly Typed (LOW)
**File:** `packages/plugin-tobii-user-position/src/index.ts:313`

```typescript
const updateInterval = setInterval(async () => {
```

**Problem:** Should use `window.setInterval` for browser environment to ensure proper typing.

#### 2. Position Averaging Loses Eye-Specific Issues (MEDIUM)
**File:** `packages/plugin-tobii-user-position/src/position-display.ts:106-115`

```typescript
private getAveragePosition(left: number | null, right: number | null, ...): number | null {
  if (leftValid && rightValid && left !== null && right !== null) {
    return (left + right) / 2;
  }
```

**Problem:** If one eye has poor tracking, averaging masks the problem.

**Recommendation:** Consider showing per-eye status or flagging when only one eye is valid.

#### 3. Magic Numbers for Position Thresholds (MEDIUM)
**File:** `packages/plugin-tobii-user-position/src/position-display.ts:212-214, 217-238`

```typescript
if (distance < 0.15) return this.options.goodColor;
if (distance < 0.25) return this.options.fairColor;
```

**Problem:** Thresholds are hard-coded and not configurable.

**Recommendation:** Make these configurable via plugin parameters.

#### 4. No Debouncing on Position Updates (LOW)
**File:** `packages/plugin-tobii-user-position/src/index.ts:313-329`

Position updates at 100ms intervals could cause UI jitter.

**Recommendation:** Consider smoothing/averaging recent positions for display.

---

## Python Server: jspsych-tobii

### Issues Identified

#### 1. No Thread Safety in DataBuffer (HIGH)
**File:** `python/jspsych_tobii/data_buffer.py`

The `DataBuffer` class claims to be "Thread-safe buffer" in comments but doesn't use locks:

```python
def add_sample(self, sample: Dict[str, Any]) -> None:
    sample["server_timestamp"] = time.time() * 1000
    self.buffer.append(sample)
```

**Problem:** Multiple WebSocket handlers could write concurrently, causing race conditions.

**Recommendation:** Add threading.Lock:
```python
def __init__(self, ...):
    self._lock = threading.Lock()

def add_sample(self, sample):
    with self._lock:
        sample["server_timestamp"] = time.time() * 1000
        self.buffer.append(sample)
```

#### 2. Unused numpy Import (LOW)
**File:** `python/jspsych_tobii/data_buffer.py:8`

```python
import numpy as np
```

**Problem:** numpy is imported but never used in the file.

**Recommendation:** Remove unused import.

#### 3. Calibration Mode Not Left After Error (MEDIUM)
**File:** `python/jspsych_tobii/calibration.py:159-166`

```python
except Exception as e:
    self.calibration_active = False
    self.logger.error(f"Error computing calibration: {e}")
```

**Problem:** When calibration computation fails, `calibration_active` is set to False but the adapter's calibration mode may still be active.

**Recommendation:** Call `self.tobii_manager.adapter.leave_calibration_mode()` in exception handler.

#### 4. Degrees Approximation in Validation Is Crude (MEDIUM)
**File:** `python/jspsych_tobii/calibration.py:309-310`

```python
# This is a rough approximation: degrees ≈ normalized_distance * screen_width_cm * (180/π) / viewing_distance_cm
accuracy_degrees = accuracy_norm * 50 * 57.3 / 50  # ≈ normalized * 57.3
```

**Problem:** Hard-coded screen and viewing distance assumptions. Doesn't account for actual monitor dimensions.

**Recommendation:** Make screen geometry configurable, or retrieve from tracker's display area settings.

#### 5. Multiple Clients Share Calibration State (HIGH)
**File:** `python/jspsych_tobii/calibration.py`

The `CalibrationManager` is shared across all connected clients:

```python
# In server.py
self.calibration_manager = CalibrationManager(self.tobii_manager)
```

**Problem:** If two clients connect simultaneously, one's calibration could interfere with another's.

**Recommendation:** Create per-client calibration sessions or implement locking.

#### 6. WebSocket Handler Creates Task Without Error Handling (MEDIUM)
**File:** `python/jspsych_tobii/websocket_handler.py:216-223`

```python
asyncio.create_task(
    self.send(
        {
            "type": "gaze_data",
            "gaze": gaze_data,
        }
    )
)
```

**Problem:** Fire-and-forget task with no exception handling. Errors will be silently lost.

**Recommendation:** Add exception handling or use `asyncio.create_task` with error callback.

#### 7. Signal Handlers Not Removed on Shutdown (LOW)
**File:** `python/jspsych_tobii/server.py:116-117`

Signal handlers are added but never removed.

**Problem:** Could cause issues if server is restarted within the same process.

#### 8. SDK Type Map Incomplete (LOW)
**File:** `python/jspsych_tobii/server.py:44-47`

```python
sdk_map = {
    "tobii-pro": SDKType.TOBII_PRO,
    "tobii-x-series": SDKType.TOBII_X_SERIES,
}
```

**Problem:** Missing "mock" option despite `use_mock` existing.

**Recommendation:** Add consistency or document the difference.

#### 9. Potential Division by Zero (LOW)
**File:** `python/jspsych_tobii/calibration.py:314`

```python
mean_x = sum(s["x"] for s in gaze_samples if ...) / len(distances)
```

**Problem:** If `distances` is empty from filtering, this would divide by zero.

**Recommendation:** Add guard: `if len(distances) > 0:`.

#### 10. Gaze Callback Not Thread-Safe (MEDIUM)
**File:** `python/jspsych_tobii/adapters/tobii_pro.py:158-192`

The internal gaze callback stores `_latest_gaze_data` and calls `_gaze_callback`:

```python
def _internal_gaze_callback(self, gaze_data: Any) -> None:
    self._latest_gaze_data = gaze_data
    if self._gaze_callback:
        self._gaze_callback(standardized)
```

**Problem:** Tobii SDK callbacks run on a separate thread. Writing to `_latest_gaze_data` and reading it from the main thread isn't thread-safe.

**Recommendation:** Use thread-safe queue or proper synchronization.

---

## Cross-Cutting Concerns

### 1. Error Message Inconsistency
Different components use different error formats:
- Extension: `throw new Error("message")`
- Plugins: `throw new Error("message")`
- Server: `{"type": "error", "error": "message"}`

**Recommendation:** Define a standard error response format and use it consistently.

### 2. No Connection State Recovery
If the WebSocket disconnects mid-calibration, there's no way to resume or safely abort.

**Recommendation:** Implement session state that can be recovered after reconnection.

### 3. Missing Tests for Edge Cases
The test files (`.spec.ts`) exist but likely don't cover:
- Connection failures during calibration
- Server crashes during tracking
- Multiple rapid reconnections
- Buffer overflow scenarios

### 4. No Rate Limiting
The server has no rate limiting on messages, allowing a malicious client to flood it.

**Recommendation:** Implement message rate limiting per client.

### 5. Logging Inconsistency
- TypeScript uses `console.error` directly
- Python uses `logging` module

**Recommendation:** Consider using a structured logging approach on the client side.

---

## Summary and Recommendations

### Critical Issues (Should Fix)
1. **Thread safety in DataBuffer** - Could cause data corruption
2. **Multiple clients sharing calibration state** - Can interfere with each other
3. **Timing race in validation gaze collection** - Could produce inaccurate validation
4. **Tracking state set before server confirmation** - State inconsistency

### Important Improvements
1. Add buffer size limits to prevent memory issues
2. Apply time sync offset to all timestamps
3. Validate server responses before use
4. Handle reconnection properly (re-sync time, recover state)
5. Make threshold values configurable

### Nice-to-Have Enhancements
1. Improve error messages and standardize format
2. Add connection state recovery for interrupted sessions
3. Implement rate limiting on server
4. Add more comprehensive tests for edge cases
5. Remove unused imports and clean up code

### Code Quality
Overall, the code is well-structured with good separation of concerns. The adapter pattern for multi-SDK support is a good design choice. Type definitions are comprehensive. Main areas for improvement are around robustness and thread safety.
