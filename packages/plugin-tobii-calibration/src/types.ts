/**
 * Type definitions for calibration plugin
 */

export interface CalibrationPoint {
  x: number;
  y: number;
}

export interface CalibrationParameters {
  /** Number of calibration points */
  calibration_points?: 5 | 9 | 13 | 15 | 19 | 25;
  /** Calibration mode: click to advance or view for fixed duration */
  calibration_mode?: 'click' | 'view';
  /** Size of calibration point in pixels */
  point_size?: number;
  /** Color of calibration point */
  point_color?: string;
  /** Duration to show each point before data collection (ms) - allows user to fixate */
  point_duration?: number;
  /** Show progress indicator */
  show_progress?: boolean;
  /** Custom calibration points (overrides calibration_points) */
  custom_points?: CalibrationPoint[];
  /** Instructions text */
  instructions?: string;
  /** Button text for click mode */
  button_text?: string;
  /** Background color of the calibration container */
  background_color?: string;
  /** Primary button color */
  button_color?: string;
  /** Primary button hover color */
  button_hover_color?: string;
  /** Retry button color */
  retry_button_color?: string;
  /** Retry button hover color */
  retry_button_hover_color?: string;
  /** Success message color */
  success_color?: string;
  /** Error message color */
  error_color?: string;
  /** Maximum number of retry attempts allowed on calibration failure */
  max_retries?: number;
  /** Duration of zoom in/out animations in ms */
  zoom_duration?: number;
  /** Duration of explosion animation in ms */
  explosion_duration?: number;
  /** Duration to show success result before auto-advancing in ms */
  success_display_duration?: number;
  /** Duration to show instructions before auto-advancing in view mode in ms */
  instruction_display_duration?: number;
}
