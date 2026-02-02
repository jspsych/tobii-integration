/**
 * Type definitions for calibration plugin
 */

export interface CalibrationPoint {
  x: number;
  y: number;
}

export interface CalibrationParameters {
  /** Number of calibration points (5 or 9) */
  calibration_points?: 5 | 9;
  /** Calibration mode: click to advance or view for fixed duration */
  calibration_mode?: 'click' | 'view';
  /** Size of calibration point in pixels */
  point_size?: number;
  /** Color of calibration point */
  point_color?: string;
  /** Duration to show each point before data collection (ms) - allows user to fixate */
  point_duration?: number;
  /** Duration to collect data at each point (ms) */
  collection_duration?: number;
  /** Gap duration between points (ms) - blank screen before next point appears */
  gap_duration?: number;
  /** Show progress indicator */
  show_progress?: boolean;
  /** Custom calibration points (overrides calibration_points) */
  custom_points?: CalibrationPoint[];
  /** Animation style for point appearance */
  animation?: 'none' | 'pulse' | 'shrink';
  /** Instructions text */
  instructions?: string;
  /** Button text for click mode */
  button_text?: string;
}
