import { initJsPsych } from 'jspsych';

import TobiiCalibrationPlugin from '.';

describe('TobiiCalibrationPlugin', () => {
  describe('static info', () => {
    it('should have correct name', () => {
      expect(TobiiCalibrationPlugin.info.name).toBe('tobii-calibration');
    });

    it('should have version defined', () => {
      expect(TobiiCalibrationPlugin.info.version).toBeDefined();
    });
  });

  describe('parameters', () => {
    const params = TobiiCalibrationPlugin.info.parameters;

    it('should have calibration_points parameter with default 9', () => {
      expect(params.calibration_points).toBeDefined();
      expect(params.calibration_points.default).toBe(9);
    });

    it("should have calibration_mode parameter with default 'view'", () => {
      expect(params.calibration_mode).toBeDefined();
      expect(params.calibration_mode.default).toBe('view');
    });

    it('should have point_size parameter with default 20', () => {
      expect(params.point_size).toBeDefined();
      expect(params.point_size.default).toBe(20);
    });

    it('should have point_color parameter', () => {
      expect(params.point_color).toBeDefined();
      expect(params.point_color.default).toBe('#ff0000');
    });

    it('should have point_duration parameter', () => {
      expect(params.point_duration).toBeDefined();
      expect(params.point_duration.default).toBe(500);
    });

    it('should have collection_duration parameter', () => {
      expect(params.collection_duration).toBeDefined();
      expect(params.collection_duration.default).toBe(1000);
    });

    it('should have custom_points parameter', () => {
      expect(params.custom_points).toBeDefined();
      expect(params.custom_points.default).toBeNull();
    });

    it('should have show_progress parameter', () => {
      expect(params.show_progress).toBeDefined();
      expect(params.show_progress.default).toBe(true);
    });

    it('should have instructions parameter', () => {
      expect(params.instructions).toBeDefined();
      expect(typeof params.instructions.default).toBe('string');
    });

    it('should have animation parameter', () => {
      expect(params.animation).toBeDefined();
      expect(params.animation.default).toBe('shrink');
    });

    it('should have background_color parameter', () => {
      expect(params.background_color).toBeDefined();
      expect(params.background_color.default).toBe('#808080');
    });
  });

  describe('data specification', () => {
    const data = TobiiCalibrationPlugin.info.data;

    it('should have calibration_success data field', () => {
      expect(data.calibration_success).toBeDefined();
    });

    it('should have average_error data field', () => {
      expect(data.average_error).toBeDefined();
    });

    it('should have num_points data field', () => {
      expect(data.num_points).toBeDefined();
    });

    it('should have mode data field', () => {
      expect(data.mode).toBeDefined();
    });

    it('should have calibration_data data field', () => {
      expect(data.calibration_data).toBeDefined();
    });
  });

  describe('instantiation', () => {
    it('should instantiate without errors', () => {
      const jsPsych = initJsPsych();
      const plugin = new TobiiCalibrationPlugin(jsPsych);
      expect(plugin).toBeDefined();
    });
  });
});
