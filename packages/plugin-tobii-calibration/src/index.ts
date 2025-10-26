/**
 * **plugin-tobii-calibration**
 *
 * jsPsych plugin for Tobii eye tracker calibration
 *
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/plugin-tobii-calibration#readme}
 */

import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { version } from "../package.json";
import { CalibrationDisplay } from "./calibration-display";
import type { CalibrationParameters, CalibrationPoint } from "./types";
import "./styles.css";

const info = <const>{
  name: "plugin-tobii-calibration",
  version: version,
  parameters: {
    /** Number of calibration points (5 or 9) */
    calibration_points: {
      type: ParameterType.INT,
      default: 9,
    },
    /** Calibration mode: click or view */
    calibration_mode: {
      type: ParameterType.STRING,
      default: "click",
    },
    /** Size of calibration points in pixels */
    point_size: {
      type: ParameterType.INT,
      default: 20,
    },
    /** Color of calibration points */
    point_color: {
      type: ParameterType.STRING,
      default: "#ff0000",
    },
    /** Duration to show each point in view mode (ms) */
    point_duration: {
      type: ParameterType.INT,
      default: 1000,
    },
    /** Duration to collect data at each point (ms) */
    collection_duration: {
      type: ParameterType.INT,
      default: 1000,
    },
    /** Show progress indicator */
    show_progress: {
      type: ParameterType.BOOL,
      default: true,
    },
    /** Custom calibration points */
    custom_points: {
      type: ParameterType.COMPLEX,
      default: null,
    },
    /** Animation style */
    animation: {
      type: ParameterType.STRING,
      default: "shrink",
    },
    /** Instructions text */
    instructions: {
      type: ParameterType.STRING,
      default:
        "Look at each point as it appears on the screen. Click when you are ready to continue.",
    },
    /** Button text for click mode */
    button_text: {
      type: ParameterType.STRING,
      default: "Start Calibration",
    },
  },
  data: {
    /** Calibration success status */
    calibration_success: {
      type: ParameterType.BOOL,
    },
    /** Average calibration error */
    average_error: {
      type: ParameterType.FLOAT,
    },
    /** Number of calibration points used */
    num_points: {
      type: ParameterType.INT,
    },
    /** Calibration mode used */
    mode: {
      type: ParameterType.STRING,
    },
    /** Full calibration result data */
    calibration_data: {
      type: ParameterType.COMPLEX,
    },
  },
};

type Info = typeof info;

class PluginTobiiCalibrationPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  async trial(display_element: HTMLElement, trial: TrialType<Info>): Promise<void> {
    // Get extension instance
    const tobiiExt = this.jsPsych.extensions.tobii as any;

    if (!tobiiExt) {
      throw new Error("Tobii extension not initialized");
    }

    // Check connection
    if (!tobiiExt.isConnected()) {
      throw new Error("Not connected to Tobii server");
    }

    // Create calibration display
    const calibrationDisplay = new CalibrationDisplay(display_element, trial);

    // Show instructions
    await calibrationDisplay.showInstructions();

    // Get calibration points
    const points = trial.custom_points || this.getCalibrationPoints(trial.calibration_points);

    // Start calibration on server
    await tobiiExt.startCalibration();

    // Show each point and collect calibration data
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // Show point
      await calibrationDisplay.showPoint(point, i, points.length);

      if (trial.calibration_mode === "click") {
        // Wait for user to click
        await calibrationDisplay.waitForClick();
      } else {
        // Wait for fixed duration
        await this.delay(trial.point_duration);
      }

      // Collect calibration data for this point
      await tobiiExt.collectCalibrationPoint(point.x, point.y);

      // Wait for data collection
      await this.delay(trial.collection_duration);

      // Hide point
      await calibrationDisplay.hidePoint();
    }

    // Compute calibration on server
    const calibrationResult = await tobiiExt.computeCalibration();

    // Show result
    await calibrationDisplay.showResult(
      calibrationResult.success,
      calibrationResult.averageError
    );

    // Clear display
    calibrationDisplay.clear();
    display_element.innerHTML = "";

    // Finish trial
    const trial_data = {
      calibration_success: calibrationResult.success,
      average_error: calibrationResult.averageError || null,
      num_points: points.length,
      mode: trial.calibration_mode,
      calibration_data: calibrationResult,
    };

    this.jsPsych.finishTrial(trial_data);
  }

  /**
   * Get standard calibration points (5 or 9 point grid)
   */
  private getCalibrationPoints(count: 5 | 9): CalibrationPoint[] {
    if (count === 9) {
      return [
        { x: 0.1, y: 0.1 },
        { x: 0.5, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.1, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0.9, y: 0.5 },
        { x: 0.1, y: 0.9 },
        { x: 0.5, y: 0.9 },
        { x: 0.9, y: 0.9 },
      ];
    } else {
      return [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.5, y: 0.5 },
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 },
      ];
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default PluginTobiiCalibrationPlugin;
