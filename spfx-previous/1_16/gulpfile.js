'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

const path = require('path');
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    generatedConfiguration.resolve.alias = {
      components: path.resolve(__dirname, './lib/components/'),
      constants: path.resolve(__dirname, './lib/constants/'),
      helpers: path.resolve(__dirname, './lib/helpers/'),
      hooks: path.resolve(__dirname, './lib/hooks/'),
      mappers: path.resolve(__dirname, './lib/mappers/'),
      settings: path.resolve(__dirname, './lib/settings/'),
      shared: path.resolve(__dirname, './lib/shared/'),
    };
    return generatedConfiguration;
  },
});

/* fast-serve */
const { addFastServe } = require('spfx-fast-serve-helpers');
addFastServe(build);
/* end of fast-serve */

build.initialize(require('gulp'));
