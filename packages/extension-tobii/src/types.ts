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
  coordinateSystem?: 'pixels' | 'normalized';
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
  metadata?: Record<string, unknown>;
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
  /** Timestamp in milliseconds (device clock) */
  timestamp: number;
  /** Device timestamp mapped to performance.now() domain */
  browserTimestamp?: number;
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
  /** Average accuracy in normalized (0-1) coordinates */
  averageAccuracyNorm?: number;
  /** Average precision in normalized (0-1) coordinates */
  averagePrecisionNorm?: number;
  /** Per-point validation data */
  pointData?: Array<{
    point: CalibrationPoint;
    accuracy: number;
    precision: number;
    accuracyNorm: number;
    precisionNorm: number;
    meanGaze?: { x: number; y: number };
    numSamples?: number;
    numSamplesTotal?: number;
    numSamplesSkipped?: number;
  }>;
  /** Error message if failed */
  error?: string;
}

/**
 * WebSocket message types
 */
export type MessageType =
  | 'connect'
  | 'disconnect'
  | 'start_tracking'
  | 'stop_tracking'
  | 'calibration_start'
  | 'calibration_point'
  | 'calibration_compute'
  | 'get_calibration_data'
  | 'validation_start'
  | 'validation_point'
  | 'validation_compute'
  | 'get_current_gaze'
  | 'get_data'
  | 'get_user_position'
  | 'get_device_clock_offset'
  | 'marker'
  | 'time_sync'
  | 'error';

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: MessageType;
  /** Message payload */
  [key: string]: unknown;
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
  /** Marker label/identifier */
  label: string;
  /** Timestamp in milliseconds */
  timestamp?: number;
  /** Additional marker data */
  [key: string]: unknown;
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

/**
 * Device time synchronization status
 */
export interface DeviceTimeSyncStatus {
  /** Whether device time sync is available */
  synced: boolean;
  /** Offset from browser (performance.now()) to server (A→B) in ms */
  offsetAB: number;
  /** Offset from server to device clock (B→C) in ms */
  offsetBC: number | null;
  /** Offset from browser to device clock (A→C) in ms */
  offsetAC: number | null;
  /** Number of B-C offset samples used */
  bcSampleCount: number;
  /** Standard deviation of B-C offset samples in ms */
  bcStdDev: number | null;
  /** Minimum B-C offset observed in ms */
  bcMin: number | null;
  /** Maximum B-C offset observed in ms */
  bcMax: number | null;
}

/**
 * Timestamp alignment validation result
 */
export interface TimestampAlignmentResult {
  /** Number of samples analyzed */
  sampleCount: number;
  /** Mean residual in ms (approximates one-way WebSocket latency) */
  meanResidual: number;
  /** Standard deviation of residuals in ms (lower = better alignment) */
  stdDev: number;
  /** Minimum residual in ms */
  min: number;
  /** Maximum residual in ms */
  max: number;
}

/**
 * User position data (head position)
 */
export interface UserPositionData {
  /** Left eye X position (normalized 0-1, 0.5 is center) */
  leftX: number | null;
  /** Left eye Y position (normalized 0-1, 0.5 is center) */
  leftY: number | null;
  /** Left eye Z position/distance (normalized 0-1, 0.5 is optimal) */
  leftZ: number | null;
  /** Right eye X position (normalized 0-1, 0.5 is center) */
  rightX: number | null;
  /** Right eye Y position (normalized 0-1, 0.5 is center) */
  rightY: number | null;
  /** Right eye Z position/distance (normalized 0-1, 0.5 is optimal) */
  rightZ: number | null;
  /** Left eye data validity */
  leftValid: boolean;
  /** Right eye data validity */
  rightValid: boolean;
  /** Raw left eye X origin in mm (optional) */
  leftOriginX?: number | null;
  /** Raw left eye Y origin in mm (optional) */
  leftOriginY?: number | null;
  /** Raw left eye Z origin in mm (optional) */
  leftOriginZ?: number | null;
  /** Raw right eye X origin in mm (optional) */
  rightOriginX?: number | null;
  /** Raw right eye Y origin in mm (optional) */
  rightOriginY?: number | null;
  /** Raw right eye Z origin in mm (optional) */
  rightOriginZ?: number | null;
}
