# Calibration Guide

This guide covers best practices for achieving high-quality eye tracker calibration with the jsPsych-Tobii integration.

## Understanding Calibration

Eye tracker calibration is the process of mapping the physical characteristics of a participant's eyes to screen coordinates. Good calibration is essential for accurate gaze data.

## Calibration Workflow

### 1. Pre-Calibration Setup

Before starting calibration, ensure optimal conditions:

```javascript
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';

// Always use position guide before calibration
const positionTrial = {
  type: TobiiUserPositionPlugin,
  message: 'Adjust your position until both eye indicators are green',
  require_good_position: true,
  show_distance_feedback: true,
  show_position_feedback: true,
};
```

### 2. Calibration Settings

```javascript
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';

const calibrationTrial = {
  type: TobiiCalibrationPlugin,

  // Number of calibration points (5 or 9)
  calibration_points: 9,

  // 'view' - just look at points; 'click' - click when ready
  calibration_mode: 'view',

  // Time to fixate before data collection (ms)
  point_duration: 500,

  // Data collection time per point (ms)
  collection_duration: 1000,

  // Visual settings
  point_size: 20,
  point_color: '#ff0000',
  background_color: '#808080',

  // Instructions shown before calibration
  instructions: 'Follow the red dot with your eyes. Keep your head still.',
};
```

## Calibration Point Patterns

### 9-Point Calibration (Recommended)

The default 9-point pattern provides good coverage:

```
●─────────●─────────●
│         │         │
│         │         │
●─────────●─────────●
│         │         │
│         │         │
●─────────●─────────●
```

Points at: (0.1, 0.1), (0.5, 0.1), (0.9, 0.1), etc.

### 5-Point Calibration

Faster but less accurate:

```
●─────────────────────●
│                     │
│          ●          │
│                     │
●─────────────────────●
```

### Custom Points

For specific experimental needs:

```javascript
const calibrationTrial = {
  type: TobiiCalibrationPlugin,
  custom_points: [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
  ],
};
```

## Calibration Modes

### View Mode (Default)

- Participant simply looks at each point
- Points appear with animation to guide attention
- Faster, less participant effort
- Best for experienced participants

### Click Mode

- Participant clicks when ready at each point
- More control over timing
- Better for novice participants
- Useful when exact timing isn't critical

```javascript
const calibrationTrial = {
  type: TobiiCalibrationPlugin,
  calibration_mode: 'click',
  button_text: 'Start Calibration',
};
```

## Validation

Always validate after calibration:

```javascript
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';

const validationTrial = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05, // 5% of screen size
  show_feedback: true,
};
```

### Interpreting Validation Results

The validation plugin reports:

- **Average Accuracy**: Mean distance between target and gaze (normalized)
- **Average Precision**: Consistency of gaze samples at each point
- **Per-point data**: Accuracy for each validation point

### Tolerance Guidelines

| Tolerance | Use Case |
|-----------|----------|
| 0.02 (2%) | High precision research |
| 0.05 (5%) | Standard experiments |
| 0.10 (10%) | Exploratory/pilot studies |

## Recalibration Logic

Implement automatic recalibration when validation fails:

```javascript
const createCalibrationSequence = () => {
  const sequence = [];

  sequence.push({
    type: TobiiUserPositionPlugin,
    require_good_position: true,
  });

  sequence.push({
    type: TobiiCalibrationPlugin,
    calibration_points: 9,
  });

  sequence.push({
    type: TobiiValidationPlugin,
    validation_points: 9,
    tolerance: 0.05,
    on_finish: (data) => {
      if (!data.validation_success) {
        // Validation failed - recalibrate
        jsPsych.addNodeToEndOfTimeline({
          timeline: createCalibrationSequence(),
        });
      }
    },
  });

  return sequence;
};

timeline.push({ timeline: createCalibrationSequence() });
```

## Tips for Better Calibration

### Environmental Factors

1. **Lighting**: Avoid direct light sources (windows, lamps) behind the participant
2. **Screen brightness**: Use moderate brightness, avoid extreme settings
3. **Distance**: Maintain optimal distance (typically 60-70cm for most trackers)

### Participant Instructions

Tell participants to:

1. Keep their head as still as possible
2. Follow the dot smoothly with their eyes only
3. Blink normally but not excessively
4. Remove glasses if possible (or ensure clean lenses)

### Technical Considerations

1. **Monitor refresh rate**: Higher is better (60Hz minimum)
2. **Fullscreen mode**: Always run experiments in fullscreen
3. **Warm-up time**: Let the eye tracker warm up for a few minutes

## Troubleshooting Poor Calibration

### Problem: High calibration error

Solutions:
- Use position guide to optimize participant position
- Increase `collection_duration` to collect more samples
- Try click mode for more controlled timing
- Check for environmental issues (lighting, reflections)

### Problem: Inconsistent results

Solutions:
- Ensure participant isn't moving during calibration
- Check for glasses/contact lens issues
- Verify eye tracker is properly positioned
- Consider 9-point instead of 5-point calibration

### Problem: Points in certain areas fail

Solutions:
- Check if participant can see those screen areas clearly
- Verify monitor is properly calibrated
- Consider custom points avoiding problematic areas
- Check for tracking range limitations

## Example: Complete Calibration Workflow

```javascript
import { initJsPsych } from 'jspsych';
import TobiiExtension from '@jspsych/extension-tobii';
import TobiiCalibrationPlugin from '@jspsych/plugin-tobii-calibration';
import TobiiValidationPlugin from '@jspsych/plugin-tobii-validation';
import TobiiUserPositionPlugin from '@jspsych/plugin-tobii-user-position';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';

const jsPsych = initJsPsych({
  extensions: [
    {
      type: TobiiExtension,
      params: {
        connection: { url: 'ws://localhost:8080', autoConnect: true },
      },
    },
  ],
});

const timeline = [];

// Instructions
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: `
    <h2>Eye Tracking Setup</h2>
    <p>We will now calibrate the eye tracker.</p>
    <p>Please follow these guidelines:</p>
    <ul style="text-align: left; display: inline-block;">
      <li>Keep your head still during calibration</li>
      <li>Follow the dots with your eyes only</li>
      <li>Blink normally</li>
    </ul>
    <p>Press any key to continue.</p>
  `,
});

// Position guide
timeline.push({
  type: TobiiUserPositionPlugin,
  message: 'Adjust your position until both indicators are green',
  require_good_position: true,
});

// Calibration
timeline.push({
  type: TobiiCalibrationPlugin,
  calibration_points: 9,
  calibration_mode: 'view',
});

// Validation with retry logic
let validationAttempts = 0;
const maxAttempts = 3;

const validationNode = {
  type: TobiiValidationPlugin,
  validation_points: 9,
  tolerance: 0.05,
  on_finish: (data) => {
    validationAttempts++;

    if (!data.validation_success && validationAttempts < maxAttempts) {
      // Add recalibration
      jsPsych.addNodeToEndOfTimeline({
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
          <h2>Recalibration Needed</h2>
          <p>The calibration wasn't quite right. Let's try again.</p>
          <p>Press any key to recalibrate.</p>
        `,
      });

      jsPsych.addNodeToEndOfTimeline({
        type: TobiiCalibrationPlugin,
        calibration_points: 9,
      });

      jsPsych.addNodeToEndOfTimeline(validationNode);
    }
  },
};

timeline.push(validationNode);

// Success message
timeline.push({
  type: HtmlKeyboardResponsePlugin,
  stimulus: `
    <h2>Calibration Complete</h2>
    <p>Eye tracking is now ready.</p>
    <p>Press any key to begin the experiment.</p>
  `,
});

jsPsych.run(timeline);
```
