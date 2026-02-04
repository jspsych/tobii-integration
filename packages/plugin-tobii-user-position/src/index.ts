/**
 * @title Tobii User Position
 * @description jsPsych plugin for Tobii eye tracker user position guide. Displays real-time
 * head position feedback to help participants maintain optimal positioning for eye tracking.
 * @version 1.0.0
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/plugin-tobii-user-position#readme Documentation}
 */

import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from 'jspsych';
import { version } from '../package.json';
import type TobiiExtension from '@jspsych/extension-tobii';
import { PositionDisplay } from './position-display';
import type { PositionQuality } from './types';

const info = <const>{
  name: 'tobii-user-position',
  version: version,
  parameters: {
    /** Duration to show the position guide (ms), null for manual */
    duration: {
      type: ParameterType.INT,
      default: null,
    },
    /** Message to display */
    message: {
      type: ParameterType.STRING,
      default: 'Please position yourself so the indicators are green',
    },
    /** Update interval (ms) */
    update_interval: {
      type: ParameterType.INT,
      default: 100,
    },
    /** Show distance feedback */
    show_distance_feedback: {
      type: ParameterType.BOOL,
      default: true,
    },
    /** Show position feedback */
    show_position_feedback: {
      type: ParameterType.BOOL,
      default: true,
    },
    /** Button text for manual continuation */
    button_text: {
      type: ParameterType.STRING,
      default: 'Continue',
    },
    /** Only show button when position is good */
    require_good_position: {
      type: ParameterType.BOOL,
      default: false,
    },
    /** Background color */
    background_color: {
      type: ParameterType.STRING,
      default: '#f0f0f0',
    },
    /** Good position color */
    good_color: {
      type: ParameterType.STRING,
      default: '#28a745',
    },
    /** Fair position color */
    fair_color: {
      type: ParameterType.STRING,
      default: '#ffc107',
    },
    /** Poor position color */
    poor_color: {
      type: ParameterType.STRING,
      default: '#dc3545',
    },
    /** Button color */
    button_color: {
      type: ParameterType.STRING,
      default: '#007bff',
    },
    /** Button hover color */
    button_hover_color: {
      type: ParameterType.STRING,
      default: '#0056b3',
    },
    /** Font size */
    font_size: {
      type: ParameterType.STRING,
      default: '18px',
    },
    /** Position offset threshold for "good" status (normalized, default 0.15) */
    position_threshold_good: {
      type: ParameterType.FLOAT,
      default: 0.15,
    },
    /** Position offset threshold for "fair" status (normalized, default 0.25) */
    position_threshold_fair: {
      type: ParameterType.FLOAT,
      default: 0.25,
    },
    /** Distance offset threshold for "good" status (normalized, default 0.1) */
    distance_threshold_good: {
      type: ParameterType.FLOAT,
      default: 0.1,
    },
    /** Distance offset threshold for "fair" status (normalized, default 0.2) */
    distance_threshold_fair: {
      type: ParameterType.FLOAT,
      default: 0.2,
    },
  },
  data: {
    /** Average X position during trial */
    average_x: {
      type: ParameterType.FLOAT,
    },
    /** Average Y position during trial */
    average_y: {
      type: ParameterType.FLOAT,
    },
    /** Average Z position (distance) during trial */
    average_z: {
      type: ParameterType.FLOAT,
    },
    /** Whether position was good at end */
    position_good: {
      type: ParameterType.BOOL,
    },
    /** Horizontal position status */
    horizontal_status: {
      type: ParameterType.STRING,
    },
    /** Vertical position status */
    vertical_status: {
      type: ParameterType.STRING,
    },
    /** Distance status */
    distance_status: {
      type: ParameterType.STRING,
    },
    /** Duration of trial */
    rt: {
      type: ParameterType.INT,
    },
  },
};

type Info = typeof info;

class TobiiUserPositionPlugin implements JsPsychPlugin<Info> {
  static info = info;
  private static styleInjected = false;

  constructor(private jsPsych: JsPsych) {}

  private static removeStyles(): void {
    const el = document.getElementById('tobii-user-position-styles');
    if (el) {
      el.remove();
    }
    TobiiUserPositionPlugin.styleInjected = false;
  }

  private injectStyles(trial: TrialType<Info>): void {
    if (TobiiUserPositionPlugin.styleInjected) {
      return;
    }

    const css = `
      .tobii-user-position-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100vh;
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        font-size: ${trial.font_size};
      }

      .tobii-user-position-message {
        margin-bottom: 40px;
        text-align: center;
        font-weight: 500;
        color: #333;
      }

      .tobii-user-position-guide {
        position: relative;
        margin-bottom: 40px;
      }

      .tobii-position-feedback {
        text-align: center;
        margin-bottom: 30px;
        font-weight: 600;
        font-size: 1.1em;
      }

      .tobii-user-position-button {
        padding: 12px 32px;
        font-size: 16px;
        font-weight: 500;
        border: none;
        border-radius: 6px;
        background-color: ${trial.button_color};
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .tobii-user-position-button:hover:not(:disabled) {
        background-color: ${trial.button_hover_color};
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transform: translateY(-1px);
      }

      .tobii-user-position-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .tobii-center-marker {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 30px;
        height: 30px;
        border: 2px dashed #666;
        border-radius: 50%;
        opacity: 0.5;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'tobii-user-position-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    TobiiUserPositionPlugin.styleInjected = true;
  }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    return new Promise<void>((resolve) => {
      // Inject CSS
      this.injectStyles(trial);

      // Check for Tobii extension
      const tobiiExtension = this.jsPsych.extensions.tobii as unknown as TobiiExtension;
      if (!tobiiExtension) {
        throw new Error('Tobii extension not loaded');
      }

      // Create container
      display_element.innerHTML = `
        <div class="tobii-user-position-container">
        </div>
      `;

      const container = display_element.querySelector(
        '.tobii-user-position-container'
      ) as HTMLElement;

      // Create position display
      const positionDisplay = new PositionDisplay(container, {
        message: trial.message!,
        showDistanceFeedback: trial.show_distance_feedback!,
        showPositionFeedback: trial.show_position_feedback!,
        backgroundColor: trial.background_color!,
        goodColor: trial.good_color!,
        fairColor: trial.fair_color!,
        poorColor: trial.poor_color!,
        fontSize: trial.font_size!,
        positionThresholdGood: trial.position_threshold_good!,
        positionThresholdFair: trial.position_threshold_fair!,
        distanceThresholdGood: trial.distance_threshold_good!,
        distanceThresholdFair: trial.distance_threshold_fair!,
      });

      // Add continue button if no duration specified
      let continueButton: HTMLButtonElement | null = null;
      if (trial.duration === null) {
        continueButton = document.createElement('button');
        continueButton.className = 'tobii-user-position-button';
        continueButton.textContent = trial.button_text!;
        if (trial.require_good_position) {
          continueButton.disabled = true;
        }
        container.appendChild(continueButton);
      }

      // Track position data
      const positionSamples: PositionQuality[] = [];
      const startTime = performance.now();

      // Update position display periodically
      const updateInterval = setInterval(async () => {
        try {
          const positionData = await tobiiExtension.getUserPosition();
          positionDisplay.updatePosition(positionData);

          // Track position quality
          const quality = positionDisplay.getCurrentQuality(positionData);
          positionSamples.push(quality);

          // Update button state if required
          if (continueButton && trial.require_good_position) {
            continueButton.disabled = !quality.isGoodPosition;
          }
        } catch (error) {
          console.error('Error updating user position:', error);
        }
      }, trial.update_interval!);

      // Handle trial end
      const endTrial = () => {
        clearInterval(updateInterval);

        // Calculate average position
        const validSamples = positionSamples.filter(
          (s) => s.averageX !== null && s.averageY !== null && s.averageZ !== null
        );

        let averageX = null;
        let averageY = null;
        let averageZ = null;
        let finalQuality: PositionQuality | null = null;

        if (validSamples.length > 0) {
          averageX = validSamples.reduce((sum, s) => sum + s.averageX!, 0) / validSamples.length;
          averageY = validSamples.reduce((sum, s) => sum + s.averageY!, 0) / validSamples.length;
          averageZ = validSamples.reduce((sum, s) => sum + s.averageZ!, 0) / validSamples.length;
          finalQuality = positionSamples[positionSamples.length - 1];
        }

        const trialData = {
          average_x: averageX,
          average_y: averageY,
          average_z: averageZ,
          position_good: finalQuality?.isGoodPosition ?? false,
          horizontal_status: finalQuality?.horizontalStatus ?? 'poor',
          vertical_status: finalQuality?.verticalStatus ?? 'poor',
          distance_status: finalQuality?.distanceStatus ?? 'poor',
          rt: Math.round(performance.now() - startTime),
        };

        positionDisplay.destroy();
        TobiiUserPositionPlugin.removeStyles();
        this.jsPsych.finishTrial(trialData);
        resolve();
      };

      // Set up continue button
      if (continueButton) {
        continueButton.addEventListener('click', endTrial);
      }

      // Set up duration timeout
      if (trial.duration != null) {
        this.jsPsych.pluginAPI.setTimeout(endTrial, trial.duration);
      }
    });
  }
}

export default TobiiUserPositionPlugin;
