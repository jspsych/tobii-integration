# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the jsPsych-Tobii integration.

## Connection Issues

### Server Won't Start

**Symptoms:**
- `jspsych-tobii-server` command fails
- Error about missing eye tracker

**Solutions:**

1. **Check eye tracker connection:**
   ```bash
   # Verify USB connection
   lsusb | grep -i tobii  # Linux
   ```

2. **Verify Tobii Eye Tracker Manager:**
   - Open Tobii Eye Tracker Manager
   - Ensure the tracker is recognized
   - Run the built-in calibration to verify hardware works

3. **Check Python dependencies:**
   ```bash
   pip install --upgrade jspsych-tobii
   ```

4. **Try a different adapter:**
   ```bash
   # Use mock adapter for testing
   jspsych-tobii-server --adapter mock
   ```

### Browser Can't Connect

**Symptoms:**
- "WebSocket connection failed" error in browser console
- Extension initialization fails

**Solutions:**

1. **Verify server is running:**
   ```bash
   # Check if server is listening
   netstat -an | grep 8080  # or your port number
   ```

2. **Check URL matches:**
   ```javascript
   // Make sure URL matches server
   params: {
     connection: {
       url: 'ws://localhost:8080',  // Default port
     },
   }
   ```

3. **Firewall issues:**
   - Temporarily disable firewall
   - Add exception for port 8080

4. **Cross-origin issues:**
   - Serve your experiment from a local web server
   - Don't open HTML files directly (file:// protocol)

### Connection Drops During Experiment

**Symptoms:**
- Gaze data stops appearing mid-experiment
- Reconnection messages in console

**Solutions:**

1. **Check USB connection:**
   - Use a high-quality USB cable
   - Connect directly to computer (not through hub)

2. **Adjust reconnection settings:**
   ```javascript
   params: {
     connection: {
       url: 'ws://localhost:8080',
       reconnectAttempts: 10,
       reconnectDelay: 2000,
     },
   }
   ```

3. **Monitor server logs:**
   ```bash
   jspsych-tobii-server --log-level debug
   ```

## Calibration Issues

### Calibration Fails

**Symptoms:**
- Calibration reports failure
- High average error

**Solutions:**

1. **Use position guide first:**
   ```javascript
   timeline.push({
     type: TobiiUserPositionPlugin,
     require_good_position: true,
   });
   ```

2. **Increase collection duration:**
   ```javascript
   {
     type: TobiiCalibrationPlugin,
     collection_duration: 1500,  // Increase from default 1000
     point_duration: 750,        // More time to fixate
   }
   ```

3. **Try click mode:**
   ```javascript
   {
     type: TobiiCalibrationPlugin,
     calibration_mode: 'click',
   }
   ```

4. **Environmental factors:**
   - Reduce ambient lighting
   - Remove reflective surfaces from participant's view
   - Clean eye tracker lens

### Poor Calibration in Certain Areas

**Symptoms:**
- Corners or edges have high error
- Center calibration is good

**Solutions:**

1. **Check monitor size vs. tracking range:**
   - Large monitors may exceed tracking range at edges
   - Consider using central area only

2. **Adjust participant distance:**
   - Move slightly closer or farther
   - Use position guide to find optimal distance

3. **Use custom points:**
   ```javascript
   {
     type: TobiiCalibrationPlugin,
     custom_points: [
       { x: 0.15, y: 0.15 },  // Avoid extreme edges
       { x: 0.5, y: 0.15 },
       { x: 0.85, y: 0.15 },
       // ... more points
     ],
   }
   ```

### Calibration Jumps Around

**Symptoms:**
- Participant's gaze jumps unexpectedly
- Calibration points collect erratically

**Solutions:**

1. **Ensure head stability:**
   - Use chin rest if available
   - Instruct participant to minimize movement

2. **Check for glasses issues:**
   - Clean glasses lenses
   - Ensure proper fit
   - Consider contact lenses if available

## Data Issues

### No Gaze Data Collected

**Symptoms:**
- `tobii_data` is empty in trial results
- No eye tracking data in export

**Solutions:**

1. **Verify extension is added to trials:**
   ```javascript
   {
     type: HtmlKeyboardResponsePlugin,
     stimulus: '<p>Your stimulus</p>',
     extensions: [{ type: TobiiExtension }],  // Don't forget this!
   }
   ```

2. **Check if tracking started:**
   ```javascript
   // Debug: Check tracking state
   console.log('Tracking:', jsPsych.extensions.tobii.isTracking());
   ```

3. **Verify calibration completed:**
   - Calibration must complete successfully before gaze data is collected

### Gaze Data Has Wrong Coordinates

**Symptoms:**
- Coordinates are outside expected range
- Gaze position doesn't match where participant is looking

**Solutions:**

1. **Recalibrate:**
   - Calibration may have degraded
   - Participant may have moved

2. **Check coordinate system:**
   ```javascript
   // Gaze data is normalized (0-1) by default
   // Convert to pixels if needed:
   const pixels = jsPsych.extensions.tobii.normalizedToPixels(gaze.x, gaze.y);
   ```

3. **Verify screen dimensions:**
   ```javascript
   const dims = jsPsych.extensions.tobii.getScreenDimensions();
   console.log('Screen:', dims.width, 'x', dims.height);
   ```

### Timestamp Issues

**Symptoms:**
- Timestamps don't align with jsPsych events
- Time sync errors in console

**Solutions:**

1. **Check time synchronization:**
   ```javascript
   if (!jsPsych.extensions.tobii.isTimeSynced()) {
     console.warn('Time not synchronized');
   }
   ```

2. **Use client timestamps:**
   - Gaze data includes `clientTimestamp` for browser-local time
   - Use for aligning with other browser events

## Performance Issues

### Slow Frame Rate

**Symptoms:**
- Experiment feels sluggish
- Animation stutters

**Solutions:**

1. **Reduce buffer size:**
   ```javascript
   // In extension-tobii source, adjust DEFAULT_MAX_BUFFER_SIZE
   ```

2. **Clear old data periodically:**
   ```javascript
   // The extension does this automatically, but you can force it:
   jsPsych.extensions.tobii.clearGazeData();
   ```

3. **Use Chrome/Chromium:**
   - Generally best WebSocket performance

### High CPU Usage

**Symptoms:**
- Fan runs constantly
- Other applications slow down

**Solutions:**

1. **Lower sampling rate (if supported by your tracker):**
   - Configure in Python server or tracker settings

2. **Reduce update frequency in position guide:**
   ```javascript
   {
     type: TobiiUserPositionPlugin,
     update_interval: 200,  // Increase from default 100ms
   }
   ```

## Browser-Specific Issues

### Firefox Issues

**Symptoms:**
- WebSocket connection problems
- Performance issues

**Solutions:**
- Use Chrome/Chromium for best compatibility
- If Firefox is required, ensure latest version

### Safari Issues

**Symptoms:**
- WebSocket may not connect
- CSS animations may differ

**Solutions:**
- Enable WebSocket support in Safari preferences
- Prefer Chrome/Chromium for experiments

## Error Messages

### "Tobii extension not initialized"

**Cause:** Plugin tried to use extension before it was set up.

**Solution:**
```javascript
const jsPsych = initJsPsych({
  extensions: [
    {
      type: TobiiExtension,
      params: { /* ... */ },
    },
  ],
});
```

### "Not connected to server"

**Cause:** Trying to use features before WebSocket connects.

**Solution:**
```javascript
// Wait for connection
await jsPsych.extensions.tobii.connect();
```

### "Invalid calibration point"

**Cause:** Coordinates outside 0-1 range.

**Solution:**
```javascript
// Ensure coordinates are normalized (0-1)
const point = { x: 0.5, y: 0.5 };  // Center of screen
```

### "Request timeout"

**Cause:** Server didn't respond in time.

**Solutions:**
- Check server is running
- Check network connection
- Increase timeout if needed (in WebSocket client)

## Getting Help

If you're still having issues:

1. **Check existing issues:**
   https://github.com/jspsych/jspsych-tobii/issues

2. **Create a new issue with:**
   - Operating system and version
   - Browser and version
   - Eye tracker model
   - Python server logs
   - Browser console output
   - Minimal code to reproduce the issue

3. **Join discussions:**
   https://github.com/jspsych/jspsych-tobii/discussions
