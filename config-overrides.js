/* eslint-disable no-param-reassign */
/**
 * Add webpack fallbacks for Node core modules required by some deps.
 * CRA (react-scripts) doesn't expose webpack config directly, so we use react-app-rewired.
 */

module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url/'),
  };

  return config;
};

