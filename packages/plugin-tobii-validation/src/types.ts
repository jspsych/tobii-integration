/**
 * Type definitions for validation plugin
 */

export interface ValidationPoint {
  x: number;
  y: number;
}

export interface ValidationParameters {
  /** Number of validation points (5 or 9) */
  validation_points?: 5 | 9;
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
}

export interface PointValidationData {
  point: ValidationPoint;
  accuracy: number;
  precision: number;
}
