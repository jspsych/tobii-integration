/**
 * @title Tobii Validation
 * @description jsPsych plugin for Tobii eye tracker validation. Validates calibration
 * accuracy by measuring gaze error at target points and provides detailed feedback.
 * @version 1.0.0
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/plugin-tobii-validation#readme Documentation}
 */

import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from 'jspsych';
import { version } from '../package.json';
import type TobiiExtension from '@jspsych/extension-tobii';
import type { ValidationResult } from '@jspsych/extension-tobii';
import { ValidationDisplay } from './validation-display';
import type { ValidationParameters, ValidationPoint } from './types';

const info = <const>{
  name: 'tobii-validation',
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
      default: '#00ff00',
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
      default: 'Look at each point as it appears on the screen to validate calibration accuracy.',
    },
    /** Background color of the validation container */
    background_color: {
      type: ParameterType.STRING,
      default: '#808080',
    },
    /** Primary button color */
    button_color: {
      type: ParameterType.STRING,
      default: '#28a745',
    },
    /** Primary button hover color */
    button_hover_color: {
      type: ParameterType.STRING,
      default: '#218838',
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
    /** Good accuracy color */
    accuracy_good_color: {
      type: ParameterType.STRING,
      default: '#00ff00',
    },
    /** Fair accuracy color */
    accuracy_fair_color: {
      type: ParameterType.STRING,
      default: '#ffff00',
    },
    /** Poor accuracy color */
    accuracy_poor_color: {
      type: ParameterType.STRING,
      default: '#ff0000',
    },
    /** Normalized tolerance for acceptable accuracy (0-1 scale, validation passes if average error <= this) */
    tolerance: {
      type: ParameterType.FLOAT,
      default: 0.05,
    },
    /** Maximum number of retry attempts allowed on validation failure */
    max_retries: {
      type: ParameterType.INT,
      default: 1,
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
    /** Number of validation attempts made */
    num_attempts: {
      type: ParameterType.INT,
    },
  },
};

type Info = typeof info;

class TobiiValidationPlugin implements JsPsychPlugin<Info> {
  static info = info;
  private static styleInjected = false;

  constructor(private jsPsych: JsPsych) {}

  private static removeStyles(): void {
    const el = document.getElementById('tobii-validation-styles');
    if (el) {
      el.remove();
    }
    TobiiValidationPlugin.styleInjected = false;
  }

  private injectStyles(trial: TrialType<Info>): void {
    // Only inject once per page
    if (TobiiValidationPlugin.styleInjected) {
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
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
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
      }

      .tobii-validation-point.animation-zoom-out {
        animation: tobii-validation-zoom-out 0.3s ease-out forwards;
      }

      @keyframes tobii-validation-zoom-out {
        0% {
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          transform: translate(-50%, -50%) scale(2.5);
        }
      }

      .tobii-validation-point.animation-zoom-in {
        animation: tobii-validation-zoom-in 0.3s ease-out forwards;
      }

      @keyframes tobii-validation-zoom-in {
        0% {
          transform: translate(-50%, -50%) scale(2.5);
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
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
        padding: 30px 40px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        width: 60vw;
        max-width: 800px;
        max-height: 85vh;
        overflow-y: auto;
      }

      .tobii-validation-result-content h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 24px;
      }

      .tobii-validation-result-content.success h2 {
        color: ${trial.success_color};
      }

      .tobii-validation-result-content.error h2 {
        color: ${trial.error_color};
      }

      .tobii-validation-result-content p {
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

      .target-legend {
        background-color: transparent;
        border: 3px solid #333;
      }

      .feedback-canvas-fullscreen {
        position: relative;
        width: 100%;
        background-color: #2a2a2a;
        border: 2px solid #444;
        border-radius: 5px;
        margin-bottom: 15px;
        overflow: hidden;
      }

      .feedback-target {
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 3px solid #fff;
        background-color: transparent;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .target-label {
        color: #fff;
        font-size: 10px;
        font-weight: bold;
      }

      .feedback-gaze {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid;
        z-index: 11;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: help;
      }

      .gaze-label {
        color: #000;
        font-size: 9px;
        font-weight: bold;
      }

      .feedback-sample {
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(100, 100, 255, 0.4);
        z-index: 5;
      }

      .accuracy-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        font-size: 13px;
        text-align: left;
      }

      .accuracy-table th,
      .accuracy-table td {
        padding: 8px 12px;
        border: 1px solid #ddd;
      }

      .accuracy-table th {
        background-color: #f5f5f5;
        font-weight: 600;
        color: #333;
      }

      .accuracy-table tr:nth-child(even) {
        background-color: #fafafa;
      }

      .accuracy-table td {
        color: #555;
      }

      .saccade-note {
        font-size: 12px;
        color: #888;
        font-style: italic;
        margin-top: 10px;
      }

      .tolerance-info {
        font-size: 14px;
        color: #666;
      }

      .gaze-pass-legend {
        background-color: #4ade80;
      }

      .gaze-fail-legend {
        background-color: #f87171;
      }

      .feedback-gaze.gaze-pass {
        background-color: #4ade80;
        border-color: #22c55e;
      }

      .feedback-gaze.gaze-fail {
        background-color: #f87171;
        border-color: #ef4444;
      }

      .feedback-sample.sample-pass {
        background-color: rgba(74, 222, 128, 0.5);
      }

      .feedback-sample.sample-fail {
        background-color: rgba(248, 113, 113, 0.5);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'tobii-validation-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    TobiiValidationPlugin.styleInjected = true;
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

    // Create validation display
    const validationDisplay = new ValidationDisplay(
      display_element,
      trial as unknown as ValidationParameters
    );

    // Show instructions (only once, before retry loop)
    await validationDisplay.showInstructions();

    // Get validation points and validate custom points
    let points: ValidationPoint[];
    if (trial.custom_points) {
      points = this.validateCustomPoints(trial.custom_points);
    } else {
      points = this.getValidationPoints(trial.validation_points);
    }

    const maxAttempts = 1 + (trial.max_retries as number);
    let attempt = 0;
    let validationPassed = false;
    let avgAccuracyNorm = 0;
    let avgPrecisionNorm = 0;
    let validationResult: ValidationResult = { success: false };

    // Retry loop
    while (attempt < maxAttempts) {
      attempt++;
      const retriesRemaining = maxAttempts - attempt;

      // Start validation on server (resets server-side state on each call)
      await tobiiExt.startValidation();

      // Start tracking to collect gaze data
      await tobiiExt.startTracking();

      // Initialize point at screen center (with brief pause)
      await validationDisplay.initializePoint();

      // Show each point and collect validation data with smooth path animation
      for (let i = 0; i < points.length; i++) {
        const point = points[i];

        // Travel to the point location (smooth animation from current position)
        await validationDisplay.travelToPoint(point, i, points.length);

        // Zoom out (point grows larger to attract attention)
        await validationDisplay.playZoomOut();

        // Zoom in (point shrinks to fixation size)
        await validationDisplay.playZoomIn();

        // Capture start time before collection period for precise time-range query
        const collectionStartTime = performance.now();

        // Wait for data collection
        await this.delay(trial.collection_duration);

        // Capture end time after collection period
        const collectionEndTime = performance.now();

        // Get gaze samples collected during exactly this point's display period
        const gazeSamples = await tobiiExt.getGazeData(collectionStartTime, collectionEndTime);

        // Collect validation data for this point with the gaze samples
        await tobiiExt.collectValidationPoint(point.x, point.y, gazeSamples);

        // Reset point for next travel (don't remove element)
        if (i < points.length - 1) {
          await validationDisplay.resetPointForTravel();
        }
      }

      // Hide point after final data collection
      await validationDisplay.hidePoint();

      // Stop tracking
      await tobiiExt.stopTracking();

      // Compute validation on server
      validationResult = await tobiiExt.computeValidation();

      // Get normalized accuracy values from server
      avgAccuracyNorm = validationResult.averageAccuracyNorm || 0;
      avgPrecisionNorm = validationResult.averagePrecisionNorm || 0;

      // Determine if validation passes based on normalized tolerance
      validationPassed = validationResult.success && avgAccuracyNorm <= trial.tolerance;

      // Show result with retry option if retries remain
      const userChoice = await validationDisplay.showResult(
        validationPassed,
        avgAccuracyNorm,
        avgPrecisionNorm,
        validationResult.pointData || [],
        trial.tolerance,
        retriesRemaining > 0
      );

      if (userChoice === 'continue') {
        break;
      }

      // User chose retry — reset display for next attempt
      validationDisplay.resetForRetry();
    }

    // Clear display and remove injected styles
    validationDisplay.clear();
    display_element.innerHTML = '';
    TobiiValidationPlugin.removeStyles();

    // Finish trial
    const trial_data = {
      validation_success: validationPassed,
      average_accuracy_norm: avgAccuracyNorm,
      average_precision_norm: avgPrecisionNorm,
      tolerance: trial.tolerance,
      num_points: points.length,
      validation_data: validationResult,
      num_attempts: attempt,
    };

    this.jsPsych.finishTrial(trial_data);
  }

  /**
   * Validate custom validation points
   */
  private validateCustomPoints(points: unknown[]): ValidationPoint[] {
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error('custom_points must be a non-empty array');
    }

    const validated: ValidationPoint[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i] as Record<string, unknown>;
      if (
        typeof point !== 'object' ||
        point === null ||
        typeof point.x !== 'number' ||
        typeof point.y !== 'number'
      ) {
        throw new Error(`Invalid validation point at index ${i}: must have numeric x and y`);
      }
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
        throw new Error(
          `Validation point at index ${i} out of range: x and y must be between 0 and 1`
        );
      }
      validated.push({ x: point.x, y: point.y });
    }

    return validated;
  }

  /**
   * Get standard validation points for the given grid size
   */
  private getValidationPoints(count: number): ValidationPoint[] {
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
          `Unsupported validation_points value: ${count}. Use 5, 9, 13, 15, 19, or 25, or provide custom_points.`
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

export default TobiiValidationPlugin;
