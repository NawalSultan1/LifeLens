const { getDefaultConfig, mergeConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'tflite'],
  },
  transformer: {
    ...defaultConfig.transformer,
    unstable_allowRequireContext: true,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
});
