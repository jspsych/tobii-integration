# Basic Tobii Eye Tracking Experiment

This example demonstrates a simple jsPsych experiment with Tobii eye tracking.

## Features

- Automatic connection to Tobii server
- User position guide with real-time feedback
- 9-point calibration
- Validation with visual feedback
- Eye tracking during stimulus presentation
- Custom markers for stimulus events
- Data export to CSV

## Running the Example

### 1. Start the Python Server

```bash
cd ../../python
pip install -e .
jspsych-tobii-server
```

### 2. Build the JavaScript Packages

```bash
cd ../..
npm install
npm run build
```

### 3. Open the Experiment

Open `experiment.html` in a web browser (modern browser with WebSocket support).

## What the Experiment Does

1. **Welcome**: Shows welcome screen
2. **Position Check**: Guides user to optimal tracking position
   - Shows real-time position indicators for left and right eyes
   - Provides color-coded feedback (green/yellow/red)
   - Displays distance feedback (too close/optimal/too far)
3. **Calibration**: 9-point calibration with animated targets
4. **Validation**: Validates calibration accuracy with visual feedback
5. **Instructions**: Displays task instructions
6. **Trials**: Shows 5 words, one at a time, with eye tracking
   - Records gaze data while each word is displayed
   - Sends markers when each stimulus appears
7. **Finish**: Thanks participant and exports data to CSV

## Experiment Data

The experiment collects:

- **Trial data**: Response times, key presses, trial metadata
- **Eye tracking data**: Gaze coordinates, pupil diameter, validity
- **Markers**: Stimulus onset times and metadata
- **Position data**: Average position and quality metrics
- **Calibration/validation**: Quality metrics

All data is automatically combined and exported to CSV at the end.

## Customization

You can modify:

- **Words**: Change the `words` array
- **Position check**: Set `require_good_position: true` to require optimal positioning
- **Calibration**: Adjust number of points, animation, colors
- **Timing**: Modify trial durations, ISI
- **Data export**: Choose CSV or JSON format
