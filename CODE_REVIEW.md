# Code Review: Tobii Integration for jsPsych

This document tracks remaining issues identified during code review. Items that have been resolved are removed.

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

### Remaining Issues

#### 1. Race Condition in sendAndWait (LOW)
**File:** `packages/extension-tobii/src/websocket-client.ts`

The request ID generation uses `Date.now()` + `Math.random()`:

```typescript
const requestId = `req_${Date.now()}_${Math.random()}`;
```

**Problem:** In rapid succession, `Date.now()` could be identical, and `Math.random()` collision is unlikely but possible.

**Recommendation:** Use a monotonic counter instead.

---

## Plugin: plugin-tobii-calibration

### Remaining Issues

---

## Plugin: plugin-tobii-validation

### Remaining Issues

#### 1. Duplicate Style Class Names (LOW)
**Files:** Both calibration and validation plugins use similar but slightly different CSS class names that could conflict.

**Problem:** Class names like `.result-content h2` could have specificity conflicts.

**Recommendation:** Use more specific prefixes: `.tobii-calibration-result-content`, `.tobii-validation-result-content`.

---

## Plugin: plugin-tobii-user-position

### Remaining Issues

#### 1. setInterval Not Properly Typed (LOW)
**File:** `packages/plugin-tobii-user-position/src/index.ts`

```typescript
const updateInterval = setInterval(async () => {
```

**Problem:** Should use `window.setInterval` for browser environment to ensure proper typing.

#### 2. Position Averaging Loses Eye-Specific Issues (MEDIUM)
**File:** `packages/plugin-tobii-user-position/src/position-display.ts`

```typescript
private getAveragePosition(left: number | null, right: number | null, ...): number | null {
  if (leftValid && rightValid && left !== null && right !== null) {
    return (left + right) / 2;
  }
```

**Problem:** If one eye has poor tracking, averaging masks the problem.

**Recommendation:** Consider showing per-eye status or flagging when only one eye is valid.

#### 3. No Debouncing on Position Updates (LOW)
**File:** `packages/plugin-tobii-user-position/src/index.ts`

Position updates at 100ms intervals could cause UI jitter.

**Recommendation:** Consider smoothing/averaging recent positions for display.

---

## Python Server: jspsych-tobii

### Remaining Issues

*(No remaining issues)*

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
The test files (`.spec.ts`) exist but don't cover:
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

### Previously Resolved
The following critical and important issues have been addressed:
- ~~Thread safety in DataBuffer~~ -- uses `threading.Lock` throughout
- ~~Multiple clients sharing calibration state~~ -- per-client sessions with `client_id`
- ~~Timing race in validation gaze collection~~ -- uses start/end timestamps with `getGazeData()`
- ~~Tracking state set before server confirmation~~ -- uses `sendAndWait` + `response.success`
- ~~Memory leak in DataManager~~ -- `clearOldData()` called on trial end
- ~~Time sync not applied to markers~~ -- uses `toServerTime()` in trial markers
- ~~Reconnection doesn't re-sync time~~ -- `reconnected` handler calls `synchronize()`
- ~~Custom calibration points not validated~~ -- `validateCustomPoints()` method added
- ~~Extension access not checked in plugins~~ -- existence check with error message
- ~~Unused numpy import~~ -- removed
- ~~Gaze callback not thread-safe~~ -- uses `threading.Lock` for `_latest_gaze_data`
- ~~WebSocket handler fire-and-forget tasks~~ -- uses `run_coroutine_threadsafe` with try-catch
- ~~Calibration mode not left after error~~ -- uses `try/finally` to guarantee `leave_calibration_mode()` and state cleanup
- ~~No validation of server response types~~ -- `validateCalibrationResult`/`validateValidationResult` type guards added
- ~~Hard-coded success threshold~~ -- `tolerance` parameter already existed
- ~~Magic numbers for position thresholds~~ -- configurable via `position_threshold_good/fair` and `distance_threshold_good/fair` parameters
- ~~No retry mechanism for failed calibration~~ -- `max_retries` parameter with in-plugin retry loop for both calibration and validation
- ~~Styles persist after plugin unload~~ -- `removeStyles()` cleans up injected `<style>` elements and resets static flag at trial end for all three plugins
- ~~calibration_points type not properly constrained~~ -- supports 5, 9, 13, 15, 19, 25 with explicit error on unsupported values; same grids for validation
- ~~Degrees approximation in validation is crude~~ -- removed degree calculation entirely; calibration reports success/fail only, validation reports normalized accuracy/precision
- ~~Signal handlers not removed on shutdown~~ -- `shutdown()` now calls `remove_signal_handler()` for SIGTERM/SIGINT
- ~~X-Series adapter is dead code~~ -- removed `TobiiXSeriesAdapter` and `SDKType.TOBII_X_SERIES`; all hardware supported via single `TobiiProAdapter` using `tobii-research` (1.x for older models, 2.x for modern Pro series)
- ~~SDK type map incomplete~~ -- added `"mock": SDKType.MOCK` to `sdk_map` in `server.py`
- ~~Potential division by zero in validation~~ -- explicit `if not distances or not valid_samples: continue` guard

### Remaining Nice-to-Have Enhancements
1. Improve error messages and standardize format
2. Add connection state recovery for interrupted sessions
3. Implement rate limiting on server
4. Add more comprehensive tests for edge cases
5. Use monotonic counter for request IDs
6. Prefix CSS class names to avoid cross-plugin conflicts
