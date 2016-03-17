'use strict';

var Settings = module.parent.require("./settings");
var SocketAdmin = module.parent.require('./socket.io/admin');

var controllers = require('./lib/controller');

var plugin = {};

var settings;
var camoUrl;
var camo;

// Kill worker when nodebb closes/crashes.
process.on("uncaughtException", killWorker);
process.on("SIGINT", killWorker);
process.on("SIGTERM", killWorker);

plugin.init = function(params, callback) {
  var router = params.router;
  var hostMiddleware = params.middleware;
  var hostControllers = params.controllers;

  settings = new Settings('camo', '1.0.0', {host: "", key: "", type: "path"}, sync);

  router.get('/admin/plugins/camo', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
  router.get('/api/admin/plugins/camo', controllers.renderAdminPage);

  SocketAdmin.settings.syncCamo = function () {
    settings.sync(sync);
  };

  function sync() {
    camoUrl = require('camo-url')({
      host: settings.get('host'),
      key: settings.get('key'),
      type: settings.get('type')
    });

    if (settings.get('useCamoProxy')) {
      killWorker();

      var camo = require("child_process").spawn('node', ['node_modules/camo/server'], {silent: true, env: {
        'CAMO_KEY': settings.get('key') || 'banana',
		'PORT': settings.get('port') || '8082'
      }});

      camo.stdout.on('data', function (data) { console.log('CAMO PROXY SAYS: ' + data); });
      camo.stderr.on('data', function (data) { console.log('CAMO PROXY ERROR: ' + data); });
      camo.on('close', function (code) { console.log('CAMO PROXY exited with code ' + code); });
    }
  }

  callback();
};

plugin.addAdminNavigation = function(header, callback) {
  header.plugins.push({
    route: '/plugins/camo',
    icon: 'fa-image',
    name: 'Camo'
  });

  callback(null, header);
};

plugin.parseRaw = function(content, callback) {
  content = content.replace(/<img[^>]+src=['"](http[^s][^'"]+)['"][^>]*>/gi, function (match, url) {
    return match.replace(url, camoUrl(url));
  });
  callback(null, content);
};

plugin.parsePost = function(data, callback) {
  plugin.parseRaw(data.postData.content, function(err, content){
    data.postData.content = content;
    callback(null, data);
  });
};

function killWorker() {
  if (camo && camo.pid) process.kill(camo.pid);
}

module.exports = plugin;
