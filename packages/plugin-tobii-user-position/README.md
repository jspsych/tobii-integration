# @jspsych/plugin-tobii-user-position

This plugin displays a user position guide for Tobii eye trackers. It helps users position themselves optimally within the tracker's field of view for best tracking accuracy.

## Installation

```bash
npm install @jspsych/plugin-tobii-user-position
```

## Usage

```javascript
import jsPsychTobiiUserPosition from '@jspsych/plugin-tobii-user-position';

const trial = {
  type: jsPsychTobiiUserPosition,
  duration: 10000, // Show for 10 seconds
  message: 'Please position yourself so the indicators are green',
  update_interval: 100, // Update position every 100ms
};
```

## Parameters

- `duration`: How long to display the position guide (milliseconds). Use `null` for manual continuation.
- `message`: Instructions to display to the user.
- `update_interval`: How often to update the position display (milliseconds).
- `show_distance_feedback`: Whether to show distance (Z-axis) feedback.
- `show_position_feedback`: Whether to show XY position feedback.

## Data

The plugin records:
- Average user position during the trial
- Position quality metrics
- Whether the user was well-positioned

## Requirements

Requires the Tobii extension to be loaded and connected to an eye tracker.
