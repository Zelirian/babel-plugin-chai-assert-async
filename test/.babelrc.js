const parent = require('../.babelrc')

module.exports = {
  plugins: ['../lib'],
  presets: parent.presets
}
