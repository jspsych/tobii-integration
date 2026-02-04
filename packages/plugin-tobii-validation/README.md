# @jspsych/plugin-tobii-validation

jsPsych plugin for Tobii eye tracker validation. Validates calibration accuracy by measuring gaze error at target points and provides detailed visual feedback with per-point metrics.

## Installation

```bash
npm install @jspsych/plugin-tobii-validation
```

## Compatibility

This plugin requires jsPsych v8.0.0 or later and the `@jspsych/extension-tobii` extension.

## Usage

```javascript
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';

const trial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  show_feedback: true,
};
```

The Tobii extension must be loaded, connected, and calibrated before this plugin runs. See the [extension documentation](../extension-tobii/README.md) for setup instructions.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| validation_points | int | `9` | Number of validation points. Supported values: `5`, `9`, `13`, `15`, `19`, `25`. |
| point_size | int | `20` | Size of validation points in pixels. |
| point_color | string | `'#00ff00'` | Color of validation points (CSS color value). |
| collection_duration | int | `1000` | Duration to collect gaze data at each point (ms). |
| show_progress | boolean | `true` | Show a progress indicator (e.g., "Point 3 of 9"). |
| custom_points | array | `null` | Array of custom validation points. Each point is an object with `x` and `y` properties (normalized 0-1). Overrides `validation_points` when provided. |
| show_feedback | boolean | `true` | Show visual feedback after validation, including a scatter plot of targets vs. gaze positions and a per-point accuracy table. |
| instructions | string | `'Look at each point as it appears on the screen to validate calibration accuracy.'` | Instructions text shown before validation begins. |
| background_color | string | `'#808080'` | Background color of the validation container. |
| button_color | string | `'#28a745'` | Primary button color. |
| button_hover_color | string | `'#218838'` | Primary button hover color. |
| retry_button_color | string | `'#dc3545'` | Retry button color. |
| retry_button_hover_color | string | `'#c82333'` | Retry button hover color. |
| success_color | string | `'#28a745'` | Success message heading color. |
| error_color | string | `'#dc3545'` | Error message heading color. |
| tolerance | float | `0.05` | Normalized tolerance for acceptable accuracy (0-1 scale). Validation passes if average accuracy error is less than or equal to this value. For example, `0.05` means 5% of screen dimensions. |
| max_retries | int | `1` | Maximum number of retry attempts allowed if validation fails. The participant is shown a retry button on failure. Set to `0` to disable retries. |

### Tolerance Guidelines

| Tolerance | Use Case |
|-----------|----------|
| 0.02 (2%) | High precision research |
| 0.05 (5%) | Standard experiments (default) |
| 0.10 (10%) | Exploratory/pilot studies |

## Data Generated

In addition to the [default data collected by jsPsych plugins](https://www.jspsych.org/latest/overview/plugins/#data-collected-by-all-plugins), this plugin collects the following data for each trial.

| Name | Type | Description |
|------|------|-------------|
| validation_success | boolean | Whether validation passed (average accuracy <= tolerance). |
| average_accuracy_norm | float | Average accuracy error across all points (normalized, 0-1 scale). Lower is better. |
| average_precision_norm | float | Average precision (consistency) across all points (normalized, 0-1 scale). Lower is better. |
| tolerance | float | The tolerance value used for this validation. |
| num_points | int | Number of validation points used. |
| validation_data | object | Full validation result from the server (see below). |
| num_attempts | int | Number of validation attempts made (including retries). |

### validation_data Object

The `validation_data` field contains the full server response, including:

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether the server-side validation computation succeeded. |
| averageAccuracyNorm | float | Average accuracy error (normalized). |
| averagePrecisionNorm | float | Average precision (normalized). |
| pointData | array | Per-point validation data (see below). |

### Per-Point Data

Each element in the `pointData` array contains:

| Field | Type | Description |
|-------|------|-------------|
| point | object | Target point with `x` and `y` (normalized 0-1). |
| accuracyNorm | float | Accuracy error at this point (normalized). |
| precisionNorm | float | Precision at this point (normalized). |
| meanGaze | object | Mean gaze position (`{ x, y }`) during data collection at this point. |
| numSamples | int | Number of valid gaze samples used for this point. |
| numSamplesTotal | int | Total number of gaze samples collected. |
| numSamplesSkipped | int | Number of invalid samples that were skipped. |
| gazeSamples | array | Raw gaze sample positions (`[{ x, y }, ...]`). |

## Validation Point Grids

The `validation_points` parameter supports the same grid sizes as the calibration plugin:

- **5**: Four corners + center
- **9**: 3x3 grid (recommended default)
- **13**: 3x3 outer grid + 4 diagonal midpoints
- **15**: 5 rows x 3 columns
- **19**: Symmetric 3-5-3-5-3 pattern
- **25**: 5x5 full grid

All standard grids use points spanning from 0.1 to 0.9 in normalized coordinates.

## Examples

### Basic Validation

```javascript
const trial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
};
```

### Strict Validation with No Retries

```javascript
const trial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.02,
  max_retries: 0,
};
```

### Lenient Validation with Custom Styling

```javascript
const trial = {
  type: TobiiValidationPlugin,
  validation_points: 5,
  tolerance: 0.10,
  point_color: '#00aaff',
  background_color: '#333333',
  collection_duration: 1500,
};
```

### Using Validation Results for Conditional Logic

```javascript
const trial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  on_finish: (data) => {
    if (!data.validation_success) {
      // Add recalibration to the timeline
      jsPsych.addNodeToEndOfTimeline({
        type: TobiiCalibrationPlugin,
        calibration_points: 9,
      });
    }
  },
};
```

## Citation

If you use this plugin in your research, please cite it. See [CITATION.cff](CITATION.cff).
