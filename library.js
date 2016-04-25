(function(Plugin, NodeBB){

  'use strict';

  var Controllers = require('./lib/controllers');
  var Server = require('./lib/server');
  var Settings = require('./lib/settings');
  var Parser = require('./lib/parser');

  Plugin.init = function (params, callback) {
    var router = params.router;
    var middleware = params.middleware;

    Controllers.init(router, middleware);
    Settings.init(callback);
  };

  Plugin.addAdminNavigation = Settings.addAdminNavigation;
  Plugin.reload = Server.reload;
  Plugin.parseRaw = Parser.parseRaw;
  Plugin.parsePost = Parser.parsePost;
  Plugin.parseSignature = Parser.parseSignature;

}(exports, require.main));
