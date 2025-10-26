/**
 * Type definitions for Tobii extension
 */

/**
 * Connection configuration options
 */
export interface ConnectionConfig {
  /** WebSocket server URL */
  url?: string;
  /** Automatically connect on initialization */
  autoConnect?: boolean;
  /** Number of reconnection attempts */
  reconnectAttempts?: number;
  /** Delay between reconnection attempts in ms */
  reconnectDelay?: number;
}

/**
 * Sampling configuration options
 */
export interface SamplingConfig {
  /** Sampling rate in Hz */
  rate?: number;
}

/**
 * Data configuration options
 */
export interface DataConfig {
  /** Include raw eye tracking samples in trial data */
  includeRawSamples?: boolean;
  /** Coordinate system for gaze data */
  coordinateSystem?: "pixels" | "normalized";
}

/**
 * Extension initialization parameters
 */
export interface InitializeParameters {
  /** Connection settings */
  connection?: ConnectionConfig;
  /** Sampling settings */
  sampling?: SamplingConfig;
  /** Data settings */
  data?: DataConfig;
}

/**
 * Trial start parameters
 */
export interface OnStartParameters {
  /** Trial ID or index */
  trialId?: string | number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Trial finish parameters
 */
export interface OnFinishParameters {
  /** Trial ID or index */
  trialId?: string | number;
}

/**
 * Gaze data point
 */
export interface GazeData {
  /** X coordinate (normalized 0-1 or pixels depending on config) */
  x: number;
  /** Y coordinate (normalized 0-1 or pixels depending on config) */
  y: number;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Left eye validity */
  leftValid?: boolean;
  /** Right eye validity */
  rightValid?: boolean;
  /** Pupil diameter (left eye) */
  leftPupilDiameter?: number;
  /** Pupil diameter (right eye) */
  rightPupilDiameter?: number;
}

/**
 * Calibration point
 */
export interface CalibrationPoint {
  /** X coordinate (normalized 0-1) */
  x: number;
  /** Y coordinate (normalized 0-1) */
  y: number;
}

/**
 * Calibration result
 */
export interface CalibrationResult {
  /** Success status */
  success: boolean;
  /** Average error in degrees */
  averageError?: number;
  /** Per-point calibration quality */
  pointQuality?: Array<{
    point: CalibrationPoint;
    error: number;
  }>;
  /** Error message if failed */
  error?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Success status */
  success: boolean;
  /** Average accuracy in degrees */
  averageAccuracy?: number;
  /** Average precision in degrees */
  averagePrecision?: number;
  /** Per-point validation data */
  pointData?: Array<{
    point: CalibrationPoint;
    accuracy: number;
    precision: number;
  }>;
  /** Error message if failed */
  error?: string;
}

/**
 * WebSocket message types
 */
export type MessageType =
  | "connect"
  | "disconnect"
  | "start_tracking"
  | "stop_tracking"
  | "calibration_start"
  | "calibration_point"
  | "calibration_compute"
  | "get_calibration_data"
  | "validation_start"
  | "validation_point"
  | "validation_compute"
  | "get_current_gaze"
  | "get_data"
  | "marker"
  | "time_sync"
  | "error";

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: MessageType;
  /** Message payload */
  [key: string]: any;
}

/**
 * Connection status
 */
export interface ConnectionStatus {
  /** Connected to server */
  connected: boolean;
  /** Currently tracking */
  tracking: boolean;
  /** Last error message */
  lastError?: string;
  /** Connection timestamp */
  connectedAt?: number;
}

/**
 * Marker data
 */
export interface MarkerData {
  /** Marker type */
  type: string;
  /** Timestamp in milliseconds */
  timestamp?: number;
  /** Additional marker data */
  [key: string]: any;
}

/**
 * Screen dimensions
 */
export interface ScreenDimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Coordinate pair
 */
export interface Coordinates {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}
