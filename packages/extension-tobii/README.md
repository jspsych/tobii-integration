# @jspsych/extension-tobii

Core jsPsych extension for Tobii eye tracker integration via WebSocket. Provides real-time gaze data streaming, calibration control, time synchronization, and coordinate utilities for eye tracking experiments.

## Installation

```bash
npm install @jspsych/extension-tobii
```

## Compatibility

This extension requires jsPsych v8.0.0 or later.

## Usage

### Loading the Extension

```javascript
import { initJsPsych } from 'jspsych';
import TobiiExtension from '@jspsych/extension-tobii';

const jsPsych = initJsPsych({
  extensions: [
    {
      type: TobiiExtension,
      params: {
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: true,
        },
      },
    },
  ],
});
```

### Enabling Eye Tracking on Trials

Add the extension to any trial to collect gaze data during that trial:

```javascript
const trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<p>Look at this text</p>',
  extensions: [{ type: TobiiExtension }],
};
```

## Initialization Parameters

Parameters passed to the extension in the `params` object when initializing jsPsych.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| connection | object | `{}` | Connection settings (see below) |
| connection.url | string | `undefined` | WebSocket server URL (e.g., `'ws://localhost:8080'`) |
| connection.autoConnect | boolean | `undefined` | Automatically connect on initialization |
| connection.reconnectAttempts | number | `undefined` | Number of reconnection attempts |
| connection.reconnectDelay | number | `undefined` | Delay between reconnection attempts in ms |

## On Start Parameters

Parameters passed to the extension in the `extensions` array on individual trials.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| trialId | string \| number | `undefined` | Trial ID or index |

## Data Generated

When the extension is added to a trial, the following data is appended to the trial's data object.

| Name | Type | Description |
|------|------|-------------|
| tobii_data | array | Array of gaze data samples collected during the trial. Each sample is a `GazeData` object (see below). |

### GazeData Object

Each element in the `tobii_data` array contains:

| Field | Type | Description |
|-------|------|-------------|
| x | number | X coordinate (normalized 0-1 or pixels, depending on config) |
| y | number | Y coordinate (normalized 0-1 or pixels, depending on config) |
| timestamp | number | Timestamp in ms (Tobii device clock) |
| browserTimestamp | number | Device timestamp mapped to `performance.now()` domain |
| leftValid | boolean | Whether the left eye data is valid |
| rightValid | boolean | Whether the right eye data is valid |
| leftPupilDiameter | number | Left eye pupil diameter |
| rightPupilDiameter | number | Right eye pupil diameter |

## Extension API

All methods are accessible via `jsPsych.extensions.tobii.*`. See the [full API reference](../../README.md#extension-api-reference) for detailed documentation.

### Connection

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<void>` | Connect to WebSocket server |
| `disconnect()` | `Promise<void>` | Disconnect from server |
| `isConnected()` | `boolean` | Check connection status |
| `getConnectionStatus()` | `ConnectionStatus` | Get detailed connection status |

### Eye Tracking Control

| Method | Returns | Description |
|--------|---------|-------------|
| `startTracking()` | `Promise<void>` | Start gaze data collection |
| `stopTracking()` | `Promise<void>` | Stop gaze data collection |
| `isTracking()` | `boolean` | Check tracking status |

### Calibration

| Method | Returns | Description |
|--------|---------|-------------|
| `startCalibration()` | `Promise<void>` | Start calibration procedure |
| `collectCalibrationPoint(x, y)` | `Promise<{ success }>` | Collect data for a point (0-1) |
| `computeCalibration()` | `Promise<CalibrationResult>` | Compute calibration |
| `getCalibrationData()` | `Promise<CalibrationResult>` | Get calibration quality metrics |

### Validation

| Method | Returns | Description |
|--------|---------|-------------|
| `startValidation()` | `Promise<void>` | Start validation procedure |
| `collectValidationPoint(x, y, samples?)` | `Promise<void>` | Collect data for a point (0-1) |
| `computeValidation()` | `Promise<ValidationResult>` | Compute validation metrics |

### Data Access

| Method | Returns | Description |
|--------|---------|-------------|
| `getCurrentGaze()` | `Promise<GazeData \| null>` | Get current gaze position |
| `getGazeData(start, end)` | `Promise<GazeData[]>` | Get gaze data for a time range |
| `getRecentGazeData(durationMs)` | `GazeData[]` | Get recent data from buffer |
| `getUserPosition()` | `Promise<UserPositionData \| null>` | Get head position data |
| `clearGazeData()` | `void` | Clear stored gaze data |

### Coordinate Utilities

| Method | Returns | Description |
|--------|---------|-------------|
| `normalizedToPixels(x, y)` | `Coordinates` | Convert normalized (0-1) to pixels |
| `pixelsToNormalized(x, y)` | `Coordinates` | Convert pixels to normalized (0-1) |
| `windowToContainer(x, y, el?)` | `Coordinates` | Convert window to container-relative coords |
| `getScreenDimensions()` | `ScreenDimensions` | Get window dimensions |
| `getContainerDimensions(el?)` | `ScreenDimensions` | Get container dimensions |
| `isWithinContainer(x, y, el?)` | `boolean` | Check if point is inside container |
| `calculateDistance(p1, p2)` | `number` | Euclidean distance between two points |

### Data Export

| Method | Returns | Description |
|--------|---------|-------------|
| `exportToCSV(data, filename)` | `void` | Export data to CSV file |
| `exportToJSON(data, filename)` | `void` | Export data to JSON file |

### Time Synchronization

| Method | Returns | Description |
|--------|---------|-------------|
| `getTimeOffset()` | `number` | Get browser-server time offset (ms) |
| `isTimeSynced()` | `boolean` | Check if time is synced with server |
| `toDeviceTime(performanceNow)` | `number` | Convert `performance.now()` to device time |
| `toLocalTime(deviceTime)` | `number` | Convert device time to `performance.now()` |
| `isDeviceTimeSynced()` | `boolean` | Check if device time sync is established |
| `getTimeSyncStatus()` | `DeviceTimeSyncStatus` | Get full sync status and diagnostics |
| `validateTimestampAlignment(samples)` | `TimestampAlignmentResult \| null` | Validate timestamp alignment |

### Configuration

| Method | Returns | Description |
|--------|---------|-------------|
| `setConfig(config)` | `void` | Update extension configuration |
| `getConfig()` | `InitializeParameters` | Get current configuration |

## Example

```javascript
import { initJsPsych } from 'jspsych';
import TobiiExtension from '@jspsych/extension-tobii';
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';

const jsPsych = initJsPsych({
  extensions: [
    {
      type: TobiiExtension,
      params: {
        connection: { url: 'ws://localhost:8080', autoConnect: true },
      },
    },
  ],
  on_finish: () => {
    const data = jsPsych.data.get().values();
    jsPsych.extensions.tobii.exportToCSV(data, 'gaze_data.csv');
  },
});

const timeline = [];

timeline.push({
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
});

timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: '<p>Look at this stimulus</p>',
  extensions: [{ type: TobiiExtension }],
});

jsPsych.run(timeline);
```

## Citation

If you use this extension in your research, please cite it. See [CITATION.cff](CITATION.cff).
