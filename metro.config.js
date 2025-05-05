const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('onnx'); // allow .onnx as a static asset

module.exports = config;
