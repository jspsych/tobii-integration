/**
 * @title Tobii Calibration
 * @description jsPsych plugin for Tobii eye tracker calibration. Provides a visual
 * calibration procedure with animated points and real-time feedback.
 * @version 1.0.0
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/plugin-tobii-calibration#readme Documentation}
 */

import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from 'jspsych';
import { version } from '../package.json';
import type TobiiExtension from '@jspsych/extension-tobii';
import type { CalibrationResult } from '@jspsych/extension-tobii';
import { CalibrationDisplay } from './calibration-display';
import type { CalibrationParameters, CalibrationPoint } from './types';

const info = <const>{
  name: 'tobii-calibration',
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
      default: 'view',
    },
    /** Size of calibration points in pixels */
    point_size: {
      type: ParameterType.INT,
      default: 20,
    },
    /** Color of calibration points */
    point_color: {
      type: ParameterType.STRING,
      default: '#ff0000',
    },
    /** Duration to show each point before data collection (ms) - allows user to fixate */
    point_duration: {
      type: ParameterType.INT,
      default: 500,
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
    /** Instructions text */
    instructions: {
      type: ParameterType.STRING,
      default:
        'Look at each point as it appears on the screen. Keep your gaze fixed on each point until it disappears.',
    },
    /** Button text for click mode */
    button_text: {
      type: ParameterType.STRING,
      default: 'Start Calibration',
    },
    /** Background color of the calibration container */
    background_color: {
      type: ParameterType.STRING,
      default: '#808080',
    },
    /** Primary button color */
    button_color: {
      type: ParameterType.STRING,
      default: '#007bff',
    },
    /** Primary button hover color */
    button_hover_color: {
      type: ParameterType.STRING,
      default: '#0056b3',
    },
    /** Retry button color */
    retry_button_color: {
      type: ParameterType.STRING,
      default: '#dc3545',
    },
    /** Retry button hover color */
    retry_button_hover_color: {
      type: ParameterType.STRING,
      default: '#c82333',
    },
    /** Success message color */
    success_color: {
      type: ParameterType.STRING,
      default: '#28a745',
    },
    /** Error message color */
    error_color: {
      type: ParameterType.STRING,
      default: '#dc3545',
    },
    /** Maximum number of retry attempts allowed on calibration failure */
    max_retries: {
      type: ParameterType.INT,
      default: 1,
    },
    /** Duration of zoom in/out animations in ms */
    zoom_duration: {
      type: ParameterType.INT,
      default: 300,
    },
    /** Duration of explosion animation in ms */
    explosion_duration: {
      type: ParameterType.INT,
      default: 400,
    },
    /** Duration to show success result before auto-advancing in ms */
    success_display_duration: {
      type: ParameterType.INT,
      default: 2000,
    },
    /** Duration to show instructions before auto-advancing in view mode in ms */
    instruction_display_duration: {
      type: ParameterType.INT,
      default: 3000,
    },
  },
  data: {
    /** Calibration success status */
    calibration_success: {
      type: ParameterType.BOOL,
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
    /** Number of calibration attempts made */
    num_attempts: {
      type: ParameterType.INT,
    },
  },
};

type Info = typeof info;

class TobiiCalibrationPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  private static removeStyles(): void {
    const el = document.getElementById('tobii-calibration-styles');
    if (el) {
      el.remove();
    }
  }

  private injectStyles(trial: TrialType<Info>): void {
    // Remove existing styles so each trial gets its own colors
    TobiiCalibrationPlugin.removeStyles();

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
        animation: tobii-calibration-explosion ${(trial.explosion_duration as number) / 1000}s ease-out forwards;
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
        animation: tobii-calibration-zoom-out ${(trial.zoom_duration as number) / 1000}s ease-out forwards;
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
        animation: tobii-calibration-zoom-in ${(trial.zoom_duration as number) / 1000}s ease-out forwards;
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

      .tobii-calibration-result-content h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 24px;
      }

      .tobii-calibration-result-content.success h2 {
        color: ${trial.success_color};
      }

      .tobii-calibration-result-content.error h2 {
        color: ${trial.error_color};
      }

      .tobii-calibration-result-content p {
        margin-bottom: 20px;
        font-size: 16px;
        color: #666;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'tobii-calibration-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  async trial(display_element: HTMLElement, trial: TrialType<Info>): Promise<void> {
    // Inject styles
    this.injectStyles(trial);
    // Get extension instance
    const tobiiExt = this.jsPsych.extensions.tobii as unknown as TobiiExtension;

    if (!tobiiExt) {
      throw new Error('Tobii extension not initialized');
    }

    // Check connection
    if (!tobiiExt.isConnected()) {
      throw new Error('Not connected to Tobii server');
    }

    // Create calibration display
    const calibrationDisplay = new CalibrationDisplay(
      display_element,
      trial as unknown as CalibrationParameters
    );

    // Show instructions (only once, before retry loop)
    await calibrationDisplay.showInstructions();

    // Get calibration points and validate custom points
    let points: CalibrationPoint[];
    if (trial.custom_points) {
      points = this.validateCustomPoints(trial.custom_points);
    } else {
      points = this.getCalibrationPoints(trial.calibration_points!);
    }

    const maxAttempts = 1 + (trial.max_retries as number);
    let attempt = 0;
    let calibrationResult: CalibrationResult = { success: false };

    try {
      // Retry loop
      while (attempt < maxAttempts) {
        attempt++;
        const retriesRemaining = maxAttempts - attempt;

        // Start calibration on server (resets server-side state on each call)
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

          if (trial.calibration_mode === 'click') {
            // Wait for user to click
            await calibrationDisplay.waitForClick();
          } else {
            // Wait for user to fixate on the point
            await this.delay(trial.point_duration!);
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
        calibrationResult = await tobiiExt.computeCalibration();

        // Show result with retry option if retries remain
        const userChoice = await calibrationDisplay.showResult(
          calibrationResult.success,
          retriesRemaining > 0
        );

        if (userChoice === 'continue') {
          break;
        }

        // User chose retry — reset display for next attempt
        calibrationDisplay.resetForRetry();
      }
    } finally {
      // Clear display and remove injected styles
      calibrationDisplay.clear();
      display_element.innerHTML = '';
      TobiiCalibrationPlugin.removeStyles();
    }

    // Finish trial
    const trial_data = {
      calibration_success: calibrationResult.success,
      num_points: points.length,
      mode: trial.calibration_mode,
      calibration_data: calibrationResult,
      num_attempts: attempt,
    };

    this.jsPsych.finishTrial(trial_data);
  }

  /**
   * Validate custom calibration points
   */
  private validateCustomPoints(points: unknown[]): CalibrationPoint[] {
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error('custom_points must be a non-empty array');
    }

    const validated: CalibrationPoint[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (typeof point !== 'object' || point === null) {
        throw new Error(`Invalid calibration point at index ${i}: must have numeric x and y`);
      }
      const p = point as Record<string, unknown>;
      if (typeof p.x !== 'number' || typeof p.y !== 'number') {
        throw new Error(`Invalid calibration point at index ${i}: must have numeric x and y`);
      }
      if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
        throw new Error(
          `Calibration point at index ${i} out of range: x and y must be between 0 and 1`
        );
      }
      validated.push({ x: p.x, y: p.y });
    }

    return validated;
  }

  /**
   * Get standard calibration points for the given grid size
   */
  private getCalibrationPoints(count: number): CalibrationPoint[] {
    switch (count) {
      case 5:
        return [
          { x: 0.1, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.5, y: 0.5 },
          { x: 0.1, y: 0.9 },
          { x: 0.9, y: 0.9 },
        ];
      case 9:
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
      case 13:
        // 3x3 outer grid + 4 diagonal midpoints
        return [
          { x: 0.1, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.3, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.3, y: 0.7 },
          { x: 0.7, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.9, y: 0.9 },
        ];
      case 15:
        // 5 rows x 3 columns
        return [
          { x: 0.1, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.1, y: 0.3 },
          { x: 0.5, y: 0.3 },
          { x: 0.9, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.1, y: 0.7 },
          { x: 0.5, y: 0.7 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.9, y: 0.9 },
        ];
      case 19:
        // Symmetric 3-5-3-5-3 pattern
        return [
          { x: 0.1, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.1, y: 0.3 },
          { x: 0.3, y: 0.3 },
          { x: 0.5, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.9, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.1, y: 0.7 },
          { x: 0.3, y: 0.7 },
          { x: 0.5, y: 0.7 },
          { x: 0.7, y: 0.7 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.9, y: 0.9 },
        ];
      case 25:
        // 5x5 full grid
        return [
          { x: 0.1, y: 0.1 },
          { x: 0.3, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.7, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.1, y: 0.3 },
          { x: 0.3, y: 0.3 },
          { x: 0.5, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.9, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.3, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.7, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.1, y: 0.7 },
          { x: 0.3, y: 0.7 },
          { x: 0.5, y: 0.7 },
          { x: 0.7, y: 0.7 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.3, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.7, y: 0.9 },
          { x: 0.9, y: 0.9 },
        ];
      default:
        throw new Error(
          `Unsupported calibration_points value: ${count}. Use 5, 9, 13, 15, 19, or 25, or provide custom_points.`
        );
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
