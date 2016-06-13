const chai = require('chai')
const path = require('path')
const fs = require('fs')

const expect = chai.expect

// Find the NodeBB install dir.
const HOME = ( process.env.TRAVIS_BUILD_DIR ? process.env.TRAVIS_BUILD_DIR : process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ) + '/nodebb/'

process.env.NODE_ENV = 'development'

// Load the config file to nconf.
require(path.join(HOME, 'node_modules/nconf')).file({ file: path.join(HOME, 'config.json') })

require.main.require = module => {
  switch (module) {
    case './src/settings': return () => {}
    case './src/pubsub': return {on: () => {}, publish: () => {}}
    case 'async': return require(path.join(HOME, 'node_modules', module))
    case 'winston': return {info: () => {}, warn: () => {}}
    case 'nconf': return require(path.join(HOME, 'node_modules', module))
  }
}

require(path.join(__dirname, '../lib/', 'camo'))

const getCamo = () => {
  return require(path.join(__dirname, '../lib/', 'camo'))
}

describe('The plugin', () => {
  it('should load the ES6 modules', () => {
    expect(getCamo).to.not.throw
    let camo = getCamo()
    expect(camo).to.be.an.object
  })
})
