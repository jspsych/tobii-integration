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

    it('should have background_color parameter', () => {
      expect(params.background_color).toBeDefined();
      expect(params.background_color.default).toBe('#808080');
    });

    it('should have max_retries parameter with default 1', () => {
      expect(params.max_retries).toBeDefined();
      expect(params.max_retries.default).toBe(1);
    });

    it('should have button_text parameter', () => {
      expect(params.button_text).toBeDefined();
      expect(params.button_text.default).toBe('Start Calibration');
    });

    it('should have button_color parameter', () => {
      expect(params.button_color).toBeDefined();
      expect(params.button_color.default).toBe('#007bff');
    });

    it('should have button_hover_color parameter', () => {
      expect(params.button_hover_color).toBeDefined();
      expect(params.button_hover_color.default).toBe('#0056b3');
    });

    it('should have retry_button_color parameter', () => {
      expect(params.retry_button_color).toBeDefined();
      expect(params.retry_button_color.default).toBe('#dc3545');
    });

    it('should have retry_button_hover_color parameter', () => {
      expect(params.retry_button_hover_color).toBeDefined();
      expect(params.retry_button_hover_color.default).toBe('#c82333');
    });

    it('should have success_color parameter', () => {
      expect(params.success_color).toBeDefined();
      expect(params.success_color.default).toBe('#28a745');
    });

    it('should have error_color parameter', () => {
      expect(params.error_color).toBeDefined();
      expect(params.error_color.default).toBe('#dc3545');
    });

    it('should have zoom_duration parameter with default 300', () => {
      expect(params.zoom_duration).toBeDefined();
      expect(params.zoom_duration.default).toBe(300);
    });

    it('should have explosion_duration parameter with default 400', () => {
      expect(params.explosion_duration).toBeDefined();
      expect(params.explosion_duration.default).toBe(400);
    });

    it('should have success_display_duration parameter with default 2000', () => {
      expect(params.success_display_duration).toBeDefined();
      expect(params.success_display_duration.default).toBe(2000);
    });

    it('should have instruction_display_duration parameter with default 3000', () => {
      expect(params.instruction_display_duration).toBeDefined();
      expect(params.instruction_display_duration.default).toBe(3000);
    });
  });

  describe('data specification', () => {
    const data = TobiiCalibrationPlugin.info.data;

    it('should have calibration_success data field', () => {
      expect(data.calibration_success).toBeDefined();
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

    it('should have num_attempts data field', () => {
      expect(data.num_attempts).toBeDefined();
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
