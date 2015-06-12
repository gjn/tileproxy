var http = require('http');
var httpProxy = require('http-proxy');

var zoomRange = [17, 17];
var xRange = [136772, 136814];
var yRange = [99527, 99547];

var inRange = function(val, range) {
  if (val >= range[0] && val <= range[1]) {
    return true;
  }
  return false;
}

var proxy = httpProxy.createProxyServer({});

http.createServer(function(req, client_res) {
  // Default back-end is old POC terrain files
  var options = {
    hostname: 'ec2-54-220-242-89.eu-west-1.compute.amazonaws.com',
    path: '/stk-terrain/tilesets/swisseudem' + req.url
  };

  //Analyse url for z,x,y and then decide which back-end to go to
  //If hit, we use new backend from our tiles
  var matches = /tiles\/(.*)\/(.*)\/(.*).terrain(.*)$/gi.exec(req.url);
  if (matches && matches.length >= 4) {
    var zoom = parseInt(matches[1]);
    var x = parseInt(matches[2]);
    var y = parseInt(matches[3]);
    if (!isNaN(zoom) && !isNaN(x) && !isNaN(y)) {
      if (inRange(zoom, zoomRange) &&
          inRange(x, xRange) &&
          inRange(y, yRange)) {
        options.hostname = 'tms3d.geo.admin.ch.s3.amazonaws.com'
        options.path = req.url.split('/tiles')[1]
        console.log('Going with our tiles now!' + options.hostname + options.path);
      }
    }
  }
  
  var target = 'http://' + options.hostname + options.path;
  proxy.web(req, client_res, {
    target: target
  });

}).listen(9014);

