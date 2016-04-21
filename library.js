'use strict';

var NodeBB = module.parent;
var Settings = NodeBB.require("./settings");
var SocketAdmin = NodeBB.require('./socket.io/admin');

var winston = require.main.require('winston');

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

var C = "[Camo]: ";
var CP = "[CamoProxy]: ";

// Kill worker when nodebb closes/crashes. I have no idea if this is right.
// TODO: Find an adult.
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

    // Only reset the key if it was previously standalone.
    var wasStandalone = !settings.get('useCamoProxy');

    settings.sync(function(){
      if ((settings.get('useCamoProxy') && wasStandalone) || !settings.get('key')) {
        require('crypto').randomBytes(48, function(err, buf) {
          settings.set('key', buf.toString('base64').replace(/\//g, '='));
          settings.persist();
          sync();
        });
      }else{
        sync();
      }
    });
    winston.info(C + "Settings saved.");
  };

  function sync() {
    if (settings.get('https')) {
      regex = /<img[^>]+src=['"](http[^'"]+)['"][^>]*>/gi;
    } else {
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
      winston.info(C + "Starting Camo worker...");
      var options = {silent: true, env: {
        'CAMO_KEY': settings.get('key'),
        'PORT': settings.get('port') || '8082'
      }};

      loader = require("child_process").fork(__dirname + '/server', [], options);
      loader.stdout.on('data', function (data) { winston.info(CP + data); });
      loader.stderr.on('data', function (data) { winston.error(CP + data); });
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

plugin.parseSignature = function(data, callback) {
  plugin.parseRaw(data.userData.signature, function(err, content){
    data.userData.signature = content;
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
      winston.info(C + "Closed Camo worker.");
    }
  }catch(e){
  }
}

module.exports = plugin;
