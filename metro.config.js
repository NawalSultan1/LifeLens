const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('onnx'); // allow .onnx as a static asset
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
