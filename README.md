# jsPsych-Tobii Eye Tracker Integration

Tobii Pro eye tracker integration for jsPsych experiments.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
  - [Package Relationships](#package-relationships)
  - [Data Flow](#data-flow)
- [Tutorial](#tutorial)
  - [Basic Workflow](#basic-workflow)
  - [Step-by-Step Example](#step-by-step-example)
  - [Advanced Usage](#advanced-usage)
- [Calibration Guide](#calibration-guide)
  - [Calibration Point Patterns](#calibration-point-patterns)
  - [Calibration Modes](#calibration-modes)
  - [Validation](#validation)
  - [Recalibration Logic](#recalibration-logic)
  - [Tips for Better Calibration](#tips-for-better-calibration)
- [Extension API Reference](#extension-api-reference)
  - [Connection Management](#connection-management)
  - [Eye Tracking Control](#eye-tracking-control)
  - [Calibration Control](#calibration-control)
  - [Validation Control](#validation-control)
  - [Data Access](#data-access)
  - [Markers](#markers)
  - [Coordinate Utilities](#coordinate-utilities)
  - [Data Export](#data-export)
  - [Time Synchronization](#time-synchronization)
  - [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
  - [Connection Issues](#connection-issues)
  - [Calibration Issues](#calibration-issues)
  - [Data Issues](#data-issues)
  - [Performance Issues](#performance-issues)
  - [Browser-Specific Issues](#browser-specific-issues)
  - [Error Messages](#error-messages)
- [Packages](#packages)
- [Development](#development)

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Python 3.9 or higher
- Node.js 18.0 or higher
- Tobii Pro eye tracker (connected via USB or network)

### Installation

#### 1. Install the Python Server

```bash
pip install jspsych-tobii
```

#### 2. Install JavaScript Packages

```bash
npm install @jspsych/extension-tobii \
            @jspsych/plugin-tobii-calibration \
            @jspsych/plugin-tobii-validation \
            @jspsych/plugin-tobii-user-position
```

### Quick Start

#### 1. Start the Server

In a terminal, start the Tobii WebSocket server:

```bash
jspsych-tobii-server
```

You should see output like:

```
Starting Tobii WebSocket server on localhost:8080
Connected to tracker: {'model': 'Tobii Pro Spectrum', ...}
Server started successfully
```

#### 2. Create Your Experiment

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
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: true,
        },
      },
    },
  ],
});

const timeline = [];

// Add calibration
timeline.push({
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
});

// Add your experimental trials with eye tracking enabled
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: '<p>Look at this text</p>',
  extensions: [{ type: TobiiExtension }],
});

jsPsych.run(timeline);
```

#### 3. Run Your Experiment

Open the HTML file in your browser. The experiment will:

1. Connect to the Tobii server
2. Run calibration
3. Collect eye tracking data during trials
4. Store data in jsPsych's data structure

---

## Architecture Overview

The jsPsych-Tobii integration consists of four JavaScript packages and one Python server that work together to enable eye tracking in jsPsych experiments.

```
+---------------------------------------------------------------------------+
|                              Browser                                      |
|  +---------------------------------------------------------------------+ |
|  |                         jsPsych Timeline                            | |
|  |                                                                     | |
|  |  +------------------+  +-----------------+  +--------------------+  | |
|  |  | User Position    |  |  Calibration    |  |    Validation     |  | |
|  |  |    Plugin        |  |     Plugin      |  |      Plugin       |  | |
|  |  +--------+---------+  +--------+--------+  +---------+---------+  | |
|  |           |                     |                      |            | |
|  |           +---------------------+----------------------+            | |
|  |                                 |                                   | |
|  |                   +-------------v--------------+                    | |
|  |                   |      Tobii Extension       |                    | |
|  |                   | (WebSocket + Data Mgmt)    |                    | |
|  |                   +-------------+--------------+                    | |
|  +---------------------------------------------------------------------+ |
+---------------------------------------------------------------------------+
                                     | WebSocket
                                     v
+---------------------------------------------------------------------------+
|                     Python WebSocket Server                               |
|                (jspsych-tobii-server, port 8080)                          |
+---------------------------------------------------------------------------+
                                     | USB/Network
                                     v
+---------------------------------------------------------------------------+
|                       Tobii Eye Tracker                                   |
|               (Pro Spectrum, X3-120, Nano, etc.)                          |
+---------------------------------------------------------------------------+
```

### Package Relationships

| Package | Role | Depends On |
|---------|------|------------|
| [@jspsych/extension-tobii](packages/extension-tobii) | Core extension: WebSocket communication, time sync, gaze data buffering, coordinate utilities, data export | jsPsych >= 8.0.0 |
| [@jspsych/plugin-tobii-calibration](packages/plugin-tobii-calibration) | Visual calibration procedure with animated points | extension-tobii |
| [@jspsych/plugin-tobii-validation](packages/plugin-tobii-validation) | Validates calibration accuracy with detailed metrics | extension-tobii |
| [@jspsych/plugin-tobii-user-position](packages/plugin-tobii-user-position) | Real-time head position feedback | extension-tobii |

### Data Flow

```
1. User Position  ->  Participant adjusts position until indicators are green
                      |
2. Calibration    ->  Eye tracker learns participant's gaze mapping
                      |
3. Validation     ->  Verify calibration is accurate (optional but recommended)
                      |
4. Experiment     ->  Collect gaze data during experimental trials
                      |
5. Data Export    ->  Export collected gaze data for analysis
```

---

## Tutorial

### Basic Workflow

#### Step 1: Initialize jsPsych with the Tobii Extension

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

#### Step 2: Set Up the Calibration Workflow

```javascript
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';

const timeline = [];

// Position guide (optional but recommended)
timeline.push({
  type: TobiiUserPositionPlugin,
  message: 'Please adjust your position until both indicators are green',
  require_good_position: true,
});

// Calibration
timeline.push({
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
});

// Validation (recommended)
timeline.push({
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
});
```

#### Step 3: Add Experimental Trials with Eye Tracking

```javascript
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';

timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: '<img src="stimulus.png" />',
  extensions: [{ type: TobiiExtension }],
});
```

#### Step 4: Run the Experiment

```javascript
jsPsych.run(timeline);
```

### Step-by-Step Example

A complete visual search experiment with eye tracking:

```javascript
import { initJsPsych } from 'jspsych';
import TobiiExtension from '@jspsych/extension-tobii';
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';
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
    jsPsych.extensions.tobii.exportToCSV(data, 'experiment_data.csv');
  },
});

const timeline = [];

// Welcome screen
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: `
    <h1>Visual Search Experiment</h1>
    <p>Press any key to begin the eye tracking setup.</p>
  `,
});

// Position guide
timeline.push({
  type: TobiiUserPositionPlugin,
  message: 'Adjust your position until both eye indicators are green, then click Continue.',
  require_good_position: true,
});

// Calibration
timeline.push({
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
});

// Validation
timeline.push({
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
});

// Experimental trials with eye tracking
const stimuli = [
  { target_present: true, set_size: 8 },
  { target_present: false, set_size: 8 },
  { target_present: true, set_size: 16 },
  { target_present: false, set_size: 16 },
];

for (const stim of stimuli) {
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: generateSearchDisplay(stim),
    choices: ['f', 'j'],
    data: {
      target_present: stim.target_present,
      set_size: stim.set_size,
    },
    extensions: [{ type: TobiiExtension }],
  });
}

jsPsych.run(timeline);
```

### Advanced Usage

#### Accessing Gaze Data During Trials

```javascript
// Get current gaze position
const gaze = await jsPsych.extensions.tobii.getCurrentGaze();
console.log(`Looking at: (${gaze.x}, ${gaze.y})`);

// Get gaze data for a time range
const startTime = performance.now() - 1000;
const endTime = performance.now();
const gazeData = await jsPsych.extensions.tobii.getGazeData(startTime, endTime);
```

#### Sending Markers

Mark specific events in the eye tracking data stream:

```javascript
await jsPsych.extensions.tobii.sendMarker({
  label: 'stimulus_onset',
  stimulus_id: 'face_001',
  condition: 'happy',
});
```

#### Coordinate Conversion

```javascript
// Convert normalized (0-1) to pixels
const pixels = jsPsych.extensions.tobii.normalizedToPixels(0.5, 0.5);
// { x: 960, y: 540 } for 1920x1080 screen

// Convert pixels to normalized
const normalized = jsPsych.extensions.tobii.pixelsToNormalized(960, 540);
// { x: 0.5, y: 0.5 }

// Get container-relative coordinates
const containerCoords = jsPsych.extensions.tobii.windowToContainer(gaze.x, gaze.y);
```

#### Conditional Recalibration

```javascript
const validationTrial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  on_finish: (data) => {
    if (!data.validation_success) {
      jsPsych.addNodeToEndOfTimeline({
        type: TobiiCalibrationPlugin,
        calibration_points: 9,
      });
      jsPsych.addNodeToEndOfTimeline(validationTrial);
    }
  },
};
```

---

## Calibration Guide

Eye tracker calibration maps the physical characteristics of a participant's eyes to screen coordinates. Good calibration is essential for accurate gaze data.

### Pre-Calibration Setup

Always use the position guide before calibration:

```javascript
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';

const positionTrial = {
  type: TobiiUserPositionPlugin,
  message: 'Adjust your position until both eye indicators are green',
  require_good_position: true,
  show_distance_feedback: true,
  show_position_feedback: true,
};
```

### Calibration Point Patterns

The calibration plugin supports the following grid sizes:

| Grid Size | Pattern | Use Case |
|-----------|---------|----------|
| 5 | Corners + center | Quick calibration |
| 9 | 3x3 grid | Standard (recommended) |
| 13 | 3x3 outer + 4 diagonal midpoints | Enhanced coverage |
| 15 | 5 rows x 3 columns | Dense vertical coverage |
| 19 | Symmetric 3-5-3-5-3 pattern | High density |
| 25 | 5x5 full grid | Maximum coverage |

You can also provide custom points:

```javascript
const calibrationTrial = {
  type: TobiiCalibrationPlugin,
  custom_points: [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
  ],
};
```

### Calibration Modes

#### View Mode (Default)

- Participant looks at each point as it appears
- Points appear with animation to guide attention
- Faster, less participant effort
- Best for experienced participants

#### Click Mode

- Participant clicks when ready at each point
- More control over timing
- Better for novice participants

```javascript
const calibrationTrial = {
  type: TobiiCalibrationPlugin,
  calibration_mode: 'click',
  button_text: 'Start Calibration',
};
```

### Validation

Always validate after calibration:

```javascript
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';

const validationTrial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  show_feedback: true,
};
```

#### Interpreting Validation Results

The validation plugin reports:

- **Average Accuracy**: Mean distance between target and gaze (normalized, 0-1 scale)
- **Average Precision**: Consistency of gaze samples at each point (normalized)
- **Per-point data**: Accuracy, precision, mean gaze position, and sample counts for each validation point

#### Tolerance Guidelines

| Tolerance | Use Case |
|-----------|----------|
| 0.02 (2%) | High precision research |
| 0.05 (5%) | Standard experiments |
| 0.10 (10%) | Exploratory/pilot studies |

### Recalibration Logic

The calibration and validation plugins support built-in retry via the `max_retries` parameter. You can also implement custom recalibration logic:

```javascript
const createCalibrationSequence = () => {
  const sequence = [];

  sequence.push({
    type: TobiiUserPositionPlugin,
    require_good_position: true,
  });

  sequence.push({
    type: TobiiCalibrationPlugin,
    calibration_points: 9,
  });

  sequence.push({
    type: TobiiValidationPlugin,
    validation_points: 9,
    tolerance: 0.05,
    on_finish: (data) => {
      if (!data.validation_success) {
        jsPsych.addNodeToEndOfTimeline({
          timeline: createCalibrationSequence(),
        });
      }
    },
  });

  return sequence;
};

timeline.push({ timeline: createCalibrationSequence() });
```

### Tips for Better Calibration

#### Environmental Factors

1. **Lighting**: Avoid direct light sources (windows, lamps) behind the participant
2. **Screen brightness**: Use moderate brightness, avoid extreme settings
3. **Distance**: Maintain optimal distance (typically 60-70cm for most trackers)

#### Participant Instructions

Tell participants to:

1. Keep their head as still as possible
2. Follow the dot smoothly with their eyes only
3. Blink normally but not excessively
4. Remove glasses if possible (or ensure clean lenses)

#### Technical Considerations

1. **Monitor refresh rate**: Higher is better (60Hz minimum)
2. **Fullscreen mode**: Always run experiments in fullscreen
3. **Warm-up time**: Let the eye tracker warm up for a few minutes

#### Troubleshooting Poor Calibration

- **High calibration error**: Use position guide first, increase `collection_duration`, try click mode, check lighting
- **Inconsistent results**: Ensure participant isn't moving, check glasses/contacts, verify tracker position
- **Points in certain areas fail**: Check visibility, verify monitor calibration, consider custom points avoiding problem areas

---

## Extension API Reference

All utility functions are exposed as methods on the extension instance, accessible via `jsPsych.extensions.tobii.*`.

### Connection Management

#### `connect()`

Connect to the WebSocket server.

```javascript
await jsPsych.extensions.tobii.connect();
```

**Returns:** `Promise<void>`

#### `disconnect()`

Disconnect from the WebSocket server. Stops tracking if active.

```javascript
await jsPsych.extensions.tobii.disconnect();
```

**Returns:** `Promise<void>`

#### `isConnected()`

Check if connected to server.

```javascript
const connected = jsPsych.extensions.tobii.isConnected();
```

**Returns:** `boolean`

#### `getConnectionStatus()`

Get detailed connection status.

```javascript
const status = jsPsych.extensions.tobii.getConnectionStatus();
// { connected: true, tracking: false, connectedAt: 1234567890 }
```

**Returns:** `ConnectionStatus` with fields:
- `connected` (boolean) - Connected to server
- `tracking` (boolean) - Currently tracking
- `lastError` (string, optional) - Last error message
- `connectedAt` (number, optional) - Connection timestamp

### Eye Tracking Control

#### `startTracking()`

Start eye tracking data collection.

```javascript
await jsPsych.extensions.tobii.startTracking();
```

**Returns:** `Promise<void>`

#### `stopTracking()`

Stop eye tracking data collection.

```javascript
await jsPsych.extensions.tobii.stopTracking();
```

**Returns:** `Promise<void>`

#### `isTracking()`

Check if currently tracking.

```javascript
const tracking = jsPsych.extensions.tobii.isTracking();
```

**Returns:** `boolean`

### Calibration Control

#### `startCalibration()`

Start calibration procedure on the server.

```javascript
await jsPsych.extensions.tobii.startCalibration();
```

**Returns:** `Promise<void>`

#### `collectCalibrationPoint(x, y)`

Collect calibration data for a specific point.

```javascript
const result = await jsPsych.extensions.tobii.collectCalibrationPoint(0.5, 0.5);
```

**Parameters:**
- `x` (number) - Normalized x coordinate (0-1)
- `y` (number) - Normalized y coordinate (0-1)

**Returns:** `Promise<{ success: boolean }>`

#### `computeCalibration()`

Compute calibration from collected points.

```javascript
const result = await jsPsych.extensions.tobii.computeCalibration();
// { success: true }
```

**Returns:** `Promise<CalibrationResult>`

#### `getCalibrationData()`

Get calibration data and quality metrics.

```javascript
const data = await jsPsych.extensions.tobii.getCalibrationData();
```

**Returns:** `Promise<CalibrationResult>`

### Validation Control

#### `startValidation()`

Start validation procedure on the server.

```javascript
await jsPsych.extensions.tobii.startValidation();
```

**Returns:** `Promise<void>`

#### `collectValidationPoint(x, y, gazeSamples?)`

Collect validation data for a specific point.

```javascript
await jsPsych.extensions.tobii.collectValidationPoint(0.5, 0.5, gazeSamples);
```

**Parameters:**
- `x` (number) - Normalized x coordinate (0-1)
- `y` (number) - Normalized y coordinate (0-1)
- `gazeSamples` (GazeData[], optional) - Array of gaze samples collected at this point

**Returns:** `Promise<void>`

#### `computeValidation()`

Compute validation metrics from collected points.

```javascript
const result = await jsPsych.extensions.tobii.computeValidation();
// {
//   success: true,
//   averageAccuracy: 0.65,
//   averagePrecision: 0.42,
//   pointData: [...]
// }
```

**Returns:** `Promise<ValidationResult>` with fields:
- `success` (boolean) - Whether validation succeeded
- `averageAccuracy` (number) - Average accuracy in degrees
- `averagePrecision` (number) - Average precision in degrees
- `pointData` (array) - Per-point accuracy and precision data
- `error` (string, optional) - Error message if failed

### Data Access

#### `getCurrentGaze()`

Get current gaze position (from local buffer or server).

```javascript
const gaze = await jsPsych.extensions.tobii.getCurrentGaze();
// { x: 0.52, y: 0.48, timestamp: 12345.67, leftValid: true, rightValid: true }
```

**Returns:** `Promise<GazeData | null>`

`GazeData` fields:
- `x` (number) - X coordinate (normalized 0-1 or pixels)
- `y` (number) - Y coordinate (normalized 0-1 or pixels)
- `timestamp` (number) - Device clock timestamp in ms
- `serverTimestamp` (number, optional) - Python server clock timestamp
- `clientTimestamp` (number, optional) - Browser `performance.now()` when received
- `leftValid` (boolean, optional) - Left eye data validity
- `rightValid` (boolean, optional) - Right eye data validity
- `leftPupilDiameter` (number, optional) - Left eye pupil diameter
- `rightPupilDiameter` (number, optional) - Right eye pupil diameter

#### `getGazeData(startTime, endTime)`

Get gaze data for a specific time range.

```javascript
const startTime = performance.now() - 1000;
const endTime = performance.now();
const data = await jsPsych.extensions.tobii.getGazeData(startTime, endTime);
```

**Parameters:**
- `startTime` (number) - Start timestamp in milliseconds
- `endTime` (number) - End timestamp in milliseconds

**Returns:** `Promise<GazeData[]>`

#### `getRecentGazeData(durationMs)`

Get recent gaze data from the buffer.

```javascript
const recentData = jsPsych.extensions.tobii.getRecentGazeData(1000); // last 1 second
```

**Parameters:**
- `durationMs` (number) - How many milliseconds of recent data to retrieve

**Returns:** `GazeData[]`

#### `getUserPosition()`

Get current user position (head position).

```javascript
const position = await jsPsych.extensions.tobii.getUserPosition();
```

**Returns:** `Promise<UserPositionData | null>` with fields:
- `leftX`, `leftY`, `leftZ` (number | null) - Left eye position (normalized 0-1, 0.5 is center/optimal)
- `rightX`, `rightY`, `rightZ` (number | null) - Right eye position (normalized 0-1)
- `leftValid`, `rightValid` (boolean) - Eye data validity
- `leftOriginX`, `leftOriginY`, `leftOriginZ` (number | null, optional) - Raw left eye origin in mm
- `rightOriginX`, `rightOriginY`, `rightOriginZ` (number | null, optional) - Raw right eye origin in mm

#### `clearGazeData()`

Clear stored gaze data from the buffer.

```javascript
jsPsych.extensions.tobii.clearGazeData();
```

**Returns:** `void`

### Markers

#### `sendMarker(markerData)`

Send a marker to the eye tracking data stream.

```javascript
await jsPsych.extensions.tobii.sendMarker({
  label: 'stimulus_onset',
  stimulus_id: 'face_001',
  condition: 'happy',
});
```

**Parameters:**
- `markerData` (MarkerData) - Object with:
  - `label` (string, required) - Marker label/identifier
  - `timestamp` (number, optional) - Timestamp in ms (defaults to `performance.now()`)
  - Any additional key-value pairs

**Returns:** `Promise<void>`

### Coordinate Utilities

#### `normalizedToPixels(x, y)`

Convert normalized coordinates (0-1) to window pixels.

```javascript
const pixels = jsPsych.extensions.tobii.normalizedToPixels(0.5, 0.5);
// { x: 960, y: 540 } for 1920x1080 screen
```

**Returns:** `Coordinates` (`{ x: number, y: number }`)

#### `pixelsToNormalized(x, y)`

Convert pixel coordinates to normalized (0-1).

```javascript
const normalized = jsPsych.extensions.tobii.pixelsToNormalized(960, 540);
// { x: 0.5, y: 0.5 }
```

**Returns:** `Coordinates`

#### `windowToContainer(x, y, container?)`

Convert window pixel coordinates to container-relative coordinates.

```javascript
const containerCoords = jsPsych.extensions.tobii.windowToContainer(x, y);
```

**Parameters:**
- `x` (number) - X coordinate in window pixels
- `y` (number) - Y coordinate in window pixels
- `container` (HTMLElement, optional) - Defaults to jsPsych display element

**Returns:** `Coordinates`

#### `getScreenDimensions()`

Get window dimensions.

```javascript
const screen = jsPsych.extensions.tobii.getScreenDimensions();
// { width: 1920, height: 1080 }
```

**Returns:** `ScreenDimensions` (`{ width: number, height: number }`)

#### `getContainerDimensions(container?)`

Get container element dimensions.

```javascript
const dims = jsPsych.extensions.tobii.getContainerDimensions();
```

**Returns:** `ScreenDimensions`

#### `isWithinContainer(x, y, container?)`

Check if window coordinates fall within a container.

```javascript
const inside = jsPsych.extensions.tobii.isWithinContainer(x, y);
```

**Returns:** `boolean`

#### `calculateDistance(p1, p2)`

Calculate Euclidean distance between two points.

```javascript
const dist = jsPsych.extensions.tobii.calculateDistance({ x: 0, y: 0 }, { x: 1, y: 1 });
```

**Returns:** `number`

### Data Export

#### `exportToCSV(data, filename)`

Export data to a CSV file (triggers browser download).

```javascript
const allData = jsPsych.data.get().values();
jsPsych.extensions.tobii.exportToCSV(allData, 'experiment_data.csv');
```

**Parameters:**
- `data` (any[]) - Data array to export
- `filename` (string) - Output filename

#### `exportToJSON(data, filename)`

Export data to a JSON file (triggers browser download).

```javascript
const allData = jsPsych.data.get().values();
jsPsych.extensions.tobii.exportToJSON(allData, 'experiment_data.json');
```

**Parameters:**
- `data` (any[]) - Data array to export
- `filename` (string) - Output filename

### Time Synchronization

#### `getTimeOffset()`

Get time synchronization offset between browser and server.

```javascript
const offset = jsPsych.extensions.tobii.getTimeOffset();
```

**Returns:** `number` (milliseconds)

#### `isTimeSynced()`

Check if time is synchronized with server.

```javascript
const synced = jsPsych.extensions.tobii.isTimeSynced();
```

**Returns:** `boolean`

#### `toDeviceTime(performanceNow)`

Convert a `performance.now()` timestamp to Tobii device clock time. Requires device time sync to be established.

```javascript
const deviceTime = jsPsych.extensions.tobii.toDeviceTime(performance.now());
```

**Returns:** `number`

#### `toLocalTime(deviceTime)`

Convert a Tobii device clock timestamp to `performance.now()` domain. Requires device time sync to be established.

```javascript
const localTime = jsPsych.extensions.tobii.toLocalTime(deviceTimestamp);
```

**Returns:** `number`

#### `isDeviceTimeSynced()`

Check if the browser-to-device time sync chain is established.

```javascript
const synced = jsPsych.extensions.tobii.isDeviceTimeSynced();
```

**Returns:** `boolean`

#### `getTimeSyncStatus()`

Get full device time synchronization status with all offsets and diagnostics.

```javascript
const status = jsPsych.extensions.tobii.getTimeSyncStatus();
```

**Returns:** `DeviceTimeSyncStatus` with fields:
- `synced` (boolean) - Whether device time sync is available
- `offsetAB` (number) - Browser to server offset in ms
- `offsetBC` (number | null) - Server to device clock offset in ms
- `offsetAC` (number | null) - Browser to device clock offset in ms
- `bcSampleCount` (number) - Number of B-C offset samples used
- `bcStdDev` (number | null) - Standard deviation of B-C samples in ms
- `bcMin` (number | null) - Minimum B-C offset in ms
- `bcMax` (number | null) - Maximum B-C offset in ms

#### `validateTimestampAlignment(samples)`

Validate timestamp alignment across a set of gaze samples.

```javascript
const result = jsPsych.extensions.tobii.validateTimestampAlignment(gazeSamples);
// { sampleCount: 50, meanResidual: 2.3, stdDev: 0.8, min: 0.5, max: 4.1 }
```

**Parameters:**
- `samples` (GazeData[]) - Gaze samples with `clientTimestamp` set

**Returns:** `TimestampAlignmentResult | null`

### Configuration

#### `setConfig(config)`

Update extension configuration.

```javascript
jsPsych.extensions.tobii.setConfig({
  data: { coordinateSystem: 'pixels' },
});
```

**Parameters:**
- `config` (Partial<InitializeParameters>) - Configuration options:
  - `connection` - `{ url?, autoConnect?, reconnectAttempts?, reconnectDelay? }`
  - `sampling` - `{ rate? }` (Hz)
  - `data` - `{ includeRawSamples?, coordinateSystem? }` (`'pixels'` or `'normalized'`)

#### `getConfig()`

Get current configuration.

```javascript
const config = jsPsych.extensions.tobii.getConfig();
```

**Returns:** `InitializeParameters`

---

## Troubleshooting

### Connection Issues

#### Server Won't Start

**Symptoms:** `jspsych-tobii-server` command fails, error about missing eye tracker.

**Solutions:**

1. Check eye tracker connection (USB or network)
2. Verify Tobii Eye Tracker Manager recognizes the tracker
3. Update the Python package: `pip install --upgrade jspsych-tobii`
4. Try the mock adapter for testing: `jspsych-tobii-server --adapter mock`

#### Browser Can't Connect

**Symptoms:** "WebSocket connection failed" error in browser console.

**Solutions:**

1. Verify server is running: `netstat -an | grep 8080`
2. Ensure URL matches: `ws://localhost:8080`
3. Check firewall settings for port 8080
4. Serve your experiment from a local web server (avoid `file://` protocol)

#### Connection Drops During Experiment

**Symptoms:** Gaze data stops appearing mid-experiment.

**Solutions:**

1. Use a high-quality USB cable, connect directly (not through a hub)
2. Adjust reconnection settings:
   ```javascript
   params: {
     connection: {
       url: 'ws://localhost:8080',
       reconnectAttempts: 10,
       reconnectDelay: 2000,
     },
   }
   ```
3. Monitor server logs: `jspsych-tobii-server --log-level debug`

### Calibration Issues

#### Calibration Fails

**Solutions:**

1. Use position guide first to optimize participant position
2. Increase `collection_duration` (e.g., 1500ms) and `point_duration` (e.g., 750ms)
3. Try click mode: `calibration_mode: 'click'`
4. Check environmental factors: reduce ambient lighting, remove reflective surfaces, clean tracker lens

#### Poor Calibration in Certain Areas

**Solutions:**

1. Large monitors may exceed tracking range at edges
2. Adjust participant distance using the position guide
3. Use custom points to avoid extreme edges:
   ```javascript
   custom_points: [
     { x: 0.15, y: 0.15 },
     { x: 0.5, y: 0.15 },
     { x: 0.85, y: 0.15 },
     // ...
   ]
   ```

### Data Issues

#### No Gaze Data Collected

**Solutions:**

1. Verify extension is added to trials:
   ```javascript
   extensions: [{ type: TobiiExtension }]  // Don't forget this!
   ```
2. Check tracking state: `jsPsych.extensions.tobii.isTracking()`
3. Ensure calibration completed successfully first

#### Gaze Data Has Wrong Coordinates

**Solutions:**

1. Recalibrate (calibration may have degraded or participant moved)
2. Check coordinate system: gaze data is normalized (0-1) by default
3. Convert to pixels: `jsPsych.extensions.tobii.normalizedToPixels(gaze.x, gaze.y)`

#### Timestamp Issues

**Solutions:**

1. Verify time synchronization: `jsPsych.extensions.tobii.isTimeSynced()`
2. Use `clientTimestamp` for aligning with other browser events
3. Use `validateTimestampAlignment()` to check sync quality

### Performance Issues

#### Slow Frame Rate

**Solutions:**

1. Use Chrome/Chromium for best WebSocket performance
2. Clear old data periodically: `jsPsych.extensions.tobii.clearGazeData()`

#### High CPU Usage

**Solutions:**

1. Lower sampling rate (if supported by your tracker)
2. Increase `update_interval` on the position guide plugin (e.g., 200ms)

### Browser-Specific Issues

- **Chrome/Chromium**: Best compatibility and performance (recommended)
- **Firefox**: May have WebSocket performance issues; use latest version
- **Safari**: Enable WebSocket support in preferences; prefer Chrome for experiments

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Tobii extension not initialized" | Plugin tried to use extension before setup | Add extension to `initJsPsych({ extensions: [...] })` |
| "Not connected to server" | Using features before WebSocket connects | Call `await jsPsych.extensions.tobii.connect()` or use `autoConnect: true` |
| "Invalid calibration point" | Coordinates outside 0-1 range | Ensure all coordinates are normalized (0-1) |
| "Request timeout" | Server didn't respond in time | Check server is running, check network |

---

## Packages

| Package | Description |
|---------|-------------|
| [@jspsych/extension-tobii](packages/extension-tobii) | Core extension |
| [@jspsych/plugin-tobii-calibration](packages/plugin-tobii-calibration) | Calibration plugin |
| [@jspsych/plugin-tobii-validation](packages/plugin-tobii-validation) | Validation plugin |
| [@jspsych/plugin-tobii-user-position](packages/plugin-tobii-user-position) | User position guide plugin |
| [jspsych-tobii](python) | Python WebSocket server |

## Development

This is a monorepo managed with npm workspaces.

```bash
npm install            # Install dependencies
npm run build          # Build all packages
npm test               # Run all JS tests
npm run lint           # ESLint
npm run format         # Prettier
cd python && pytest    # Run Python tests
```

## License

MIT

## Support

- [Issue Tracker](https://github.com/jspsych/jspsych-tobii/issues)
- [Discussions](https://github.com/jspsych/jspsych-tobii/discussions)
