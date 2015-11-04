'use strict';

var controllers = {};

controllers.renderAdminPage = function(req, res, next) {
  // TODO: Add admin panel template with host and key options
  res.render('admin/plugins/camo', {});
};

module.exports = controllers;
