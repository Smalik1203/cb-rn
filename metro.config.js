const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add path alias support
config.resolver.alias = {
  '@': __dirname,
};

// iOS-specific optimizations
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Better source map support for iOS debugging
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Add support for template file extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'csv',
  'txt',
  'xlsx',
];

module.exports = config;
