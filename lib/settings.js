(function(Settings, NodeBB){

  'use strict';

  var Server = require('./server');
  var Parser = require('./parser');
  var Logger = require('./logger');

  var nbbSettings = NodeBB.require('./src/settings');

  var defaultSettings = {
    host: "",
    key: "",
    type: "path",
    https: 0,
    useCamoProxy: 0,
    port: 8082
  };

  Settings.init = function(callback) {
    var settings = new nbbSettings('camo', '1.0.0', defaultSettings, function () {
      syncProxy(callback);
    });

    NodeBB.require('./src/socket.io/admin').settings.syncCamo = syncCamo;

    // Update settings when saving from the admin page.
    function syncCamo(socket, data, callback) {
      settings.sync(function() {

        // If the key is blank, generate a secure one.
        if (!settings.get('key')) {
          require('crypto').randomBytes(48, function(err, buf) {
            settings.set('key', buf.toString('base64').replace(/\//g, '='));
            settings.persist();
            syncProxy(callback);
          });
        } else {
          syncProxy();
        }
      });
      Logger.info('C', "Settings saved.");
    };

    function syncProxy(callback) {

      // Re-init the Camo url parser.
      var data = {
        host: settings.get('host'),
        key: settings.get('key'),
        type: settings.get('type')
      };
      if (settings.get('https')) {
        data.regex = /<img[^>]+src=['"](http[^'"]+)['"][^>]*>/gi;
      } else {
        data.regex = /<img[^>]+src=['"](http[^s][^'"]+)['"][^>]*>/gi;
      }
      Parser.setCamoUrl(data);

      // Re-init the CamoProxy.
      if (settings.get('useCamoProxy')) {
        Server.startProxy({
          'CAMO_KEY': settings.get('key'),
          'PORT': settings.get('port') || '8082'
        });
      } else {
        // Kill any previously started camo worker.
        killWorker();
      }

      if (typeof callback === 'function') callback(null, {key: settings.get('key')});
    }
  };

  Settings.addAdminNavigation = function(header, callback) {
    header.plugins.push({
      route: '/plugins/camo',
      icon: 'fa-image',
      name: 'Camo'
    });

    callback(null, header);
  };

}(exports, require.main));
