const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withOnnxRuntime(config) {
  return withProjectBuildGradle(config, async (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*{/,
      `dependencies {
        implementation project(':onnxruntime-react-native')`
    );
    return config;
  });
};