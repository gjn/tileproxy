var http = require('http');
var httpProxy = require('http-proxy');

var zoomRange = [15, 17];

var config = {
  15: {
    xRange: [34190, 34191],
    yRange: [24881, 24882]
  },
  16: {
    xRange: [68381, 68402],
    yRange: [49763, 49783]
  },
  17: {
    xRange: [136772, 136804],
    yRange: [99527, 99566]
  }
};

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
      if (inRange(zoom, zoomRange)) {
        var xRange = config[zoom].xRange;
        var yRange = config[zoom].yRange;
        if (inRange(x, xRange) &&
            inRange(y, yRange)) {
          options.hostname = 'tms3d.geo.admin.ch.s3.amazonaws.com'
          options.path = req.url.split('/tiles')[1]
          console.log('Going with our tiles now!' + options.hostname + options.path);
        }
      }
    }
  }
  
  var target = 'http://' + options.hostname + options.path;
  proxy.web(req, client_res, {
    target: target
  });

}).listen(9014);
