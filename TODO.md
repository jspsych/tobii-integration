# TODO — 1.0 Release Code Review

## Fix Before 1.0

### Dead / Unused Code

- [x] Remove `showPoint()` method from `CalibrationDisplay` (`packages/plugin-tobii-calibration/src/calibration-display.ts`)
- [x] Remove `showPoint()` method from `ValidationDisplay` (`packages/plugin-tobii-validation/src/validation-display.ts`)
- [x] Remove `collection_duration` and `gap_duration` parameters in calibration plugin. They were declared and documented but never read.
- [x] Remove `accuracy_good_color`, `accuracy_fair_color`, `accuracy_poor_color` in validation plugin. They were declared and documented but the feedback uses hardcoded colors.
- [x] Remove `sampling.rate` and `data.includeRawSamples` in extension config. Accepted in `InitializeParameters` but never used.
- [x] Remove unused exports from extension internals: `isWithinBounds()`, `angle()`, `isGazeInBounds()`. None were exposed through the extension API or called anywhere.
- [x] Remove unused CSS classes in user-position plugin: `.tobii-position-box`, `.tobii-eye-indicator`, `.tobii-distance-feedback`.
- [x] Remove unused `import time` in `python/jspsych_tobii/tobii_manager.py`.
- [x] Move `import math` from inside `compute_validation()` to module level in `python/jspsych_tobii/calibration.py`.
- [x] Remove `sampling_rate` in Python `ServerConfig`. Accepted but never used.

### Logic Bugs

- [x] Fix `stopTracking()` redundant conditional. The `if (response.success)` block was dead code since `this.tracking = false` ran unconditionally afterward.
- [x] Fix CSS injection one-shot bug in all three plugins. Static `styleInjected` flag caused per-trial color parameters to be silently ignored on subsequent trials.
- [x] Fix connection timeout race condition. The timeout was never cleared on successful connection.
- [x] Fix mismatched position thresholds in user-position plugin. Textual feedback used hardcoded values while quality assessment used configurable thresholds.

### Incomplete Types

- [x] Export `UserPositionData` from extension and remove the duplicate definition in user-position plugin.
- [x] Complete `CalibrationParameters` interface: add all grid sizes (5, 9, 13, 15, 19, 25), color parameters, and `max_retries`.
- [x] Complete `ValidationParameters` interface: add all grid sizes, color parameters, `tolerance`, and `max_retries`.

### Error Handling

- [x] Add `console.warn` for silently swallowed errors in extension: device time sync failure, reconnection time sync failure, reconnection failure.
- [x] Improve error messages with context: include coordinates in "Invalid calibration point", include URL in "Connection timeout", include detail in "Server failed to start tracking".

### Minor

- [x] Fix `on_load` parameter type — was accepting `OnStartParameters` instead of no params.

## Should Address Soon

### Data Management

- [x] Implement buffer size cap in `DataManager` (`packages/extension-tobii/src/data-manager.ts:15-17`). Currently unbounded; CLAUDE.md describes a 7200-sample circular buffer that is not implemented.
- [x] Fix `URL.revokeObjectURL()` timing in data export (`packages/extension-tobii/src/data-export.ts:80-83`). Called synchronously after `link.click()` before the download has started. Add a delay before revoking.

### Testing

- [x] Create Python test directory and tests (`python/pyproject.toml` references `testpaths = ["tests"]` but the directory doesn't exist).
- [x] Expand JS test coverage beyond static `info` checks. Key gaps: trial execution flows, display components, calibration/validation logic, grid point generation, custom point validation, error paths.

### Python Server

- [x] Replace `Any` types in `WebSocketHandler` constructor (`python/jspsych_tobii/websocket_handler.py:40-43`) with actual class types.
- [x] Standardize error response format. Some handlers return `{"type": "error", ...}`, others return `{"type": "calibration_xxx", "success": false, ...}`.
- [x] Add logging to bare `except: pass` blocks in `calibration.py:60-61,220-221`.
- [x] Extract duplicated calibration state guard checks in `calibration.py` into a helper method.

### Infrastructure

- [x] Set up CI/CD (GitHub Actions for linting, type checking, and test execution on push/PR).

## Lower Priority

- [x] Consider extracting a shared base class for `CalibrationDisplay`, `ValidationDisplay`, and `PositionDisplay` — they share ~200 lines of near-identical code. **Decision: Deferred.** CalibrationDisplay and ValidationDisplay share ~170 lines, but they live in separate npm packages. A shared base class would require either adding UI code to extension-tobii (wrong abstraction level) or creating a new internal package (infrastructure overhead). The duplication is manageable and the classes are stable.
- [x] Sanitize `instructions` and `button_text` inserted via `innerHTML` in display components to prevent XSS.
- [x] Add accessibility: ARIA labels, keyboard navigation, non-color-based pass/fail indicators.
- [x] Make animation timings configurable (300ms zoom, 400ms explosion, 2000ms success display, 3000ms instruction display are all hardcoded).
