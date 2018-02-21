const webpack = require('pify')(require('webpack'))
const fs = require('fs')

module.exports.createBundle = function(options) {
  return webpack({
    entry: options.input,
    target: 'node',
    output: { filename: 'tmp.js' },
  }).then(() => {
    const result = fs.readFileSync('./tmp.js').toString()
    fs.unlinkSync('./tmp.js')
    return result
  })
}
