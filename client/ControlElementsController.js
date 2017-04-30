spaceApp.controller('ControlElementsController', function ControlElementsController($scope, satelliteService, $timeout){
  $scope.menuOpen = false;
  $scope.satData = [];

  var viewer = new Cesium.Viewer('cesiumContainer',{
    fullscreenButton: true,
  });

  var initialTime = viewer.clock.currentTime.secondsOfDay;//TODO account for dayNumber too

  $scope.loading = true;
  $scope.vm ={duration:''}
  $timeout(function(){$scope.loading = false;}, 2000);
  // viewer.scene.postRender.addEventListener(function(scene, time){
  //     $scope.loading = false;
  // });

  $scope.satellites = [];
  satelliteService.getAvailableSatelites().then(function(response){
    $scope.satellites = response;
  });

  $scope.selectAllState = false;
  $scope.selectAll = function(){
    $scope.selectAllState = !$scope.selectAllState;
    _.each($scope.satellites, function(sat){sat.showOnMap = $scope.selectAllState});
  };

  $scope.loadSats = function(){
    $scope.loading = true;
    $scope.vm.duration = $scope.vm.duration || 24;
    var sats = _.chain($scope.satellites).filter(function(sat){return sat.showOnMap;}).pluck('name').value();
    satelliteService.loadSatelliteData({sats:sats,duration:$scope.vm.duration}).then(function(response){
      viewer.dataSources.add(Cesium.CzmlDataSource.load(response));
      $scope.satData = response;
      $scope.loading = false;
    });
  }

  $scope.followSat = function(sat){//to remove :(
    var cartesianArray = _.find($scope.satData, function(el){return el.id==='Satellite '+sat.name;}).position.cartesian;
    // console.log(cartesianArray);
    var lastIndex = 0;
    viewer.clock.onTick.addEventListener(function(){
      var timeoffset = viewer.clock.currentTime.secondsOfDay-initialTime;
      var cartesianIndex = Math.floor(timeoffset/300)*4;
      if(cartesianIndex===lastIndex) return;//throttle the tick
      lastIndex = cartesianIndex;
      var cartesian = Cesium.Cartesian3.fromArray([cartesianArray[cartesianIndex+1],cartesianArray[cartesianIndex+2],-cartesianArray[cartesianIndex+3]]);

      // console.log(cartesian);
      viewer.camera.flyTo({
          destination:cartesian,
          orientation:{
            pitch:Cesium.Math.toRadians(-35.0)
          }
      });
    });
  };
});
