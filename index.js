'use strict';

var config = require('./config');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var app = express();
var _ = require('underscore');
var Q = require('Q');
var router = express.Router();
var czmlFormatter = require('./czmlFormatter');
var satellite = require('satellite.js');

var server = app.listen(config.HOST_PORT);

app.use(express.static(__dirname + '/client'));

app.use("/node_modules/", express.static(__dirname + "/node_modules/"));

var availableTLEs = [];//aquired from the internet
var simulationResults = [];

/* Initialize */
function getTLEforURL(url){
  return Q.Promise(function(resolve, reject, notify){
    var req = http.request({
      method: 'GET',
      host: url.host,
      path: url.path
    }, function(response){
          var body = '';
          response.on('data', function(d) {
              body += d;
          });
          response.on('end', function() {
              return resolve(body);
          });
    });
    req.end();
    req.on('error', function(err) {
      console.error('Error with forwarding the data', err.message);
    });
  });
}
function getTLEs(){
  return Q.Promise(function(resolve, reject, notify){
    var requests = [];
    for(var i=0; i<config.RESOURCES.length;i++){
      requests.push(getTLEforURL(config.RESOURCES[i]));
    }
    var formattedTLEs = [];
    Q.allSettled(requests).then(function(response){
      var values = _.pluck(response, 'value');
      for(var i=0; i<values.length;i++){
        var tles = values[i].split("\r\n");
        for(var j=0; j<tles.length;j+=3){
          if(tles[j]==='') break;
          formattedTLEs.push({
            satelliteName: tles[j],
            line1: tles[j+1],
            line2: tles[j+2]
          });
        }
      }
      resolve(formattedTLEs);
    });
  });
}
getTLEs().then(function(tles){
  var satelliteNames = _.chain(config.SATELLITES).pluck('tleName').uniq().value();
  for(var i=0; i<satelliteNames.length;i++){
    var satellite = _.find(config.SATELLITES, function(sat){return sat.tleName===satelliteNames[i];});
    var tleForSat = _.find(tles, function(tle){return tle.satelliteName.trim()===satelliteNames[i];});
    satellite.line1 = tleForSat.line1;
    satellite.line2 = tleForSat.line2;
    availableTLEs.push(satellite);
  }
});

/* API */
app.use(bodyParser.json());
router.use(function(req, res, next) {
    next();
});
router.post('/satdata', function(req, res){
  var tlesToReturn = _.filter(availableTLEs, function(tle){return req.body.sats.indexOf(tle.name)!==-1;});
  simulationResults = czmlFormatter.formatForSatellites(tlesToReturn, req.body.duration);
  res.json(simulationResults);
});

router.get('/availablesats', function(req, res){
  res.json(availableTLEs);
});

app.use('/api', router);

function getPositionDataForSatellite(){

}
