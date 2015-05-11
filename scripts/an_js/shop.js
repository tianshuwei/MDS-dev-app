var host_add="http://localhost/DrugOnline"


function url(add){
	return host_add+add;
}

var appModule = angular.module('appModule', ["ionic"], function($httpProvider){
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
      
    for(name in obj) {
      value = obj[name];
        
      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
      
    return query.length ? query.substr(0, query.length - 1) : query;
    };
    
    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
});

appModule.controller('ShopListCtrl', function ($scope, $http) {
	$scope.address={
        longitude:'121.0',
        latitude:'30.0'
    };
	$http.get(url("/ShowDrugstoreServlet"+"?longitude="+$scope.address.longitude+"&&latitude="+$scope.address.latitude+"&page=1")).success(function(data) {
	$scope.rec = data;
  if(!$scope.$$phase) $scope.$apply();
	});
});