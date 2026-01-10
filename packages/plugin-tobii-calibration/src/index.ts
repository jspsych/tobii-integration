/**
 * @title Tobii Calibration
 * @description jsPsych plugin for Tobii eye tracker calibration. Provides a visual
 * calibration procedure with animated points and real-time feedback.
 * @version 1.0.0
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/plugin-tobii-calibration#readme Documentation}
 */

import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { version } from "../package.json";
import { CalibrationDisplay } from "./calibration-display";
import type { CalibrationParameters, CalibrationPoint } from "./types";

const info = <const>{
  name: "tobii-calibration",
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
      default: "view",
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
    /** Duration to show each point before data collection (ms) - allows user to fixate */
    point_duration: {
      type: ParameterType.INT,
      default: 500,
    },
    /** Duration to collect data at each point (ms) */
    collection_duration: {
      type: ParameterType.INT,
      default: 1000,
    },
    /** Gap duration between points (ms) - blank screen before next point appears */
    gap_duration: {
      type: ParameterType.INT,
      default: 250,
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
        "Look at each point as it appears on the screen. Keep your gaze fixed on each point until it disappears.",
    },
    /** Button text for click mode */
    button_text: {
      type: ParameterType.STRING,
      default: "Start Calibration",
    },
    /** Background color of the calibration container */
    background_color: {
      type: ParameterType.STRING,
      default: "#808080",
    },
    /** Primary button color */
    button_color: {
      type: ParameterType.STRING,
      default: "#007bff",
    },
    /** Primary button hover color */
    button_hover_color: {
      type: ParameterType.STRING,
      default: "#0056b3",
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

class TobiiCalibrationPlugin implements JsPsychPlugin<Info> {
  static info = info;
  private static styleInjected = false;

  constructor(private jsPsych: JsPsych) {}

  private injectStyles(trial: TrialType<Info>): void {
    // Only inject once per page
    if (TobiiCalibrationPlugin.styleInjected) {
      return;
    }

    const css = `
      .tobii-calibration-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${trial.background_color};
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        z-index: 9999;
      }

      .tobii-calibration-instructions {
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

      .tobii-calibration-instructions h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 24px;
        color: #333;
      }

      .tobii-calibration-instructions p {
        margin-bottom: 20px;
        font-size: 16px;
        line-height: 1.5;
        color: #666;
      }

      .calibration-start-btn,
      .calibration-continue-btn,
      .calibration-retry-btn {
        background-color: ${trial.button_color};
        color: white;
        border: none;
        padding: 12px 30px;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .calibration-start-btn:hover,
      .calibration-continue-btn:hover {
        background-color: ${trial.button_hover_color};
      }

      .calibration-retry-btn {
        background-color: ${trial.retry_button_color};
      }

      .calibration-retry-btn:hover {
        background-color: ${trial.retry_button_hover_color};
      }

      .tobii-calibration-point {
        position: absolute;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      }

      .tobii-calibration-point.animation-pulse {
        animation: tobii-calibration-pulse 1s infinite;
      }

      @keyframes tobii-calibration-pulse {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 0.8;
        }
      }

      .tobii-calibration-point.animation-shrink {
        animation: tobii-calibration-shrink 1s ease-out;
      }

      @keyframes tobii-calibration-shrink {
        0% {
          transform: translate(-50%, -50%) scale(3);
          opacity: 0.5;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

      .tobii-calibration-point.animation-explosion {
        animation: tobii-calibration-explosion 0.4s ease-out forwards;
      }

      @keyframes tobii-calibration-explosion {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(2);
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
        }
      }

      .tobii-calibration-point.animation-zoom-out {
        animation: tobii-calibration-zoom-out 0.3s ease-out forwards;
      }

      @keyframes tobii-calibration-zoom-out {
        0% {
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          transform: translate(-50%, -50%) scale(2.5);
        }
      }

      .tobii-calibration-point.animation-zoom-in {
        animation: tobii-calibration-zoom-in 0.3s ease-out forwards;
      }

      @keyframes tobii-calibration-zoom-in {
        0% {
          transform: translate(-50%, -50%) scale(2.5);
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
        }
      }

      .tobii-calibration-progress {
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

      .tobii-calibration-result {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
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
        margin-bottom: 20px;
        font-size: 16px;
        color: #666;
      }
    `;

    const styleElement = document.createElement("style");
    styleElement.id = "tobii-calibration-styles";
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    TobiiCalibrationPlugin.styleInjected = true;
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

    // Create calibration display
    const calibrationDisplay = new CalibrationDisplay(display_element, trial as any as CalibrationParameters);

    // Show instructions
    await calibrationDisplay.showInstructions();

    // Get calibration points and validate custom points
    let points: CalibrationPoint[];
    if (trial.custom_points) {
      // Validate custom points
      points = this.validateCustomPoints(trial.custom_points);
    } else {
      points = this.getCalibrationPoints(trial.calibration_points as 5 | 9);
    }

    // Start calibration on server
    await tobiiExt.startCalibration();

    // Initialize point at screen center (with brief pause)
    await calibrationDisplay.initializePoint();

    // Show each point and collect calibration data with smooth path animation
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // Travel to the point location (smooth animation from current position)
      await calibrationDisplay.travelToPoint(point, i, points.length);

      // Zoom out (point grows larger to attract attention)
      await calibrationDisplay.playZoomOut();

      // Zoom in (point shrinks to fixation size)
      await calibrationDisplay.playZoomIn();

      if (trial.calibration_mode === "click") {
        // Wait for user to click
        await calibrationDisplay.waitForClick();
      } else {
        // Wait for user to fixate on the point
        await this.delay(trial.point_duration);
      }

      // Collect calibration data for this point (blocks until SDK finishes)
      const result = await tobiiExt.collectCalibrationPoint(point.x, point.y);

      // Play explosion animation based on result
      await calibrationDisplay.playExplosion(result.success);

      // Reset point for next travel (don't remove element)
      if (i < points.length - 1) {
        await calibrationDisplay.resetPointAfterExplosion();
      }
    }

    // Hide point after final explosion
    await calibrationDisplay.hidePoint();

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
   * Validate custom calibration points
   */
  private validateCustomPoints(points: any[]): CalibrationPoint[] {
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error("custom_points must be a non-empty array");
    }

    const validated: CalibrationPoint[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (
        typeof point !== "object" ||
        point === null ||
        typeof point.x !== "number" ||
        typeof point.y !== "number"
      ) {
        throw new Error(`Invalid calibration point at index ${i}: must have numeric x and y`);
      }
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
        throw new Error(`Calibration point at index ${i} out of range: x and y must be between 0 and 1`);
      }
      validated.push({ x: point.x, y: point.y });
    }

    return validated;
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

export default TobiiCalibrationPlugin;
