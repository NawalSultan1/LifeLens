const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidChanges(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      // Add TensorFlow Lite dependencies
      if (
        !config.modResults.contents.includes("org.tensorflow:tensorflow-lite")
      ) {
        config.modResults.contents = config.modResults.contents.replace(
          /dependencies {/,
          `dependencies {
    implementation 'org.tensorflow:tensorflow-lite:2.8.0'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.0'`
        );
      }

      // Add abiFilters if needed
      if (!config.modResults.contents.includes("abiFilters")) {
        config.modResults.contents = config.modResults.contents.replace(
          /defaultConfig {/,
          `defaultConfig {
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }`
        );
      }
    }
    return config;
  });
};
