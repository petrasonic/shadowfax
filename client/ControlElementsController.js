spaceApp.controller('ControlElementsController', function ControlElementsController($scope, satelliteService, $timeout){
  $scope.menuOpen = false;
  $scope.satData = [];

  var viewer = new Cesium.Viewer('cesiumContainer',{
    fullscreenButton: true,
  });

  $scope.loading = true;
  $scope.vm ={duration:''}

  //timed loading because the loading screen looks cool and the app loads too fast
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

});
