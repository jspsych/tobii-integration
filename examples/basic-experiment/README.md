# Basic Tobii Eye Tracking Experiment

This example demonstrates a simple jsPsych experiment with Tobii eye tracking.

## Features

- Automatic connection to Tobii server
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
2. **Calibration**: 9-point calibration with animated targets
3. **Validation**: Validates calibration accuracy with visual feedback
4. **Instructions**: Displays task instructions
5. **Trials**: Shows 5 words, one at a time, with eye tracking
   - Records gaze data while each word is displayed
   - Sends markers when each stimulus appears
6. **Finish**: Thanks participant and exports data to CSV

## Experiment Data

The experiment collects:

- **Trial data**: Response times, key presses, trial metadata
- **Eye tracking data**: Gaze coordinates, pupil diameter, validity
- **Markers**: Stimulus onset times and metadata
- **Calibration/validation**: Quality metrics

All data is automatically combined and exported to CSV at the end.

## Customization

You can modify:

- **Words**: Change the `words` array
- **Calibration**: Adjust number of points, animation, colors
- **Timing**: Modify trial durations, ISI
- **Data export**: Choose CSV or JSON format
