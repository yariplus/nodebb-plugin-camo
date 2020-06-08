const { info, warn } = require('./logger')

const fs = require('fs')
const path = require('path')

const nconf = require.main.require('nconf')

// This is the forked child process.
let camo = null

// Start CamoProxy.
const startProxy = data => {
  // Only start on primary node.
  if (!(nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled'))) return

  // Kill any existing proxy.
  killWorker()

  info('C', 'Starting CamoProxy...')

  // Find camo path.
  let camopath
  const camopathlegacy = path.join(__dirname, '..', 'node_modules', 'camo')
  const camopathmodern = path.join(__dirname, '..', '..', 'node_modules', 'camo')

  if (fs.existsSync(camopathmodern)) {
    camopath = camopathmodern
  } else if (fs.existsSync(camopathlegacy)) {
    camopath = camopathlegacy
  } else {
    // TODO: Uh-oh. Where it go?
    return warn('C', 'Could not find camo path!')
  }

  // Options for server fork.
  const options = {
    silent: true,
    cwd: camopath,
    env: Object.assign({...data}, process.env),
  }

  // Try to fork camo proxy.
  try {
    camo = require('child_process').fork('server.js', [], options)

    camo.stdout.on('data', data => { info('CP', data) })
    camo.stderr.on('data', data => { warn('CP', data) })

    camo.once('exit', data => { info('C', 'CamoProxy is dead.') })
  } catch (e) {
    warn('C', 'Error starting CamoProxy.')
    console.log(e)
  }
}

const killWorker = (data, callback = () => {}) => {
  if (camo && camo.connected) {
    info('C', 'Killing CamoProxy.')
    camo.kill('SIGHUP')
  }
  callback()
}

exports.killWorker = killWorker
exports.startProxy = startProxy

