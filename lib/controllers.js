(function(Controllers){

	'use strict';

  Controllers.init = function(router, hostMiddleware){
    router.get('/admin/plugins/camo', hostMiddleware.admin.buildHeader, renderAdminPage);
    router.get('/api/admin/plugins/camo', renderAdminPage);
  };

	function renderAdminPage(req, res, next) {
		res.render('admin/plugins/camo', {});
	};

}(exports));
