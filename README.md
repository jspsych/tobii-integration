# jsPsych-Tobii Eye Tracker Integration

Production-ready Tobii Pro eye tracker integration for jsPsych experiments.

## Overview

This monorepo contains a complete solution for integrating Tobii Pro eye trackers with jsPsych, including:

- **@jspsych/extension-tobii**: Core extension for WebSocket communication and data management
- **@jspsych/plugin-tobii-calibration**: Calibration plugin
- **@jspsych/plugin-tobii-validation**: Validation plugin
- **jspsych-tobii** (Python): WebSocket server for Tobii SDK communication

## Architecture

```
Browser (jsPsych) <--WebSocket--> Python Server <--USB/Network--> Tobii Eye Tracker
```

## Quick Start

### 1. Install Python Server

```bash
pip install jspsych-tobii
```

### 2. Start WebSocket Server

```bash
jspsych-tobii-server --port 8080
```

### 3. Install JavaScript Packages

```bash
npm install @jspsych/extension-tobii @jspsych/plugin-tobii-calibration @jspsych/plugin-tobii-validation
```

### 4. Use in Your Experiment

```javascript
import { initJsPsych } from 'jspsych';
import tobiiExtension from '@jspsych/extension-tobii';
import tobiiCalibration from '@jspsych/plugin-tobii-calibration';

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

const timeline = [
  {
    type: tobiiCalibration,
    calibration_points: 9,
  },
  // Your experiment trials...
];

jsPsych.run(timeline);
```

## Features

- **WebSocket Communication**: Real-time data streaming between browser and eye tracker
- **Time Synchronization**: Accurate timestamp alignment
- **Calibration & Validation**: Built-in plugins for calibration workflow
- **Data Export**: CSV and JSON export utilities
- **Marker Support**: Inject custom markers into eye tracking data stream
- **Coordinate Utilities**: Convert between normalized and pixel coordinates
- **Production Ready**: Comprehensive error handling and reconnection logic

## Extension API

All utilities are accessible via `jsPsych.extensions.tobii.*`:

```javascript
// Connection
await jsPsych.extensions.tobii.connect();
await jsPsych.extensions.tobii.disconnect();

// Eye tracking control
await jsPsych.extensions.tobii.startTracking();
await jsPsych.extensions.tobii.stopTracking();

// Data access
const gaze = await jsPsych.extensions.tobii.getCurrentGaze();
const data = await jsPsych.extensions.tobii.getGazeData(startTime, endTime);

// Markers
await jsPsych.extensions.tobii.sendMarker({ type: 'stimulus_onset', id: 1 });

// Utilities
const pixels = jsPsych.extensions.tobii.normalizedToPixels(0.5, 0.5);
jsPsych.extensions.tobii.exportToCSV(data, 'experiment_data.csv');
```

## Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Extension API Reference](docs/extension-api.md)
- [Calibration Guide](docs/calibration-guide.md)
- [Full API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

## Development

This is a monorepo managed with npm workspaces.

### Build All Packages

```bash
npm install
npm run build
```

### Run Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run format
```

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@jspsych/extension-tobii](packages/extension-tobii) | 1.0.0 | Core extension |
| [@jspsych/plugin-tobii-calibration](packages/plugin-tobii-calibration) | 1.0.0 | Calibration plugin |
| [@jspsych/plugin-tobii-validation](packages/plugin-tobii-validation) | 1.0.0 | Validation plugin |
| [jspsych-tobii](python) | 1.0.0 | Python WebSocket server |

## Requirements

- **Browser**: Modern browser with WebSocket support
- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **Tobii SDK**: Tobii Pro SDK (installed with Python package)

## License

MIT

## Contributing

Contributions welcome! Please see our contributing guidelines.

## Support

- [Issue Tracker](https://github.com/jspsych/jspsych-tobii/issues)
- [Discussions](https://github.com/jspsych/jspsych-tobii/discussions)
