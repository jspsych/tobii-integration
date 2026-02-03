# @jspsych/plugin-tobii-user-position

jsPsych plugin for Tobii eye tracker user position guide. Displays real-time head position feedback to help participants maintain optimal positioning for eye tracking. Useful before calibration to ensure good tracking conditions.

## Installation

```bash
npm install @jspsych/plugin-tobii-user-position
```

## Compatibility

This plugin requires jsPsych v8.0.0 or later and the `@jspsych/extension-tobii` extension.

## Usage

```javascript
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';

const trial = {
  type: TobiiUserPositionPlugin,
  message: 'Please position yourself so the indicators are green',
  require_good_position: true,
  show_distance_feedback: true,
  show_position_feedback: true,
};
```

The Tobii extension must be loaded and connected before this plugin runs. See the [extension documentation](../extension-tobii/README.md) for setup instructions.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| duration | int | `null` | Duration to show the position guide (ms). Set to `null` for manual continuation via a button. |
| message | string | `'Please position yourself so the indicators are green'` | Instructions message displayed to the participant. |
| update_interval | int | `100` | How often to poll and update the position display (ms). |
| show_distance_feedback | boolean | `true` | Show distance (Z-axis) feedback text indicating whether the participant is too close, too far, or at the right distance. |
| show_position_feedback | boolean | `true` | Show XY position feedback text indicating whether the participant should adjust left/right/up/down. |
| button_text | string | `'Continue'` | Text on the continue button (only shown when `duration` is `null`). |
| require_good_position | boolean | `false` | When `true`, the continue button is disabled until the participant is in a good position. Has no effect when `duration` is set. |
| background_color | string | `'#f0f0f0'` | Background color of the position guide. |
| good_color | string | `'#28a745'` | Color for good position indicators (green). |
| fair_color | string | `'#ffc107'` | Color for fair position indicators (yellow). |
| poor_color | string | `'#dc3545'` | Color for poor position indicators (red). |
| button_color | string | `'#007bff'` | Continue button color. |
| button_hover_color | string | `'#0056b3'` | Continue button hover color. |
| font_size | string | `'18px'` | Font size for feedback text (CSS value). |
| position_threshold_good | float | `0.15` | Maximum normalized offset from center (0.5) for the XY position to be rated "good". |
| position_threshold_fair | float | `0.25` | Maximum normalized offset from center for the XY position to be rated "fair". Offsets beyond this are rated "poor". |
| distance_threshold_good | float | `0.1` | Maximum normalized offset from optimal distance (0.5) for the Z position to be rated "good". |
| distance_threshold_fair | float | `0.2` | Maximum normalized offset from optimal distance for the Z position to be rated "fair". Offsets beyond this are rated "poor". |

### Position Quality Thresholds

The eye position indicators are color-coded based on how far the participant's eyes are from the center of the tracking box:

| Quality | XY Offset | Z Offset | Color |
|---------|-----------|----------|-------|
| Good | <= 0.15 | <= 0.1 | Green |
| Fair | <= 0.25 | <= 0.2 | Yellow |
| Poor | > 0.25 | > 0.2 | Red |

These thresholds can be customized with the `position_threshold_*` and `distance_threshold_*` parameters.

## Data Generated

In addition to the [default data collected by jsPsych plugins](https://www.jspsych.org/latest/overview/plugins/#data-collected-by-all-plugins), this plugin collects the following data for each trial.

| Name | Type | Description |
|------|------|-------------|
| average_x | float | Average horizontal eye position during the trial (normalized, 0-1, 0.5 is center). `null` if no valid samples. |
| average_y | float | Average vertical eye position during the trial (normalized, 0-1, 0.5 is center). `null` if no valid samples. |
| average_z | float | Average distance/depth during the trial (normalized, 0-1, 0.5 is optimal). `null` if no valid samples. |
| position_good | boolean | Whether the participant was in a good position at the end of the trial (all axes rated "good"). |
| horizontal_status | string | Horizontal position quality at trial end: `'good'`, `'fair'`, or `'poor'`. |
| vertical_status | string | Vertical position quality at trial end: `'good'`, `'fair'`, or `'poor'`. |
| distance_status | string | Distance quality at trial end: `'good'`, `'fair'`, or `'poor'`. |
| rt | int | Response time in ms (duration from trial start to when the participant clicked Continue, or the full duration if timed). |

## Examples

### Manual Continuation (Recommended Before Calibration)

```javascript
const trial = {
  type: TobiiUserPositionPlugin,
  message: 'Adjust your position until both eye indicators are green, then click Continue.',
  require_good_position: true,
};
```

### Timed Display

```javascript
const trial = {
  type: TobiiUserPositionPlugin,
  duration: 10000,
  message: 'Hold still for the position check.',
};
```

### Custom Thresholds

```javascript
const trial = {
  type: TobiiUserPositionPlugin,
  require_good_position: true,
  position_threshold_good: 0.10,
  position_threshold_fair: 0.20,
  distance_threshold_good: 0.08,
  distance_threshold_fair: 0.15,
};
```

### Position Check Before Each Block

```javascript
const positionCheck = {
  type: TobiiUserPositionPlugin,
  message: 'Please re-center before the next block.',
  require_good_position: true,
  show_distance_feedback: true,
  show_position_feedback: true,
};

// Insert between experimental blocks
timeline.push(block1);
timeline.push(positionCheck);
timeline.push(block2);
timeline.push(positionCheck);
timeline.push(block3);
```
