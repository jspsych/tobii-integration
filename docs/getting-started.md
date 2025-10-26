# Getting Started with jsPsych-Tobii

This guide will help you set up and run your first eye tracking experiment with jsPsych and Tobii.

## Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Python 3.9 or higher
- Node.js 18.0 or higher
- Tobii Pro eye tracker (connected via USB or network)

## Installation

### 1. Install Python Server

```bash
pip install jspsych-tobii
```

### 2. Install JavaScript Packages

```bash
npm install @jspsych/extension-tobii @jspsych/plugin-tobii-calibration @jspsych/plugin-tobii-validation
```

## Quick Start

### 1. Start the Server

In a terminal, start the Tobii WebSocket server:

```bash
jspsych-tobii-server
```

You should see output like:

```
Starting Tobii WebSocket server on localhost:8080
Connected to tracker: {'model': 'Tobii Pro Spectrum', ...}
Server started successfully
```

### 2. Create Your Experiment

Create an HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Eye Tracking Experiment</title>
    <script src="https://unpkg.com/jspsych@7.3.4"></script>
    <script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@1.1.3"></script>
    <script src="node_modules/@jspsych/extension-tobii/dist/index.browser.min.js"></script>
    <script src="node_modules/@jspsych/plugin-tobii-calibration/dist/index.browser.min.js"></script>
    <link href="https://unpkg.com/jspsych@7.3.4/css/jspsych.css" rel="stylesheet" />
    <link href="node_modules/@jspsych/plugin-tobii-calibration/dist/styles.css" rel="stylesheet" />
</head>
<body></body>
<script>
    // Initialize jsPsych with Tobii extension
    const jsPsych = initJsPsych({
        extensions: [
            {
                type: extension_tobii,
                params: {
                    connection: {
                        url: 'ws://localhost:8080',
                        autoConnect: true,
                    },
                },
            },
        ],
    });

    // Create timeline
    const timeline = [];

    // Add calibration
    timeline.push({
        type: plugin_tobii_calibration,
        calibration_points: 9,
        calibration_mode: 'click',
    });

    // Add your experimental trials
    timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<p>Look at this text</p>',
        extensions: [{ type: extension_tobii }],
    });

    // Run experiment
    jsPsych.run(timeline);
</script>
</html>
```

### 3. Run Your Experiment

Open the HTML file in your browser. The experiment will:

1. Connect to the Tobii server
2. Run calibration
3. Collect eye tracking data during trials
4. Store data in jsPsych's data structure

## Next Steps

- Read the [Extension API Reference](extension-api.md) to learn about all available methods
- Check out [example experiments](../examples/) for more complex use cases
- Review the [Calibration Guide](calibration-guide.md) for tips on getting good calibration
- See the [API Reference](api-reference.md) for detailed documentation

## Troubleshooting

### Server won't start

- Check that your Tobii tracker is connected
- Verify the Tobii Eye Tracker Manager recognizes your tracker
- Ensure no other applications are using the tracker

### Can't connect from browser

- Verify the server is running (check terminal output)
- Check that you're using the correct URL (`ws://localhost:8080`)
- Ensure your firewall isn't blocking the connection
- Try a different port: `jspsych-tobii-server --port 9000`

### No gaze data collected

- Make sure you called `startTracking()` or used the extension in your trials
- Check the browser console for errors
- Verify calibration completed successfully

## Support

If you encounter issues:

1. Check the [Troubleshooting guide](troubleshooting.md)
2. Search [existing issues](https://github.com/jspsych/jspsych-tobii/issues)
3. Create a [new issue](https://github.com/jspsych/jspsych-tobii/issues/new) with:
   - Your setup (OS, browser, tracker model)
   - Server logs
   - Browser console output
   - Minimal reproducible example
