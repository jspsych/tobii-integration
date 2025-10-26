import { makeRollupConfig } from "@jspsych/config/rollup";
import postcss from "rollup-plugin-postcss";

const config = makeRollupConfig("jsPsychPluginPluginTobiiCalibration");

// Add postcss plugin to all configurations
config.forEach((cfg) => {
  if (!cfg.plugins) cfg.plugins = [];
  cfg.plugins.unshift(postcss({
    inject: true,
    minimize: true,
  }));
});

export default config;
