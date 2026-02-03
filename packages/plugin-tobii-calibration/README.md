# @jspsych/plugin-tobii-calibration

jsPsych plugin for Tobii eye tracker calibration. Provides a visual calibration procedure with animated points, multiple grid sizes, and real-time feedback.

## Installation

```bash
npm install @jspsych/plugin-tobii-calibration
```

## Compatibility

This plugin requires jsPsych v8.0.0 or later and the `@jspsych/extension-tobii` extension.

## Usage

```javascript
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';

const trial = {
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
};
```

The Tobii extension must be loaded and connected before this plugin runs. See the [extension documentation](../extension-tobii/README.md) for setup instructions.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| calibration_points | int | `9` | Number of calibration points. Supported values: `5`, `9`, `13`, `15`, `19`, `25`. |
| calibration_mode | string | `'view'` | Calibration mode. `'view'`: participant looks at each point for a fixed duration. `'click'`: participant clicks when ready at each point. |
| point_size | int | `20` | Size of calibration points in pixels. |
| point_color | string | `'#ff0000'` | Color of calibration points (CSS color value). |
| point_duration | int | `500` | Duration to show each point before data collection begins (ms). Allows the participant to fixate. |
| collection_duration | int | `1000` | Duration to collect calibration data at each point (ms). |
| gap_duration | int | `250` | Blank screen duration between points (ms). |
| show_progress | boolean | `true` | Show a progress indicator (e.g., "Point 3 of 9"). |
| custom_points | array | `null` | Array of custom calibration points. Each point is an object with `x` and `y` properties (normalized 0-1). Overrides `calibration_points` when provided. |
| animation | string | `'shrink'` | Animation style for point appearance. Options: `'none'`, `'pulse'`, `'shrink'`. |
| instructions | string | `'Look at each point as it appears on the screen. Keep your gaze fixed on each point until it disappears.'` | Instructions text shown before calibration begins. |
| button_text | string | `'Start Calibration'` | Button text shown on the instructions screen before calibration begins. |
| background_color | string | `'#808080'` | Background color of the calibration container. |
| button_color | string | `'#007bff'` | Primary button color. |
| button_hover_color | string | `'#0056b3'` | Primary button hover color. |
| retry_button_color | string | `'#dc3545'` | Retry button color. |
| retry_button_hover_color | string | `'#c82333'` | Retry button hover color. |
| success_color | string | `'#28a745'` | Success message heading color. |
| error_color | string | `'#dc3545'` | Error message heading color. |
| max_retries | int | `1` | Maximum number of retry attempts allowed if calibration fails. The participant is shown a retry button on failure. Set to `0` to disable retries. |

## Data Generated

In addition to the [default data collected by jsPsych plugins](https://www.jspsych.org/latest/overview/plugins/#data-collected-by-all-plugins), this plugin collects the following data for each trial.

| Name | Type | Description |
|------|------|-------------|
| calibration_success | boolean | Whether the calibration was successful. |
| num_points | int | Number of calibration points used. |
| mode | string | Calibration mode used (`'view'` or `'click'`). |
| calibration_data | object | Full calibration result data returned by the server, including any quality metrics. |
| num_attempts | int | Number of calibration attempts made (including retries). |

## Calibration Point Grids

The `calibration_points` parameter supports these grid sizes:

- **5**: Four corners + center
- **9**: 3x3 grid (recommended default)
- **13**: 3x3 outer grid + 4 diagonal midpoints
- **15**: 5 rows x 3 columns
- **19**: Symmetric 3-5-3-5-3 pattern
- **25**: 5x5 full grid

All standard grids use points spanning from 0.1 to 0.9 in normalized coordinates, keeping a 10% margin from screen edges.

## Examples

### Basic 9-Point Calibration

```javascript
const trial = {
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
};
```

### Click Mode with Custom Styling

```javascript
const trial = {
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'click',
  point_color: '#0000ff',
  point_size: 25,
  background_color: '#333333',
  button_text: 'Begin Calibration',
};
```

### Custom Points

```javascript
const trial = {
  type: TobiiCalibrationPlugin,
  custom_points: [
    { x: 0.15, y: 0.15 },
    { x: 0.5, y: 0.15 },
    { x: 0.85, y: 0.15 },
    { x: 0.15, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.85, y: 0.5 },
    { x: 0.15, y: 0.85 },
    { x: 0.5, y: 0.85 },
    { x: 0.85, y: 0.85 },
  ],
};
```

### With Retries Disabled

```javascript
const trial = {
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  max_retries: 0,
};
```

## Citation

If you use this plugin in your research, please cite it. See [CITATION.cff](CITATION.cff).
