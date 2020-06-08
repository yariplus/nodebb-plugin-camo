// nodebb-plugin-camo

const { startProxy, killWorker } = require('./server')
const { info, warn } = require('./logger')
const { setCamoUrl, parseRaw, parsePost, parseSignature, parseAboutMe } = require('./parser')

const SocketAdmin = require.main.require('./src/socket.io/admin')
const nbbSettings = require.main.require('./src/settings')
const pubsub      = require.main.require('./src/pubsub')
const winston     = require.main.require('winston')
const nconf       = require.main.require('nconf')

const defaultSettings = {
  host: '',
  key: '',
  type: 'path',
  https: 0,
  useCamoProxy: 0,
  port: 8082,
}

const settings = new nbbSettings('camo', '1.0.0', defaultSettings)

exports.init = ({router, middleware}) => new Promise((accept, reject) => {
  // When the main process dies, kill the worker.
  if (nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled')) process.once('exit', killWorker)

  const renderAdminPage = (req, res) => res.render('admin/plugins/camo', {})

  router.get('/admin/plugins/camo', middleware.admin.buildHeader, renderAdminPage)
  router.get('/api/admin/plugins/camo', renderAdminPage)

  SocketAdmin.settings.syncCamo = (socket, ignored, callback) => {
    info('C', 'Settings saved.')

    // If the key is blank, generate a secure one.
    if (!settings.get('key')) {
      require('crypto').randomBytes(48, (err, buf) => {
        buf = buf.toString('base64').replace(/\//g, '=')
        settings.set('key', buf)
        callback(null, buf)
        pubsub.publish('syncCamo')
        settings.persist()
      })
    } else {
      pubsub.publish('syncCamo')
      settings.persist()
    }
  }

  pubsub.on('syncCamo', syncCamo)

  syncCamo()

  accept()
})

exports.addAdminNavigation = (header) => new Promise((accept, reject) => {
  header.plugins.push({
    route: '/plugins/camo',
    icon: 'fa-image',
    name: 'Camo',
  })

  accept(header)
})

// Update settings when saving from the admin page.
const syncCamo = () => {
  settings.sync(() => {
    // Re-init the Camo url parser.
    const data = {
      host: settings.get('host'),
      key: settings.get('key'),
      type: settings.get('type'),
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
}

exports.parseRaw       = parseRaw
exports.parsePost      = parsePost
exports.parseSignature = parseSignature
exports.parseAboutMe   = parseAboutMe

