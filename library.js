'use strict';

var Settings = module.parent.require("./settings");
var SocketAdmin = module.parent.require('./socket.io/admin');

var controllers = require('./lib/controller');

var plugin = {};

var settings;
var camoUrl;

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

plugin.parse = function(data, callback) {
  data.postData.content = data.postData.content.replace(/<img[^>]+src=['"](http[^s][^'"]+)['"][^>]*>/gi, function (match, url) {
    return match.replace(url, camoUrl(url));
  });
  callback(null, data);
};

module.exports = plugin;
