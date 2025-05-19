// plugins/withFastTFLite.js
const { withProjectBuildGradle } = require("@expo/config-plugins");

const withFastTFLite = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      // Add the required repositories
      if (!config.modResults.contents.includes("mavenCentral()")) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects {/,
          `allprojects {
    repositories {
        mavenCentral()
    }`
        );
      }

      // Add the required dependencies
      if (
        !config.modResults.contents.includes("org.tensorflow:tensorflow-lite")
      ) {
        config.modResults.contents = config.modResults.contents.replace(
          /buildscript {/,
          `buildscript {
    dependencies {
        classpath 'org.tensorflow:tensorflow-lite:2.8.0'
    }`
        );
      }
    }
    return config;
  });
};

module.exports = withFastTFLite;
