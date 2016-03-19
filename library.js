'use strict';

var NodeBB = module.parent;
var Settings = NodeBB.require("./settings");
var SocketAdmin = NodeBB.require('./socket.io/admin');

var controllers = require('./lib/controller');

var plugin = {};

var settings;
var camoUrl;
var loader;
var regex;

var defaultSettings = {
  host: "",
  key: "",
  type: "path",
  https: 0,
  useCamoProxy: 0,
  port: 8082
};

// Kill worker when nodebb closes/crashes. I have no idea if this is right.
process.on("uncaughtException", killWorker);
process.on("SIGINT", killWorker);
process.on("SIGHUP", killWorker);
process.on("SIGUSR2", killWorker);
process.on("SIGTERM", killWorker);

plugin.init = function(params, callback) {
  var router = params.router;
  var hostMiddleware = params.middleware;
  var hostControllers = params.controllers;

  settings = new Settings('camo', '1.0.0', defaultSettings, sync);

  router.get('/admin/plugins/camo', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
  router.get('/api/admin/plugins/camo', controllers.renderAdminPage);

  SocketAdmin.settings.syncCamo = function () {
    settings.sync(function(){
      if (settings.get('useCamoProxy')) {
        require('crypto').randomBytes(48, function(err, buf) {
          settings.set('key', buf.toString('base64').replace(/\//g, '='));
          settings.persist();
          sync();
        });
      }else{
        sync();
      }
    });
    console.log("Settings saved for Camo.");
  };

  function sync() {
    if (settings.get('https')) {
      regex = /<img[^>]+src=['"](http[^'"]+)['"][^>]*>/gi;
    }else{
      regex = /<img[^>]+src=['"](http[^s][^'"]+)['"][^>]*>/gi;
    }

    camoUrl = require('camo-url')({
      host: settings.get('host'),
      key: settings.get('key'),
      type: settings.get('type')
    });

    // Kill any previously started camo worker.
    killWorker();

    if (settings.get('useCamoProxy')) {
      console.log("Starting Camo worker...");
      var options = {silent: true, env: {
        'CAMO_KEY': settings.get('key') || 'banana',
        'PORT': settings.get('port') || '8082'
      }};

      loader = require("child_process").fork(__dirname + '/server', [], options);
      loader.stdout.on('data', function (data) { console.log('CAMO PROXY SAYS: ' + data); });
      loader.stderr.on('data', function (data) {});
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
  content = content.replace(regex, function (match, url) {
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

plugin.reload = function (data, next) {
  killWorker();
  next();
};

function killWorker() {
  try {
    if (loader) {
      loader.kill('SIGHUP');
      console.log("Closed Camo worker.");
    }
  }catch(e){
  }
}

module.exports = plugin;
