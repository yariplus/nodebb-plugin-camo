import { startProxy, killWorker } from './server'
import { setCamoUrl } from './parser'
import { info } from './logger'

const nbbSettings = require.main.require('./src/settings')

const defaultSettings = {
  host: '',
  key: '',
  type: 'path',
  https: 0,
  useCamoProxy: 0,
  port: 8082
}

const init = callback => {
  const settings = new nbbSettings('camo', '1.0.0', defaultSettings, () => {
    syncProxy(callback)
  })

  require.main.require('./src/socket.io/admin').settings.syncCamo = syncCamo

  // Update settings when saving from the admin page.
  function syncCamo(socket, data, callback) {
    settings.sync(() => {

      // If the key is blank, generate a secure one.
      if (!settings.get('key')) {
        require('crypto').randomBytes(48, (err, buf) => {
          settings.set('key', buf.toString('base64').replace(/\//g, '='))
          settings.persist()
          syncProxy(callback)
        })
      } else {
        syncProxy()
      }
    })
    info('C', 'Settings saved.')
  }

  function syncProxy(callback) {

    // Re-init the Camo url parser.
    const data = {
      host: settings.get('host'),
      key: settings.get('key'),
      type: settings.get('type')
    }
    if (settings.get('https')) {
      data.regex = /<img[^>]+src=[''](http[^'']+)[''][^>]*>/gi
    } else {
      data.regex = /<img[^>]+src=[''](http[^s][^'']+)[''][^>]*>/gi
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

    if (typeof callback === 'function') callback(null, {key: settings.get('key')})
  }
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
