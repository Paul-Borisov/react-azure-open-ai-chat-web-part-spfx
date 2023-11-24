/*
 * User webpack settings file. You can add your own settings here.
 * Changes from this file will be merged into the base webpack configuration file.
 * This file will not be overwritten by the subsequent spfx-fast-serve calls.
 */

// you can add your project related webpack configuration here, it will be merged using webpack-merge module
// i.e. plugins: [new webpack.Plugin()]
const path = require('path');
const webpackConfig = {
  resolve: {
    alias: {
      components: path.resolve(__dirname, '..', 'src/components/'),
      constants: path.resolve(__dirname, '..', 'src/constants/'),
      helpers: path.resolve(__dirname, '..', 'src/helpers/'),
      hooks: path.resolve(__dirname, '..', 'src/hooks/'),
      mappers: path.resolve(__dirname, '..', 'src/mappers/'),
      settings: path.resolve(__dirname, '..', 'src/settings/'),
      shared: path.resolve(__dirname, '..', 'src/shared/'),
    },
  },
};

// for even more fine-grained control, you can apply custom webpack settings using below function
const transformConfig = function (initialWebpackConfig) {
  // transform the initial webpack config here, i.e.
  // initialWebpackConfig.plugins.push(new webpack.Plugin()); etc.

  return initialWebpackConfig;
};

module.exports = {
  webpackConfig,
  transformConfig,
};
