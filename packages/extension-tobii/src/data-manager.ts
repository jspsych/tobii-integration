/**
 * Data manager for storing and retrieving gaze data
 */

import type { GazeData } from "./types";

// Default max buffer size: 120 Hz * 60 seconds = 7200 samples
const DEFAULT_MAX_BUFFER_SIZE = 7200;

export class DataManager {
  private gazeBuffer: GazeData[] = [];
  private trialStartTime: number | null = null;
  private trialEndTime: number | null = null;
  private maxBufferSize: number;

  constructor(maxBufferSize: number = DEFAULT_MAX_BUFFER_SIZE) {
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Add gaze data point with buffer size limit
   */
  addGazeData(data: GazeData): void {
    this.gazeBuffer.push(data);

    // Enforce buffer size limit by removing oldest samples
    if (this.gazeBuffer.length > this.maxBufferSize) {
      // Remove oldest 10% to avoid frequent trimming
      const removeCount = Math.floor(this.maxBufferSize * 0.1);
      this.gazeBuffer.splice(0, removeCount);
    }
  }

  /**
   * Mark trial start
   */
  startTrial(): void {
    this.trialStartTime = performance.now();
  }

  /**
   * Mark trial end
   */
  endTrial(): void {
    this.trialEndTime = performance.now();
  }

  /**
   * Get all gaze data for current trial
   */
  getTrialData(): GazeData[] {
    if (this.trialStartTime === null) {
      return [];
    }

    const endTime = this.trialEndTime || performance.now();

    return this.gazeBuffer.filter((data) => {
      // Use clientTimestamp for filtering (set by extension when gaze data arrives)
      // This is in the same time domain as performance.now() used by startTrial/endTrial
      const ts = (data as any).clientTimestamp ?? data.timestamp;
      return ts >= this.trialStartTime! && ts <= endTime;
    });
  }

  /**
   * Get gaze data for specific time range (using clientTimestamp if available)
   */
  getDataRange(startTime: number, endTime: number): GazeData[] {
    return this.gazeBuffer.filter((data) => {
      // Use clientTimestamp for filtering (set by extension when gaze data arrives)
      // Fall back to timestamp if clientTimestamp not available
      const ts = (data as any).clientTimestamp ?? data.timestamp;
      return ts >= startTime && ts <= endTime;
    });
  }

  /**
   * Get most recent gaze data point
   */
  getCurrentGaze(): GazeData | null {
    if (this.gazeBuffer.length === 0) {
      return null;
    }
    return this.gazeBuffer[this.gazeBuffer.length - 1];
  }

  /**
   * Clear all gaze data
   */
  clear(): void {
    this.gazeBuffer = [];
    this.trialStartTime = null;
    this.trialEndTime = null;
  }

  /**
   * Clear old data (keep only recent data)
   */
  clearOldData(keepDuration: number = 60000): void {
    const cutoffTime = performance.now() - keepDuration;
    this.gazeBuffer = this.gazeBuffer.filter((data) => {
      const ts = (data as any).clientTimestamp ?? data.timestamp;
      return ts >= cutoffTime;
    });
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.gazeBuffer.length;
  }

  /**
   * Get recent gaze data from the last N milliseconds
   */
  getRecentData(durationMs: number): GazeData[] {
    const now = performance.now();
    const startTime = now - durationMs;
    return this.gazeBuffer.filter((data) => {
      const ts = (data as any).clientTimestamp ?? data.timestamp;
      return ts >= startTime;
    });
  }
}
