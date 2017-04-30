var config = require('./config');
var _ = require('underscore');
var satellite = require('satellite.js');
var moment = require('moment');

var self = module.exports = {
	formatForSatellites: function(tles, duration){
    duration = duration*60*60;
    var initializeElement = {
      version:"1.0",
      id:"document",
      clock:{
        multiplier:50,
        currentTime: moment().format(),
        step:"SYSTEM_CLOCK_MULTIPLIER",
        interval: moment().format()+'/'+moment().add(duration,'seconds').format(),
        range:"LOOP_STOP"
      }
    }

    var output = [];
    output.push(initializeElement);
    for(var i=0;i<tles.length;i++){
      var sat = self.formatForSatellite(tles[i], duration)
      output.push(sat.sat);
      output.push(sat.fov);
    }
    return output;
  },
  formatForSatellite: function(tle, duration){
    var colour = config.COLOURS[Math.floor(Math.random() * 5)]
    // Initialize a satellite record
    var satrec = satellite.satellite.twoline2satrec(tle.line1, tle.line2);
    // var duration = 1*60*60;
    var points = [];
    for(var i=0;i<duration;i+=300){
      var positionAndVelocity = satellite.satellite.propagate(satrec, moment().add(i,'seconds').toDate());
      points.push(i);
      points.push(positionAndVelocity.position.x*1000);
      points.push(positionAndVelocity.position.y*1000);
      points.push(positionAndVelocity.position.z*1000);
    }
    tle.cartesian = points;
    var cesiumElement = {
      description: tle.summary,
      id: 'Satellite '+tle.name,
      label:{
        text: tle.name,
        outlineWidth:2,
        fillColor:{
           rgba:colour
        },
        show: true,
        horizontalOrigin:"LEFT",
        font:"11pt Helvetica Neue, Helvetica, Arial",
        outlineColor:{
           "rgba":[0,0,0,255]
        },
        pixelOffset:{
          cartesian2:[12,0]
        }
      },
      path:{
        material:{solidColor:{color:{rgba:colour}}},
        show:[{boolean:true,interval:moment().format()+'/'+moment().add(duration,'seconds').format()}],
        width:1,
        resolution:120
      },
      position:{
        epoch: moment().format(),
        referenceFrame: "INERTIAL",
        interpolationDegree:5,
        cartesian: points,
        interpolationAlgorithm:"LAGRANGE"
      },
      availability: moment().format()+'/'+moment().add(duration,'seconds').format(),
      billboard:{
        show:true,
        scale:1.5,
        image:tle.img
      }
    };

    colour[3] = 127;
    var cesiumElementForFOV = {
      ellipse:{
        semiMinorAxis: tle.sensorDiameter/2,
        semiMajorAxis: tle.sensorDiameter/2,
        material:{solidColor:{color:{rgba:colour}}}
      },
      position:{
        epoch: moment().format(),
        referenceFrame:"INERTIAL",
        interpolationDegree:5,
        cartesian: points,
        interpolationAlgorithm: "LAGRANGE"
      }
    };

    return {
      sat:cesiumElement,
      fov:cesiumElementForFOV
    };
  },
  // getSatIcon
};
