const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');
config.transformer = {
     ...config.transformer,
     unstable_allowRequireContext: true,
     getTransformOptions: async () => ({
       transform: {
         experimentalImportSupport: false,
         inlineRequires: true,
       },
     }),
   };
   

module.exports = config;
