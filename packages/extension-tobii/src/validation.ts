/**
 * Data validation utilities
 */

import type { GazeData, CalibrationPoint, CalibrationResult, ValidationResult } from './types';

/**
 * Validate gaze data point
 */
export function validateGazeData(data: unknown): data is GazeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.x === 'number' &&
    typeof data.y === 'number' &&
    typeof data.timestamp === 'number' &&
    !isNaN(data.x) &&
    !isNaN(data.y) &&
    !isNaN(data.timestamp)
  );
}

/**
 * Validate calibration point
 */
export function validateCalibrationPoint(point: unknown): point is CalibrationPoint {
  return (
    typeof point === 'object' &&
    point !== null &&
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

/**
 * Filter invalid gaze data
 */
export function filterValidGaze(data: GazeData[]): GazeData[] {
  return data.filter(validateGazeData);
}

/**
 * Validate that a server response conforms to CalibrationResult
 */
export function validateCalibrationResult(data: unknown): data is CalibrationResult {
  return typeof data === 'object' && data !== null && typeof data.success === 'boolean';
}

/**
 * Validate that a server response conforms to ValidationResult
 */
export function validateValidationResult(data: unknown): data is ValidationResult {
  return typeof data === 'object' && data !== null && typeof data.success === 'boolean';
}

/**
 * Check if gaze data is within screen bounds
 */
export function isGazeInBounds(data: GazeData, normalized: boolean = true): boolean {
  if (normalized) {
    return data.x >= 0 && data.x <= 1 && data.y >= 0 && data.y <= 1;
  }
  return true; // Pixel coordinates are assumed valid
}
