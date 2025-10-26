# @jspsych/plugin-tobii-calibration

jsPsych plugin for Tobii eye tracker calibration.

## Installation

```bash
npm install @jspsych/plugin-tobii-calibration @jspsych/extension-tobii
```

## Requirements

- jsPsych 7.0 or higher
- @jspsych/extension-tobii 1.0 or higher
- Python server (`jspsych-tobii`) running

## Quick Start

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
    calibration_mode: 'click',
  },
];

jsPsych.run(timeline);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `calibration_points` | int | 9 | Number of calibration points (5 or 9) |
| `calibration_mode` | string | 'click' | Calibration mode: 'click' or 'view' |
| `point_size` | int | 20 | Size of calibration points in pixels |
| `point_color` | string | '#ff0000' | Color of calibration points |
| `point_duration` | int | 1000 | Duration to show each point in view mode (ms) |
| `collection_duration` | int | 1000 | Duration to collect data at each point (ms) |
| `show_progress` | bool | true | Show progress indicator |
| `custom_points` | array | null | Custom calibration points (overrides calibration_points) |
| `animation` | string | 'shrink' | Animation style: 'none', 'pulse', or 'shrink' |
| `instructions` | string | - | Custom instructions text |
| `button_text` | string | 'Start Calibration' | Button text for click mode |

## Data Generated

| Name | Type | Description |
|------|------|-------------|
| `calibration_success` | bool | Whether calibration succeeded |
| `average_error` | float | Average calibration error in degrees |
| `num_points` | int | Number of calibration points used |
| `mode` | string | Calibration mode used |
| `calibration_data` | object | Full calibration result data |

## Examples

### 9-Point Calibration (Click Mode)

```javascript
{
  type: tobiiCalibration,
  calibration_points: 9,
  calibration_mode: 'click',
  point_size: 25,
  point_color: '#0000ff',
  animation: 'pulse',
}
```

### 5-Point Calibration (View Mode)

```javascript
{
  type: tobiiCalibration,
  calibration_points: 5,
  calibration_mode: 'view',
  point_duration: 2000,
  collection_duration: 1500,
  animation: 'shrink',
}
```

### Custom Calibration Points

```javascript
{
  type: tobiiCalibration,
  custom_points: [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
  ],
  calibration_mode: 'click',
}
```

## Styling

The plugin includes default CSS styles. You can customize by overriding these classes:

- `.tobii-calibration-container` - Main container
- `.tobii-calibration-point` - Calibration point
- `.tobii-calibration-instructions` - Instructions panel
- `.tobii-calibration-progress` - Progress indicator
- `.tobii-calibration-result` - Result display

## License

MIT
