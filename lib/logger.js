(function(Logger, NodeBB){

  'use strict'

  var winston = NodeBB.require('winston');

  var prefixes = {
    C  : "[Camo]: ",
    CP : "[CamoProxy]: "
  };

  Logger.info = Logger.log = function (prefix, msg) { winston.info(prefixes[prefix] + msg); };

  Logger.warn = function (prefix, msg) { winston.warn(prefixes[prefix] + msg); };

}(exports, require.main));
