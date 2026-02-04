/**
 * Data validation utilities
 */

import type { GazeData, CalibrationPoint, CalibrationResult, ValidationResult } from './types';

/**
 * Validate gaze data point
 */
export function validateGazeData(data: unknown): data is GazeData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.x === 'number' &&
    typeof d.y === 'number' &&
    typeof d.timestamp === 'number' &&
    !isNaN(d.x) &&
    !isNaN(d.y) &&
    !isNaN(d.timestamp)
  );
}

/**
 * Validate calibration point
 */
export function validateCalibrationPoint(point: unknown): point is CalibrationPoint {
  if (typeof point !== 'object' || point === null) return false;
  const p = point as Record<string, unknown>;
  return (
    typeof p.x === 'number' &&
    typeof p.y === 'number' &&
    p.x >= 0 &&
    p.x <= 1 &&
    p.y >= 0 &&
    p.y <= 1
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
  if (typeof data !== 'object' || data === null) return false;
  return typeof (data as Record<string, unknown>).success === 'boolean';
}

/**
 * Validate that a server response conforms to ValidationResult
 */
export function validateValidationResult(data: unknown): data is ValidationResult {
  if (typeof data !== 'object' || data === null) return false;
  return typeof (data as Record<string, unknown>).success === 'boolean';
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
