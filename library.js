'use strict';

var camo = require('camo-url')({
  // TODO: Get host and key from the NodeBB settings / admin panel
  host: config.host,
  key: config.key,
  type: 'path'
});
var controllers = require('./lib/controllers');
var plugin = {};

plugin.init = function(params, callback) {
  var router = params.router;
  var hostMiddleware = params.middleware;
  var hostControllers = params.controllers;

  router.get('/admin/plugins/camo', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
  router.get('/api/admin/plugins/camo', controllers.renderAdminPage);

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

plugin.parse = function(postContent, callback) {
  // TODO: Replace all URL's with the hmac encrypted version - camo('https://www.example.com/example.jpg') returns the hmac encrypted url
	postContent = postContent;
	callback(null, postContent);
};

module.exports = plugin;
