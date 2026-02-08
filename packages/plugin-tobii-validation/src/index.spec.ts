import { initJsPsych } from 'jspsych';

import TobiiValidationPlugin from '.';

describe('TobiiValidationPlugin', () => {
  describe('static info', () => {
    it('should have correct name', () => {
      expect(TobiiValidationPlugin.info.name).toBe('tobii-validation');
    });

    it('should have version defined', () => {
      expect(TobiiValidationPlugin.info.version).toBeDefined();
    });
  });

  describe('parameters', () => {
    const params = TobiiValidationPlugin.info.parameters;

    it('should have validation_points parameter with default 9', () => {
      expect(params.validation_points).toBeDefined();
      expect(params.validation_points.default).toBe(9);
    });

    it('should have point_size parameter with default 20', () => {
      expect(params.point_size).toBeDefined();
      expect(params.point_size.default).toBe(20);
    });

    it('should have point_color parameter', () => {
      expect(params.point_color).toBeDefined();
      expect(params.point_color.default).toBe('#00ff00');
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
      expect(params.show_progress.default).toBe(false);
    });

    it('should have show_feedback parameter', () => {
      expect(params.show_feedback).toBeDefined();
      expect(params.show_feedback.default).toBe(true);
    });

    it('should have tolerance parameter with default 0.05', () => {
      expect(params.tolerance).toBeDefined();
      expect(params.tolerance.default).toBe(0.05);
    });

    it('should have background_color parameter', () => {
      expect(params.background_color).toBeDefined();
      expect(params.background_color.default).toBe('#808080');
    });

    it('should have max_retries parameter with default 1', () => {
      expect(params.max_retries).toBeDefined();
      expect(params.max_retries.default).toBe(1);
    });

    it('should have instructions parameter', () => {
      expect(params.instructions).toBeDefined();
      expect(typeof params.instructions.default).toBe('string');
    });

    it('should have button_color parameter', () => {
      expect(params.button_color).toBeDefined();
      expect(params.button_color.default).toBe('#28a745');
    });

    it('should have button_hover_color parameter', () => {
      expect(params.button_hover_color).toBeDefined();
      expect(params.button_hover_color.default).toBe('#218838');
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
  });

  describe('data specification', () => {
    const data = TobiiValidationPlugin.info.data;

    it('should have validation_success data field', () => {
      expect(data.validation_success).toBeDefined();
    });

    it('should have average_accuracy data field', () => {
      expect(data.average_accuracy).toBeDefined();
    });

    it('should have average_precision data field', () => {
      expect(data.average_precision).toBeDefined();
    });

    it('should have num_points data field', () => {
      expect(data.num_points).toBeDefined();
    });

    it('should have validation_data data field', () => {
      expect(data.validation_data).toBeDefined();
    });

    it('should have num_attempts data field', () => {
      expect(data.num_attempts).toBeDefined();
    });
  });

  describe('instantiation', () => {
    it('should instantiate without errors', () => {
      const jsPsych = initJsPsych();
      const plugin = new TobiiValidationPlugin(jsPsych);
      expect(plugin).toBeDefined();
    });
  });
});
