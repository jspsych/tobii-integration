/**
 * @title Tobii Extension
 * @description jsPsych extension for Tobii eye tracker integration via WebSocket.
 * Provides real-time gaze data streaming, calibration control, time synchronization,
 * and coordinate utilities for eye tracking experiments.
 * @version 1.0.0
 * @author jsPsych Team
 * @see {@link https://github.com/jspsych/jspsych-tobii/tree/main/packages/extension-tobii#readme Documentation}
 */

import { JsPsych, JsPsychExtension, JsPsychExtensionInfo, ParameterType } from "jspsych";
import { version } from "../package.json";

import { WebSocketClient } from "./websocket-client";
import { DataManager } from "./data-manager";
import { TimeSync } from "./time-sync";
import * as CoordinateUtils from "./coordinate-utils";
import * as DataExport from "./data-export";
import * as Validation from "./validation";

import type {
  InitializeParameters,
  OnStartParameters,
  OnFinishParameters,
  GazeData,
  CalibrationPoint,
  CalibrationResult,
  ValidationResult,
  UserPositionData,
  MarkerData,
  ScreenDimensions,
  Coordinates,
  ConnectionStatus,
} from "./types";

class TobiiExtension implements JsPsychExtension {
  static info: JsPsychExtensionInfo = {
    name: "tobii",
    version: version,
    data: {
      /** Eye tracking gaze data collected during the trial */
      tobii_data: {
        type: ParameterType.COMPLEX,
        array: true,
      },
    },
  };

  private jsPsych: JsPsych;
  private ws!: WebSocketClient;
  private dataManager!: DataManager;
  private timeSync!: TimeSync;
  private initialized: boolean = false;
  private tracking: boolean = false;
  private config: InitializeParameters = {};

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  initialize = async (params: InitializeParameters = {}): Promise<void> => {
    this.config = params;

    // Initialize WebSocket client
    this.ws = new WebSocketClient(params.connection);

    // Initialize data manager
    this.dataManager = new DataManager();

    // Initialize time synchronization
    this.timeSync = new TimeSync(this.ws);

    // Set up gaze data handler
    this.ws.on("gaze_data", (data) => {
      if (data.gaze && Validation.validateGazeData(data.gaze)) {
        // Add client timestamp for time-range queries using performance.now()
        const gazeWithClientTime = {
          ...data.gaze,
          clientTimestamp: performance.now(),
        };
        this.dataManager.addGazeData(gazeWithClientTime);
      }
    });

    // Set up reconnection handler to re-sync time
    this.ws.on("reconnected", async () => {
      try {
        await this.timeSync.synchronize();
      } catch (e) {
        // Time sync failed after reconnection
      }
    });

    // Auto-connect if configured
    if (params.connection?.autoConnect) {
      await this.connect();
    }

    this.initialized = true;
  };

  on_start = async (params: OnStartParameters = {}): Promise<void> => {
    // Mark trial start
    this.dataManager.startTrial();

    // Send trial start marker with synchronized timestamp
    const localTime = performance.now();
    await this.sendMarker({
      label: "trial_start",
      timestamp: localTime,
      syncedTimestamp: this.timeSync.isSynced() ? this.timeSync.toServerTime(localTime) : localTime,
      ...params.metadata,
    });

    // Start tracking if not already tracking
    if (!this.tracking) {
      await this.startTracking();
    }
  };

  on_load = async (params: OnStartParameters = {}): Promise<void> => {
    // Optional: additional setup when trial loads
  };

  on_finish = async (params: OnFinishParameters = {}): Promise<{ tobii_data: GazeData[] }> => {
    // Mark trial end
    this.dataManager.endTrial();

    // Send trial end marker with synchronized timestamp
    const localTime = performance.now();
    await this.sendMarker({
      label: "trial_end",
      timestamp: localTime,
      syncedTimestamp: this.timeSync.isSynced() ? this.timeSync.toServerTime(localTime) : localTime,
    });

    // Get trial data
    const trialData = this.dataManager.getTrialData();

    // Clear old data to prevent memory buildup
    this.dataManager.clearOldData();

    return {
      tobii_data: trialData,
    };
  };

  // ==========================================
  // PUBLIC API METHODS
  // These are accessible via jsPsych.extensions.tobii.*
  // ==========================================

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    await this.ws.connect();
    await this.timeSync.synchronize();
  }

  /**
   * Disconnect from the WebSocket server
   */
  async disconnect(): Promise<void> {
    if (this.tracking) {
      await this.stopTracking();
    }
    await this.ws.disconnect();
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.ws.isConnected();
  }

  /**
   * Get connection status details
   */
  getConnectionStatus(): ConnectionStatus {
    return this.ws.getStatus();
  }

  /**
   * Start eye tracking data collection
   */
  async startTracking(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Not connected to server. Call connect() first.");
    }

    // Wait for server confirmation before setting state
    const response = await this.ws.sendAndWait({ type: "start_tracking" });
    if (response.success) {
      this.tracking = true;
    } else {
      throw new Error("Server failed to start tracking");
    }
  }

  /**
   * Stop eye tracking data collection
   */
  async stopTracking(): Promise<void> {
    // Wait for server confirmation before setting state
    const response = await this.ws.sendAndWait({ type: "stop_tracking" });
    if (response.success) {
      this.tracking = false;
    }
    // Even if server fails, reset local tracking state
    this.tracking = false;
  }

  /**
   * Check if currently tracking
   */
  isTracking(): boolean {
    return this.tracking;
  }

  /**
   * Start calibration procedure
   */
  async startCalibration(): Promise<void> {
    await this.ws.send({ type: "calibration_start" });
  }

  /**
   * Collect calibration data for a specific point
   * @returns Promise resolving to success status when SDK finishes collecting
   */
  async collectCalibrationPoint(x: number, y: number): Promise<{ success: boolean }> {
    if (!Validation.validateCalibrationPoint({ x, y })) {
      throw new Error("Invalid calibration point. Coordinates must be in range [0, 1].");
    }

    const response = await this.ws.sendAndWait({
      type: "calibration_point",
      point: { x, y },
      timestamp: performance.now(),
    });

    return { success: response.success === true };
  }

  /**
   * Compute calibration from collected points
   */
  async computeCalibration(): Promise<CalibrationResult> {
    const response = await this.ws.sendAndWait({
      type: "calibration_compute",
    });
    return response as CalibrationResult;
  }

  /**
   * Get calibration data/quality metrics
   */
  async getCalibrationData(): Promise<CalibrationResult> {
    const response = await this.ws.sendAndWait({
      type: "get_calibration_data",
    });
    return response as CalibrationResult;
  }

  /**
   * Start validation procedure
   */
  async startValidation(): Promise<void> {
    await this.ws.send({ type: "validation_start" });
  }

  /**
   * Collect validation data for a specific point
   * @param x - Normalized x coordinate (0-1)
   * @param y - Normalized y coordinate (0-1)
   * @param gazeSamples - Optional array of gaze samples collected at this point
   */
  async collectValidationPoint(x: number, y: number, gazeSamples?: GazeData[]): Promise<void> {
    if (!Validation.validateCalibrationPoint({ x, y })) {
      throw new Error("Invalid validation point. Coordinates must be in range [0, 1].");
    }

    await this.ws.send({
      type: "validation_point",
      point: { x, y },
      timestamp: performance.now(),
      gaze_samples: gazeSamples || [],
    });
  }

  /**
   * Get recent gaze data from the data manager buffer
   * @param durationMs - How many milliseconds of recent data to retrieve
   */
  getRecentGazeData(durationMs: number): GazeData[] {
    return this.dataManager.getRecentData(durationMs);
  }

  /**
   * Compute validation from collected points
   */
  async computeValidation(): Promise<ValidationResult> {
    const response = await this.ws.sendAndWait({
      type: "validation_compute",
    });
    return response as ValidationResult;
  }

  /**
   * Get current gaze position
   */
  async getCurrentGaze(): Promise<GazeData | null> {
    // Try to get from local buffer first
    const localGaze = this.dataManager.getCurrentGaze();
    if (localGaze) {
      return localGaze;
    }

    // Otherwise request from server
    const response = await this.ws.sendAndWait({
      type: "get_current_gaze",
    });
    return response.gaze || null;
  }

  /**
   * Get current user position (head position)
   */
  async getUserPosition(): Promise<UserPositionData | null> {
    if (!this.isConnected()) {
      return null;
    }
    const response = await this.ws.sendAndWait({
      type: "get_user_position",
    });
    return response.position || null;
  }

  /**
   * Get gaze data for a specific time range
   */
  async getGazeData(startTime: number, endTime: number): Promise<GazeData[]> {
    // Get from local buffer
    const localData = this.dataManager.getDataRange(startTime, endTime);

    // Filter valid gaze points
    return Validation.filterValidGaze(localData);
  }

  /**
   * Clear stored gaze data
   */
  clearGazeData(): void {
    this.dataManager.clear();
  }

  /**
   * Send a marker to the eye tracking data stream
   */
  async sendMarker(markerData: MarkerData): Promise<void> {
    await this.ws.send({
      type: "marker",
      ...markerData,
      timestamp: markerData.timestamp || performance.now(),
    });
  }

  /**
   * Convert normalized coordinates (0-1) to pixels
   */
  normalizedToPixels(x: number, y: number): Coordinates {
    return CoordinateUtils.normalizedToPixels(x, y);
  }

  /**
   * Convert pixel coordinates to normalized (0-1)
   */
  pixelsToNormalized(x: number, y: number): Coordinates {
    return CoordinateUtils.pixelsToNormalized(x, y);
  }

  /**
   * Get screen dimensions
   */
  getScreenDimensions(): ScreenDimensions {
    return CoordinateUtils.getScreenDimensions();
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(p1: Coordinates, p2: Coordinates): number {
    return CoordinateUtils.distance(p1, p2);
  }

  /**
   * Convert window pixel coordinates to container-relative coordinates
   * @param x - X coordinate in window pixels
   * @param y - Y coordinate in window pixels
   * @param container - Optional container element (defaults to jsPsych display element)
   */
  windowToContainer(x: number, y: number, container?: HTMLElement): Coordinates {
    const el = container || this.jsPsych.getDisplayElement();
    return CoordinateUtils.windowToContainer(x, y, el);
  }

  /**
   * Get container dimensions
   * @param container - Optional container element (defaults to jsPsych display element)
   */
  getContainerDimensions(container?: HTMLElement): ScreenDimensions {
    const el = container || this.jsPsych.getDisplayElement();
    return CoordinateUtils.getContainerDimensions(el);
  }

  /**
   * Check if window coordinates fall within a container
   * @param x - X coordinate in window pixels
   * @param y - Y coordinate in window pixels
   * @param container - Optional container element (defaults to jsPsych display element)
   */
  isWithinContainer(x: number, y: number, container?: HTMLElement): boolean {
    const el = container || this.jsPsych.getDisplayElement();
    return CoordinateUtils.isWithinContainer(x, y, el);
  }

  /**
   * Export gaze data to CSV
   */
  exportToCSV(data: any[], filename: string): void {
    DataExport.toCSV(data, filename);
  }

  /**
   * Export gaze data to JSON
   */
  exportToJSON(data: any[], filename: string): void {
    DataExport.toJSON(data, filename);
  }

  /**
   * Set extension configuration
   */
  setConfig(config: Partial<InitializeParameters>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): InitializeParameters {
    return { ...this.config };
  }

  /**
   * Get time synchronization offset
   */
  getTimeOffset(): number {
    return this.timeSync.getOffset();
  }

  /**
   * Check if time is synchronized
   */
  isTimeSynced(): boolean {
    return this.timeSync.isSynced();
  }
}

export default TobiiExtension;

// Export types for use by plugins and experiments
export type {
  InitializeParameters,
  OnStartParameters,
  OnFinishParameters,
  GazeData,
  CalibrationPoint,
  CalibrationResult,
  ValidationResult,
  MarkerData,
  ScreenDimensions,
  Coordinates,
  ConnectionStatus,
};
