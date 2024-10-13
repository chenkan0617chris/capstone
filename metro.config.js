// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const resolver = config.resolver;
const assetExts = resolver.assetExts;

module.exports = {
    ...config,
    resolver: {
        ...resolver,
        assetExts: [
            ...assetExts,
            'bin'
        ]
    }
};
