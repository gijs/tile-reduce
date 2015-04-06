//identify disconnected major roads
var turf = require('turf');

module.exports = function(tileLayers, opts){
  var minDistance = 50/5280; // 50 ft in miles
  var streetsRoads = tileLayers.streets.road;
  var disconnects = turf.featurecollection([]);
  var preserve = { "motorway" : true, "primary" : true, "secondary" : true, "tertiary" : true, "trunk": true };
  var caps = {};

  streetsRoads.features.forEach(function(line){
    if (preserve[line.properties.type]) {
      // get start and end points
      var ends = [
        line.geometry.coordinates[0],
        line.geometry.coordinates[line.geometry.coordinates.length-1]
      ];

      // count how many times each endpoint appears
      // so we can choose only those that are not already
      // connected to something
      ends.forEach(function(end){
        if (!(end[0] in caps)) {
          caps[end[0]] = {};
        }

        if (!(end[1] in caps[end[0]])) {
          caps[end[0]][end[1]] = 0;
        }

        caps[end[0]][end[1]]++;
      });
    }
  });

  for (x in caps) {
    for (y in caps[x]) {
      if (caps[x][y] == 1) {
        var end = turf.point([Number(x), Number(y)]);
        var best = Number.MAX_VALUE;

        // check whether the end is close but not exactly on any other line
        streetsRoads.features.forEach(function(line2){
          if (preserve[line2.properties.type]) {
            var distance = turf.distance(end, turf.pointOnLine(line2, end));
            if (distance < best && distance != 0) {
              best = distance;
            }
          }
        });

        if (best < minDistance) {
          end.properties.distance = best;
          disconnects.features.push(end);
        }
      };
    }
  };
  
  // return points where distance is less than 50 feet
  return disconnects;
}
