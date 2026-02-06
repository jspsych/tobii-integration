import { initJsPsych } from 'jspsych';

import TobiiUserPositionPlugin from '.';

describe('TobiiUserPositionPlugin', () => {
  describe('static info', () => {
    it('should have correct name', () => {
      expect(TobiiUserPositionPlugin.info.name).toBe('tobii-user-position');
    });

    it('should have version defined', () => {
      expect(TobiiUserPositionPlugin.info.version).toBeDefined();
    });
  });

  describe('parameters', () => {
    const params = TobiiUserPositionPlugin.info.parameters;

    it('should have duration parameter with default null', () => {
      expect(params.duration).toBeDefined();
      expect(params.duration.default).toBeNull();
    });

    it('should have message parameter', () => {
      expect(params.message).toBeDefined();
      expect(typeof params.message.default).toBe('string');
    });

    it('should have update_interval parameter with default 100', () => {
      expect(params.update_interval).toBeDefined();
      expect(params.update_interval.default).toBe(100);
    });

    it('should have show_distance_feedback parameter', () => {
      expect(params.show_distance_feedback).toBeDefined();
      expect(params.show_distance_feedback.default).toBe(true);
    });

    it('should have show_position_feedback parameter', () => {
      expect(params.show_position_feedback).toBeDefined();
      expect(params.show_position_feedback.default).toBe(true);
    });

    it('should have button_text parameter', () => {
      expect(params.button_text).toBeDefined();
      expect(params.button_text.default).toBe('Continue');
    });

    it('should have require_good_position parameter', () => {
      expect(params.require_good_position).toBeDefined();
      expect(params.require_good_position.default).toBe(false);
    });

    it('should have color parameters', () => {
      expect(params.background_color).toBeDefined();
      expect(params.good_color).toBeDefined();
      expect(params.fair_color).toBeDefined();
      expect(params.poor_color).toBeDefined();
      expect(params.button_color).toBeDefined();
      expect(params.button_hover_color).toBeDefined();
    });

    it('should have position_threshold_good parameter with default 0.15', () => {
      expect(params.position_threshold_good).toBeDefined();
      expect(params.position_threshold_good.default).toBe(0.15);
    });

    it('should have position_threshold_fair parameter with default 0.25', () => {
      expect(params.position_threshold_fair).toBeDefined();
      expect(params.position_threshold_fair.default).toBe(0.25);
    });

    it('should have distance_threshold_good parameter with default 0.1', () => {
      expect(params.distance_threshold_good).toBeDefined();
      expect(params.distance_threshold_good.default).toBe(0.1);
    });

    it('should have distance_threshold_fair parameter with default 0.2', () => {
      expect(params.distance_threshold_fair).toBeDefined();
      expect(params.distance_threshold_fair.default).toBe(0.2);
    });

    it('should have font_size parameter with default 18px', () => {
      expect(params.font_size).toBeDefined();
      expect(params.font_size.default).toBe('18px');
    });
  });

  describe('data specification', () => {
    const data = TobiiUserPositionPlugin.info.data;

    it('should have average_x data field', () => {
      expect(data.average_x).toBeDefined();
    });

    it('should have average_y data field', () => {
      expect(data.average_y).toBeDefined();
    });

    it('should have average_z data field', () => {
      expect(data.average_z).toBeDefined();
    });

    it('should have position_good data field', () => {
      expect(data.position_good).toBeDefined();
    });

    it('should have status data fields', () => {
      expect(data.horizontal_status).toBeDefined();
      expect(data.vertical_status).toBeDefined();
      expect(data.distance_status).toBeDefined();
    });

    it('should have rt data field', () => {
      expect(data.rt).toBeDefined();
    });
  });

  describe('instantiation', () => {
    it('should instantiate without errors', () => {
      const jsPsych = initJsPsych();
      const plugin = new TobiiUserPositionPlugin(jsPsych);
      expect(plugin).toBeDefined();
    });
  });
});
