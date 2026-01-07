# Integration Test Guide

This guide will help you run your first full integration test of the jsPsych-Tobii system.

## Prerequisites

### 1. Build JavaScript Packages

```bash
# From the root of the repository
npm install
npm run build
```

This builds:
- `@jspsych/extension-tobii`
- `@jspsych/plugin-tobii-calibration`
- `@jspsych/plugin-tobii-validation`

### 2. Install Python Server

```bash
cd python
pip install -e .
```

For specific tracker types:
```bash
# For Tobii Pro series
pip install -e ".[tobii-pro]"

# For X3-120 (requires manual legacy SDK installation)
pip install -e .
# Then install Tobii Analytics SDK 3.0 from Tobii support
```

## Quick Test with Mock Tracker

The easiest way to test without hardware:

### 1. Start the Server (Mock Mode)

```bash
# From python/ directory
python -m jspsych_tobii.server --mock --log-level DEBUG

# Or using the CLI command (if installed)
jspsych-tobii-server --mock --log-level DEBUG
```

You should see:
```
INFO - Created adapter: mock v1.0.0
INFO - Starting Tobii WebSocket server on localhost:8080
INFO - Connected to tracker: Mock Tobii Pro Spectrum
INFO - Server started successfully
```

### 2. Open the Example in a Browser

```bash
# From the root directory
# Open in your browser:
examples/basic-experiment/experiment.html
```

Or use a local server (recommended):
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000/examples/basic-experiment/experiment.html
```

### 3. What to Expect

The mock tracker will:
- ✅ Connect successfully
- ✅ Generate realistic 120 Hz gaze data
- ✅ Simulate calibration (always succeeds with ~1.0° error)
- ✅ Simulate validation (produces realistic metrics)
- ✅ Track mouse-like smooth eye movements
- ✅ Respond to all WebSocket commands

### 4. Check the Browser Console

Open Developer Tools (F12) and you should see:
```
Extension initialized
Connected to Tobii server
Calibration started
Calibration point collected (0.5, 0.5)
...
Calibration computed: success
```

### 5. Verify Data Collection

At the end of the experiment:
- Data will be displayed in the browser
- A CSV file will be downloaded
- Check for `tobii_data` in the trial records
- Each trial should have gaze samples with x, y, timestamp, validity

## Test with Real Hardware

### Tobii Pro Series (Spectrum, Fusion, Nano, TX300)

```bash
# Start server (auto-detects Pro SDK)
jspsych-tobii-server --log-level DEBUG

# Or force Pro SDK explicitly
jspsych-tobii-server --sdk tobii-pro --log-level DEBUG
```

### Tobii X3-120 and X-Series

```bash
# Force X-series SDK
jspsych-tobii-server --sdk tobii-x-series --log-level DEBUG
```

### Expected Console Output

```
INFO - Created adapter: tobii-research v1.11.0
INFO - Connected to tracker: Tobii Pro Spectrum
INFO - Connected to tracker: {
  'model': 'Tobii Pro Spectrum',
  'serial': 'TPSG-12345678',
  'sampling_frequency': 150.0,
  'sdk': 'tobii-research',
  'sdk_version': '1.11.0'
}
INFO - Server started successfully
```

## Common Issues and Solutions

### Issue: "No Tobii SDK found"

**Solution for mock testing:**
```bash
jspsych-tobii-server --mock
```

**Solution for Pro series:**
```bash
pip install tobii-research
```

**Solution for X3-120:**
- Contact Tobii support for Analytics SDK 3.0
- Install the SDK per Tobii's instructions
- Verify: `python -c "import tobii.eye_tracking_io; print('OK')"`

### Issue: "Failed to find Tobii eye tracker"

**Check:**
1. Tracker is connected (USB or network)
2. Tracker is powered on
3. Correct SDK installed
4. Try explicit SDK selection: `--sdk tobii-pro` or `--sdk tobii-x-series`

### Issue: "WebSocket connection failed" in browser

**Check:**
1. Server is running: `jspsych-tobii-server --mock`
2. Port 8080 is available (or use `--port 9000`)
3. WebSocket URL matches: `ws://localhost:8080`
4. Check browser console for errors

### Issue: Calibration fails

**Mock mode:**
- Should never fail (by design)
- If it fails, there's a bug - please report!

**Real hardware:**
- Ensure participant is positioned correctly
- Check track box alignment
- Try recalibration
- Check lighting conditions
- Ensure no reflections on glasses

### Issue: No gaze data in trials

**Check:**
1. Extension added to trial: `extensions: [{ type: extension_tobii }]`
2. Tracking started (automatic after calibration)
3. Check `trial.tobii_data` in the data
4. Check browser console for errors

## Debugging Tips

### Check Server Logs

```bash
# Run with debug logging and save to file
jspsych-tobii-server --mock --log-level DEBUG --log-file server.log

# Then check the log
cat server.log
```

### Check WebSocket Messages

In browser console:
```javascript
// See all messages
jsPsych.extensions.tobii._ws._debug = true;
```

### Verify Adapter

```bash
# Check which adapters are available
python -c "from jspsych_tobii.adapters import print_sdk_status; print_sdk_status()"
```

Output example:
```
=== Tobii SDK Status ===

✓ Available: Tobii Pro (tobii-research) (v1.11.0)
✗ Not installed: Tobii X-Series (Analytics SDK)

========================

✓ 1 SDK(s) available
```

## Test Checklist

Before reporting success, verify:

- [ ] Server starts without errors
- [ ] Browser connects to WebSocket
- [ ] Extension initializes
- [ ] Calibration completes
- [ ] Validation shows results
- [ ] Trials collect gaze data
- [ ] Data exports to CSV
- [ ] No console errors
- [ ] Markers appear in data stream

## Performance Benchmarks

### Mock Tracker
- **Latency**: <1ms
- **Sampling rate**: 120 Hz
- **Data quality**: Perfect (simulated)

### Real Tobii Pro Spectrum
- **Latency**: 5-10ms
- **Sampling rate**: 60-1200 Hz (hardware dependent)
- **Data quality**: Hardware dependent

### Real Tobii X3-120
- **Latency**: 10-20ms
- **Sampling rate**: 60-120 Hz
- **Data quality**: Hardware dependent

## Next Steps

Once integration test passes:

1. **Customize experiment** - Edit `examples/basic-experiment/experiment.html`
2. **Test calibration quality** - Try different point configurations
3. **Test validation accuracy** - Check reported metrics
4. **Collect real data** - Run with participants
5. **Analyze data** - Use exported CSV files

## Getting Help

- **GitHub Issues**: https://github.com/jspsych/jspsych-tobii/issues
- **Documentation**: See README files in each package
- **Adapter Guide**: `python/ADAPTER_GUIDE.md`

## Known Limitations

1. **Validation** is a software-based analysis, not a tracker feature
   - Results are computed from collected gaze samples
   - Accuracy depends on calibration quality

2. **Mock tracker** simulates realistic patterns but isn't real data
   - Use for development and testing only
   - Always validate with real hardware before experiments

3. **Legacy SDK (X-series)** must be installed manually
   - Not available via pip
   - Contact Tobii support for downloads

## Success Criteria

✅ Integration test is successful if:
- Server starts and finds tracker (mock or real)
- Browser connects without errors
- Calibration completes without errors
- At least one trial collects gaze data
- Data includes x, y, timestamp, validity fields
- CSV export works

🎉 You're ready to run experiments!
