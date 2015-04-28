var host_add="http://localhost:8000"


function url(add){
	return host_add+add;
}

var phonecatApp = angular.module('phonecatApp', []);

phonecatApp.controller('PhoneListCtrl', function ($scope, $http) {
  $http.post(url("/ShopList")).success(function(data) {
    $scope.data = data;
  });
});