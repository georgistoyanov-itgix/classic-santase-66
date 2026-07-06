module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin must be listed last.
      // Note: With Expo SDK 57 + babel-preset-expo, this is already
      // configured automatically, but listed here explicitly for clarity.
      'react-native-reanimated/plugin',
    ],
  };
};
