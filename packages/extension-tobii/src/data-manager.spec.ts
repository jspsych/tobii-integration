import { DataManager } from './data-manager';
import type { GazeData } from './types';

function makeSample(timestamp: number, browserTimestamp?: number): GazeData {
  return {
    x: 0.5,
    y: 0.5,
    timestamp,
    browserTimestamp,
  };
}

describe('DataManager', () => {
  describe('buffer basics', () => {
    it('should start empty', () => {
      const dm = new DataManager();
      expect(dm.getBufferSize()).toBe(0);
      expect(dm.getCurrentGaze()).toBeNull();
    });

    it('should add and retrieve gaze data', () => {
      const dm = new DataManager();
      const sample = makeSample(100);
      dm.addGazeData(sample);
      expect(dm.getBufferSize()).toBe(1);
      expect(dm.getCurrentGaze()).toBe(sample);
    });

    it('should return the most recent sample from getCurrentGaze', () => {
      const dm = new DataManager();
      dm.addGazeData(makeSample(100));
      dm.addGazeData(makeSample(200));
      dm.addGazeData(makeSample(300));
      expect(dm.getCurrentGaze()!.timestamp).toBe(300);
    });

    it('should clear all data', () => {
      const dm = new DataManager();
      dm.addGazeData(makeSample(100));
      dm.addGazeData(makeSample(200));
      dm.clear();
      expect(dm.getBufferSize()).toBe(0);
      expect(dm.getCurrentGaze()).toBeNull();
    });
  });

  describe('buffer size cap', () => {
    it('should enforce maxBufferSize', () => {
      const dm = new DataManager(5);
      for (let i = 0; i < 10; i++) {
        dm.addGazeData(makeSample(i * 100));
      }
      expect(dm.getBufferSize()).toBe(5);
    });

    it('should keep the most recent samples when capping', () => {
      const dm = new DataManager(3);
      for (let i = 0; i < 6; i++) {
        dm.addGazeData(makeSample(i * 100));
      }
      expect(dm.getCurrentGaze()!.timestamp).toBe(500);
      // Oldest kept should be timestamp 300
      const range = dm.getDataRange(0, 1000);
      expect(range[0].timestamp).toBe(300);
    });

    it('should use default maxBufferSize of 7200', () => {
      const dm = new DataManager();
      // Add more than 7200 samples
      for (let i = 0; i < 7210; i++) {
        dm.addGazeData(makeSample(i));
      }
      expect(dm.getBufferSize()).toBe(7200);
    });
  });

  describe('trial data', () => {
    let mockTime: number;

    beforeEach(() => {
      mockTime = 1000;
      jest.spyOn(performance, 'now').mockImplementation(() => mockTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return empty array when no trial started', () => {
      const dm = new DataManager();
      dm.addGazeData(makeSample(100));
      expect(dm.getTrialData()).toEqual([]);
    });

    it('should filter data by trial time window using browserTimestamp', () => {
      const dm = new DataManager();

      dm.addGazeData(makeSample(50, 800)); // before trial
      dm.addGazeData(makeSample(60, 900)); // before trial

      mockTime = 1000;
      dm.startTrial(); // trialStartTime = 1000

      dm.addGazeData(makeSample(150, 1050)); // during trial
      dm.addGazeData(makeSample(200, 1100)); // during trial

      mockTime = 1200;
      dm.endTrial(); // trialEndTime = 1200

      dm.addGazeData(makeSample(250, 1500)); // after trial

      const trialData = dm.getTrialData();
      expect(trialData.length).toBe(2);
      expect(trialData[0].browserTimestamp).toBe(1050);
      expect(trialData[1].browserTimestamp).toBe(1100);
    });

    it('should use timestamp as fallback when browserTimestamp is missing', () => {
      const dm = new DataManager();

      mockTime = 1000;
      dm.startTrial();

      dm.addGazeData(makeSample(1010)); // during trial (falls back to timestamp)
      dm.addGazeData(makeSample(1020)); // during trial

      mockTime = 1100;
      dm.endTrial();

      const trialData = dm.getTrialData();
      expect(trialData.length).toBe(2);
    });

    it('should clear trial times on clear()', () => {
      const dm = new DataManager();
      dm.startTrial();
      dm.addGazeData(makeSample(100, 1050));
      dm.endTrial();
      dm.clear();
      expect(dm.getTrialData()).toEqual([]);
    });
  });

  describe('getDataRange', () => {
    it('should filter by browserTimestamp', () => {
      const dm = new DataManager();
      dm.addGazeData(makeSample(10, 100));
      dm.addGazeData(makeSample(20, 200));
      dm.addGazeData(makeSample(30, 300));
      dm.addGazeData(makeSample(40, 400));

      const range = dm.getDataRange(150, 350);
      expect(range.length).toBe(2);
      expect(range[0].browserTimestamp).toBe(200);
      expect(range[1].browserTimestamp).toBe(300);
    });

    it('should fall back to timestamp when no browserTimestamp', () => {
      const dm = new DataManager();
      dm.addGazeData(makeSample(100));
      dm.addGazeData(makeSample(200));
      dm.addGazeData(makeSample(300));

      const range = dm.getDataRange(150, 250);
      expect(range.length).toBe(1);
      expect(range[0].timestamp).toBe(200);
    });
  });

  describe('getRecentData', () => {
    it('should return samples from the last N ms', () => {
      const dm = new DataManager();
      const now = performance.now();
      dm.addGazeData(makeSample(1, now - 5000)); // 5s ago
      dm.addGazeData(makeSample(2, now - 500)); // 0.5s ago
      dm.addGazeData(makeSample(3, now - 100)); // 0.1s ago

      const recent = dm.getRecentData(1000);
      expect(recent.length).toBe(2);
    });
  });

  describe('clearOldData', () => {
    it('should remove old samples beyond keepDuration', () => {
      const dm = new DataManager();
      const now = performance.now();
      dm.addGazeData(makeSample(1, now - 120000)); // 2 min ago
      dm.addGazeData(makeSample(2, now - 30000)); // 30s ago
      dm.addGazeData(makeSample(3, now - 1000)); // 1s ago

      dm.clearOldData(60000); // keep last 60s
      expect(dm.getBufferSize()).toBe(2);
    });
  });
});
