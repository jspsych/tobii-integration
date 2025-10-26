# @jspsych/extension-tobii

jsPsych extension for Tobii Pro eye tracker integration via WebSocket.

## Installation

```bash
npm install @jspsych/extension-tobii
```

## Requirements

- jsPsych 7.0 or higher
- Python server (`jspsych-tobii`) running locally or on network

## Quick Start

```javascript
import { initJsPsych } from 'jspsych';
import tobiiExtension from '@jspsych/extension-tobii';

const jsPsych = initJsPsych({
  extensions: [
    {
      type: tobiiExtension,
      params: {
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: true,
        },
      },
    },
  ],
});

// Use in trials
const trial = {
  type: htmlKeyboardResponse,
  stimulus: '<p>Look at the screen</p>',
  extensions: [
    {
      type: tobiiExtension,
    },
  ],
};
```

## Extension API

All utilities are accessible via `jsPsych.extensions.tobii.*`:

### Connection Management

```javascript
// Connect to server
await jsPsych.extensions.tobii.connect();

// Disconnect
await jsPsych.extensions.tobii.disconnect();

// Check connection status
const isConnected = jsPsych.extensions.tobii.isConnected();
const status = jsPsych.extensions.tobii.getConnectionStatus();
```

### Eye Tracking Control

```javascript
// Start tracking
await jsPsych.extensions.tobii.startTracking();

// Stop tracking
await jsPsych.extensions.tobii.stopTracking();

// Check if tracking
const isTracking = jsPsych.extensions.tobii.isTracking();
```

### Calibration

```javascript
// Start calibration
await jsPsych.extensions.tobii.startCalibration();

// Collect calibration point
await jsPsych.extensions.tobii.collectCalibrationPoint(0.5, 0.5);

// Compute calibration
const result = await jsPsych.extensions.tobii.computeCalibration();

// Get calibration data
const calibData = await jsPsych.extensions.tobii.getCalibrationData();
```

### Data Access

```javascript
// Get current gaze position
const gaze = await jsPsych.extensions.tobii.getCurrentGaze();
console.log(`Looking at: ${gaze.x}, ${gaze.y}`);

// Get gaze data for time range
const startTime = performance.now() - 1000;
const endTime = performance.now();
const data = await jsPsych.extensions.tobii.getGazeData(startTime, endTime);

// Clear gaze data
jsPsych.extensions.tobii.clearGazeData();
```

### Markers

```javascript
// Send custom marker
await jsPsych.extensions.tobii.sendMarker({
  type: 'stimulus_onset',
  stimulus_id: 'face_001',
  emotion: 'happy',
});
```

### Coordinate Utilities

```javascript
// Convert normalized (0-1) to pixels
const pixels = jsPsych.extensions.tobii.normalizedToPixels(0.5, 0.5);

// Convert pixels to normalized
const normalized = jsPsych.extensions.tobii.pixelsToNormalized(960, 540);

// Get screen dimensions
const screen = jsPsych.extensions.tobii.getScreenDimensions();
```

### Data Export

```javascript
// Export to CSV
const allData = jsPsych.data.get().values();
jsPsych.extensions.tobii.exportToCSV(allData, 'experiment_data.csv');

// Export to JSON
jsPsych.extensions.tobii.exportToJSON(allData, 'experiment_data.json');
```

## Configuration

### Connection Options

```javascript
{
  connection: {
    url: 'ws://localhost:8080',  // WebSocket server URL
    autoConnect: true,            // Connect on initialization
    reconnectAttempts: 5,         // Number of reconnection attempts
    reconnectDelay: 1000          // Delay between attempts (ms)
  }
}
```

### Sampling Options

```javascript
{
  sampling: {
    rate: 60  // Sampling rate in Hz (if supported by tracker)
  }
}
```

### Data Options

```javascript
{
  data: {
    includeRawSamples: true,       // Include all samples in trial data
    coordinateSystem: 'normalized'  // 'normalized' or 'pixels'
  }
}
```

## Trial Data

Each trial with the extension enabled will include `tobii_data` in the results:

```javascript
{
  tobii_data: [
    {
      x: 0.52,
      y: 0.48,
      timestamp: 12345.67,
      leftValid: true,
      rightValid: true,
      leftPupilDiameter: 3.2,
      rightPupilDiameter: 3.1
    },
    // ... more samples
  ]
}
```

## TypeScript

Full TypeScript definitions are included.

```typescript
import TobiiExtension, { GazeData, CalibrationResult } from '@jspsych/extension-tobii';
```

## License

MIT
