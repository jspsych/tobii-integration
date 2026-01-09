# Tutorial: Building Eye Tracking Experiments with jsPsych-Tobii

This tutorial provides a comprehensive guide to using the jsPsych-Tobii integration packages for building eye tracking experiments.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Package Relationships](#package-relationships)
3. [Installation](#installation)
4. [Basic Workflow](#basic-workflow)
5. [Step-by-Step Example](#step-by-step-example)
6. [Advanced Usage](#advanced-usage)
7. [Best Practices](#best-practices)

---

## Architecture Overview

The jsPsych-Tobii integration consists of four JavaScript packages and one Python server that work together to enable eye tracking in jsPsych experiments.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                       jsPsych Timeline                          │ │
│  │                                                                  │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │ │
│  │  │ User Position    │  │   Calibration    │  │  Validation  │  │ │
│  │  │    Plugin        │  │     Plugin       │  │    Plugin    │  │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │ │
│  │           │                      │                    │         │ │
│  │           └──────────────────────┼────────────────────┘         │ │
│  │                                  │                               │ │
│  │                    ┌─────────────▼─────────────┐                │ │
│  │                    │    Tobii Extension        │                │ │
│  │                    │  (WebSocket + Data Mgmt)  │                │ │
│  │                    └─────────────┬─────────────┘                │ │
│  └──────────────────────────────────┼──────────────────────────────┘ │
└──────────────────────────────────────┼───────────────────────────────┘
                                       │ WebSocket
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Python WebSocket Server                           │
│               (jspsych-tobii-server, port 8080)                      │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │ USB/Network
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Tobii Eye Tracker                               │
│              (Pro Spectrum, X3-120, Nano, etc.)                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Package Relationships

### @jspsych/extension-tobii (Core)

The **foundation package** that all plugins depend on. It provides:

- WebSocket communication with the Python server
- Time synchronization between browser and eye tracker
- Gaze data buffering and management
- Coordinate conversion utilities
- Data export (CSV/JSON)

**Key insight**: This extension must be initialized before any Tobii plugin can work. All plugins access eye tracking functionality through `jsPsych.extensions.tobii`.

### @jspsych/plugin-tobii-calibration

Handles the **calibration procedure** where the eye tracker learns to map gaze position for the current participant:

- Displays animated calibration points
- Collects gaze samples at each point
- Reports calibration quality

**Depends on**: extension-tobii

### @jspsych/plugin-tobii-validation

**Validates calibration accuracy** after calibration is complete:

- Displays validation points
- Measures gaze error at each point
- Provides accuracy/precision metrics
- Visual feedback with pass/fail indicators

**Depends on**: extension-tobii

### @jspsych/plugin-tobii-user-position

Displays **real-time head position feedback**:

- Shows eye position indicators
- Guides participants to optimal tracking position
- Useful before calibration to ensure good tracking conditions

**Depends on**: extension-tobii

### Data Flow

```
1. User Position  →  Participant adjusts position until indicators are green
                     ↓
2. Calibration    →  Eye tracker learns participant's gaze mapping
                     ↓
3. Validation     →  Verify calibration is accurate (optional but recommended)
                     ↓
4. Experiment     →  Collect gaze data during experimental trials
                     ↓
5. Data Export    →  Export collected gaze data for analysis
```

---

## Installation

### 1. Install the Python Server

```bash
pip install jspsych-tobii
```

### 2. Install JavaScript Packages

```bash
npm install @jspsych/extension-tobii \
            @jspsych/plugin-tobii-calibration \
            @jspsych/plugin-tobii-validation \
            @jspsych/plugin-tobii-user-position
```

### 3. Start the Server

```bash
jspsych-tobii-server --port 8080
```

---

## Basic Workflow

### Step 1: Initialize jsPsych with the Tobii Extension

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

### Step 2: Set Up the Calibration Workflow

```javascript
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';

const timeline = [];

// Step 2a: Position guide (optional but recommended)
timeline.push({
  type: TobiiUserPositionPlugin,
  message: 'Please adjust your position until both indicators are green',
  require_good_position: true,
});

// Step 2b: Calibration
timeline.push({
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
});

// Step 2c: Validation (recommended)
timeline.push({
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05, // 5% of screen width/height
});
```

### Step 3: Add Experimental Trials with Eye Tracking

```javascript
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';

// Enable eye tracking on your experimental trials
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: '<img src="stimulus.png" />',
  extensions: [
    { type: TobiiExtension }
  ],
});
```

### Step 4: Run the Experiment

```javascript
jsPsych.run(timeline);
```

---

## Step-by-Step Example

Here's a complete example of a simple visual search experiment with eye tracking:

```javascript
import { initJsPsych } from 'jspsych';
import TobiiExtension from '@jspsych/extension-tobii';
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';

// Initialize jsPsych with Tobii extension
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
  on_finish: () => {
    // Export eye tracking data when experiment ends
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
  instructions: 'Follow the red dot with your eyes. Keep your head still.',
});

// Validation
timeline.push({
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  instructions: 'Follow the green dot to verify calibration accuracy.',
});

// Instructions
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: `
    <h2>Task Instructions</h2>
    <p>Find the target (T) among the distractors (L).</p>
    <p>Press <strong>F</strong> if the target is present.</p>
    <p>Press <strong>J</strong> if the target is absent.</p>
    <p>Press any key to start.</p>
  `,
});

// Experimental trials
const stimuli = [
  { target_present: true, set_size: 8 },
  { target_present: false, set_size: 8 },
  { target_present: true, set_size: 16 },
  { target_present: false, set_size: 16 },
];

for (const stim of stimuli) {
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: generateSearchDisplay(stim), // Your stimulus generation function
    choices: ['f', 'j'],
    data: {
      target_present: stim.target_present,
      set_size: stim.set_size,
    },
    extensions: [
      { type: TobiiExtension }
    ],
  });
}

// End screen
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: '<h1>Thank you!</h1><p>Your data has been saved.</p>',
});

// Run the experiment
jsPsych.run(timeline);
```

---

## Advanced Usage

### Accessing Gaze Data During Trials

You can access gaze data in real-time during trials:

```javascript
// Get current gaze position
const gaze = await jsPsych.extensions.tobii.getCurrentGaze();
console.log(`Looking at: (${gaze.x}, ${gaze.y})`);

// Get gaze data for a time range
const startTime = performance.now() - 1000; // Last 1 second
const endTime = performance.now();
const gazeData = await jsPsych.extensions.tobii.getGazeData(startTime, endTime);
```

### Custom Calibration Points

```javascript
timeline.push({
  type: TobiiCalibrationPlugin,
  custom_points: [
    { x: 0.1, y: 0.1 },
    { x: 0.5, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.5, y: 0.5 },
    { x: 0.1, y: 0.9 },
    { x: 0.5, y: 0.9 },
    { x: 0.9, y: 0.9 },
  ],
});
```

### Sending Markers

Mark specific events in the eye tracking data stream:

```javascript
await jsPsych.extensions.tobii.sendMarker({
  label: 'stimulus_onset',
  stimulus_id: 'face_001',
  condition: 'happy',
});
```

### Coordinate Conversion

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

### Conditional Recalibration

```javascript
const validationTrial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  on_finish: (data) => {
    if (!data.validation_success) {
      // Validation failed - add recalibration to timeline
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

## Best Practices

### 1. Always Use Position Guide Before Calibration

The position guide ensures participants are at the optimal distance and position before calibration begins, leading to better calibration quality.

### 2. Validate After Calibration

Always validate calibration before collecting experimental data. If validation fails, recalibrate.

### 3. Use Time Synchronization

The extension automatically synchronizes time between the browser and eye tracker. Access synchronized timestamps via:

```javascript
const offset = jsPsych.extensions.tobii.getTimeOffset();
const synced = jsPsych.extensions.tobii.isTimeSynced();
```

### 4. Handle Connection Issues

```javascript
// Check connection status
if (!jsPsych.extensions.tobii.isConnected()) {
  await jsPsych.extensions.tobii.connect();
}

// The extension automatically attempts reconnection with exponential backoff
```

### 5. Export Data Appropriately

```javascript
// CSV for statistical analysis
jsPsych.extensions.tobii.exportToCSV(data, 'gaze_data.csv');

// JSON for detailed analysis or archival
jsPsych.extensions.tobii.exportToJSON(data, 'gaze_data.json');
```

### 6. Use Appropriate Calibration Mode

- **'view' mode**: Participant just looks at points (faster, less effort)
- **'click' mode**: Participant clicks when ready (more control, better for novices)

### 7. Consider Screen Size

Normalized coordinates (0-1) are relative to the window size. For consistent results across different screen sizes, design stimuli using normalized coordinates or calculate positions dynamically.

---

## Troubleshooting

### Connection Issues

1. Verify the Python server is running
2. Check the WebSocket URL matches the server port
3. Ensure no firewall is blocking the connection

### Poor Calibration Quality

1. Use the position guide to optimize participant position
2. Ensure proper lighting (avoid strong backlighting)
3. Ask participant to keep head still during calibration
4. Try click mode for more control over timing

### No Gaze Data

1. Verify calibration completed successfully
2. Check that eye tracking is started (`isTracking()` returns true)
3. Ensure the extension is added to trial configuration

---

## Next Steps

- Review the [Extension API Reference](extension-api.md) for complete API documentation
- Check the [examples](../examples/) directory for more complex experiments
- See the [Python server documentation](../python/README.md) for server configuration options
