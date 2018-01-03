import { info, warn } from './logger'

const nconf = require.main.require('nconf')

let camo = null

// Start CamoProxy.
const startProxy = data => {
  // Only start on primary node.
  if (!(nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled'))) return

  killWorker()

  info('C', 'Starting CamoProxy...')

  let env = {...data}

  // Options for server fork.
  let options = {
    silent: true,
    cwd: require('path').join(__dirname, '..', 'node_modules', 'camo'),
    env: Object.assign(env, process.env)
  }

  camo = require('child_process').fork('server.js', [], options)

  camo.stdout.on('data', data => { info('CP', data) })
  camo.stderr.on('data', data => { warn('CP', data) })

  camo.once('exit', data => { info('C', 'CamoProxy is dead.') })
}

const killWorker = (data, callback = () => {}) => {
  if (camo && camo.connected) {
    info('C', 'Killing CamoProxy.')
    camo.kill('SIGHUP')
  }
  callback()
}

// When the main process dies, kill the worker.
if (nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled')) process.once('exit', killWorker)

export { startProxy, killWorker }
