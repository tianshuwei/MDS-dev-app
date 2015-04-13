var host_add="http://127.0.0.1:1337"


function url(add){
	return host_add+add;
}

// var phonecatApp = angular.module('phonecatApp', []);

// phonecatApp.controller('PhoneListCtrl', function ($scope, $http) {
//   $http.post(url("/login")).success(function(data) {
//     $scope.phones = data;
//   });
// });

var appModule = angular.module('appModule', []);
appModule.controller('TestFormModule', function($scope, $http){
    $scope.user={
        userName:'damoqiongqiu',
        password:''
    };
    // $scope.processForm = function() {
    // $http({
    //     method  : 'POST',
    //     url     : 'login',
    //     data    : JSON.stringify($scope.user),  // pass in data as strings
    //     headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
    // })
    //     .success(function(data) {
    //         console.log(data);
 
    //         if (!data.success) {
    //             // if not successful, bind errors to error variables
    //             $scope.errorName = data.errors.name;
    //             $scope.errorSuperhero = data.errors.superheroAlias;
    //         } else {
    //             // if successful, bind success message to message
    //             $scope.message = data.message;
    //         }
    //     });
    $scope.save=function(){
        $http({
        method  : 'POST',
        url     : url('/login'),
        data    : JSON.stringify($scope.user),  // pass in data as strings
        headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
    })
        .success(function(data) {
            console.log(data);
 
            if (!data.success) {
                // if not successful, bind errors to error variables
                $scope.errorName = data.errors.name;
                $scope.errorSuperhero = data.errors.superheroAlias;
            } 
            else {
                // if successful, bind success message to message
                $scope.message = data.message;
            }});
    }

    });