/**
 * Data manager for storing and retrieving gaze data
 */

import type { GazeData } from './types';

export class DataManager {
  private gazeBuffer: GazeData[] = [];
  private trialStartTime: number | null = null;
  private trialEndTime: number | null = null;
  private maxBufferSize: number;

  /**
   * @param maxBufferSize Maximum number of samples to retain. Oldest samples
   *   are dropped when the buffer exceeds this size. Default is 7200
   *   (~60 seconds at 120 Hz).
   */
  constructor(maxBufferSize: number = 7200) {
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Add gaze data point to the buffer
   */
  addGazeData(data: GazeData): void {
    this.gazeBuffer.push(data);
    if (this.gazeBuffer.length > this.maxBufferSize) {
      this.gazeBuffer = this.gazeBuffer.slice(-this.maxBufferSize);
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
      // Use browserTimestamp for filtering (in performance.now() domain, same as startTrial/endTrial)
      const ts = data.browserTimestamp ?? data.timestamp;
      return ts >= this.trialStartTime! && ts <= endTime;
    });
  }

  /**
   * Get gaze data for specific time range (using browserTimestamp if available)
   */
  getDataRange(startTime: number, endTime: number): GazeData[] {
    return this.gazeBuffer.filter((data) => {
      // Use browserTimestamp for filtering (in performance.now() domain)
      // Fall back to timestamp if browserTimestamp not available
      const ts = data.browserTimestamp ?? data.timestamp;
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
      const ts = data.browserTimestamp ?? data.timestamp;
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
      const ts = data.browserTimestamp ?? data.timestamp;
      return ts >= startTime;
    });
  }
}
