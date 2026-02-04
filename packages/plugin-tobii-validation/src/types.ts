/**
 * Type definitions for validation plugin
 */

export interface ValidationPoint {
  x: number;
  y: number;
}

export interface ValidationParameters {
  /** Number of validation points */
  validation_points?: 5 | 9 | 13 | 15 | 19 | 25;
  /** Size of validation point in pixels */
  point_size?: number;
  /** Color of validation point */
  point_color?: string;
  /** Duration to collect data at each point (ms) */
  collection_duration?: number;
  /** Show progress indicator */
  show_progress?: boolean;
  /** Custom validation points (overrides validation_points) */
  custom_points?: ValidationPoint[];
  /** Show visual feedback after validation */
  show_feedback?: boolean;
  /** Instructions text */
  instructions?: string;
  /** Background color of the validation container */
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
  /** Normalized tolerance for acceptable accuracy (0-1 scale) */
  tolerance?: number;
  /** Maximum number of retry attempts allowed on validation failure */
  max_retries?: number;
}

export interface GazeSample {
  x: number;
  y: number;
}

export interface PointValidationData {
  point: ValidationPoint;
  accuracyNorm: number;
  precisionNorm: number;
  meanGaze?: { x: number; y: number };
  numSamples?: number;
  numSamplesTotal?: number;
  numSamplesSkipped?: number;
  gazeSamples?: GazeSample[];
}
