/**
 * Device time synchronization - maps browser timestamps to Tobii device timestamps
 *
 * Three clocks exist:
 *   A = performance.now() (browser)
 *   B = time.time() * 1000 (Python server)
 *   C = Tobii device clock
 *
 * TimeSync establishes A↔B. The server computes B↔C from gaze samples
 * (server_timestamp and device timestamp are set in the same Python callback).
 * This module chains them: A↔C = A↔B + B↔C.
 */

import type { WebSocketClient } from './websocket-client';
import type { TimeSync } from './time-sync';
import type { GazeData, DeviceTimeSyncStatus, TimestampAlignmentResult } from './types';

export class DeviceTimeSync {
  private offsetBC: number | null = null;
  private bcSampleCount: number = 0;
  private bcStdDev: number | null = null;
  private bcMin: number | null = null;
  private bcMax: number | null = null;

  constructor(
    private ws: WebSocketClient,
    private timeSync: TimeSync
  ) {}

  /**
   * Request the B-C offset from the server and compute the A-C chain.
   * Requires that TimeSync (A-B) is already synchronized and that
   * gaze samples have been collected on the server.
   */
  async synchronizeDeviceClock(): Promise<boolean> {
    if (!this.timeSync.isSynced()) {
      return false;
    }

    try {
      const response = await this.ws.sendAndWait({
        type: 'get_device_clock_offset',
      });

      if (!response.success) {
        return false;
      }

      this.offsetBC = response.offset as number;
      this.bcSampleCount = response.sample_count as number;
      this.bcStdDev = response.std_dev as number | null;
      this.bcMin = response.min as number | null;
      this.bcMax = response.max as number | null;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Whether the full A↔C chain is established
   */
  isSynced(): boolean {
    return this.timeSync.isSynced() && this.offsetBC !== null;
  }

  /**
   * Convert a performance.now() timestamp to device clock time.
   * offset_AB: B = A + offset_AB
   * offset_BC: B = C + offset_BC  →  C = B - offset_BC
   * So: C = (A + offset_AB) - offset_BC = A + (offset_AB - offset_BC)
   */
  toDeviceTime(performanceNow: number): number {
    if (!this.isSynced()) {
      throw new Error('Device time sync not established. Call synchronizeDeviceClock() first.');
    }
    const offsetAB = this.timeSync.getOffset();
    return performanceNow + offsetAB - this.offsetBC!;
  }

  /**
   * Convert a device clock timestamp to performance.now() domain.
   * A = C - offset_AB + offset_BC = C - (offset_AB - offset_BC)
   */
  toLocalTime(deviceTime: number): number {
    if (!this.isSynced()) {
      throw new Error('Device time sync not established. Call synchronizeDeviceClock() first.');
    }
    const offsetAB = this.timeSync.getOffset();
    return deviceTime - offsetAB + this.offsetBC!;
  }

  /**
   * Get full synchronization status with all offsets and diagnostics
   */
  getStatus(): DeviceTimeSyncStatus {
    const offsetAB = this.timeSync.getOffset();
    const offsetAC = this.offsetBC !== null ? offsetAB - this.offsetBC : null;

    return {
      synced: this.isSynced(),
      offsetAB,
      offsetBC: this.offsetBC,
      offsetAC,
      bcSampleCount: this.bcSampleCount,
      bcStdDev: this.bcStdDev,
      bcMin: this.bcMin,
      bcMax: this.bcMax,
    };
  }

  /**
   * Validate timestamp alignment across a set of gaze samples.
   *
   * For each sample, computes: residual = (_receiveTime + offset_AC) - timestamp
   * using the internal _receiveTime property (raw WebSocket receive time) as an
   * independent measurement to cross-validate the sync offset.
   * If clocks are well-aligned, residuals should cluster tightly around the
   * one-way WebSocket latency (server→client).
   *
   * @param samples - Array of gaze samples (must have internal _receiveTime set)
   * @returns Alignment statistics, or null if sync is not established or no valid samples
   */
  validateTimestampAlignment(samples: GazeData[]): TimestampAlignmentResult | null {
    if (!this.isSynced()) {
      return null;
    }

    const offsetAB = this.timeSync.getOffset();
    const offsetAC = offsetAB - this.offsetBC!;

    const residuals: number[] = [];
    for (const sample of samples) {
      const receiveTime = (sample as unknown as Record<string, unknown>)._receiveTime as
        | number
        | undefined;
      if (receiveTime != null && sample.timestamp != null) {
        residuals.push(receiveTime + offsetAC - sample.timestamp);
      }
    }

    if (residuals.length === 0) {
      return null;
    }

    const n = residuals.length;
    const mean = residuals.reduce((a, b) => a + b, 0) / n;
    const variance = residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...residuals);
    const max = Math.max(...residuals);

    return {
      sampleCount: n,
      meanResidual: mean,
      stdDev,
      min,
      max,
    };
  }

  /**
   * Reset sync state (e.g., after reconnection)
   */
  reset(): void {
    this.offsetBC = null;
    this.bcSampleCount = 0;
    this.bcStdDev = null;
    this.bcMin = null;
    this.bcMax = null;
  }
}
