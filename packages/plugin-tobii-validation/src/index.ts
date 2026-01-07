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
    /** Background color of the validation container */
    background_color: {
      type: ParameterType.STRING,
      default: "#808080",
    },
    /** Primary button color */
    button_color: {
      type: ParameterType.STRING,
      default: "#28a745",
    },
    /** Primary button hover color */
    button_hover_color: {
      type: ParameterType.STRING,
      default: "#218838",
    },
    /** Retry button color */
    retry_button_color: {
      type: ParameterType.STRING,
      default: "#dc3545",
    },
    /** Retry button hover color */
    retry_button_hover_color: {
      type: ParameterType.STRING,
      default: "#c82333",
    },
    /** Success message color */
    success_color: {
      type: ParameterType.STRING,
      default: "#28a745",
    },
    /** Error message color */
    error_color: {
      type: ParameterType.STRING,
      default: "#dc3545",
    },
    /** Good accuracy color */
    accuracy_good_color: {
      type: ParameterType.STRING,
      default: "#00ff00",
    },
    /** Fair accuracy color */
    accuracy_fair_color: {
      type: ParameterType.STRING,
      default: "#ffff00",
    },
    /** Poor accuracy color */
    accuracy_poor_color: {
      type: ParameterType.STRING,
      default: "#ff0000",
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
  private static styleInjected = false;

  constructor(private jsPsych: JsPsych) {}

  private injectStyles(trial: TrialType<Info>): void {
    // Only inject once per page
    if (PluginTobiiValidationPlugin.styleInjected) {
      return;
    }

    const css = `
      .tobii-validation-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${trial.background_color};
        z-index: 9999;
      }

      .tobii-validation-instructions {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 600px;
      }

      .tobii-validation-instructions h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 24px;
        color: #333;
      }

      .tobii-validation-instructions p {
        margin-bottom: 20px;
        font-size: 16px;
        line-height: 1.5;
        color: #666;
      }

      .validation-start-btn,
      .validation-continue-btn,
      .validation-retry-btn {
        background-color: ${trial.button_color};
        color: white;
        border: none;
        padding: 12px 30px;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .validation-start-btn:hover,
      .validation-continue-btn:hover {
        background-color: ${trial.button_hover_color};
      }

      .validation-retry-btn {
        background-color: ${trial.retry_button_color};
      }

      .validation-retry-btn:hover {
        background-color: ${trial.retry_button_hover_color};
      }

      .tobii-validation-point {
        position: absolute;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        animation: tobii-validation-pulse 1s infinite;
      }

      @keyframes tobii-validation-pulse {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 0.9;
        }
      }

      .tobii-validation-progress {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
      }

      .tobii-validation-result {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 800px;
      }

      .result-content h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 24px;
      }

      .result-content.success h2 {
        color: ${trial.success_color};
      }

      .result-content.error h2 {
        color: ${trial.error_color};
      }

      .result-content p {
        margin-bottom: 15px;
        font-size: 16px;
        color: #666;
      }

      .validation-feedback {
        margin: 30px 0;
      }

      .validation-feedback h3 {
        margin-bottom: 15px;
        font-size: 18px;
        color: #333;
      }

      .feedback-canvas {
        position: relative;
        width: 100%;
        height: 300px;
        background-color: #f0f0f0;
        border: 2px solid #ddd;
        border-radius: 5px;
        margin-bottom: 15px;
      }

      .feedback-point {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid #333;
        cursor: help;
      }

      .feedback-legend {
        display: flex;
        justify-content: center;
        gap: 20px;
        font-size: 14px;
        color: #666;
      }

      .feedback-legend span {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .legend-color {
        display: inline-block;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 1px solid #333;
      }
    `;

    const styleElement = document.createElement("style");
    styleElement.id = "tobii-validation-styles";
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    PluginTobiiValidationPlugin.styleInjected = true;
  }

  async trial(display_element: HTMLElement, trial: TrialType<Info>): Promise<void> {
    // Inject styles
    this.injectStyles(trial);
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
    const validationDisplay = new ValidationDisplay(display_element, trial as any as ValidationParameters);

    // Show instructions
    await validationDisplay.showInstructions();

    // Get validation points and validate custom points
    let points: ValidationPoint[];
    if (trial.custom_points) {
      // Validate custom points
      points = this.validateCustomPoints(trial.custom_points);
    } else {
      points = this.getValidationPoints(trial.validation_points as 5 | 9);
    }

    // Start validation on server
    await tobiiExt.startValidation();

    // Show each point and collect validation data
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // Show point
      await validationDisplay.showPoint(point, i, points.length);

      // Capture start time before collection period for precise time-range query
      const collectionStartTime = performance.now();

      // Wait for data collection
      await this.delay(trial.collection_duration);

      // Capture end time after collection period
      const collectionEndTime = performance.now();

      // Get gaze samples collected during exactly this point's display period
      // Use time-range query for precise alignment instead of duration-based retrieval
      const gazeSamples = await tobiiExt.getGazeData(collectionStartTime, collectionEndTime);

      // Collect validation data for this point with the gaze samples
      await tobiiExt.collectValidationPoint(point.x, point.y, gazeSamples);

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
   * Validate custom validation points
   */
  private validateCustomPoints(points: any[]): ValidationPoint[] {
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error("custom_points must be a non-empty array");
    }

    const validated: ValidationPoint[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (
        typeof point !== "object" ||
        point === null ||
        typeof point.x !== "number" ||
        typeof point.y !== "number"
      ) {
        throw new Error(`Invalid validation point at index ${i}: must have numeric x and y`);
      }
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
        throw new Error(`Validation point at index ${i} out of range: x and y must be between 0 and 1`);
      }
      validated.push({ x: point.x, y: point.y });
    }

    return validated;
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
