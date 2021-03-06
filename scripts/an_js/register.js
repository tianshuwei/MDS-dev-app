var host_add="http://localhost/DrugOnline"


function url(add){
    return host_add+add;
}

// var phonecatApp = angular.module('phonecatApp', []);

// phonecatApp.controller('PhoneListCtrl', function ($scope, $http) {
//   $http.post(url("/login")).success(function(data) {
//     $scope.phones = data;
//   });
// });

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

appModule.controller('TestFormModule', function($scope, $http){
    $scope.user={
        userName:'',
        loginPassword:'',
        usertype:'commonuser'
    };

    $scope.save=function(){
        $http.post( url('/Register'),$scope.user).success(
                    function(data) {
            console.log(data);
 
            if (!data.ok) {
                // if not successful, bind errors to error variables
                $scope.errorName = data.reason;
                $scope.message = data;
                alert("注册失败！");
                //$scope.errorSuperhero = data.errors.superheroAlias;
            } 
            else {
                // if successful, bind success message to message
                $scope.rec = data;
                alert("注册成功！"); 
                window.location.href='mine.html'; 
            }});
    };
});