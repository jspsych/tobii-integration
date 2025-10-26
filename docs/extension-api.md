# Extension API Reference

All utility functions are exposed as methods on the extension instance, accessible via `jsPsych.extensions.tobii.*`.

## Connection Management

### `connect()`

Connect to the WebSocket server.

```javascript
await jsPsych.extensions.tobii.connect();
```

**Returns:** `Promise<void>`

### `disconnect()`

Disconnect from the WebSocket server.

```javascript
await jsPsych.extensions.tobii.disconnect();
```

**Returns:** `Promise<void>`

### `isConnected()`

Check if connected to server.

```javascript
const connected = jsPsych.extensions.tobii.isConnected();
```

**Returns:** `boolean`

### `getConnectionStatus()`

Get detailed connection status.

```javascript
const status = jsPsych.extensions.tobii.getConnectionStatus();
// {
//   connected: true,
//   tracking: false,
//   connectedAt: 1234567890
// }
```

**Returns:** `ConnectionStatus`

## Eye Tracking Control

### `startTracking()`

Start eye tracking data collection.

```javascript
await jsPsych.extensions.tobii.startTracking();
```

**Returns:** `Promise<void>`

### `stopTracking()`

Stop eye tracking data collection.

```javascript
await jsPsych.extensions.tobii.stopTracking();
```

**Returns:** `Promise<void>`

### `isTracking()`

Check if currently tracking.

```javascript
const tracking = jsPsych.extensions.tobii.isTracking();
```

**Returns:** `boolean`

## Calibration Control

### `startCalibration()`

Start calibration procedure.

```javascript
await jsPsych.extensions.tobii.startCalibration();
```

**Returns:** `Promise<void>`

### `collectCalibrationPoint(x, y)`

Collect calibration data for a specific point.

```javascript
await jsPsych.extensions.tobii.collectCalibrationPoint(0.5, 0.5);
```

**Parameters:**
- `x` (number): Normalized x coordinate (0-1)
- `y` (number): Normalized y coordinate (0-1)

**Returns:** `Promise<void>`

### `computeCalibration()`

Compute calibration from collected points.

```javascript
const result = await jsPsych.extensions.tobii.computeCalibration();
// {
//   success: true,
//   averageError: 0.87,
//   pointQuality: [...]
// }
```

**Returns:** `Promise<CalibrationResult>`

### `getCalibrationData()`

Get calibration data and quality metrics.

```javascript
const data = await jsPsych.extensions.tobii.getCalibrationData();
```

**Returns:** `Promise<CalibrationResult>`

## Validation Control

### `startValidation()`

Start validation procedure.

```javascript
await jsPsych.extensions.tobii.startValidation();
```

**Returns:** `Promise<void>`

### `collectValidationPoint(x, y)`

Collect validation data for a specific point.

```javascript
await jsPsych.extensions.tobii.collectValidationPoint(0.5, 0.5);
```

**Parameters:**
- `x` (number): Normalized x coordinate (0-1)
- `y` (number): Normalized y coordinate (0-1)

**Returns:** `Promise<void>`

### `computeValidation()`

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

**Returns:** `Promise<ValidationResult>`

## Data Access

### `getCurrentGaze()`

Get current gaze position.

```javascript
const gaze = await jsPsych.extensions.tobii.getCurrentGaze();
// {
//   x: 0.52,
//   y: 0.48,
//   timestamp: 12345.67,
//   leftValid: true,
//   rightValid: true
// }
```

**Returns:** `Promise<GazeData | null>`

### `getGazeData(startTime, endTime)`

Get gaze data for a specific time range.

```javascript
const startTime = performance.now() - 1000;
const endTime = performance.now();
const data = await jsPsych.extensions.tobii.getGazeData(startTime, endTime);
```

**Parameters:**
- `startTime` (number): Start timestamp in milliseconds
- `endTime` (number): End timestamp in milliseconds

**Returns:** `Promise<GazeData[]>`

### `clearGazeData()`

Clear stored gaze data.

```javascript
jsPsych.extensions.tobii.clearGazeData();
```

**Returns:** `void`

## Markers

### `sendMarker(markerData)`

Send a marker to the eye tracking data stream.

```javascript
await jsPsych.extensions.tobii.sendMarker({
    type: 'stimulus_onset',
    stimulus_id: 'face_001',
    condition: 'happy',
});
```

**Parameters:**
- `markerData` (MarkerData): Marker information

**Returns:** `Promise<void>`

## Coordinate Utilities

### `normalizedToPixels(x, y)`

Convert normalized coordinates (0-1) to pixels.

```javascript
const pixels = jsPsych.extensions.tobii.normalizedToPixels(0.5, 0.5);
// { x: 960, y: 540 } (for 1920x1080 screen)
```

**Parameters:**
- `x` (number): Normalized x coordinate
- `y` (number): Normalized y coordinate

**Returns:** `Coordinates`

### `pixelsToNormalized(x, y)`

Convert pixel coordinates to normalized (0-1).

```javascript
const normalized = jsPsych.extensions.tobii.pixelsToNormalized(960, 540);
// { x: 0.5, y: 0.5 } (for 1920x1080 screen)
```

**Parameters:**
- `x` (number): Pixel x coordinate
- `y` (number): Pixel y coordinate

**Returns:** `Coordinates`

### `getScreenDimensions()`

Get screen dimensions.

```javascript
const screen = jsPsych.extensions.tobii.getScreenDimensions();
// { width: 1920, height: 1080 }
```

**Returns:** `ScreenDimensions`

## Data Export

### `exportToCSV(data, filename)`

Export data to CSV file.

```javascript
const allData = jsPsych.data.get().values();
jsPsych.extensions.tobii.exportToCSV(allData, 'experiment_data.csv');
```

**Parameters:**
- `data` (any[]): Data array to export
- `filename` (string): Output filename

**Returns:** `void`

### `exportToJSON(data, filename)`

Export data to JSON file.

```javascript
const allData = jsPsych.data.get().values();
jsPsych.extensions.tobii.exportToJSON(allData, 'experiment_data.json');
```

**Parameters:**
- `data` (any[]): Data array to export
- `filename` (string): Output filename

**Returns:** `void`

## Configuration

### `setConfig(config)`

Update extension configuration.

```javascript
jsPsych.extensions.tobii.setConfig({
    data: {
        coordinateSystem: 'pixels'
    }
});
```

**Parameters:**
- `config` (Partial<InitializeParameters>): Configuration options

**Returns:** `void`

### `getConfig()`

Get current configuration.

```javascript
const config = jsPsych.extensions.tobii.getConfig();
```

**Returns:** `InitializeParameters`

## Time Synchronization

### `getTimeOffset()`

Get time synchronization offset.

```javascript
const offset = jsPsych.extensions.tobii.getTimeOffset();
```

**Returns:** `number`

### `isTimeSynced()`

Check if time is synchronized with server.

```javascript
const synced = jsPsych.extensions.tobii.isTimeSynced();
```

**Returns:** `boolean`
