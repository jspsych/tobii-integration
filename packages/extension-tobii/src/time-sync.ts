/**
 * Time synchronization between browser and server
 */

import type { WebSocketClient } from './websocket-client';

export class TimeSync {
  private offset: number = 0;
  private synced: boolean = false;

  constructor(private ws: WebSocketClient) {}

  /**
   * Synchronize time with server
   */
  async synchronize(): Promise<void> {
    const measurements: number[] = [];
    const numSamples = 10;

    for (let i = 0; i < numSamples; i++) {
      const t0 = performance.now();

      const response = await this.ws.sendAndWait({
        type: 'time_sync',
        clientTime: t0,
      });

      const t1 = performance.now();
      const roundTripTime = t1 - t0;
      const serverTime = response.serverTime as number;

      // Estimate one-way latency
      const latency = roundTripTime / 2;

      // Calculate offset
      const offset = serverTime - (t0 + latency);
      measurements.push(offset);

      // Small delay between measurements
      await this.delay(100);
    }

    // Use median offset to reduce noise
    this.offset = this.median(measurements);
    this.synced = true;
  }

  /**
   * Convert local timestamp to server timestamp
   */
  toServerTime(localTime: number): number {
    return localTime + this.offset;
  }

  /**
   * Convert server timestamp to local timestamp
   */
  toLocalTime(serverTime: number): number {
    return serverTime - this.offset;
  }

  /**
   * Check if time is synchronized
   */
  isSynced(): boolean {
    return this.synced;
  }

  /**
   * Get current offset
   */
  getOffset(): number {
    return this.offset;
  }

  /**
   * Calculate median of array
   */
  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
