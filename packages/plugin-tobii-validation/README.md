# @jspsych/plugin-tobii-validation

jsPsych plugin for Tobii eye tracker validation.

## Installation

```bash
npm install @jspsych/plugin-tobii-validation @jspsych/extension-tobii
```

## Requirements

- jsPsych 7.0 or higher
- @jspsych/extension-tobii 1.0 or higher
- Python server (`jspsych-tobii`) running

## Quick Start

```javascript
import { initJsPsych } from 'jspsych';
import tobiiExtension from '@jspsych/extension-tobii';
import tobiiValidation from '@jspsych/plugin-tobii-validation';

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
    type: tobiiValidation,
    validation_points: 9,
    show_feedback: true,
  },
];

jsPsych.run(timeline);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `validation_points` | int | 9 | Number of validation points (5 or 9) |
| `point_size` | int | 20 | Size of validation points in pixels |
| `point_color` | string | '#00ff00' | Color of validation points |
| `collection_duration` | int | 1000 | Duration to collect data at each point (ms) |
| `show_progress` | bool | true | Show progress indicator |
| `custom_points` | array | null | Custom validation points (overrides validation_points) |
| `show_feedback` | bool | true | Show visual accuracy feedback |
| `instructions` | string | - | Custom instructions text |

## Data Generated

| Name | Type | Description |
|------|------|-------------|
| `validation_success` | bool | Whether validation succeeded |
| `average_accuracy` | float | Average accuracy in degrees |
| `average_precision` | float | Average precision in degrees |
| `num_points` | int | Number of validation points used |
| `validation_data` | object | Full validation result data |

## Examples

### 9-Point Validation with Feedback

```javascript
{
  type: tobiiValidation,
  validation_points: 9,
  show_feedback: true,
  collection_duration: 1500,
}
```

### 5-Point Validation

```javascript
{
  type: tobiiValidation,
  validation_points: 5,
  show_feedback: false,
}
```

### Custom Validation Points

```javascript
{
  type: tobiiValidation,
  custom_points: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  show_feedback: true,
}
```

## Understanding Results

- **Accuracy**: Average angular distance between gaze and target (lower is better)
  - < 1°: Excellent
  - 1-2°: Good
  - > 2°: May need recalibration

- **Precision**: Variability of gaze points (lower is better)
  - Measures consistency of gaze tracking

## Styling

The plugin includes default CSS styles. You can customize by overriding these classes:

- `.tobii-validation-container` - Main container
- `.tobii-validation-point` - Validation point
- `.tobii-validation-instructions` - Instructions panel
- `.tobii-validation-progress` - Progress indicator
- `.tobii-validation-result` - Result display
- `.validation-feedback` - Accuracy feedback visualization

## License

MIT
