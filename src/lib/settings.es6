import { info } from 'logger'
import { setCamoUrl } from 'parser'
import { startProxy, killWorker } from 'server'

const nbbSettings = require.main.require('./src/settings')
const pubsub = require.main.require('./src/pubsub')

pubsub.on('syncCamo', syncCamo)

const defaultSettings = {
  host: '',
  key: '',
  type: 'path',
  https: 0,
  useCamoProxy: 0,
  port: 8082
}

const settings = new nbbSettings('camo', '1.0.0', defaultSettings)

const init = callback => {
  syncCamo(callback)

  require.main.require('./src/socket.io/admin').settings.syncCamo = (socket, ignored, callback) => {
    info('C', 'Settings saved.')

    // If the key is blank, generate a secure one.
    if (!settings.get('key')) {
      require('crypto').randomBytes(48, (err, buf) => {
        buf = buf.toString('base64').replace(/\//g, '=')
        settings.set('key', buf)
        settings.persist()
        callback(null, buf)
        pubsub.publish('syncCamo')
      })
    } else {
      pubsub.publish('syncCamo')
    }
  }
}

// Update settings when saving from the admin page.
function syncCamo (callback = () => {}) {
  settings.sync(() => {
    // Re-init the Camo url parser.
    const data = {
      host: settings.get('host'),
      key: settings.get('key'),
      type: settings.get('type')
    }
    if (settings.get('https')) {
      data.regex = /<img[^>]+src=["'](http[^"']+)["'][^>]*>/gi
    } else {
      data.regex = /<img[^>]+src=["'](http[^s][^"']+)["'][^>]*>/gi
    }
    setCamoUrl(data)

    // Re-init the CamoProxy.
    if (settings.get('useCamoProxy')) {
      startProxy({
        'CAMO_KEY': settings.get('key'),
        'PORT': settings.get('port') || '8082'
      })
    } else {
      // Kill any previously started camo worker.
      killWorker()
    }
  })

  callback()
}

const addAdminNavigation = (header, callback) => {
  header.plugins.push({
    route: '/plugins/camo',
    icon: 'fa-image',
    name: 'Camo'
  })

  callback(null, header)
}

export { init, addAdminNavigation }
