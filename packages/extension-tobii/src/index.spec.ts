import { initJsPsych } from 'jspsych';

import TobiiExtension from '.';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    const message = JSON.parse(data);
    // Mock response based on message type
    setTimeout(() => {
      if (message.requestId) {
        this.onmessage?.({
          data: JSON.stringify({
            requestId: message.requestId,
            success: true,
            serverTime: Date.now(),
          }),
        });
      }
    }, 10);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

// Setup global mock
(global as any).WebSocket = MockWebSocket;

describe('TobiiExtension', () => {
  describe('static info', () => {
    it('should have correct name', () => {
      expect(TobiiExtension.info.name).toBe('tobii');
    });

    it('should have version defined', () => {
      expect(TobiiExtension.info.version).toBeDefined();
    });

    it('should have tobii_data in data specification', () => {
      expect(TobiiExtension.info.data.tobii_data).toBeDefined();
    });
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      const jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      expect(jsPsych.extensions.tobii).toBeDefined();
    });

    it('should auto-connect when configured', async () => {
      const jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      await jsPsych.extensions.tobii.initialize({
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: true,
        },
      });

      expect(jsPsych.extensions.tobii.isConnected()).toBe(true);
    });
  });

  describe('connection methods', () => {
    let jsPsych: ReturnType<typeof initJsPsych>;

    beforeEach(async () => {
      jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      await jsPsych.extensions.tobii.initialize({
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: false,
        },
      });
    });

    it('isConnected should return false before connecting', () => {
      expect(jsPsych.extensions.tobii.isConnected()).toBe(false);
    });

    it('connect should establish connection', async () => {
      await jsPsych.extensions.tobii.connect();
      expect(jsPsych.extensions.tobii.isConnected()).toBe(true);
    });

    it('getConnectionStatus should return status object', async () => {
      await jsPsych.extensions.tobii.connect();

      const status = jsPsych.extensions.tobii.getConnectionStatus();
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('tracking');
    });
  });

  describe('tracking methods', () => {
    let jsPsych: ReturnType<typeof initJsPsych>;

    beforeEach(async () => {
      jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      await jsPsych.extensions.tobii.initialize({
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: true,
        },
      });
    });

    it('isTracking should return false initially', () => {
      expect(jsPsych.extensions.tobii.isTracking()).toBe(false);
    });

    it('startTracking should start data collection', async () => {
      await jsPsych.extensions.tobii.startTracking();
      expect(jsPsych.extensions.tobii.isTracking()).toBe(true);
    });

    it('stopTracking should stop data collection', async () => {
      await jsPsych.extensions.tobii.startTracking();
      await jsPsych.extensions.tobii.stopTracking();
      expect(jsPsych.extensions.tobii.isTracking()).toBe(false);
    });
  });

  describe('coordinate utilities', () => {
    let jsPsych: ReturnType<typeof initJsPsych>;

    beforeEach(() => {
      jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    });

    it('normalizedToPixels should convert correctly', () => {
      const result = jsPsych.extensions.tobii.normalizedToPixels(0.5, 0.5);
      expect(result.x).toBe(960);
      expect(result.y).toBe(540);
    });

    it('pixelsToNormalized should convert correctly', () => {
      const result = jsPsych.extensions.tobii.pixelsToNormalized(960, 540);
      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
    });

    it('getScreenDimensions should return correct dimensions', () => {
      const dims = jsPsych.extensions.tobii.getScreenDimensions();
      expect(dims.width).toBe(1920);
      expect(dims.height).toBe(1080);
    });

    it('calculateDistance should calculate correctly', () => {
      const distance = jsPsych.extensions.tobii.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
      expect(distance).toBe(5);
    });
  });

  describe('configuration', () => {
    let jsPsych: ReturnType<typeof initJsPsych>;

    beforeEach(async () => {
      jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      await jsPsych.extensions.tobii.initialize({
        data: { coordinateSystem: 'normalized' },
      });
    });

    it('getConfig should return current configuration', () => {
      const config = jsPsych.extensions.tobii.getConfig();
      expect(config.data?.coordinateSystem).toBe('normalized');
    });

    it('setConfig should update configuration', () => {
      jsPsych.extensions.tobii.setConfig({
        data: { coordinateSystem: 'pixels' },
      });
      const config = jsPsych.extensions.tobii.getConfig();
      expect(config.data?.coordinateSystem).toBe('pixels');
    });
  });

  describe('time synchronization', () => {
    let jsPsych: ReturnType<typeof initJsPsych>;

    beforeEach(async () => {
      jsPsych = initJsPsych({
        extensions: [{ type: TobiiExtension }],
      });

      await jsPsych.extensions.tobii.initialize({
        connection: {
          url: 'ws://localhost:8080',
          autoConnect: true,
        },
      });
    });

    it('isTimeSynced should return boolean', () => {
      const synced = jsPsych.extensions.tobii.isTimeSynced();
      expect(typeof synced).toBe('boolean');
    });

    it('getTimeOffset should return number', () => {
      const offset = jsPsych.extensions.tobii.getTimeOffset();
      expect(typeof offset).toBe('number');
    });
  });
});
