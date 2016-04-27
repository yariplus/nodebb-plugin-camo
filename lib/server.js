(function(Server, NodeBB){

  'use strict';

  var Logger = require('./logger');

  var nconf = NodeBB.require('nconf');

  var camo = null;

  // Start CamoProxy.
  Server.startProxy = function (data) {

    // Only start on primary node.
    if (!(nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled'))) return;

    Server.killWorker();

    Logger.log('C', "Starting CamoProxy...");

    // Options for server fork.
    var options = {
      silent: true,
      cwd: __dirname + '/../node_modules/camo',
      env: {}
    };

    // Copy previous env.
    for (var prop in process.env) {
      if (process.env.hasOwnProperty(prop)) options.env[prop] = process.env[prop];
    }

    options.env['CAMO_KEY'] = data['CAMO_KEY'];
    options.env['PORT'] = data['PORT'];

    camo = require("child_process").fork('server.js', [], options);

    camo.stdout.on('data', function (data) { Logger.info('CP', data); });
    camo.stderr.on('data', function (data) { Logger.warn('CP', data); });

    camo.once("exit", function (data) { Logger.info('C', "CamoProxy is dead."); });
  };

  Server.killWorker = function() {
    if (camo && camo.connected) {
      Logger.info('C', "Killing CamoProxy.");
      camo.kill('SIGHUP');
    }
  }

  Server.reload = function (data, next) {
    Server.killWorker();
    next();
  };

  process.once("exit", Server.killWorker);

}(exports, require.main));
