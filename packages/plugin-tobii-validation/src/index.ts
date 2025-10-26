/**
 * **plugin-tobii-validation**
 *
 * jsPsych plugin for Tobii eye tracker validation
 *
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/plugin-tobii-validation#readme}
 */

import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { version } from "../package.json";
import { ValidationDisplay } from "./validation-display";
import type { ValidationParameters, ValidationPoint } from "./types";
import "./styles.css";

const info = <const>{
  name: "plugin-tobii-validation",
  version: version,
  parameters: {
    /** Number of validation points (5 or 9) */
    validation_points: {
      type: ParameterType.INT,
      default: 9,
    },
    /** Size of validation points in pixels */
    point_size: {
      type: ParameterType.INT,
      default: 20,
    },
    /** Color of validation points */
    point_color: {
      type: ParameterType.STRING,
      default: "#00ff00",
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
    /** Custom validation points */
    custom_points: {
      type: ParameterType.COMPLEX,
      default: null,
    },
    /** Show visual feedback */
    show_feedback: {
      type: ParameterType.BOOL,
      default: true,
    },
    /** Instructions text */
    instructions: {
      type: ParameterType.STRING,
      default: "Look at each point as it appears on the screen to validate calibration accuracy.",
    },
  },
  data: {
    /** Validation success status */
    validation_success: {
      type: ParameterType.BOOL,
    },
    /** Average accuracy */
    average_accuracy: {
      type: ParameterType.FLOAT,
    },
    /** Average precision */
    average_precision: {
      type: ParameterType.FLOAT,
    },
    /** Number of validation points used */
    num_points: {
      type: ParameterType.INT,
    },
    /** Full validation result data */
    validation_data: {
      type: ParameterType.COMPLEX,
    },
  },
};

type Info = typeof info;

class PluginTobiiValidationPlugin implements JsPsychPlugin<Info> {
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

    // Create validation display
    const validationDisplay = new ValidationDisplay(display_element, trial);

    // Show instructions
    await validationDisplay.showInstructions();

    // Get validation points
    const points = trial.custom_points || this.getValidationPoints(trial.validation_points);

    // Start validation on server
    await tobiiExt.startValidation();

    // Show each point and collect validation data
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // Show point
      await validationDisplay.showPoint(point, i, points.length);

      // Wait for data collection
      await this.delay(trial.collection_duration);

      // Collect validation data for this point
      await tobiiExt.collectValidationPoint(point.x, point.y);

      // Hide point
      await validationDisplay.hidePoint();
    }

    // Compute validation on server
    const validationResult = await tobiiExt.computeValidation();

    // Show result
    await validationDisplay.showResult(
      validationResult.success,
      validationResult.averageAccuracy,
      validationResult.averagePrecision,
      validationResult.pointData
    );

    // Clear display
    validationDisplay.clear();
    display_element.innerHTML = "";

    // Finish trial
    const trial_data = {
      validation_success: validationResult.success,
      average_accuracy: validationResult.averageAccuracy || null,
      average_precision: validationResult.averagePrecision || null,
      num_points: points.length,
      validation_data: validationResult,
    };

    this.jsPsych.finishTrial(trial_data);
  }

  /**
   * Get standard validation points (5 or 9 point grid)
   */
  private getValidationPoints(count: 5 | 9): ValidationPoint[] {
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

export default PluginTobiiValidationPlugin;
