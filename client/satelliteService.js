spaceApp.service('satelliteService', function satelliteService($http, $q){
  var satelliteService = {
    getAvailableSatelites: function(){
      var deferred = $q.defer();
      $http.get('/api/availablesats')
          .then(function(result){
              deferred.resolve(result.data);
          }, function(error){
              deferred.reject();
          });
      return deferred.promise;
    },

    loadSatelliteData: function(sats){
      var deferred = $q.defer();
      $http.post('/api/satdata', sats)
          .then(function(result){
              deferred.resolve(result.data);
          }, function(error){
              deferred.reject();
          });
      return deferred.promise;
    }
  }
  return satelliteService;
});
