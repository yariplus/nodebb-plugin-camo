(function(Parser){

  'use strict';

  var Logger = require('./logger');

  var camoUrl = null;
  var regex = null;

  Parser.setCamoUrl = function(data) {
    regex = data.regex;
    camoUrl = require('camo-url')(data);
  };

  Parser.parseRaw = function(content, callback) {
    if (!camoUrl || !regex) return content;
    content = content.replace(regex, function (match, url) {
      return match.replace(url, camoUrl(url));
    });
    callback(null, content);
  };

  Parser.parsePost = function(data, callback) {
    Parser.parseRaw(data.postData.content, function(err, content){
      data.postData.content = content;
      callback(null, data);
    });
  };

  Parser.parseSignature = function(data, callback) {
    Parser.parseRaw(data.userData.signature, function(err, content){
      data.userData.signature = content;
      callback(null, data);
    });
  };

}(exports));
